# ANALYSIS — Companies table data coverage for AAV gene therapy targeting

**Date:** 2026-05-20
**Base:** RevOps Surface `appYBYH3aOHhTODAw` → Companies `tblnj3YlOI3thjrXp` (136 fields)
**Cross-reference sources:**
- AAV criteria: `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` (v4)
- State model: `practices/revops/ARTIFACT-company-state-model-2026-05-19.md`
- Field audit: `practices/revops/AUDIT-companies-field-provenance-2026-05-19.md`
- Data Sources catalog: System Registry `apppQjlZiktpbO4aX` / `tblut8xIt9MgMO892` (31 sources)
- Data Fields catalog: System Registry `apppQjlZiktpbO4aX` / `tbl6Ou9PprvZzhkgx` (32 fields)

The Companies table evaluates "is this a qualified AAV gene-therapy account?" against the v4 criteria. This document maps every data point the criteria needs back to a Companies field, and flags gaps.

---

## Headline

The Companies table already has fields for **every hard filter** in the AAV segment. The actual gaps are:
1. **Two soft signals have no first-class field** (process-dev leadership hire, AAV-process publication). These belong in Company Events, not Companies columns.
2. **Three Explorium-extractable fields are not mirrored** (intent_topics, change_in_engineering_roles, live_techs) — all are buying-intent proxies that would tighten the soft-signal scoring.
3. **Nine orphan fields are empty across all 122 companies** (per audit). Most are deletion candidates; one (`Exclusion Reason`) is structurally required by the state model and needs a writer, not a delete.
4. **Several manual-only fields exist but are unpopulated**, which throttles `expert_ready` even when the data is there (see §5).

No new firmographic field is needed for AAV qualification. The work is plumbing existing fields, not schema growth.

---

## 1. Hard-filter coverage (must-have)

Every hard filter in the AAV criteria maps to one or more existing Companies fields.

| AAV hard filter | Companies field(s) | Status |
|---|---|---|
| Active AAV gene therapy work | `AAV Segment`, `Therapeutic Modality`, `Delivery Vehicle`, `Verification Status`, `Verification Verdict`, `Verification Evidence`, `Vector Evidence Clause`, `Custom Classification` | ✅ working (L2 writes) |
| Stage: preclinical through Phase II | `Clinical Stage`, `Most Advanced Phase`, `Development Stage`, `Currency Status`, `Currency Evidence` | ✅ working (L1/L2 + currency writes) |
| Size: <2,000 FTE or AAV CDMO | `Employee Count`, `Employee Range`, `Company Type`, `Sub-Vertical`, `NAICS Code` | ✅ working (Explorium) |
| Not wholly-owned subsidiary of top-20 pharma | `Subsidiary Status`, `Parent Company`, `Ultimate Parent` | ✅ working (Explorium) |
| Geography: US or Canada | `HQ Country`, `HQ State`, `HQ City` | ✅ working |

**Verdict:** no hard-filter gap. The classifier has every input it needs.

---

## 2. Soft-signal coverage (scoring, not exclusion)

| AAV soft signal | Companies field | Status |
|---|---|---|
| Recent funding round (Series A+, 45d) | `Last Funding Date`, `Last Funding Amount USD`, `Total Known Funding USD`, `Number of Funding Rounds`, `Funding Stage` | ✅ working (Explorium) |
| Recent IND filing / clinical-stage advance (60d) | `Most Recent Trial Date`, `Active Recruiting`, `CT.gov NCT IDs`, `CT.gov Indications`, `Currency Status` | ✅ working (CT.gov via L1) |
| Capacity-expansion / process-dev leadership hire (60d) | `Leadership Hire` (legacy / Supabase-mirrored, see §5) + Company Events `leadership_hire` rows | ⚠️ **gap** — no writer wired; field exists but unpopulated |
| Recent conference attendance / speaking presence (90d) | `Conference Attendance 12mo Count`, `Conference Presence` | ⚠️ **gap** — fields exist, no writer |
| Recent publication on AAV process (12mo) | `Recent Publication` (legacy / Supabase-mirrored) + Company Events `publication` rows | ⚠️ **gap** — no writer wired |
| Tenure-in-role >12mo | contact-level (`Tenure (Months)`) | ✅ working (contact gate) |
| Pipeline therapeutic area named in messaging | `Lead Indication`, `Pipeline Indication`, `CT.gov Indications` | ⚠️ partial — `Lead Indication` writer not confirmed; `Pipeline Indication` is orphan (empty, candidate for delete) |

