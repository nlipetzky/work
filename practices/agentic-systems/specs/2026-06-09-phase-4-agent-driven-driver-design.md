# Phase 4 — Agent-driven driver (design)

**Date:** 2026-06-09
**Branch:** `phase-4-agent-driven-driver`
**Status:** approved, pre-plan

## Goal

The play-prep skill drives the prep funnel end-to-end — an agent issuing the status-primitive CLI and
reading the recipe — instead of `run-prep.mjs`. This is the manual→autonomous step: `run-prep.mjs`
becomes *one* driver (the deterministic script, for headless/cron), the skill becomes the *other* (the
interactive agent). Both read the same `prep-recipe.json` and write the same `public.prep_run_status`
table. No new intelligence; the funnel is unchanged. The only thing that moves is *who drives the
ordered list of stages*, so the agent can pause, narrate, and surface conflicts between stages.

## The frame (Nick's words)

List building is an ordered series of steps that each call third-party data or trigger an AI feature,
then record into a table until the row's fields are full. **Sequence matters**: sometimes you need data
to get other data, and sometimes an early fit-check lets you stop enriching a row that won't qualify —
saving downstream cost. The recipe already encodes that order. Phase 4 just moves the *driving* of it
into an agent. The "stop enriching rows that fail fit early" economics is real but is **Phase 5** (cost
discipline) — noted here as the seam Phase 5 plugs into, not built now.

## Decisions locked in brainstorm

1. **Seam = B1.** Agent orchestrates stage-by-stage via the `run-status.mjs` CLI. Split status
   ownership: the **agent** owns the plan seed, the `running` transitions, read-back, between-stage
   narration/judgment, and the approval stop. The **runner** owns its own terminal `done`/`error` +
   counts (it computed the aggregates) via the existing `--run-id` seam. **Zero runner changes.**
2. **Structure unchanged.** Keep the 3-file skill: `SKILL.md` (router/driver) + `play-prep-planner.md`
   + `play-prep-executor.md`. No Deepline-style phase-doc files — the recipe *is* our phase-doc +
   playbook, and a second encoding is exactly the drift we're killing.
3. **Planner/executor split survives** because the human approval checkpoint sits on that seam.
4. **No recipe schema change.** Funnel stages are already declared in `prep-recipe.json`. Artifact
   emission (`generate-prep-plan.mjs`) and the approval gate **bracket** the funnel loop; they are not
   registry stages and stay in skill prose, exactly as today.

## The one new piece of code: `--print-plan`

The concrete command per stage (`node classify-runner.mjs <batch> companies --play <dir>`) is built by
`buildArgs` in `lib/stage-registry.mjs` — in JavaScript. An agent driving in bash cannot call
`buildArgs`. Without an emitter, the agent would have to re-encode the stage→command mapping in skill
prose — the drift Phase 4 exists to kill. So the machinery emits the resolved commands and the agent
runs them.

Add a `--print-plan` (dry-run) mode to `run-prep.mjs`:
- Does exactly what the script already does up to the loop: `loadRecipe` → `resolveStages` →
  `checkReadiness`.
- Instead of seeding/running, prints two blocks to stdout and exits 0:
  - the plain-English readiness report (`formatReadiness`, unchanged), and
  - a JSON plan: an array of `{ stage, entity, order, command }`, where `command` is the concrete
    `node <runner> <args...>` line **without** `--run-id` (the agent appends `--run-id` per step).
- Reuses 100% of existing machinery. The registry stays the single source of truth. Est. ~15 lines,
  guarded by the flag so the default `run-prep.mjs` path is byte-for-byte unchanged.

Marker discipline: print the JSON plan after a stable marker line (e.g. `--- PLAN JSON ---`) so the
agent can extract it deterministically without parsing the human-readable readiness text.

## Planner flow (Phase 4)

Internal to `play-prep-planner.md`; replaces the hardcoded "run-stage1 → classify → dedup → generate"
prose:

