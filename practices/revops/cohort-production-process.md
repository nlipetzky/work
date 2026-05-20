# Cohort Production Process
## How we produce a verified outbound cohort

**Nick Lipetzky · Konstellation AI**
**Operating version:** 2026-05-13

---

## What this is

The Cohort Production Process is the production layer of a RevOps engagement. It reads a fixed set of input documents, enriches data from Explorium and a waterfall of supporting providers, scores every record against the Cohort Quality framework, and produces two tables — Companies and Contacts — with every field populated and a per-record evidence trail.

This is the doc the engagement points at when a client asks "how do you produce the data?" The answer is the same for every play: inputs in, engine runs, scored tables out, audit trail attached.

---

## The two tables we produce

Every engagement output, regardless of play, lands in these two tables:

- **Companies.** One row per account. Carries firmographics, classification, signals, suppression state, evidence trail, and a Company Tier (A / B / C / excluded).
- **Contacts.** One row per person at a qualified company. Carries identity, role, contact info, suppression state, evidence trail, and a Contact Tier per channel.

The cohort that activates is the cross-product of these two tables, where each record's Cohort Tier is the lower of its Company Tier and its Contact Tier.

The schemas live in the RevOps Surface Airtable base (`appYBYH3aOHhTODAw`). Companies = `tblnj3YlOI3thjrXp`. Contacts = `tblWJksRL1yKSUgrm`.

---

## Inputs

Five documents drive the engine. Four are per-play; one is the practice-level standard. The engine cannot run without all five.

| Document | Per play or standard | Path | What it contributes |
|---|---|---|---|
| Offer | Per play | `accounts/clients/<client>/artifacts/revops-offer-<play-slug>.md` | What is being sold, to whom, why now. Frames which signals matter. |
| Segment criteria | Per play | `accounts/clients/<client>/artifacts/revops-segment-<play-slug>.md` | Hard filters, soft signals, disqualifiers. Source-agnostic. Defines who is in scope. |
| Modality taxonomy | Per play | `accounts/clients/<client>/artifacts/revops-modality-taxonomy-<play-slug>.md` | Provider-bound vocabulary (Explorium-accepted category names, NAICS codes, modality anchors and exclusions). |
| Sourcing rules | Per play | `accounts/clients/<client>/artifacts/revops-sourcing-rules-<play-slug>.md` | Which discovery sources to query and what to drop. |
| Cohort Quality framework | Practice standard | `practices/revops/cohort-quality-framework.md` | The measurement standard. Defines the four dimensions and how records sort into tiers. |

If any input is missing or vague, the engine does not run. The fix is to produce or tighten the input document first. See the `offer-extract` and `segment-criteria` skills under `practices/revops/skills/`.

---

## Outputs

Three artifacts come out of every run:

1. **Companies table populated.** Every field on every record in scope is either populated by the engine or explicitly marked as structurally unavailable. Every populated field has a provider attribution and a measured-at timestamp. Every record has a Company Tier and a tier rationale.
2. **Contacts table populated.** Same standard. Per-channel hygiene where the play is multichannel. Per-record Contact Tier, plus the Cohort Tier (lower of company and contact).
3. **Quality report.** A per-batch summary written into the Enrichment Runs table (`tblEVSEqetmu4ScHe`). Shows count of records evaluated, distribution across the five-bucket gate classification, distribution across tiers, which fields were sourced from which provider, which records hit the waterfall and why, and any records that exited as `needs_review`.

The report is what we hand the client to defend the cohort. It answers "how did this record become Tier A" at the row level and "what does this batch look like overall" at the run level.

---

## The engine, end to end

Nine steps. The order is fixed. Each step writes a defined set of fields and gates the next step on a defined condition.

### Step 1 — Discovery

**Goal:** assemble the full universe of candidate companies that match the segment's hard filters.

Read the segment criteria document. Translate its hard filters into provider queries. Run all available discovery sources in parallel (Clay, Exa, clinicaltrials.gov, Crunchbase, Explorium per the sourcing rules). Deduplicate on canonical domain. Flag overlap with existing database. Apply known disqualifiers as flags (do not delete; preserve the full universe for audit).

**Inputs read:** Segment criteria, sourcing rules.
**Fields written:** `Company Name`, `Domain`, `Discovery Sources`, `Discovery Confidence`, `First Discovered`, overlap flags.
**Gate to next step:** record exists with a normalized domain.

### Step 2 — Match

**Goal:** get the Explorium business ID for every discovery record.

Call Explorium's match-business with company name + domain. A null business ID is normal, not an error; route those records to a parallel web-only path that still attempts modality verification from the company's website.

**Inputs read:** Companies table (after Step 1).
**Fields written:** `Explorium Business ID`.
**Gate to next step:** valid business ID, OR null business ID with a fetchable company website.

