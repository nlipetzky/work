# Delivery Contract — mRNA Therapeutics

**The single acceptance test that gates what crosses from staging → core → client surface (Airtable).**

Derived from `Teknova_mRNA_Outreach_Playbook_v1 2026.06.10.md` (§4, §5, §6, §7) and the segment/offer/ICP-title
artifacts. Nothing reaches the client surface unless it passes **both** gates below. A sync is not "done"
when the function runs green — it is done when its output passes this contract on real rows, checked at a
preview destination *before* the live client table.

Every clause traces to a playbook section so it can be re-verified.

---

## A. Eligibility gate — which records may cross

### Contacts
A contact crosses **only at status = `qualified`** (playbook §6 — passed ALL checks below). The screening
pipeline runs in order, short-circuit on first failure so the disposition reason is unambiguous (§6):

1. **Normalize** (§6.1) — (a) **Resolve acquired/renamed entities to the live parent** (name strings
   "now part of X" / "a … company" / "formerly Y", domain redirecting to a parent, defunct standalone),
   then screen the live entity; record both source name and resolved entity (labeled transform, never a
   silent overwrite, never a per-row operator question). (b) Dedupe the company. (c) **Attach the CRM
   account by matching against the Airtable Salesforce-mirror base `app5wdHwgM1SPNxcx`** — sets the
   existing-customer flag (see §A.5 for the mirror tables and keys).
2. **Company gates G1–G5** (§4). Fail any ⇒ `company_rejected:{gate}`.
   - **G1 Modality** — active mRNA/saRNA/circRNA program (pipeline, publication, trial, press/funding, or
     job posts referencing mRNA/IVT/LNP). Reject if only modality is non-mRNA (antibody, small molecule,
     AAV, siRNA/ASO-only).
   - **G2 Geography** — at least one physical production OR R&D lab in US/Canada/Mexico. HQ abroad OK if a
     NA site exists. Reject virtual-only / no NA wet-lab footprint.
   - **G3 Lab/operations** — confirmed wet-lab or manufacturing (PD, IVT, formulation, QC). Reject purely
     computational/AI, IP-licensing, or holding entities.
   - **G4 Reagent fit** — plausibly consumes Teknova-type reagents (implied by G1+G3). An existing-customer/
     billing flag overrides website inference.
   - **G5 Not excluded** — apply §2 exclusions. An existing-customer flag short-circuits the
     "reagent-maker = competitor" inference (billing history beats scraped data); such accounts are not
     excluded under G5 but still run G1 and the CRM activity rule.
3. **Title match** (§5.1) — current title maps to a §3.2 persona; word-boundary check, an approved
   raw-materials-procurement term **overrides** an exclusion keyword. Out-of-scope & not the sole contact at
   a high-value account ⇒ `contact_rejected:title`. Sole-contact-at-qualified-account exception ⇒
   `human_review:sole_contact`, never auto-include.
4. **LinkedIn verification** (§5.2) — if a profile is present, the MOST RECENT position must match the
   record's employer and the title must match/synonym. Match ⇒ `linkedin_verified = true` (capture date +
   URL). Mismatch (moved/changed/stale) ⇒ `human_review:linkedin_conflict`, does NOT cross. No profile ⇒
   `linkedin_verified = null` (distinct from false), continue.
5. **Existing-customer / open-deal / CRM 6-month suppression** (§5.3, HARD RULE) — **read the Airtable
   Salesforce-mirror base `app5wdHwgM1SPNxcx` directly** (operator decision 2026-06-11). The mirror-labelled
   tables are a live, native Salesforce sync (not a Supabase copy — the engine reads Airtable for this
   check):
   - `ME_Account_Mirror` — account exists ⇒ **existing-customer flag** (this is the override that resolves
     `competitor_flag` / `large_diversified_flag` from review to a decision).
   - `ME_Opportunity_Mirror` — open opportunity ⇒ **active-deal flag**.
   - `ME_Contact_Mirror` / `ME_Lead_Mirror` — most-recent-activity date ⇒ **§5.3 180-day suppression**.
   - **Match key:** contact by email first, then full-name + company; company/account by domain, then name.
   - **Dispositions:** logged activity in trailing 180 days ⇒ `suppressed:crm_activity` (does NOT cross);
     ambiguous match ⇒ suppress + flag for human review.

**Statuses that MUST NOT cross:** `company_rejected:*`, `contact_rejected:title`, `human_review:*`,
`suppressed:crm_activity`, and — critically — **`eligible`**.

> **`eligible` ≠ `qualified`.** "Eligible" means company gates + title passed only; LinkedIn (§5.2) and CRM
> (§5.3) are still deferred. Per the playbook a lead is NOT outreach-ready until those pass. Eligible records
> may not reach the client surface.

### Companies
A company crosses only at verdict **`IN`** (or `NARROW` if a thinner-fit tier is later defined — the mRNA
playbook does not currently define a NARROW class; default is binary IN/OUT plus NEEDS_REVIEW). `OUT`,
`NEEDS_REVIEW`, and dedup/hierarchy losers do not cross.

---

## B. Field contract — what each crossing record must carry

### Contacts (playbook §7 — required output fields for final CRM upload)
All required and **non-null** except where noted:
- **Full Name** — PRIMARY.
- First Name
- Last Name
- Title
- Company Name
- Email
- LinkedIn URL — *only* optional field ("if available")

Plus provenance (operator trust; present on the record, not client-facing clutter):
- **Discovery Source** (e.g. `clay_mrna`, `apollo_mrna`)
- Screening status + reason (why it qualified) + `verification_source` flag (`linkedin_verified` true/false/null)

A record missing **any** required field FAILS the contract and does not cross — regardless of gate status.
"Looks screened but is nameless/sourceless" is a contract failure, not a warning.

### Companies
Name, Domain, Modality evidence (in-scope mRNA modality + how confirmed), Verdict (`IN`) + rationale,
Discovery Source. The client must see *why* a company is a fit.

---

## C. What this contract forces (open decisions)

1. **CRM / existing-customer / open-deal data IS sourced — read the Airtable SF mirror (`app5wdHwgM1SPNxcx`).**
   (Corrected 2026-06-11: an earlier draft wrongly called this unavailable.) The §5.3 suppression, the
   existing-customer override, and the active-deal flag all resolve against the live mirror per §A.5. The
   remaining gate is **LinkedIn verification (§5.2)** — current-employer/title confirmation still needs a
   data source (e.g. the live `LinkedIn Role Status Verify` workflow or an enrichment lane). Until LinkedIn
   verification runs, a contact with a profile that can't be confirmed caps at `eligible` (cannot cross);
   a contact with no profile may cross tagged `linkedin_verified=null` per §5.2. So the load-bearing blocker
   has narrowed from "CRM+LinkedIn" to **LinkedIn verification only.**

2. **Core DB must carry the §7 fields, or contacts bypass core.** Same structural fork ngAbs hit: canonical
   `contacts` must hold the §7 required fields + provenance, or contact delivery reads from the enriched
   source. Decide before building transport.

3. **The sync's acceptance test = this contract**, run against real rows at a preview destination
   (scratch table / filtered view) and inspected, before a single row touches the live client table. This is
   one of the two hard stops in the run: nothing leaves the system until validated here.

---

## D. Reusable pattern (agentic-systems)

The transferable discipline, independent of this play: **derive the delivery contract from the play's
required-output spec + screening pipeline; only fully-qualified records cross; required fields are enforced
as a hard gate; verify the output against the contract on real data at a preview before the live surface.**
Build transport last, never first.
