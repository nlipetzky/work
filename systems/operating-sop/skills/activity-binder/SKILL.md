---
name: activity-binder
description: Use this skill in BUILD mode when an L3 activity needs a DEFINITION authored and bound into the canon registry ... the operator names a new atomic step (e.g. "enrich contact", "send approval") and you must produce its full binding: name, what, executor_class, owning_system, runner, function_path, trigger_event, schemas in/out, adapters, skills, reads/writes, and per-field provenance. Triggers: "define the X activity", "bind X as an activity", "register a new L3 leaf for X", "what's the activity definition for X". It emits an "activity-definition" draft for governance; it never writes the canon row itself. Do NOT use for: the workflow graph that sequences activities (use workflow-composer); writing the TS function body the binding points at (use function-scaffolder); authoring a JSON schema or migration the binding references (use schema-author); a thin provider wrapper an adapter names (use adapter-author).
status: DRAFT
---

# activity-binder

## Purpose
Author one L3 activity DEFINITION and bind it into canon.sop_activities as a governed draft. The output is a typed, reusable executor record (binding, not execution) that workflows compose against ... the atomic unit the three-layer model calls L3.

## When to use
- The operator names a new atomic step and wants it defined + registered as a reusable binding.
- An existing activity's binding fields (runner, trigger, schemas, provenance) need to be authored or corrected.
- A workflow being composed references an activity that has no canon definition yet.

## What it does
- Resolves the binding fields from the operator's input + the owning system's folder: name, what, executor_class (automated-tool / agent-loop / human-in-the-loop), owning_system_slug + folder.
- Fills the wiring: runner posture, function_path, trigger_event, schemas in/out, adapters, skills.
- Fills the contract edges: reads, writes, provenance_consumes, provenance_writes.
- Emits the assembled definition as an "activity-definition" artifact draft via govern-artifacts (RULES-GATE -> JUDGE -> PROPOSE -> CONFIRM).
- If the input lacks the substance to fill the required fields, emits INSUFFICIENT_SOURCE naming what is missing ... it does NOT invent a runner, schema, or path.

## Reads
- canon.sop_activities (existing bindings, to avoid duplicating a reusable one).
- canon.systems (owning_system_slug / folder resolution).
- practices/agentic-systems/reference/three-layer-work-model.md (what an L3 binding is).
- systems/operating-sop/sops/types.ts (the Activity interface the row mirrors).
- The owning system's folder (schemas/, scripts/, skills/) for the field, schema, and skill refs it names.

## Writes
- ONE "activity-definition" draft via systems/canon-engine/scripts/govern-artifacts.mjs propose_artifact. Never a direct canon row or repo-file write; a human confirms to flip draft -> approved.

## Do NOT use for
- The workflow graph that orders activities (use workflow-composer).
- Writing the actual TS function body at function_path (use function-scaffolder).
- Authoring a JSON schema or migration the binding references (use schema-author).
- A thin provider wrapper an adapter names (use adapter-author).
