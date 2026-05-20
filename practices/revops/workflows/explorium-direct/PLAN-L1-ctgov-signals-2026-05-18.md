# L1 — clinicaltrials.gov → Company Events Signals Implementation Plan

> **For the executing session (Explorium-Direct lane).** Self-contained. You own L1 and its spec. This is a MANUAL n8n UI edit — do NOT push via n8n-mcp `update_workflow` (it wipes L1's 3 Airtable credentials; the L1 spec already mandates hand-edit). Verify by a real run + surface read-back. Where it says STOP, stop.

**Goal:** L1 keeps everything it does today (per-sponsor Company upsert), and ADDITIONALLY writes one signal row per clinicaltrials.gov trial into the Company Events table, so currency becomes a multi-source signal model instead of a flat single-source field.

**What this does NOT do (state to Nick, do not oversell):** this is step 1 only — clinicaltrials.gov as signal source. It does **not** fix Pfizer/Adrenas. Those need the second signal source (trade press) plus a verdict-derived-over-signals step — a SEPARATE later plan, and the spend decision. This plan lays the rail; it does not catch press-killed programs by itself.

**Workflow:** `9gcmEjq1lvOY2jZS` ("Canonical AAV Discovery - L1 ClinicalTrials.gov"), inactive, manual. Base `appYBYH3aOHhTODAw`: Companies `tblnj3YlOI3thjrXp`, Company Events `tblnzX2b2kqNGzW6r`, Enrichment Runs `tblEVSEqetmu4ScHe`. Spec of record: `explorium-direct/SPEC-L1-recency-change-2026-05-15.md`.

## Hard constraints (read before Task 1)

- **Manual UI edits only.** No `update_workflow`. The 3 Airtable nodes carry credentials the MCP wipes; the L1 spec is hand-edit-only. All changes are made in the n8n editor.
- **Do not change existing behavior.** The per-sponsor Companies upsert, the run log, the CT.gov query — all stay exactly as they are. You are ADDING a signal-writing branch, not rewiring.
- **Idempotent by NCT — no duplicate signals.** Re-running L1 (it's a weekly sweep) must NOT append a second row for the same trial. Each signal row is keyed by `External ID` = NCT. On re-run, the existing row for that NCT is updated (upsert/match on External ID), not blindly created. We just fixed one duplicate-log defect; do not introduce a duplicate-signal one.
- **Single writer.** Confirm no other session is mid-edit on `9gcmEjq1lvOY2jZS` (System Registry `apppQjlZiktpbO4aX` → Assets → L1). 
- **No spend.** clinicaltrials.gov is free. Nothing here calls a paid tool.
- Selective-run protocol does not cleanly apply to L1 (it's a discovery sweep, not a reclassify of a checked subset). Out of scope here; leave it to the protocol-rollout roadmap item. Do not force it in.

## Recon-confirmed current state (verified 2026-05-18, agentId a1426f0e5b05761dd — confirm, do not re-derive)

- Linear graph: Schedule Trigger → Fetch AAV Studies (HTTP) → **Extract Industry Sponsors (Code)** → Bulk Lookup Existing Sources (Airtable) → Merge Discovery Sources (Code) → Batch for Airtable (splitInBatches 10) → **Upsert Company (Airtable upsert, match Company Name)** + Prepare Run Log → Write Run Log.
- CT.gov query already returns per trial: `nctId, briefTitle, leadSponsor, collaborators, phases, overallStatus, conditions, interventions, startDateStruct, lastUpdatePostDateStruct`. **Payload coverage is NOT the gap.**
- THE GAP: `Extract Industry Sponsors` collapses trials into one per-sponsor object; per-trial detail (status/date/phase per NCT) is discarded — only an `nctIds` array survives. And the workflow never holds an Airtable Company record id (upsert matches by name, never reads the id back), so a Company Events `Company` link can't be set without resolving the id.

## Task 1: Confirm current state
- [ ] Open `9gcmEjq1lvOY2jZS` in the n8n UI. Confirm `Extract Industry Sponsors` flattens trials as described and that `Upsert Company` is an Airtable upsert matched on Company Name. If it diverges, STOP and report.

## Task 2: Retain per-trial objects
- [ ] In `Extract Industry Sponsors`, in addition to the existing per-sponsor rollup it already returns, also carry through a per-trial array on each sponsor item: for every trial, keep `{ nct, overallStatus, startDate (startDateStruct.date), lastUpdateDate (lastUpdatePostDateStruct.date), phase, briefTitle, conditions }`. Do not remove or alter the existing rollup fields — only add this array. Existing downstream nodes ignore the new field; nothing else changes.

## Task 3: Resolve the Company record id
- [ ] The `Upsert Company` Airtable node returns the upserted record including its `id`. Add a node immediately AFTER `Upsert Company` (a Code or Set node) that pairs each upserted company's Airtable record id with its per-trial array from Task 2 (match on Company Name). Output: one item per TRIAL, each carrying `{ companyRecordId, nct, overallStatus, startDate, lastUpdateDate, phase, briefTitle, conditions, companyName }`.

## Task 4: Write the trial signal rows (idempotent)
- [ ] Add an Airtable node after Task 3, operation **upsert** on Company Events `tblnzX2b2kqNGzW6r`, **match on `External ID`**. For each trial item, write:
  - `Event Type` = `clinical_trial_status`
  - `External ID` = the NCT
  - `Signal State (raw)` = the raw `overallStatus` string, verbatim
  - `Vitality` = normalized: TERMINATED/WITHDRAWN/SUSPENDED → `ended`; RECRUITING/ACTIVE_NOT_RECRUITING/ENROLLING_BY_INVITATION/NOT_YET_RECRUITING → `active`; COMPLETED/UNKNOWN with start-or-last-update within 5 years → `active`, else → `dormant`; missing/unparseable → `unknown`. (Same thresholds as the L2 currency function — keep them identical so the two agree.)
  - `Event Date` = lastUpdateDate or startDate (whichever exists, prefer lastUpdate)
  - `Most Recent Activity Date` = same as Event Date
  - `Detected At` = run date
  - `Source URL` = `https://clinicaltrials.gov/study/<NCT>`
  - `Provider` = `clinicaltrials_gov`
  - `Raw Reference` = `ctgov:<NCT>`
  - `Detail` = brief title + phase
  - `Company` = link to `[companyRecordId]`
  - `Is Latest` = true
  - `Confidence` = high
- [ ] Because the match is on `External ID`, a weekly re-run updates the existing per-NCT row in place — no duplicates. Confirm the Airtable node is upsert, not create.

## Task 5: Verify on a real run (no spend, bounded)
- [ ] Run L1 once (it's a free CT.gov sweep). After it completes:
  - Company Events has one row per distinct NCT, `Event Type = clinical_trial_status`, `Company` link set, `Vitality` populated, `Signal State (raw)` = the CT.gov status.
  - Spot-check eyeDNA's terminated NCT → `Vitality = ended`; an active sponsor's NCT → `active`.
  - Existing Companies upsert behavior unchanged (Most Recent Trial Date / Active Recruiting still written as before).
- [ ] Run L1 a SECOND time. Confirm Company Events row count for those NCTs did NOT increase (idempotent upsert working). If rows duplicated, the match-on-External-ID is misconfigured — fix before close-out.

## Task 6: Close-out
- [ ] System Registry `apppQjlZiktpbO4aX`: update the L1 Capture asset — note signal-writing added; set `Reconciled Against Reality` true only after Task 5 passed (this also closes the L1 registry gap: source-of-record is `SPEC-L1-recency-change-2026-05-15.md` + this plan, owner Explorium-Direct).
- [ ] Update `SPEC-L1-recency-change-2026-05-15.md` with the added nodes (it is L1's source of record; keep it current — L1 has no other checked-in source).
- [ ] Report to Nick: signals rail is in; reiterate this does NOT yet fix Pfizer/Adrenas — that is the next plan (trade-press second signal + verdict-over-signals, the spend).

## Self-review
Existing behavior untouched (Tasks add, never rewire) → Task 2/3 additive; idempotency by NCT → Task 4; record-id linkage solved → Task 3; verification incl. a second run for dup check → Task 5; honest non-claim about Pfizer/Adrenas stated up front and at close-out. Manual-UI constraint honored throughout.