### Step 3 — Light enrich (firmographics)

**Goal:** populate the cheapest, most decision-relevant Explorium fields before spending deep-enrich credits.

Call Explorium's enrich-business with the firmographics bundle. Get industry, NAICS, employee range, revenue range, HQ.

**Inputs read:** Modality taxonomy (for accepted NAICS / linkedin_category values).
**Fields written:** `Industry`, `NAICS Code`, `Employee Range`, `Revenue Range`, `HQ City`, `HQ State`, `Country`, `Company LinkedIn URL`.
**Gate to next step:** firmographics returned, or null match with web content available.

### Step 4 — Gate (Phase D: classification)

**Goal:** triage every record into one of five outcome buckets, then assign a Company Tier.

Two stages run inside this step.

*Stage 1: industry and geography filter.* Read the modality taxonomy. Companies that fail Stage 1 archive immediately as `archived_out_of_industry`. No deeper credit spend.

*Stage 2: modality verification.* For Stage 1 survivors, fetch the company's website (multi-URL fetch across pipeline, platform, science, technology, about subpaths). Scan for the play's anchor terms, mechanism terms, and exclusion terms per the modality taxonomy. Classify into one of:

- `enrichment_complete` — modality confirmed, proceeds to Step 5.
- `rerouted_wrong_modality` — wrong modality, available for alt-play pool, excluded from this play's cohort.
- `needs_<play>_review` — branded as the play's domain, no specific modality term visible; manual review (Phase E of the engagement process).
- `needs_data_quality_review` — domain matches a parent-company / tools-vendor pattern; correction queue.
- `archived_out_of_industry` — failed Stage 1, or unmatched with no recoverable web signal.

Then assign a Company Tier per the Cohort Quality framework's company-scope dimensions. `enrichment_complete` baselines at Tier B and lifts to Tier A if a recent company-level signal is present or the structural-signal-unavailability test passes. The other four buckets defer or exclude.

**Inputs read:** Modality taxonomy, Cohort Quality framework.
**Fields written:** `Enrichment Status`, `Modality`, `Modality Source`, `Modality Confidence`, `Detected Keywords`, `Classification Notes`, `Classification Run ID`, `Gate Version`, `Company Tier`, `Company Tier Reason`.
**Gate to next step:** `enrichment_complete` only.

### Step 5 — Deep enrich (signals and intelligence)

**Goal:** populate the signal and competitive-intelligence fields on records that passed the gate.

Call Explorium for technographics, competitive landscape, strategic insights, workforce trends, and the events endpoint. Get funding events, leadership hires, IND filings, partnerships, product launches, office openings, conferences. Every event field is paired with a date so the Cohort Quality framework's recency windows can apply.

**Inputs read:** Segment criteria (for which signals matter to this play), Cohort Quality framework (for recency windows).
**Fields written:** All `Signal: *` flags and detail fields, `Funding Event Date`, `Leadership Hire Date`, `IND/Stage Advance Date`, `Conference Date`, `Publication Date`, `Office Opening Date`, `Major Partnership Date`, `Product Launch Date`, `Signal Sources`, `Active Signals Summary`.
**Gate to next step:** signals attempted; recency check applied.

### Step 6 — Contact discovery

**Goal:** find the right people at every qualified company.

Read the segment criteria's function and seniority bands. Call Explorium's fetch-prospects filtered to the business ID + those bands. Validity gate on null prospect IDs (skip; do not spend credits).

**Inputs read:** Segment criteria (function, seniority).
**Fields written (Contacts table):** `Full Name`, `First Name`, `Last Name`, `Title`, `Company Name`, `Company Domain`, `Seniority`, `Function`, prospect ID.
**Gate to next step:** prospect IDs returned.

### Step 7 — Contact enrich (waterfall)

**Goal:** populate every contact-level field. Where Explorium falls short, fall through to the next provider.

Profiles first (cheap or free): Explorium's enrich-prospects with the profiles bundle. Get role history, tenure, education, LinkedIn.

Then contacts (more expensive): Explorium's enrich-prospects with the contacts bundle for email and phone. If Explorium returns nothing for email, the waterfall runs in this order: Hunter email-finder → Apify Linkedin-Profile-Scraper → Apollo people-match.

Then verification: Hunter email-verifier on whatever email was found.

**Inputs read:** Cohort Quality framework (for what counts as identity-confirmed, what counts as deliverable).
**Fields written (Contacts table):** `LinkedIn URL`, `Tenure Years`, `Email`, `Email Verified`, `Email Confidence`, `Mobile Phone`, `State/Region`, `Country`, employment-status flag, role-status flag.
**Gate to next step:** every field that can be populated by the waterfall has been attempted.

### Step 8 — Score

**Goal:** apply the Cohort Quality framework at both scopes and assign tiers.

