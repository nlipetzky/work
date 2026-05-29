# Directive — L1 v2 Write Classification Events fix + recurring settings discipline (2026-05-20)

**From:** Boris (orchestrator)
**To:** Workflows builder
**Workflow:** `9gcmEjq1lvOY2jZS` ("Canonical AAV Discovery - L1 ClinicalTrials.gov")
**Live versionId at directive time:** `00c03f21-41ee-452d-a18e-20dcdddf5b48` (`updatedAt 2026-05-20T01:59:38.395Z`)
**Status:** v2 not authorized for activation. Material bug found on the target_classification write path.

## What the orchestrator verified independently

All four self-reported bug fixes are confirmed against the surface:

- Define Search Queries restored to all 5 queries.
- pageSize=100 is landing (Deduplicate NCTs aggregate shows totalBeforeDedup=500, 5 pages × 100).
- target_classification is accepted by the Event Type singleSelect.
- Write Classification Events has correct base (`appYBYH3aOHhTODAw`), table (`tblnzX2b2kqNGzW6r`), and credential (`FYqJQqdXIQkmT715` "may 26 all bases") binding.

Classify Trials code-node output is rich and correct — 32 fields per trial including all the new evidence (briefTitle, studyType, interventionTypes, interventionNames, conditionsList, meshInterventions, meshConditions, primaryPurpose, briefSummary, rawStudyJson, classifierTier, classifierConfidence, classifierReason, classifierDetail, classifierRawPayload, categoriesTags).

Execution 80852: success, 4m37s, 235 unique NCTs after dedup, 90 industry sponsors, 181 trial-level outputs at both event-write nodes. Numbers reconcile.

## Critical bug — Write Classification Events ships garbage to Airtable

The classifier produces 32 fields per trial. The Airtable upsert ships **6**: `Event Type, Is Latest, Magnitude, Event ID, Within Window, Created Time`. Every business field is `undefined`. Sampled 3 runs from execution 80852, identical pattern in all three:

```
Event ID:           "undefined — target_classification — undefined"
Company link:       undefined
External ID:        undefined
Source URL:         undefined
Provider:           undefined
Confidence:         undefined
Signal State (raw): undefined
Categories / Tags:  undefined
Detail:             (empty)
Raw Payload:        (not present)
```

Root cause: the node's column `value` mappings don't reference the classifier's camelCase source keys correctly. This is the same pattern as memory `feedback_n8n_airtable_upsert_ui_value_map` — value map silently dropped or misbound after a UI/MCP edit; runData looks fine because the item count is non-zero, but the items themselves are empty.

**Live Airtable state:** because Event ID is the same `"undefined — target_classification — undefined"` on all 181 writes and the upsert is idempotent on Event ID, **the table holds 1 garbage row, not 181 target_classification events.** RunData item counts proved nothing about row content; that is how this got past you.

## Cascading regression — clinical_trial_status Detail degraded

In Phase 1a (exec 80844) the `Detail` field on clinical_trial_status rows carried the full v3 evidence JSON (title, phase, studyType, primaryPurpose, enrollment, dates, interventionTypes, interventionNames, conditions, meshInterventions, meshConditions, regulatory, countries, briefSummary, hasResults, signals). In v2 (exec 80852) `Detail` is degraded to `"<title> | <phase>"` — a single concatenated string.

The design intent was clear and correct: move rich evidence to the target_classification row. But target_classification is broken, so the net engine state is **less evidence than yesterday**. This is a Principle 6 violation ("pay once, capture everything"). The fix below must restore evidence either on target_classification (preferred — keeps the new separation) or on clinical_trial_status (fallback). The engine cannot end this cycle worse than it started.

## Recurring discipline failure — settings still drifted

Live `settings = {"executionOrder":"v1","availableInMCP":true,"binaryMode":"separate"}`. Third deploy on this workflow with the same drift, third directive flagging it. The strip-to-`{executionOrder}` rule is in `practices/revops/workflows/CLAUDE.md` under "Raw REST PUT discipline." If the raw PUT path can't strip those keys in your runtime, that is itself a finding — report the failure path. Do not silently leave it.

## Unexplained drop — 54 trials lost between dedup and resolve

Deduplicate NCTs aggregate: 235 unique. Resolve & Explode Trials: 181 out. Explain the 54-trial gap. Most likely non-industry sponsor or company-link failure; needs a one-line answer in your next report.

## What you must do now (one directive, all of it)

1. **Rebuild `Write Classification Events` column map via raw REST PUT.** Read the deployed node from GET, write the `parameters.columns.value` array out explicitly in the PUT body so each Airtable field's source binding is auditable from the JSON. The source keys come from Classify Trials output (camelCase: `companyRecordId`, `nct`, `sourceUrl`, `provider`, `confidence`, `signalStateRaw`, `categoriesTags`, `detail` or `classifierDetail`, `classifierRawPayload`, etc.). Do not edit this node in the UI — that's the path that wiped the value map in the first place.

2. **Re-run manually** with a small batch cap (e.g., limit first search to 5–10 trials). Do not activate.

3. **After the run, pull 3 actual Airtable rows by record ID from `tblnzX2b2kqNGzW6r`** (Company Events), filtered by `Event Type = target_classification` and Created Time within the new execution window. For each, report verbatim:
   - record ID
   - Event ID
   - Event Type
   - Company link
   - External ID
   - Source URL
   - Provider
   - Confidence
   - Signal State (raw)
   - Categories / Tags
   - Detail (first 500 chars)
   - Raw Payload (present / not present)

   RunData item counts are not enough. Pull from Airtable directly.

4. **Strip settings to `{"executionOrder":"v1"}` only.** If raw PUT body strips them automatically, this clears. If it doesn't, isolate why and report the failure path.

5. **Explain the 235 → 181 drop.** One line, source-cited.

6. **Decide evidence placement.** Either (a) confirm the rebuilt target_classification rows carry the full evidence (briefSummary excerpt, meshConditions, classifierReason, rawStudyJson) in Detail or Raw Payload, OR (b) restore the v3 evidence JSON on clinical_trial_status Detail. The engine must not lose evidence relative to exec 80844. State which path you took.

7. **Report fresh references after the re-run:**
   - new versionId (GET after PUT)
   - new execution ID
   - per-node runData counts for all 15 nodes
   - settings verbatim
   - per-node credentials for all 5 Airtable touchpoints verbatim
   - the 3 Airtable rows from step 3

## Output contract — unchanged

References only. No narrative summary of outcomes. No "verified" / "working" / "ready to activate" claims. If a value cannot be re-pulled by the orchestrator right now, do not write it.

## Out of scope for this directive

- Do not activate the workflow.
- Do not change the workflow shape beyond what is required to rebuild the `Write Classification Events` column map and (if needed) restore clinical_trial_status Detail.
- Do not run a full-batch execution.
- Tier 2 LLM resolution, branded AAV product matching, and the ANCA Vasculitis query collision are out of scope for this cycle — they stay on your v2 deferred list.

When your fresh execution report and the 3 Airtable rows land, the orchestrator will re-verify and either authorize Phase 1 complete or issue further corrections.
