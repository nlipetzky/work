# Teknova Outreach Airtable — field gaps vs RevOps Surface

**Date:** 2026-05-20
**Outreach base:** `appFoLY6hjroyA2KW` (destination)
**RevOps Surface base:** `appYBYH3aOHhTODAw` (source of truth pre-handoff)
**Hand-off workflow:** `hjXfpABgHM0zjnda`

Source-of-truth principle: RevOps Surface holds the enriched record with full provenance. Outreach Airtable receives a curated subset — the fields Ellie and the sequence engine actually need to operate. This doc lists what Outreach is missing relative to the AAV criteria (offer, segment, modality taxonomy, Ellie's classification rules, and the May 12–14 email thread).

---

## Companies — fields to add

### 1. Three-bucket AAV segmentation (Ellie's May 13 ask)

| Field | Type | Notes |
|---|---|---|
| `AAV Segment` | singleSelect | Values: `AAV gene therapy`, `AAV production tool`, `AAV gene therapy + production tool`, `Not AAV`. System auto-classifies. |
| `Ellie Segment Override` | singleSelect | Same options. Authoritative when set. |
| `Ellie Note` | multilineText | Free-text rationale. |
| `Ellie Reviewed At` | date | When override was applied. |

Drives messaging branch (different offer for gene-therapy vs production-tool buyers).

### 2. Canonical / verification status (replaces "ClinicalTrials.gov is authoritative")

| Field | Type | Notes |
|---|---|---|
| `Canonical Status` | singleSelect | `Surfaced` / `Borderline` / `Rejected` from classifier. |
| `Verification Verdict` | singleSelect | `AAV` / `Not AAV` / `Not sure` from Ellie's review. |
| `Verification Evidence` | multilineText | Why — URL, paste, reasoning. |
| `Verification Checked At` | date | |
| `Vector Evidence Clause` | singleSelect or text | The literal "AAV + mechanism word" snippet that proved modality. |
| `Therapeutic Modality` | singleSelect | RevOps-spec modality (separate from existing `Primary Modality`). |
| `Delivery Vehicle` | singleSelect | Confirms vector vs production-tool use. |

### 3. Discovery provenance (multi-source canon)

| Field | Type | Notes |
|---|---|---|
| `Discovery Sources` | multipleSelects | `CT.gov`, `USPTO`, `ARM Atlas`, `ASGCT`, `PubMed`, `Teknova SF`, `Manual`. |
| `First Discovered` | date | |
| `Last Verified` | date | |
| `Source Confirmation Count` | number | How many independent sources name this company. |
| `Signal Structurally Unavailable` | checkbox | True for CDMOs (no trials) or preclinical (no trials). Prevents false "missing data" alarms. |

### 4. ClinicalTrials.gov detail (personalization material)

| Field | Type | Notes |
|---|---|---|
| `CT.gov NCT IDs` | multilineText | |
| `CT.gov Indications` | multilineText | |
| `Most Advanced Phase` | singleSelect | `Preclinical` / `IND-enabling` / `Phase I` / `Phase II` / `Phase III` / `Approved`. |
| `Trial Count` | number | |
| `Most Recent Trial Date` | date | Separates active pipeline from graveyard. |
| `Active Recruiting` | checkbox | |
| `Sample Intervention Name` | singleLineText | E.g., `AAV9-OTC` — Ellie's "single highest-signal" column from the classification rules doc. |

### 5. Currency / freshness (separate from enrichment freshness)

| Field | Type | Notes |
|---|---|---|
| `Currency Status` | singleSelect | `Current` / `Stale` / `Dead`. |
| `Currency Evidence` | multilineText | What's stale and why. |
| `Currency Checked At` | date | |
| `Stale Identity` | checkbox | Domain dead / LinkedIn marked inactive / M&A resolved. |

### 6. Account health and BD layering (operationalize the disqualifiers)

| Field | Type | Notes |
|---|---|---|
| `Account Health Status` | singleSelect | `Healthy` / `Distressed` / `Wind-down` / `Acquired`. |
| `M&A Status` | singleSelect | `Independent` / `Acquired` / `Pending` / `Subsidiary`. |
| `Outbound Restricted` | checkbox | Hard stop flag. |
| `Outbound Restriction Reason` | singleLineText | |
| `AE Cleared for Outreach` | checkbox | BD owner sign-off. |
| `AE Cleared By` | singleLineText | |
| `AE Cleared At` | date | |
| `Last BD Outcome` | singleSelect | `Booked` / `No-show` / `Declined` / `Lapsed` / `None`. |
| `BD Follow-up Window Opens` | date | Re-eligibility date for lapsed accounts. |

Note: `Active BD Engagement`, `DNC / Opt-Out`, `Customer Status`, `Active SF Opportunity` already exist. Add the above to round out the layered check.

### 7. Hard-filter result + tier (Jenn-visible)

| Field | Type | Notes |
|---|---|---|
| `Hard Filters Pass` | checkbox | One field that says "passes every hard rule." |
| `Company Tier` | singleSelect | `Tier 1` / `Tier 2` / `Tier 3` / `Excluded`. |
| `Company Tier Reason` | singleLineText | |
| `Cohort Quality Framework Version` | singleLineText | So we know which rule version this row was scored against. |

### 8. Strategic narrative (per the May 13 email — already in RevOps, not yet in Outreach)

| Field | Type | Notes |
|---|---|---|
| `Key Competitors` | multilineText | |
| `Company Focus` | multilineText | |
| `Strategic Notes` | multilineText | |
| `Parent Company` | singleLineText | |
| `Ultimate Parent` | singleLineText | Drives the top-20-pharma-subsidiary exclusion. |
| `Founded Year` | number | |
| `Sub-Vertical` | singleLineText | |
| `Stock Ticker` | singleLineText | Already exists as `Ticker` — confirm mapping. |
| `SEC CIK` | singleLineText | |

### 9. Funding detail (some exist, some missing)

| Field | Type | Notes |
|---|---|---|
| `Last Funding Date` | date | Already exists as `singleLineText` — change to `date` for filtering. |
| `Last Funding Amount USD` | currency | |
| `Total Known Funding USD` | currency | Already has `Total Funding` — confirm mapping. |
| `Number of Funding Rounds` | number | |

### 10. Channel availability

| Field | Type | Notes |
|---|---|---|
| `LinkedIn Channel Available` | checkbox | Distinct from per-contact LinkedIn validity. |
| `Phone Channel Available` | checkbox | |
| `Domain Last Verified` | date | |

### 11. Lifecycle

| Field | Type | Notes |
|---|---|---|
| `Lifecycle State` | singleSelect | `Discovered` / `Verified` / `Enriched` / `Outreach-ready` / `In Cadence` / `Engaged` / `Suppressed`. |

---

## Contacts — fields to add

### 1. Employment verification (Ellie's May 14 hard rule)

| Field | Type | Notes |
|---|---|---|
| `Employer Match Confirmed` | checkbox | Already exists as `Current Employer Match` — confirm mapping. |
| `Employment Verification Status` | singleSelect | `Confirmed` / `Stale` / `Departed` / `Unverified`. |
| `Recent Role Change Date` | date | |
| `Recent Promotion Date` | date | |

### 2. Salesforce activity exclusion (Ellie's May 14 hard rule)

| Field | Type | Notes |
|---|---|---|
| `SF Last Activity Date` | date | Mirrored from Salesforce Activity (Tasks + Events). Drives the "exclude any activity in last 6 months" rule. |
| `SF Last Activity Type` | singleLineText | Email / meeting / call. |
| `Per-Contact BD Follow-up Window Opens` | date | Re-eligibility for lapsed contacts. |
| `Last Per-Contact BD Outcome` | singleSelect | |

Note: existing `Last Engagement Date` is a rollup of Email Drafts — it does NOT cover SF Activity history. The 6-month rule needs a dedicated SF-sourced field.

### 3. Channel tiers (richer than existing fields)

| Field | Type | Notes |
|---|---|---|
| `Email Tier` | singleSelect | `Verified` / `Probable` / `Risky` / `Invalid`. |
| `Email Tier Reason` | singleLineText | |
| `LinkedIn Tier` | singleSelect | Same pattern. |
| `LinkedIn Tier Reason` | singleLineText | |
| `Phone Tier` | singleSelect | |
| `Phone Tier Reason` | singleLineText | |
| `Cohort Tier` | singleSelect | Overall contact tier. |
| `Cohort Tier Reason` | singleLineText | |

### 4. LinkedIn signal detail

| Field | Type | Notes |
|---|---|---|
| `LinkedIn URL Valid` | checkbox | |
| `LinkedIn Active Profile` | checkbox | |
| `LinkedIn Last Active` | date | |
| `LinkedIn Connection Possible` | checkbox | |
| `LinkedIn DNC` | checkbox | |
| `LinkedIn Active Cadence Elsewhere` | checkbox | |
| `Most Recent LinkedIn Post` | multilineText | Personalization material. |

### 5. Tenure breakouts

| Field | Type | Notes |
|---|---|---|
| `Tenure at Company (months)` | number | Distinct from `Tenure in Role`. |
| `Tenure in Function (months)` | number | Distinct from both. |

### 6. ICP scoring

| Field | Type | Notes |
|---|---|---|
| `ICP Score` | number | 0–100. |
| `ICP Score Reason` | multilineText | What contributed to the score. |
| `DMU Tier` | singleLineText | `Decision-maker` / `Influencer` / `User`. |
| `Source Confirmation Count` | number | |

### 7. Provider payload (audit trail)

| Field | Type | Notes |
|---|---|---|
| `Person Key` | singleLineText | Stable cross-base ID (already in RevOps). |
| `Raw Provider Payloads` | multilineText | Last-resort debugging surface. Optional. |

---

## Recommended cuts before adding

Before adding ~60 fields, prune what's likely dead:

- `Segments` (singleLineText) on both tables — superseded by the `Plays` linked table.
- `Total Segments Linked` (count) on Contacts — same.
- `Last Funding Date` (singleLineText) on Companies — replace with `date`-typed version.
- `Activity Log` (singleLineText) on Contacts — too generic, no clear writer.
- The four `*- DELETE` fields on Contacts (`Do Not Contact - DELETE`, `Email Opt Out - DELETE`, `Hard Bounced - DELETE`) — explicitly marked for removal.

---

## Priority order for implementation

**P0 (blocks AAV outreach correctness):**
- `AAV Segment` + `Ellie Segment Override` + `Ellie Note` + `Ellie Reviewed At`
- `Verification Verdict` + `Verification Evidence` + `Verification Checked At`
- `Discovery Sources` + `Source Confirmation Count` + `Signal Structurally Unavailable`
- `SF Last Activity Date` + `SF Last Activity Type` (Ellie's 6-month rule)
- `Employment Verification Status` + `Recent Role Change Date`
- `Hard Filters Pass`

**P1 (improves message quality):**
- `Sample Intervention Name`, `Most Advanced Phase`, `Most Recent Trial Date`
- `Key Competitors`, `Company Focus`, `Strategic Notes`, `Ultimate Parent`
- `Channel Tiers` (email / LinkedIn / phone) + reasons

**P2 (operational hygiene):**
- `Currency Status` + evidence + checked-at
- `Account Health Status`, `M&A Status`, `Outbound Restricted`
- `AE Cleared for Outreach` workflow
- `Lifecycle State`

---

## Workflow note

The hand-off workflow (`hjXfpABgHM0zjnda`) is locked from MCP access ("Workflow is not available in MCP. Enable MCP access in workflow settings"). Field mapping cannot be inspected here. Once MCP access is enabled, verify that the workflow writes:

1. Every P0 field above.
2. The `Person Key` and `Supabase ID` so re-syncs are idempotent.
3. `Last Enriched At` and `Currency Checked At` timestamps on every write.

If the workflow currently only writes the legacy field set, the new fields above need to be wired in before the AAV cohort moves to Outreach.
