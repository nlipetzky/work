# Workflows ticket — L1 Discovery: write full per-trial evidence to Company Events

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. Read fully before any workflow edit.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`
**Engine principles:** `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`

## Directive

The L1 Discovery workflow already writes `clinical_trial_status` event rows to Company Events. Extend it so each event row carries **the full per-trial evidence** L2 would otherwise have to re-fetch live: intervention names, intervention type, study type, conditions list, and the raw CT.gov payload. The downstream goal is for L2 (and any future view) to read evidence from Company Events without going back to clinicaltrials.gov.

## Scope

- **Workflow ID:** `9gcmEjq1lvOY2jZS`
- **Workflow name:** L1 Discovery (CT.gov sourcing)
- **Target table:** Company Events (`tblnzX2b2kqNGzW6r`) in RevOps Surface (`appYBYH3aOHhTODAw`)
- **Provider value:** `clinicaltrials.gov` (already in the singleSelect)
- **Event Type value:** `clinical_trial_status` (already in the singleSelect)

## New fields on Company Events to write (already added; do not create)

| Field | Field ID | Source from CT.gov record |
|---|---|---|
| Title | `fldU7CqFiAiwISnDl` | `protocolSection.identificationModule.briefTitle` |
| Study Type | `fldsvRyAVllmnOSPk` | `protocolSection.designModule.studyType` (INTERVENTIONAL / OBSERVATIONAL / EXPANDED_ACCESS) |
| Intervention Type | `fld1JSbnG1yzJvThq` | comma-joined `protocolSection.armsInterventionsModule.interventions[].type` |
| Intervention Names | `fldkJUrUhEx5zf9R6` | newline-joined `protocolSection.armsInterventionsModule.interventions[].name` |
| Conditions | `fldV0Gb90pURkm8JX` | newline-joined `protocolSection.conditionsModule.conditions` |
| Raw Payload | `fldMjAV9T4RUyHGuZ` | the entire CT.gov study object stringified, capped at ~95K chars |

## What to do

1. Pull the deployed L1 workflow JSON via raw API (not MCP — MCP strips credentials).
2. Find the node that writes Company Events rows. Modify its field mapping to populate the six new fields above on every event row.
3. For the `Raw Payload` field: stringify the full CT.gov study JSON, capped at 95K. If truncated, append a marker in the `Detail` field: ` | RAW_PAYLOAD_TRUNCATED`.
4. **Do not change** any other field on Company Events. The existing fields (Event ID, Event Type, Event Date, Detail, Source URL, Provider, Company, Signal State (raw), Vitality, External ID, Raw Reference, Confidence, Detected At, Is Latest) keep their current writers.
5. **Do not change** what L1 writes to the Companies row. The aggregate fields (`CT.gov NCT IDs`, `CT.gov Indications`, `Most Recent Trial Date`, etc.) are flagged for Phase-2 demotion to rollups; do not remove them in this ticket.
6. Deploy via credential-preserving REST PUT. Settings block: keep only `executionOrder`.
7. Read back the workflow JSON immediately and verify every credential is still attached on every node, node count + connection count unchanged.

## Hard rules

- **Do not bulk-trigger paid runs.** CT.gov is free; the runs themselves are fine. But the trigger must remain manual / scheduled as it is today.
- **REST PUT wipes credentials unless preserved verbatim.** Capture full JSON before edit; do field-by-field credential read-back after deploy.
- **Validate with one company first.** Run L1 against a single known-good sponsor (e.g. CSL Behring) and verify the resulting event row carries all six new fields populated correctly.

## Verification gate

Before marking done, all of these must be true on a single-company test run:
- A new `clinical_trial_status` event row exists in Company Events.
- `Title` is populated and matches the CT.gov briefTitle.
- `Study Type` carries one of INTERVENTIONAL / OBSERVATIONAL / EXPANDED_ACCESS.
- `Intervention Type` carries the type values comma-joined.
- `Intervention Names` carries the names newline-joined.
- `Conditions` carries the condition strings newline-joined.
- `Raw Payload` is non-empty and contains valid JSON.
- Existing fields (Event ID, Provider, Event Date, External ID, Source URL, Detail, Is Latest) are unchanged in shape.
- Workflow credentials are all still attached after the deploy.

## Handoff

Write your handoff to `practices/revops/workflows/HANDOFF-L1-event-evidence-2026-05-20.md` with:
- Diff of the modified node config.
- Test execution ID + the resulting event row's ID for the validation company.
- Confirmation that credentials are intact post-deploy.
- Any observed deviations from this spec (with reason).

## Out of scope

- Removing the aggregate fields from the Companies row (Phase-2).
- L2 Classify changes (separate Phase-2 plan).
- Any change to L1's discovery query, indication keyword list, or sponsor-resolution logic.
