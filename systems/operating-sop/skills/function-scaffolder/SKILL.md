---
name: function-scaffolder
description: Use this skill in BUILD mode when an activity's metadata and schemas already exist and you need the TS function file that backs it ... systems/<sys>/workflows/<fn>.ts. It produces a code-draft: the function signature, input/output types importing the activity's schema files, a typed stub body with a TODO marker, and the Inngest trigger wiring per the canonical mount pattern (client imported from capabilities/inngest, function owned by the system, served via projection-ui's union route). Triggers: "scaffold the function for <activity>", "stub the workflow .ts for <fn>", "wire the Inngest trigger for this activity". Do NOT use for: defining the activity's canon metadata (use activity-binder); writing the schema files the function imports (use schema-author); composing the workflow graph that calls multiple functions (use workflow-composer).
status: DRAFT
---

# function-scaffolder

## Purpose
Turn an already-defined activity (metadata bound, schemas authored) into the concrete TS function file that implements it, placed in its owning system's `workflows/` folder per the vertical-by-system pattern. Output is a scaffold, not a finished implementation ... a typed signature, schema-referencing I/O types, a stub body, and correct Inngest wiring.

## When to use
- An activity exists in canon with its schemas authored, and it has no backing `.ts` function yet.
- The operator wants the function stubbed + Inngest-triggered so implementation can start against a compiling skeleton.
- Re-scaffolding wiring after an activity's owning system or trigger event changes.

## What it does
- Resolves the owning system from the activity binding and targets `systems/<sys>/workflows/<fn>.ts`.
- Imports the activity's input/output types from its authored schema files (does not redefine them).
- Emits the function signature, a typed stub body with an explicit `// TODO: implement` marker, and a typed-but-throwing placeholder so the file compiles.
- Wires the Inngest trigger per the mount pattern: client imported from `capabilities/inngest/`, function defined and owned here, registered into the projection-ui union route.
- If the activity's schemas or trigger event are missing/ambiguous, emits INSUFFICIENT_SOURCE instead of inventing types or an event name.

## Reads
- The activity's canon binding (owning system, function name, trigger event).
- The activity's authored schema files in `systems/<sys>/schemas/`.
- `practices/agentic-systems/reference/vertical-system-pattern.md` (Inngest mount section) and `system-folder-standard.md` for placement.

## Writes
- A code-draft artifact via `systems/canon-engine/scripts/govern-artifacts.mjs` `propose_artifact` (RULES-GATE -> JUDGE -> PROPOSE -> CONFIRM). Never writes the `.ts` file or any canon row directly; the operator confirms before anything lands.

## Do NOT use for
- Defining the activity's canon metadata or binding (use activity-binder).
- Authoring the schema files the function imports (use schema-author).
- Composing the workflow graph that orchestrates multiple functions (use workflow-composer).