**Soft-signal verdict:** funding + clinical signals are wired. Hiring, conference, publication signals have field placeholders but **no source workflow writes them**. These are the cheapest data lifts available — Perplexity/Exa already in the connected source list can fill them via ad-hoc per-company queries on the cohort.

---

## 3. Disqualifier / suppression coverage

All disqualifiers map to existing fields, most of which are working.

| Disqualifier | Companies field | Status |
|---|---|---|
| Active BD engagement (6mo) | `Last BD Outcome`, `BD Follow-up Window Opens`, `Last Account-Level Contact Date`, `Salesforce Engagement`, `SF Account Status Summary` | ✅ working (SF sync) |
| Active SF Opportunity | `SF Has Open Opp`, `SF Opp Stage`, `Active SF Opportunity` (Teknova base only) | ✅ working (SF sync) |
| Current customer | `Current Customer`, `SF Has Closed Won`, `SF Account Type` | ✅ working (SF sync) |
| Account DNC | `Account-Level DNC`, `Outbound Restricted`, `Outbound Restriction Reason` | ⚠️ field exists, manual-only — unpopulated |
| Acquired / abandoned | `Stale Identity`, `M&A Status` | ⚠️ field exists, manual-only — unpopulated |
| Account health (churn/risk) | `Account Health Status` | ⚠️ field exists, manual-only — unpopulated |
| AE clearance override | `AE Cleared for Outreach`, `AE Cleared By`, `AE Cleared At` | ✅ manual-only by design |

**Disqualifier verdict:** the SF-sourced disqualifiers are working. The manual-only suppression flags (DNC, M&A, stale identity, account health) sit unpopulated. These are the silent reason `expert_ready` cannot fire on rows that otherwise pass.

---

## 4. Lifecycle State coverage (state model)

Required field set per state, against current Companies fields:

| State | Entry condition fields | Status |
|---|---|---|
| `raw` | row exists | ✅ |
| `enriched` | `Last Enriched At` set + `Deep Enrichment Raw` not empty | ✅ |
| `classified` | `Verification Status`, `Currency Status`, `Classification Version`, `Classification Run Date` | ✅ |
| `icp_validated` | ≥1 linked Contact with `Enrichment Status != icp_filtered_out` AND `Employer Match Confirmed=true` AND `Email Verified Status` ∈ {Verified, Catch-all} | ✅ (contact-side) |
| `expert_ready` | state=`icp_validated` AND suppression flags clear AND `SF Sync Timestamp` recent | ✅ (fields present; suppression flags need population — see §3) |
| `excluded` | `Exclusion Reason` populated | ⚠️ field exists but is an orphan — no writer |

**State-model verdict:** the only structurally required field that is **not** working is `Exclusion Reason`. Every other state has its full entry-condition field set in place. `Exclusion Reason` needs to become a writable output of the classifier / suppression evaluation, not a deletion candidate.

---

## 5. Orphan-field decisions (the 9-field safe-delete list)

Per the field provenance audit, nine fields are empty across all 122 companies. Re-evaluated against AAV criteria coverage:

| Field | Need for AAV | Recommendation |
|---|---|---|
| `Active Signals Summary` | Yes — readable summary of in-window Company Events | **Keep + populate** via gate workflow (`Active Signals Count` already designed by gate workflow; this is its human-readable companion) |
| `Company Status` | Redundant with `Lifecycle State` + `Enrichment Status` + `Verification Status` | **Delete** |
| `Exclusion Reason` | **Required by state model** (`excluded` carries this) | **Keep + give it a writer** (state-derivation workflow) |
| `Pipeline Indication` | Overlaps with `Lead Indication` + `CT.gov Indications` | **Delete** (consolidate to `Lead Indication`) |
| `Play` | Per-play structure is now `Custom Classification` (AAV/lenti/etc.) | **Delete** |
| `Play Eligibility Status` | Replaced by `Lifecycle State` (`expert_ready` is the new "eligible") | **Delete** |
| `Playbook Fit Level` | Overlaps with `Fit Score`, `Company Score`, `Company Tier` | **Delete** |
| `Research Focus` | Overlaps with `Company Focus` + `Sub-Vertical` + `Lead Indication` | **Delete** |
| `V2 Company Type` | Migration leftover. `Company Type` is the live field. | **Delete** |

