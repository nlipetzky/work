# Handoff: Airtable → Airtable mover for AAV Companies (Wave 1 Ellie review)

**Date:** 2026-05-20
**Owner:** Workflows team (n8n / Airtable-to-Airtable mover)
**Upstream:** RevOps Surface (`appYBYH3aOHhTODAw`)
**Downstream:** Teknova Outreach (`appFoLY6hjroyA2KW`)
**Reference workflow:** `hjXfpABgHM0zjnda` (currently locked from MCP — enable MCP access in workflow settings before iterating)
**Companion docs:**
- [Field gap analysis](artifacts/teknova-outreach-airtable-field-gaps-2026-05-20.md) — full P0/P1/P2 scope
- [AAV criteria description](artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md)
- [Modality taxonomy](artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md)

---

## Outcome

A new view in Teknova Outreach `Companies` named **`Ellie Review — AAV Wave 1`** that I can download as CSV, upload to Google Sheets, and send to Ellie for review of the ~91 active AAV companies.

The mover must:
1. Add the 16 new fields below to the Teknova Outreach Companies table.
2. Sync values for those fields from RevOps Surface Companies (`tblnj3YlOI3thjrXp`) → Teknova Outreach Companies (`tblmd04rMsw3GE3pK`) for every record where RevOps `AAV Status (derived)` = `Active AAV`.
3. Compute the `Best Evidence` string from RevOps Company Events (`tblnzX2b2kqNGzW6r`) and write it into the destination row.
4. Keep `Ellie Verdict` / `Ellie Bucket` / `Ellie Note` / `Ellie Reviewed At` writable downstream (Ellie's returned CSV lands here next iteration — out of scope for this pass).

Contacts table is out of scope for this handoff. Company-first, contacts-second.

---

## Step 1 — Schema changes on Teknova Outreach Companies (`tblmd04rMsw3GE3pK`)

Add these 16 fields. Field IDs are auto-assigned by Airtable; capture them in your config once created.

### System verdict (4 fields)

| Field name | Type | Options / notes |
|---|---|---|
| `Verification Verdict` | singleSelect | Options: `AAV`, `Not AAV`, `Not sure` |
| `AAV Segment` | singleSelect | Options: `Gene therapy`, `Production tool`, `Both`, `Not AAV` |
| `Canonical Status` | singleSelect | Options: `Surfaced`, `Borderline`, `Rejected` |
| `Hard Filters Pass` | checkbox | |

### Evidence summary (4 fields)

| Field name | Type | Options / notes |
|---|---|---|
| `Best Evidence` | singleLineText | Computed citation string. See Step 3. |
| `AAV Positive Event Count` | number | Integer. Mirror of RevOps `AAV Active Event Count`. |
| `Most Recent AAV Event Date` | date | Mirror of RevOps `Latest AAV Event Date`. |
| `AAV Event Sources` | multipleSelects | Options: `ctgov`, `pubmed`, `uspto`, `press`, `manual`. Deduped set of `Provider` values across AAV-positive events for this company. |

### Pressure-test columns Ellie asked for (4 fields)

| Field name | Type | Options / notes |
|---|---|---|
| `Sample Intervention Name` | singleLineText | E.g., `AAV9-OTC`, `rAAV2-RPE65`. Pulled from the same event row that drives `Best Evidence`. |
| `Most Advanced Phase` | singleSelect | Options: `Preclinical`, `IND-enabling`, `Phase I`, `Phase II`, `Phase III`, `Approved`. Mirror of RevOps `Most Advanced Phase` (same name on source). |
| `Lead Indication` | singleLineText | Mirror of RevOps `Lead Indication`. Distinct from existing `Pipeline / Indication` multilineText. |
| `Ultimate Parent` | singleLineText | Mirror of RevOps `Ultimate Parent`. |

### Ellie's return values (4 fields)

These start empty. Ellie's returned CSV will populate them in the next iteration. Create the fields now so the schema is stable.

| Field name | Type | Options / notes |
|---|---|---|
| `Ellie Verdict` | singleSelect | Options: `AAV`, `Not AAV`, `Not sure` |
| `Ellie Bucket` | singleSelect | Options: `Gene therapy`, `Production tool`, `Both`, `Not AAV` |
| `Ellie Note` | multilineText | |
| `Ellie Reviewed At` | date | |

---

## Step 2 — Sync mapping (RevOps Surface → Teknova Outreach)

**Source filter:** RevOps Companies where `AAV Status (derived)` contains `Active AAV`.

**Match key:** prefer `Supabase ID` if both bases carry it. Fall back to normalized `Company Name + Domain`. Confirm match logic with existing workflow `hjXfpABgHM0zjnda`.

**Field mapping (write on each sync):**

| Source (RevOps Surface Companies) | Destination (Teknova Outreach Companies) | Notes |
|---|---|---|
| `Verification Verdict` | `Verification Verdict` | Pass-through singleSelect name |
| `AAV Segment` | `AAV Segment` | Pass-through singleSelect name |
| `Canonical Status` | `Canonical Status` | Pass-through singleSelect name |
| `Hard Filters Pass` | `Hard Filters Pass` | Pass-through checkbox |
| (computed — see Step 3) | `Best Evidence` | |
| `AAV Active Event Count` | `AAV Positive Event Count` | Numeric pass-through |
| `Latest AAV Event Date` | `Most Recent AAV Event Date` | Date pass-through |
| (computed — see Step 3) | `AAV Event Sources` | |
| (computed — see Step 3) | `Sample Intervention Name` | |
| `Most Advanced Phase` | `Most Advanced Phase` | Pass-through singleSelect name |
| `Lead Indication` | `Lead Indication` | Pass-through text |
| `Ultimate Parent` | `Ultimate Parent` | Pass-through text |

**Do not overwrite** the four `Ellie *` fields on sync. They are downstream-only writes.

**Existing fields not in this mapping:** the legacy AAV fields on Teknova Outreach (`AAV Program Confirmed`, `AAV Program Source`, `Primary Modality`, `Delivery Vector`, `Pipeline / Indication`, etc.) keep their current sync behavior. This handoff only adds.

---

## Step 3 — Compute `Best Evidence`, `Sample Intervention Name`, `AAV Event Sources`

These three fields require touching the Company Events table (`tblnzX2b2kqNGzW6r`), filtered to events linked to the source company.

### Selection logic — "the winning event" per company

From all Company Events linked to the source company where `AAV Verdict = yes`:

1. Filter to events where `Confidence = high` if any exist; otherwise fall back to `medium`; otherwise `low`.
2. Within that tier, prefer `Event Type = clinical_trial_status` over `publication` over `patent` over other types.
3. Tiebreak by most recent `Event Date`.

The single event that survives this filter is the "winning event."

### Format the three computed fields

**`Best Evidence`** — single-line string:

```
{External ID} — "{Intervention Names first line}" — {Event Date YYYY-MM-DD} — {Most Advanced Phase or Title fallback}
```

Example:
```
NCT03882437 — "AAV9.LAMP2B" — 2023-03-03 — Phase 1 Danon disease
```

If `Intervention Names` is empty (often true for publications), use `Title` first 80 chars. If `External ID` is empty, use `Source URL` host + path tail.

**`Sample Intervention Name`** — the first line of the winning event's `Intervention Names` field. Empty if none.

**`AAV Event Sources`** — deduped set of `Provider` values across ALL AAV-positive events for the company (not just the winning event). Cast to the destination's multipleSelects options. Map provider values:
- `clinicaltrials.gov` → `ctgov`
- `pubmed` → `pubmed`
- `uspto` → `uspto`
- Press release / news scrapers → `press`
- Manual entry → `manual`

Unknown providers: log and skip (don't fail the sync).

---

## Step 4 — Create the view

After fields exist and a first sync run completes, create this view on Teknova Outreach Companies:

**View name:** `Ellie Review — AAV Wave 1`
**View type:** Grid

**Filters (AND):**
- `Hard Filters Pass` is checked
- `Verification Verdict` is `AAV`

**Group by:** `AAV Segment` (so the three buckets cluster)

**Sort within group:**
1. `Most Recent AAV Event Date` desc
2. `AAV Positive Event Count` desc

**Visible fields, in this order:**
1. `Company Name`
2. `AAV Segment`
3. `Best Evidence`
4. `Sample Intervention Name`
5. `Lead Indication`
6. `Most Advanced Phase`
7. `Most Recent AAV Event Date`
8. `AAV Positive Event Count`
9. `AAV Event Sources`
10. `HQ State`
11. `Country`
12. `Employee Count`
13. `Ultimate Parent`
14. `Verification Verdict`
15. `Canonical Status`
16. `SF Activity Summary`

Hide everything else.

**Note:** `SF Activity Summary` is an existing field on Teknova Outreach Companies (multilineText, AI-generated 2-4 sentence summary of recent Salesforce activity — Tasks, Events, Open Opps, Cases — refreshed daily by the SF Enrichment workflow). No schema change required for this field. Nick is handling confirmation that the SF Enrichment workflow is keeping it fresh; the mover does not need to populate it.

---

## Validation checklist

Before declaring done, confirm:

- [ ] All 16 new fields exist on Teknova Outreach Companies with the exact names and types listed.
- [ ] Single-select option lists match exactly (case-sensitive in Airtable's API).
- [ ] At least one full sync run has completed against the AAV active cohort (target: ~91 records).
- [ ] Spot-check 3 records: `Best Evidence` reads like the Rocket Pharma example. `Sample Intervention Name` matches the citation. `AAV Event Sources` contains at least `ctgov` for any company with a CT.gov-sourced verdict.
- [ ] `Ellie Verdict` / `Ellie Bucket` / `Ellie Note` / `Ellie Reviewed At` are empty on every row (no accidental sync overwrites).
- [ ] The `Ellie Review — AAV Wave 1` view exists, filters correctly, returns ~91 rows.
- [ ] CSV download from the view contains exactly the 16 visible columns and no hidden columns.

---

## Out of scope (do not do)

- **Contacts table changes.** Company-first review. Contacts handoff comes after Ellie returns the CSV.
- **The P1/P2 fields from the gap doc** (Currency Status, Account Health, AE Cleared, Channel Tiers, Lifecycle State, etc.). Those are next-iteration scope.
- **Removing legacy AAV fields** (`AAV Program Confirmed`, `AAV Program Source`). Keep them for now; deprecate in a separate sweep.
- **Auto-writing back Ellie's verdicts.** That's a separate handoff once we know the CSV-return format she sends.

---

## Open questions for the workflows team

1. Does `hjXfpABgHM0zjnda` already match records by `Supabase ID`, or does it use `Company Name + Domain`? Confirm before adding the new field mappings.
2. Where should `Best Evidence` be computed — inside this n8n workflow, or as a formula field on RevOps Surface that the sync just mirrors? My recommendation: compute in the workflow (single source of truth for the citation logic). Push back if there's a reason to prefer the formula approach.
3. The `AAV Event Sources` multipleSelects field needs its options pre-created in Airtable. Confirm whether n8n's Airtable node can auto-create option values, or whether we need to add `ctgov`, `pubmed`, `uspto`, `press`, `manual` manually before first sync.
4. RevOps Surface's `Latest AAV Event Date` is a rollup. Does the n8n Airtable node read rollup values reliably, or does it need a writable mirror field?
