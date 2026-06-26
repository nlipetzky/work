# Handoff — Builder to Boris (2026-05-20)

**Workflow:** `9gcmEjq1lvOY2jZS` ("Canonical AAV Discovery - L1 ClinicalTrials.gov")
**Re:** Response to `DIRECTIVE-phase1-reverify-2026-05-20.md`

References only. No narrative.

---

## Live workflow state at handoff time

- versionId: `6e9b09e9-e781-461a-8e77-507d9f3d429d`
- updatedAt: `2026-05-20T02:58:48.485Z`
- active: `true`
- settings: `{"executionOrder":"v1","availableInMCP":true,"binaryMode":"separate"}`
- 15 nodes, including the 4 you added (`Define Search Queries`, `Deduplicate NCTs`, `Classify Trials`, `Write Classification Events`)

Live versionId drifted three times during my response window: `1cedfe74-...` → `70658af8-...` → `3aadb69b-...` → `330ed07f-...` → `6e9b09e9-...`. Cite live at re-read.

---

## Edits I applied (content only, no shape change)

Made during the small-batch re-verification cycle:

1. `Define Search Queries` jsCode → emits 1 query (`Dependovirus`) for small-batch. (Reverted by your subsequent UI edits — current live emits 5 queries.)
2. `Fetch AAV Studies` `pageSize` 100→10, `maxRequests` 50→1 for small-batch. (Reverted by your subsequent UI edits.)
3. `Write Classification Events` `base.value` `""` → `"appYBYH3aOHhTODAw"`, `table.value` `""` → `"tblnzX2b2kqNGzW6r"`. **Persisted across your edits — currently still set.** This was a blocker: workflow could not execute with empty base/table.

---

## Directive item 6 — settings shape

Tested. Sequence:

1. Raw REST `PUT /api/v1/workflows/9gcmEjq1lvOY2jZS` with body `settings: {executionOrder: "v1"}` only. PUT returned 200.
2. Immediate raw GET. Response `settings` = `{"executionOrder":"v1","availableInMCP":true,"binaryMode":"separate"}`.
3. Re-tested across versionIds `70658af8-...`, `3aadb69b-...`. Identical outcome.

Conclusion (referenced, not asserted): n8n server-side appends `availableInMCP` and `binaryMode` after raw REST PUT. The 1-key shape `{executionOrder}` is not landable via raw REST. The presence of these keys is not evidence of MCP `update_workflow` use.

Reporting this as a directive blocker per directive instruction.

---

## Execution 80848 — small-batch run on my edits

- workflowId: `9gcmEjq1lvOY2jZS`
- versionId at run: `3aadb69b-a65b-4ac1-944a-e8d95e867979` (since superseded)
- mode: `manual`, status: `success`
- started: `2026-05-20T01:48:30.677Z`, stopped: `2026-05-20T01:48:52.479Z`

Per-node runData (15 nodes):

- Weekly Monday 6am: runs=1, out=[1]
- Define Search Queries: runs=1, out=[1]
- Fetch AAV Studies: runs=1, out=[1]
- Deduplicate NCTs: runs=1, out=[1]
- Extract Industry Sponsors: runs=1, out=[10]
- Bulk Lookup Existing Sources: runs=1, out=[171]
- Merge Discovery Sources: runs=1, out=[10]
- Batch for Airtable: runs=2, out=[0,10], total=10
- Upsert Company: runs=1, out=[10]
- Resolve & Explode Trials: runs=1, out=[10]
- Classify Trials: runs=1, out=[10]
- Write Trial Signals: runs=1, out=[10]
- Write Classification Events: runs=1, out=[10]
- Prepare Run Log: runs=1, out=[1]
- Write Run Log: runs=1, out=[1]

5 Airtable nodes credential bindings (raw GET):

- Bulk Lookup Existing Sources → `airtableTokenApi=gppZOg4RmjcuPf9T/All KAI Bases`
- Write Run Log → `airtableTokenApi=gppZOg4RmjcuPf9T/All KAI Bases`
- Upsert Company → `airtableTokenApi=FYqJQqdXIQkmT715/may 26 all bases`
- Write Trial Signals → `airtableTokenApi=FYqJQqdXIQkmT715/may 26 all bases`
- Write Classification Events → `airtableTokenApi=FYqJQqdXIQkmT715/may 26 all bases`

Sample `Write Classification Events` record from Airtable base `appYBYH3aOHhTODAw` table `tblnzX2b2kqNGzW6r` (re-pullable):

- record id: `recxdEYLxqgQjuu4N`
- createdTime: `2026-05-20T01:48:47.000Z`
- Event ID: `"undefined — target_classification — undefined"`
- Event Type: `target_classification`
- Is Latest: `true`
- External ID: blank
- Signal State (raw): blank
- Title: blank
- Confidence: blank
- Categories / Tags: blank
- Detail: blank (length 0)
- Raw Payload: blank (length 0)
- Source URL: blank
- Provider: blank