**Revised safe-delete list:** 7 fields, not 9. **Keep + populate** `Active Signals Summary` and `Exclusion Reason`.

---

## 6. Explorium fields available but not mirrored to Companies

The Data Fields catalog documents 32 Explorium fields. Of these, the following firmographic / behavioral fields are **not** currently surfaced on Companies but would directly tighten AAV soft-signal scoring:

| Explorium field | Companies field name (suggested) | Why it matters for AAV |
|---|---|---|
| `intent_topics` | `Intent Topics` (multilineText / array) | Buying-intent surface ("GMP manufacturing", "viral vector production"). Highest-signal Explorium output for the Teknova offer. |
| `change_in_engineering_roles` | `Engineering Role Growth QoQ` (number) | Proxy for capacity-build hiring soft signal — fills the leadership-hire gap when individual events haven't fired yet. |
| `live_techs` | `Tech Stack` (multilineText) | Useful disambiguator on edge cases (e.g. presence of LabVantage / Veeva / GMP-LIMS = process-stage signal). |
| `is_ipo` | already covered by `Publicly Traded` | overlap — skip |
| `perc_engineering_roles` | optional | secondary to QoQ delta |

**Recommendation:** add `Intent Topics`, `Engineering Role Growth QoQ`, `Tech Stack`. Three columns. All come from the same Explorium deep-enrich call already running, so the lift is the schema add + extract step, not a new connection.

---

## 7. Sources named as known-available but not wired

Per the Data Sources catalog (31 rows; 7 connected, 24 `available-not-wired`), the following sources would feed AAV-specific Companies data not yet captured:

| Source | What it fills on Companies | Field implication |
|---|---|---|
| USPTO / PatentsView / Google Patents | `Patent Count` (exists, no writer) — AAV vector/capsid/manufacturing IP | wire writer; field already exists |
| NIH RePORTER | early-stage academic-spinout funding signal | Company Events `nih_grant_award` row, no new Companies field |
| SEC EDGAR | 10-K / 10-Q / 8-K disclosures for public companies | Company Events `sec_filing` row keyed off `SEC CIK` (already on Companies) |
| ASGCT | AAV-specific conference presence | Company Events `conference_presence` row + populate `Conference Attendance 12mo Count` |
| BioProcess International | CMC-specific conference presence | same as ASGCT |
| Citeline / Pharmaprojects (paid) | structured pipeline / modality / MoA — alternative to CT.gov | only if CT.gov + L2 prove insufficient |

**Recommendation:** the highest-leverage next-source connection for AAV targeting is **USPTO/PatentsView** — it fills the `Patent Count` field that currently has no writer, and AAV vector/capsid IP is a directly buyer-relevant signal Ellie would recognize.

---

## 8. Concrete next-action list

In order of cost-to-value:

1. **Populate the manual-only suppression flags** (`Account-Level DNC`, `M&A Status`, `Stale Identity`, `Account Health Status`) on the 122 existing rows. No engine work. This is the single biggest unblock for `expert_ready`.
2. **Give `Exclusion Reason` a writer** as part of the state-derivation workflow. Required by state model, currently orphaned.
3. **Delete the 7 confirmed-orphan fields** (`Company Status`, `Pipeline Indication`, `Play`, `Play Eligibility Status`, `Playbook Fit Level`, `Research Focus`, `V2 Company Type`). Frees the schema; no data loss (all empty).
4. **Wire `Active Signals Summary`** as a derived/computed string from the in-window Company Events rows the gate workflow already counts.
5. **Add three Explorium fields** (`Intent Topics`, `Engineering Role Growth QoQ`, `Tech Stack`) and extract from the existing deep-enrich payload. Same call; new extractor step.
6. **Wire writers for the soft-signal Company Events** (`leadership_hire`, `publication`, `conference_presence`, `press_mention`) — Perplexity-driven, per-company, on the cohort about to be surfaced. Not a Companies-table change; populates existing summary fields on Companies.
7. **Connect USPTO/PatentsView** and wire `Patent Count` writer. Defer until items 1-6 are done.

Items 1-3 are within-Airtable. Items 4-6 require workflow changes. Item 7 is a new source connection.

---

## What this analysis does NOT change

- The canonical AAV segment artifact at `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` — read + derive, never re-author (per memory).
- The Lifecycle State design — that artifact stands; this analysis confirms the field set is sufficient.
- The contact-side trust work (employment + email + ICP) — closed and verified.
