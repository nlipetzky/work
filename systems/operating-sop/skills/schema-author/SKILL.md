---
name: schema-author
description: Use this skill in BUILD mode to author an activity's data contract. Trigger on "author the in/out schemas for <activity>", "draft the schema for X", "we need a migration for <table/column>", "define the contract this activity reads/writes". It drafts the input and output JSON Schemas, plus ... only when the activity touches a canon shape that does not exist yet ... a versioned, idempotent SQL migration (deny-all RLS + service_role grant convention), and proposes them as one "schema-migration" artifact via govern-artifacts. Do NOT use for: the activity's metadata row, executor-class, or trigger binding (use activity-binder); the function body that runs between in and out (use function-scaffolder); a provider/3rd-party API request-response wrapper (use adapter-author).
status: DRAFT
---

# schema-author

## Purpose
Author the data contract for a single activity: the input JSON Schema, the output JSON Schema, and (only when the activity touches a canon shape that does not exist yet) the accompanying canon SQL migration. This is the contract leg of building an L3 activity binding ... the typed edges that the function body and triggers attach to.

## When to use
- Building a new activity and you need its in/out schema files drafted.
- An activity's output needs to land in a canon table or column that does not exist yet, so a migration is required.
- Revising an existing activity's contract (added field, tightened type) and the change implies a schema-file edit and possibly a column add.

## What it does
- Reads the activity's intent (from the binder draft or the operator's spec) and derives the input and output JSON Schema contracts.
- Decides whether the output requires a NEW canon table/column or fits an existing one; only authors a migration when net-new shape is needed.
- When a migration is needed, drafts it to canon conventions: next sequential `NNN_*.sql` number, documented header (date + project + purpose), `create table if not exists` / `add column if not exists` (idempotent), RLS enabled deny-all with a `service_role` grant, `(slug, version, is_current)` versioning where the canon family uses it.
- Bundles in-schema + out-schema + optional migration into ONE `schema-migration` artifact and proposes it.

## Reads
- The activity-binder draft or operator spec for this activity (its intent, inputs, outputs).
- canon-engine live table list + `systems/canon-engine/supabase/migrations/` (to reuse existing shapes and find the next migration number).
- practices/agentic-systems/reference/three-layer-work-model.md (L3 binding = typed reusable contract + execution record).

## Writes
- Proposes ONE `schema-migration` artifact (in-schema, out-schema, optional `.sql`) via `systems/canon-engine/scripts/govern-artifacts.mjs` `propose_artifact` (RULES-GATE -> JUDGE -> PROPOSE -> CONFIRM). Never writes schema files, migration files, or canon rows directly.
- If the activity's intent is too thin to derive real field shapes, emits `INSUFFICIENT_SOURCE` instead of inventing fields.

## Do NOT use for
- The activity metadata row, executor-class, or trigger binding (use activity-binder).
- The function body between input and output (use function-scaffolder).
- A provider/3rd-party API request-response wrapper (use adapter-author).