1. **Read first** — recipe + `client-guidance.md` + `playbook-*.md` + `classifier/` (same context as
   the human). *Unchanged.*
2. **Resolve the plan** — `node run-prep.mjs <batch> --play <dir> --print-plan`. Narrate the readiness
   report in plain English and **proceed** unless an input is genuinely fatal (honors
   `feedback_no_blocker_overbuild`). `--strict` remains the *script's* opt-in, never the agent's
   default behavior.
3. **Seed** — mint a runId (`uuidgen`), then
   `node lib/run-status.mjs seed --run-id <u> --batch <b> --plan '<seed-subset>'` where the seed subset
   is the `{stage, entity, order}` fields from the emitted plan.
4. **Drive each step in order**:
   - `node lib/run-status.mjs set --run-id <u> --stage <s> --status running`
   - run the emitted `command` + ` --run-id <u>` (runner self-marks `done` + counts — B1)
   - narrate from the runner's own stdout (the agent ran it, so it already has the counts — no read
     CLI needed; `prep_run_status` is the durable record the Runs strip reads). Surface any
     rule-vs-evidence conflict the runner flagged. Do not resolve it by guessing.
   - on a nonzero runner exit: `set --status error --message <msg>` and **stop the run** (mirrors
     `run-prep.mjs`'s markError-and-exit). A crash turns the stage red, never hangs.
5. **Emit artifact** — `node generate-prep-plan.mjs <batch> <entity>` → artifact path.
6. **Stop for approval.** Do not promote, do not dispatch the executor. (Unchanged contract.)

## Executor flow

Effectively unchanged — it already keys off the **approved** artifact, confirms the dedup/route labels
are present, and hands the batch to the operator's Promote checkpoint. The only edit is consistency of
language with the new planner prose. No new behavior.

## SKILL.md refresh

The current "What exists" section predates Phases 1-3 and points only at the old runner list +
`generate-prep-plan.mjs`. Update it to name the real machinery: `prep-recipe.json` (the plan as data),
`lib/recipe.mjs`, `lib/stage-registry.mjs` (the safety boundary), `lib/readiness.mjs`,
`lib/run-status.mjs` + its CLI (the driver seam), and `run-prep.mjs` (the deterministic sibling driver).
Add one short "How the agent drives" line pointing the planner at `--print-plan` + the status CLI. Keep
the non-negotiables and the loop section; they still hold.

## Out of scope (explicit)

- No phase-doc markdown files.
- No recipe schema change.
- No runner changes.
- No cost/fit-short-circuit logic — that is Phase 5. Phase 4 leaves the seam (the agent decides between
  stages) in place for it.
- No auto-promote, no change to the human approval gate or the Promote checkpoint.

## Acceptance

- `node run-prep.mjs <batch> --play <dir> --print-plan` prints the readiness report + a parseable JSON
  plan whose `command` lines, when run with `--run-id` appended, match what `run-prep.mjs` runs today.
- Default `run-prep.mjs` (no `--print-plan`) behavior is unchanged (existing lib tests still pass; a new
  test covers the emitter: the emitted commands equal the resolved-stage argv).
- The play-prep-planner, driving via the CLI from the emitted plan, produces the same staging labels +
  the same prep-plan artifact as the script path, on the ngabs play, and stops for approval.
- The Runs strip in projection-ui shows the agent-driven run identically to a script-driven run (same
  `prep_run_status` rows).

## Test plan

- **Emitter unit test** (`lib/` Node built-in runner, no framework): assert `--print-plan` output
  parses, and each step's `command` equals `node <registry.runner> <buildArgs(...)>` for the ngabs
  recipe. Assert exit 0 and that no `prep_run_status` rows are written in `--print-plan` mode.
- **Regression**: existing `stage-registry.test.mjs` / `recipe.test.mjs` / `readiness.test.mjs` still
  green (14/14).
- **End-to-end (manual, on ngabs)**: run the planner via the skill against a real batch; confirm the
  status table + artifact match a script run; confirm the approval stop.
