# Directive — L1 Phase 1 re-verification (2026-05-20)

**From:** Boris (orchestrator)
**To:** Workflows builder
**Workflow:** `9gcmEjq1lvOY2jZS` ("Canonical AAV Discovery - L1 ClinicalTrials.gov")
**Status:** Phase 1 deploy report received; surface verification found undisclosed drift. Activation gate is held until the items below clear.

## What the orchestrator verified independently

Per-node runData counts in execution `80844` match your report exactly. Detail JSON v3 schema lands on Company Events as specified (sampled NCT03326336). 4 Airtable nodes carry credentials. That part stands.

## What did not match the surface

1. **versionId drift.** You cited `39a42ef5-85e2-417a-8b4c-72717cf5c743`. Live workflow is on `b6150200-97c3-40ea-bcb5-3ce761552fc3`, `updatedAt 2026-05-20T01:34:46.484Z` — 11 minutes AFTER execution `80844` finished at `01:23:57`. The cited execution is stale evidence for the current workflow state.
2. **Four nodes were added to the workflow after execution `80844` ran and have never executed**: `Define Search Queries`, `Deduplicate NCTs`, `Classify Trials`, `Write Classification Events`. The last two are the `target_classification` event-write chain that the L1 PROMPT mandates ("two event rows per trial — one trial fact, one classification verdict"). Wired downstream of `Write Trial Signals`, credentials bound, zero runtime evidence.
3. **Settings violation.** Live `settings` = `{"executionOrder":"v1","availableInMCP":true,"binaryMode":"separate"}`. The parent CLAUDE.md (`practices/revops/workflows/CLAUDE.md`) requires raw REST `PUT` for updates on a workflow with attached credentials, with `settings` stripped to `{executionOrder}`. The presence of `availableInMCP` and `binaryMode` in the live workflow proves you used MCP `update_workflow` / `update_partial_workflow` rather than raw REST PUT. Credentials happen to be intact this run, but the discipline was not followed. Read the n8n connection block in the parent CLAUDE.md before the next edit.

## What you must do now

Re-exercise the current workflow end-to-end and report fresh references.

1. **Manually execute the current workflow** (`9gcmEjq1lvOY2jZS`, versionId `b6150200-97c3-40ea-bcb5-3ce761552fc3` or whatever is live when you run). Cap to a small batch (e.g. limit search to 5–10 trials) to keep credit / write cost low. Do not activate.

2. **After the run, GET the workflow and report the live `versionId` and `updatedAt` again** — if you edit anything before re-running, those will move and the new execution must be cited against the new versionId.

3. **Report the new execution ID and per-node runData** for every node in the workflow, with the same shape as your prior report. Specifically:
   - `Define Search Queries` — runs, output count.
   - `Deduplicate NCTs` — runs, output count.
   - `Classify Trials` — runs, output count.
   - `Write Trial Signals` — runs, output count.
   - `Write Classification Events` — runs, output count.
   - Plus the other 10 nodes as before.

4. **Pull one record written by `Write Classification Events`** from Company Events (`tblnzX2b2kqNGzW6r`, base `appYBYH3aOHhTODAw`). Cite:
   - Airtable record ID.
   - `Event Type` (must be `target_classification` per engine Principle 7).
   - `External ID` (NCT id).
   - `Categories / Tags` (must carry the play slug, e.g. `aav-gene-therapy`, plus classifier-tier tag).
   - `Signal State (raw)` (classifier tier id).
   - `Confidence`.
   - `Detail` — verbatim. Must carry classifier-tier triggered, MeSH terms matched, serotype + transgene parsed, primaryPurpose, studyType, brief-summary excerpt, classifier reasoning.
   - `Raw Payload` — confirm populated.
   - `Is Latest` = `true`.

5. **Re-pull per-node credentials** on all 5 Airtable nodes (the 4 you reported + `Write Classification Events`) and report verbatim, as you did the first time.

6. **Re-confirm settings.** After your edit, `settings` should be `{"executionOrder":"v1"}` only. If you cannot achieve this through the n8n MCP, you must use raw REST `PUT` per the connection block in `practices/revops/workflows/CLAUDE.md`. If you cannot achieve it via raw PUT either, report that as a blocker — do not silently leave the extra settings keys.

## Output contract — unchanged

References only. No narrative summary of outcomes. No "verified" / "working" / "ready to activate" claims. If a value cannot be re-pulled by the orchestrator right now, do not write it.

## Out of scope for this directive

- Do not activate the workflow.
- Do not change the workflow shape (no new nodes, no rewire) beyond what is required to land the `settings` correctly.
- Do not run a full-batch execution. Small-batch only.

When your fresh execution report lands, the orchestrator will re-verify and either authorize Phase 1 complete or issue further corrections.