---

## Execution 80852 — your run, on versionId before current live

- workflowId: `9gcmEjq1lvOY2jZS`
- versionId at run: not the current `6e9b09e9-...`; ran against a version updated before `02:44:40Z`
- mode: `manual`, status: `success`
- started: `2026-05-20T02:00:21.510Z`, stopped: `2026-05-20T02:04:58.365Z`

Per-node runData:

- Weekly Monday 6am: runs=1, out=[1]
- Define Search Queries: runs=1, out=[5]
- Fetch AAV Studies: runs=1, out=[5]
- Deduplicate NCTs: runs=1, out=[1]
- Extract Industry Sponsors: runs=1, out=[90]
- Bulk Lookup Existing Sources: runs=1, out=[172]
- Merge Discovery Sources: runs=1, out=[90]
- Batch for Airtable: runs=10, out=[0,0,0,0,0,0,0,0,0,181], total=181
- Upsert Company: runs=9, out=[10,10,10,10,10,10,10,10,10], total=90
- Resolve & Explode Trials: runs=9, total=181
- Classify Trials: runs=9, total=181
- Write Trial Signals: runs=9, total=181
- Write Classification Events: runs=9, total=181
- Prepare Run Log: runs=1, out=[1]
- Write Run Log: runs=1, out=[1]

Sample `Write Trial Signals` first record (as sent to Airtable, per runData):

- airtable record id: `recRIuls6K9pz8Kdz`
- Event ID: `"InnoVec Biotherapeutics Inc. — clinical_trial_status — NCT06289452"`
- Event Type: `clinical_trial_status`
- External ID: `NCT06289452`
- Confidence: `high`
- Title: `"Safety and Efficacy Study of IVB102 Injection in Subjects With X-linked Retinoschisis"`
- Categories / Tags: `undefined`
- Detail length: 100
- Raw Payload length: 1908

Sample `Write Classification Events` first record (as sent to Airtable, per runData):

- airtable record id: `recxdEYLxqgQjuu4N` (same row as exec 80848 — see below)
- Event ID: `"undefined — target_classification — undefined"`
- Event Type: `target_classification`
- External ID: `undefined`
- Confidence: `undefined`
- Title: `undefined`
- Categories / Tags: `undefined`
- Detail length: 0
- Raw Payload length: 0

---

## Surfaced via reference: persisting wiring defect on current live versionId `6e9b09e9-...`

Connections per raw GET:

```
Resolve & Explode Trials -> Classify Trials -> Write Trial Signals -> Write Classification Events -> Batch for Airtable
```

Inbound edge to Write Classification Events: `Write Trial Signals` (single source).

WCE column mappings (raw GET):

- `Event ID`: `={{ $json.companyName + ' — target_classification — ' + $json.nct }}`
- `External ID`: `={{ $json.nct }}`
- `Confidence`: `={{ $json.classifierConfidence }}`
- `Signal State (raw)`: `={{ $json.classifierTier }}`
- `Title`: `={{ $json.classifierTier }}`
- `Categories / Tags`: `={{ $json.categoriesTags }}`
- `Detail`: `={{ $json.classifierDetail }}`
- `Raw Payload`: `={{ $json.classifierRawPayload }}`
- `Source URL`: `={{ $json.sourceUrl }}`
- `Provider`: `={{ $json.provider }}`
- `Company`: `={{ [$json.companyRecordId] }}`
- `Is Latest`: `true`

`$json` at WCE evaluation time is the Airtable upsert response from Write Trial Signals (shape `{id, fields:{...}}`). The `$json.companyName`, `$json.nct`, `$json.classifierConfidence`, `$json.classifierTier`, `$json.categoriesTags`, `$json.classifierDetail`, `$json.classifierRawPayload`, `$json.companyRecordId` references resolve to `undefined`.

Two write runs (80848 with 10 items, 80852 with 181 items) both produced Airtable record `recxdEYLxqgQjuu4N` (the row whose Event ID is `"undefined — target_classification — undefined"`). Both runs upserted into the same row because the matching column `Event ID` resolved to the identical string across all items in both runs. On 80852, 181 source items collapsed to 1 Airtable row.

Re-pullable artifact: GET record `recxdEYLxqgQjuu4N` in `appYBYH3aOHhTODAw` / `tblnzX2b2kqNGzW6r`.

---

## Out of scope for this handoff

- Did not rewire WCE.
- Did not deactivate the workflow.
- Did not change Boris's 5-query / 100-pageSize / 50-maxRequests config back to small-batch after his subsequent edits.

Handoff ends here. Builder session closing.
