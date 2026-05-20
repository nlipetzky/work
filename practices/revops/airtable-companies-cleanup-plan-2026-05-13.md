# Airtable Companies table — cleanup plan

**Base:** `appYBYH3aOHhTODAw` (RevOps Surface)
**Table:** `tblnj3YlOI3thjrXp` (Companies)
**Drafted:** 2026-05-13
**Status:** Planning. Destructive changes deferred pending workflow / sync impact review.

This plan documents schema issues observed in the Companies table after sampling 200 of 613 records (33%). The 36 framework-backing fields added on 2026-05-13 are already live; this doc is about the pre-existing fields that need attention.

## Terminology referenced in this doc

The Airtable schema uses three acronyms — L1, L2, L3 — that refer to a planned refactor of the monolithic gate workflow into three separate workflows. Canonical source: `practices/revops/workflows/HANDOFF-three-layer-pipeline-2026-05-12.md`.

- **L1 (Capture)** — source-fetching workflows. Pulls raw records from a discovery source. No classification.
- **L2 (Classify)** — reads captured records and applies modality classification. Writes `Therapeutic Modality`, `Delivery Vehicle`, `Vector Evidence Clause`, `Verification Status`, `Rejection Reason`.
- **L3 (Filter)** — reads classified records and applies segment-fit scoring. Writes `Segment Score`, `Segment Version`, `Outreach Eligible`.

Today's monolithic gate workflow (`Z6RROKx5omdfvhtn`) does all three jobs in one workflow. The L1/L2/L3 fields exist because the refactor was scoped on 2026-05-12; whether they stay depends on whether the refactor is still on the roadmap.

---

## Issue 1: Boolean-text fields with inconsistent encoding

Eleven fields are typed as `singleLineText` but hold boolean-ish data. They are inconsistent across sources: Salesforce sync writes `"No"`; the workflow writes `"true"` / `"false"`. The same column carries both encodings.

| Field | Records populated | Distinct values observed | Inconsistency |
|---|---|---|---|
| `SF Has Open Opp` | 144 | `No` | clean (but should be checkbox) |
| `SF Has Closed Won` | 144 | `No` | clean (but should be checkbox) |
| `DNC Opt Out` | 144 | `No` | clean (but should be checkbox) |
| `Modality Confirmed` | 179 | `No` (144), `false` (24), `true` (11) | three encodings in one column |
| `Signal: Funding Event` | 179 | `No` (144), `false` (35) | two false-equivalents |
| `Signal: Leadership Hire` | 179 | `No` (144), `false` (35) | two false-equivalents |
| `Signal: IND/Stage Advance` | 179 | `No` (144), `false` (34), `true` (1) | three encodings |
| `Signal: Conference Presence` | 179 | `No` (144), `false` (35) | two false-equivalents |
| `Signal: Publication` | 144 | `No` | clean (but should be checkbox) |
| `Signal: Clinical Stage Advance` | 144 | `No` | clean (but should be checkbox) |
| `Signal: Phase Transition` | 144 | `No` | clean (but should be checkbox) |

**Why this matters.** Filtering on these fields is unreliable because filters that look for `true` miss `Yes`, and filters that look for `No` miss `false`. Workflow logic that branches on these fields produces inconsistent results depending on which writer touched the record last. This is plausibly part of the data-quality complaint from clients.

**Why I didn't fix it yet.** Changing a field type in Airtable is destructive (it creates a new column and migrates data, but the schema change ripples into every consumer: n8n workflows that read the field, Supabase syncs that write it, Salesforce mappings, Airtable views and forms). Doing it unilaterally would silently break those consumers.

**Recommended migration sequence** (per field):

1. Create a sibling checkbox field with the same name plus suffix (e.g. `SF Has Open Opp (bool)`).
2. Write a one-shot backfill script that maps `Yes` / `true` / `TRUE` / `1` -> checked, everything else -> unchecked.
3. Update every consumer to read the new field. Confirm.
4. Drop the original text field.
5. Rename the sibling to the original name.

This is one engineering sprint of work, not a five-minute task. Should be coordinated with whoever owns the Salesforce sync and the n8n workflow that writes the Signal:* fields.

---

## Issue 2: Modality field sprawl

Five fields all claim to describe company modality:

| Field | Records populated | Distinct values | Status |
|---|---|---|---|
| `Modality` | 67 | gate-output values (unknown, out_of_industry, geography_mismatch, gene_therapy_unspecified_vector, autologous_cell, modality_not_found_after_unmatched) | **CANONICAL.** Current workflow output. |
| `Primary Modality` | 110 | legacy taxonomy (AAV / Gene Therapy, AAV, Not Life Science, Research Platforms, Tools & Reagents, Small Molecule) | Legacy. Pre-current taxonomy. |
| `V2 Primary Modality` | 1 | Other Gene Therapy | Abandoned schema iteration. |
| `Therapeutic Modality` | 0 | — | Specified for L2 classification workflow; never populated. |
| `Delivery Vehicle` | 0 | — | Specified for L2 classification workflow; never populated. |

**Recommended consolidation:**

- **Keep `Modality`** as canonical. It's the current workflow output, matches the gate's vocabulary, and is what the engagement process refers to.
- **Deprecate `Primary Modality`** with an inline description: "Legacy taxonomy. Use `Modality` field. Read-only; do not write."
- **Drop `V2 Primary Modality`** (one record will be lost; that record needs the value moved into `Modality` first).
- **Hold on `Therapeutic Modality` and `Delivery Vehicle`.** These are specified for an L2 classification workflow that hasn't run in production. If that workflow is still planned, leave them. If not, drop them.

---

## Issue 3: Status field overlap

Four fields claim to track classification status:

| Field | Records populated | Distinct values | Status |
|---|---|---|---|
| `Enrichment Status` | 90 | rerouted_wrong_modality, archived_out_of_industry, enrichment_complete, disqualified_non_biotech, disqualified, needs_aav_review | **CANONICAL.** Current gate workflow output. |
| `Verification Status` | 54 | borderline, surfaced, rejected | L2 classification output per its description. Overlaps in spirit with Enrichment Status. |
| `Modality Confirmed` | 179 | (boolean-text mess) | Redundant with `Enrichment Status = enrichment_complete`. |
| `Outreach Eligible` | 0 | — | Specified as L3 filter output; never populated. |

**Recommended consolidation:**

- **Keep `Enrichment Status`** as canonical. It is the gate's outcome bucket and the engagement-process Phase D output.
- **Keep `Verification Status`** if the L2 layer is intended as a separate classification stage (the description says it is). Worth confirming with the workflow owner.
- **Deprecate `Modality Confirmed`.** Its information is captured in `Enrichment Status` (record is "confirmed" if `Enrichment Status = enrichment_complete`). Migration: drop the field after consumers update to use `Enrichment Status`.
- **Hold on `Outreach Eligible`.** Specified for L3 filter; never populated. If L3 still planned, leave; otherwise drop.

---

## Issue 4: Empty fields that may or may not be needed

Four fields have zero records populated:

| Field | Type | Schema description | Decision needed |
|---|---|---|---|
| `Existing Customer` | singleLineText | none | Should be checkbox per cohort-quality framework. Drop and recreate. |
| `Therapeutic Modality` | singleSelect | "What the product does therapeutically. Separate from delivery vehicle." | Tied to L2 plan; keep or drop based on L2 status. |
| `Delivery Vehicle` | singleSelect | "How the therapy gets delivered. AAV here = in scope for reagent play." | Tied to L2 plan; keep or drop. |
| `Outreach Eligible` | checkbox | "Final L3 output: this company is ready for outreach cadence" | Tied to L3 plan; keep or drop. |

**`Existing Customer` specifically** is referenced by the Cohort Quality framework as a company-level absolute suppression check. It needs to be a checkbox. Safe to drop and recreate since it has zero data.

---

## Suggested next steps

If you want to make incremental progress without waiting for a full migration sprint:

1. **Drop and recreate `Existing Customer` as a checkbox.** Zero data loss. Backs the framework's customer-relationship suppression check.
2. **Update descriptions on `Modality Confirmed` and `Primary Modality`** to mark them as deprecated and point readers at the canonical fields. (Doable now without touching data.)
3. **Confirm with the workflow owner whether the three-layer pipeline refactor is still on the roadmap.** If yes, leave `Therapeutic Modality`, `Delivery Vehicle`, `Outreach Eligible`, `Verification Status` as-is — they are the planned outputs of L2 Classify and L3 Filter (see `HANDOFF-three-layer-pipeline-2026-05-12.md`). If the refactor is deprioritized, drop them along with `V2 Primary Modality`.
4. **Plan the boolean migration** as a coordinated sprint. Owner needs to know every consumer that reads the affected fields before any column is dropped.

I can execute items 1 and 2 immediately on confirmation. Items 3 and 4 need decisions you have to make, not me.
