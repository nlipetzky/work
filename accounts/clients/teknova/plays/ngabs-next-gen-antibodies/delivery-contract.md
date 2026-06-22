# Delivery Contract — Next-Gen Antibodies (ngAbs)

**The single acceptance test that gates what crosses from staging → core → client surface (Airtable).**

Derived from `playbook-v1-2026-05-29.md` (§4.2, §5, §6, §7, §8) and `client-guidance.md`. Nothing
reaches the client surface unless it passes **both** gates below. A sync is not "done" when the
function runs green — it is done when its output passes this contract on real rows, checked at a
preview destination *before* the live client table.

Every clause traces to a play/guidance section so it can be re-verified.

---

## A. Eligibility gate — which records may cross

### Contacts
A contact crosses **only at status = `qualified`** (playbook §7, step 9 — passed ALL checks below).
The screening pipeline runs in order, short-circuit on first failure (§7):

1. **Company gates G1–G5** (§5), with client-guidance overrides:
   - **G1 Modality** — require bispecific / multispecific / ADC. Conjugate subclasses **AOC, RDC,
     immunocytokine are in-scope** even without a literal "ADC" string (guidance §1). Fragment-only
     is "adjacent only when paired," not independently qualifying (guidance §1, overrides §2.4).
   - **Negative checks** (guidance §2, hard OUT): fusion-protein-only, PEGylated enzyme, CAR cell
     therapy, AAV gene therapy.
   - **G3 NA footprint**, **G4 reagent relevance**, **G5 not-excluded** (§5).
   - **Dedup / hierarchy** (guidance §5) applied; **client gold labels** (guidance §6) honored.
2. **Title approved** (§4.2) — word-boundary match; an approved term **overrides** an exclusion term.
3. **LinkedIn verification** (§6.1) — current title + employer match the record → pass; mismatch →
   `stale_mismatch` (does NOT cross); no profile → may cross tagged `verification_source=database_only`.
4. **CRM 6-month suppression** (§6.2, HARD RULE) — any logged activity in the trailing 180 days →
   `suppressed_recent_activity` (does NOT cross). Ambiguous match → suppress + flag for human review.

**Statuses that MUST NOT cross:** `disqualified_company`, `out_of_scope_title`, `stale_mismatch`,
`suppressed_recent_activity`, `needs_review`, and — critically — **`eligible`**.

> **`eligible` ≠ `qualified`.** "Eligible" means company + title passed only; LinkedIn (§6.1) and
> CRM (§6.2) are still deferred. Per the play a lead is NOT outreach-ready until those pass. Eligible
> records may not reach the client surface.

### Companies
A company crosses only at verdict **`IN` or `NARROW`** (qualified per §5 + guidance gold labels).
`OUT`, `NEEDS_REVIEW`, and dedup/hierarchy losers do not cross.

---

## B. Field contract — what each crossing record must carry

### Contacts (playbook §8 — required output fields for final CRM upload)
All required and **non-null** except where noted:
- **Full Name** — PRIMARY. (This is the field the prior sync left blank on all 159 rows.)
- First Name
- Last Name
- Title
- Company Name
- Email
- LinkedIn URL — *only* optional field ("if available")

Plus provenance (operator trust; not client-facing clutter, but present on the record):
- **Discovery Source** (e.g. `clay_ngabs`, `apollo_ngabs`)
- Screening status + reason (why it qualified) + verification_source flag

A record missing **any** required field FAILS the contract and does not cross — regardless of its
gate status. "Looks screened but is nameless/sourceless" is a contract failure, not a warning.

### Companies
Name, Domain, Modality evidence (in-scope modality + how confirmed), Verdict (`IN`/`NARROW`) +
rationale, Discovery Source. The client must see *why* a company is a fit.

---

## C. What this contract forces (open decisions)

1. **Core DB must carry the §8 fields, or contacts do not route through it.** Canonical `contacts`
   today has no `full_name` and no `source` column, so it **structurally cannot satisfy §B**. Either
   core's schema holds the §8 fields + provenance, or contact delivery bypasses core and reads from
   the enriched source (Clay/Airtable). This is the fork to decide before building any transport.

2. **No contact can legitimately cross today.** LinkedIn (§6.1) and CRM 6-month (§6.2) screening data
   are not in staging, so the best status any contact reaches is `eligible` — which §A forbids from
   crossing. The LinkedIn-match and CRM-suppression gates must be implemented (or their data sourced)
   before *any* contact reaches the client surface. This is the missing half of the pipeline, and it
   is a HARD play requirement, not a nice-to-have.

3. **The sync's acceptance test = this contract**, run against real rows at a preview destination
   (scratch table / filtered view) and inspected, before a single row touches the live client table.

---

## D. Reusable pattern (agentic-systems)

The transferable discipline, independent of this play: **derive the delivery contract from the
play's required-output spec + screening pipeline; only fully-qualified records cross; required fields
are enforced as a hard gate; verify the output against the contract on real data at a preview before
the live surface.** Build transport last, never first. Every play's delivery path gets a contract
like this one before any sync is built.
