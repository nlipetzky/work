# Phase 2 — Execution plan as data (design spec)

**Date:** 2026-06-09
**Roadmap phase:** Phase 2 (`practices/agentic-systems/ROADMAP.md`)
**Status:** design approved, ready for implementation plan

## Context

Today a prep run's stages are hardcoded in `systems/revops-engine/run-prep.mjs` (a literal `stages`
array). To make the engine "work through plans" rather than execute a baked-in sequence, the plan has to
become **data the engine reads**. This is the first step that lets a play vary its funnel without a code
edit, and it's the foundation the agent-driven driver (Phase 4) and the input-contract gate (Phase 3)
build on.

Folded in (decided during design): the binding that fixes a standing pain — launching a session from an
account folder loads no `revops-engine` context, because `revops-engine` has **no `CLAUDE.md`** and
CLAUDE.md only inherits up the launch path, never sideways into `systems/`. The recipe is useless if the
agent running it can't see the system, so Phase 2 ships the minimal binding too.

## Goal / Done when

A prep run is defined by a stored, per-play recipe the engine reads (stages, order, entity, configs).
Reordering, removing, or duplicating an **existing** stage type is a recipe edit with **no code change**.
And a session launched from the account folder can load `revops-engine` system context.

## Architecture decision: where you launch, how context composes

**You launch from the account, never from `systems/`.** Engagement folder
(`accounts/clients/teknova/`) for engagement work; play folder (`.../plays/<play>/`) for a specific run —
the deepest folder matching the unit of work. The account context (offer, segment, guidance,
disqualifiers, history) is the one thing that can't be defaulted or shared, so you stand in the specific
place and pull the generic things to you:

- **Account context** loads by inheritance (it's on the launch path).
- **System context** (`revops-engine`) loads by `@import`.
- **Cross-engagement intelligence** (later) rides along with the system import.

Learnings flow two ways: *down* into every run (each engagement imports the shared layer) and *up* out of
runs into the shared system/practice layer (not into the client folder). N engagements feed one brain
without each carrying a copy. **Phase 2 builds the spine that makes this possible; it does NOT build the
learning layer itself.**

## Components

### 1. The recipe file (per play)

Location: `<playDir>/prep-recipe.json` (e.g.
`accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`). Named "recipe," not "plan"
— `prep-plans/` already holds run *output* (markdown reviews); this is run *input*.

```json
{
  "system": "revops-engine",
  "configDir": "classifier",
  "stages": [
    { "stage": "stage1",          "entity": "companies", "config": "stage1-deterministic.sql" },
    { "stage": "classify",        "entity": "companies" },
    { "stage": "dedup",           "entity": "companies", "config": "dedup-rules.json" },
    { "stage": "route",           "entity": "contacts",  "config": "routing-rules.json" },
    { "stage": "contacts_screen", "entity": "contacts",  "config": "contacts-screen-rules.json" }
  ]
}
```

- Array order = run order = `prep_run_status.stage_order` (1-based).
- `config` resolves to `<playDir>/<configDir>/<config>`. A stage with no `config` (e.g. `classify`) takes none.
- `system` is the machine-readable play→system binding.

### 2. Stage registry (the safety boundary)

New: `systems/revops-engine/lib/stage-registry.mjs`. Maps a stage **name** → which runner script runs it
and how to build that runner's argv. The recipe can only name a **known stage type**, never an arbitrary
executable — that is what makes a recipe safe to hand an agent later.

- Shape: `{ <stageName>: { runner: "<file>.mjs", buildArgs: (ctx) => [...] } }` where
  `ctx = { batchId, entity, configDir (abs), configPath (abs|null), playDir }`.
- argv per existing runner (from their current parsers):
  - `stage1` → `[batchId, entity, configPath]`
  - `classify` → `[batchId, entity, "--play", configDir]`
  - `dedup` → `[batchId, entity, configPath]`
  - `route` → `[batchId, entity, configPath]`
  - `contacts_screen` → `[batchId, entity, configPath]`
- Unknown stage name → throw (recipe references an unknown stage type).
- Adding a genuinely new stage type = a runner + one registry line. That is inherent: new behavior needs code.

### 3. `run-prep.mjs` refactor

- Args change to `<batch_id> --play <playDir>` (the play **root**, not the classifier dir).
- Read `<playDir>/prep-recipe.json`. **If absent, fall back to a `DEFAULT_RECIPE`** equal to today's five
  stages (`configDir: "classifier"`) — backward compatible, nothing breaks.
- Validate every stage name against the registry before running (fail fast on a bad recipe).
- `seedPlan(runId, batchId, stages)` derived from the recipe (stage, entity, order).
- Per stage, unchanged lifecycle from Phase 1: `markRunning` → registry lookup → resolve config path →
  `spawnSync("node", [runnerPath, ...buildArgs(ctx), "--run-id", runId])` → on nonzero exit `markError`
  and stop. The hardcoded `stages` array is deleted.

### 4. The binding

- **New `systems/revops-engine/CLAUDE.md`** — the system context doc that's currently missing (projection-ui
  and canon-crm-feed have one; revops-engine doesn't). Concise: what the system is; the
  Staging → Promote → Core vocabulary; the recipe-driven prep funnel + the five stages + the stage
  registry; `prep_run_status` + `run-prep`; the Management-API connection pattern (token
  `SupaBase_CLI_access_token` in `~/code/work/.env`); pointers to `practices/agentic-systems/ROADMAP.md`
  and the DB-saturation memory.
- **`@import` in `accounts/clients/teknova/CLAUDE.md`** — one line importing the system doc
  (`@../../../systems/revops-engine/CLAUDE.md`; verify the relative depth on write). Placed at the
  **engagement** level so every play beneath it inherits system context whether the session launches from
  the engagement or a specific play. Play-level `CLAUDE.md` stays optional (only for play-specific
  instructions).

## Out of scope (Phase 2)

- The cross-engagement **learning layer** itself (the accumulating shared intelligence). Phase 2 only
  establishes that system/shared context is importable; the brain is a later phase.
- Phase 3's input-document contract / pre-flight gate. The recipe leaves room for a future `requiredInputs`
  field but does not add it now.
- Migrating the recipe into a DB row (rejected in favor of the per-play file).

## Verification

1. `node run-prep.mjs ngabs_2026_06_05 --play <ngabs playDir>` reads the recipe, runs all five stages, and
   `prep_run_status` is seeded from the recipe — same green end-to-end result as Phase 1, now recipe-driven.
2. **The Done-when test:** edit the recipe (remove `dedup`, or reorder two stages) and re-run — `prep_run_status`
   reflects the edited sequence with **no code change**.
3. A recipe naming an unknown stage → clean fail-fast error, no partial run.
4. No recipe file present → falls back to the default five stages (backward compatible).
5. Launch a session from `accounts/clients/teknova/` (or a play under it) and confirm `revops-engine`
   context is present via the `@import`.