Score every company against the six company-level hygiene checks, five company-level fit checks, seven company-level absolute suppression checks, one conditional suppression check, and the company-level signal-or-unavailable check. Assign a Company Tier (A / B / C / excluded).

Score every contact against the six contact-level hygiene checks, four fit checks, two absolute suppression checks, one conditional suppression check, and prospect-or-company-level signal. Assign a Contact Tier per channel.

Compute the Cohort Tier = min(Company Tier, Contact Tier).

**Inputs read:** Cohort Quality framework.
**Fields written:** `Company Tier`, `Company Tier Reason` (Companies table). `Contact Tier`, `Cohort Tier`, `Cohort Tier Reason` (Contacts table — these fields may need to be added to the Contacts table to match the Companies-table additions from 2026-05-13).
**Gate to next step:** every record has both tiers assigned or is explicitly excluded.

### Step 9 — Verify

**Goal:** produce the per-batch quality report and prove the data.

Write a row to the Enrichment Runs table (`tblEVSEqetmu4ScHe`) with: count evaluated, bucket distribution, tier distribution, provider attribution per field type, waterfall hit rate, count of `needs_review` records, gate version, Cohort Quality framework version, run timestamps.

Confirm every populated field on every record carries a provider attribution and a measured-at timestamp.

**Fields written:** Enrichment Runs row.
**Output:** the quality report is what we send the client.

---

## Provider waterfall (one place, one truth)

Explorium is primary for almost everything. Other providers are fallback or specialist.

| Field family | Primary | Fallback 1 | Fallback 2 | Free sources |
|---|---|---|---|---|
| Company firmographics | Explorium `enrich-business` | Exa `web_fetch_exa` on company site | — | — |
| Company classification (modality) | Explorium firmographics + multi-URL fetch | Exa semantic search | Perplexity research | clinicaltrials.gov |
| Company events / signals | Explorium events endpoint | Perplexity search | Apify clinical trials / PubMed | Google News, conference lists |
| Contact discovery | Explorium `fetch-prospects` | — | — | — |
| Contact profile | Explorium `enrich-prospects` (profiles) | Apify `harvestapi/linkedin-profile-scraper` | — | — |
| Contact email | Explorium `enrich-prospects` (contacts) | Hunter `email-finder` | Apify `dev_fusion/Linkedin-Profile-Scraper` | Apollo `people-match` |
| Email verification | Hunter `email-verifier` | — | — | — |
| Employment current | Explorium events (`prospect_changed_company`) + profile match | Apify profile scraper | — | — |

The waterfall is defined in detail in `practices/revops/skills/enrichment-providers/SKILL.md`. The pattern is fixed: try the primary first, fall to the next provider only if the primary returned nothing useful.

---

## How we prove the data

Three layers of audit, all in the Airtable base, all visible to the client.

**Per-field provenance.** Every populated field can be traced to the provider that supplied it via the Signal Sources field, the Modality Source field, and the Discovery Sources field. No anonymous values.

**Per-record tier composition.** Every record's Company Tier Reason and Contact Tier Reason carries the short prose explaining which dimension scores produced the tier ("Tier B: HQ location stale > 60 days; signal partial"). The Classification Notes field carries the gate's decision narrative.

**Per-batch quality report.** The Enrichment Runs row shows what the batch looked like at the population level, with provider attribution and tier distribution.

If a client asks "why is this Tier B," we point at the Tier Reason. If they ask "how did you find this company," we point at Discovery Sources. If they ask "is this email real," we point at the email verification status and timestamp.

---

## What this process does NOT do

Naming the boundary so it's clear to clients and to operators.

- **It does not source net-new companies beyond the discovery sources.** Discovery runs against the sources named in the sourcing rules document. If the play needs new sources, update that document and re-run discovery.
- **It does not write outreach copy.** Copy generation runs downstream of this process (Phase G of the engagement process).
- **It does not push records into a cadence tool.** Cadence push runs downstream (Phase H). The cadence tool is the client's send infrastructure; the cohort exits this process as a scored, evidence-trailed dataset ready to be activated.
- **It does not handle reply triage or attribution back to plays.** That happens in Phase I and the client's CRM.

The engine produces the cohort and the proof. Activating the cohort is a separate motion.

---

## Versions

This process runs against:

- Cohort Quality framework version: 2026-05-13 (`practices/revops/cohort-quality-framework.md`)
- Engagement process version: 2026-05-13 (`practices/revops/ENGAGEMENT-PROCESS.md`)
- Gate workflow version (Teknova reference implementation): 1.6.0 (`practices/revops/workflows/explorium-direct/match-qualify-enrich.md`)
- Enrichment providers reference: current (`practices/revops/skills/enrichment-providers/SKILL.md`)

Any change to the Cohort Quality framework or to the modality taxonomy bumps the gate version. The Enrichment Runs row records which version ran.
