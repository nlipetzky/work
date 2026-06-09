# Phase 4 — Agent-driven driver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the play-prep skill drive the prep funnel stage-by-stage via the `run-status.mjs` CLI, reading the recipe through a new `--print-plan` emitter, so `run-prep.mjs` and the agent are two drivers over the same machinery.

**Architecture:** Seam B1 — the agent owns the plan seed, the `running` transitions, between-stage narration and the approval stop; each runner self-marks its own `done`/`error` + counts via the existing `--run-id` seam (zero runner changes). One new piece of real code: `buildPlan()` (pure, in `recipe.mjs`) + a `--print-plan` dry-run mode on `run-prep.mjs` that emits the resolved concrete commands so the agent drives from the registry's output instead of re-encoding it. Everything else is prose rewiring of the play-prep skill files.

**Tech Stack:** Node.js (ESM, built-in `node:test` runner — no framework), Supabase Management API (via `lib/run-status.mjs`), Markdown skill files.

**Repo:** single git repo at `/Users/nplmini/code/work`. Engine dir: `/Users/nplmini/code/work/systems/revops-engine`. Current branch: `phase-4-agent-driven-driver` (already off `main`; the route/dedup batching fix is already committed at `49a8e05`, the design spec at `f65d6ee`).

**Run all tests with:** `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/stage-registry.test.mjs lib/recipe.test.mjs lib/readiness.test.mjs run-prep.print-plan.test.mjs`

---

## File structure

- **Modify** `/Users/nplmini/code/work/systems/revops-engine/lib/recipe.mjs` — add the pure `buildPlan(stages, batchId)` helper next to `resolveStages`.
- **Modify** `/Users/nplmini/code/work/systems/revops-engine/lib/recipe.test.mjs` — add a `buildPlan` unit test.
- **Modify** `/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs` — import `buildPlan`; add the `--print-plan` dry-run branch (prints readiness + plan JSON, exits 0 before seeding).
- **Create** `/Users/nplmini/code/work/systems/revops-engine/run-prep.print-plan.test.mjs` — integration test: `--print-plan` emits a parseable plan and exits 0 (and, by code path, writes nothing).
- **Modify** `/Users/nplmini/code/work/practices/revops/skills/play-prep/agents/play-prep-planner.md` — replace the hardcoded "Run the funnel" runner list with the recipe-driven CLI driver.
- **Modify** `/Users/nplmini/code/work/practices/revops/skills/play-prep/SKILL.md` — refresh the stale "What exists" section to name the recipe/status/readiness machinery + add a short "How the agent drives" line.
- **Modify** `/Users/nplmini/code/work/practices/revops/skills/play-prep/agents/play-prep-executor.md` — one-line language consistency only.

---

## Task 1: `buildPlan()` pure helper in recipe.mjs

**Files:**
- Modify: `/Users/nplmini/code/work/systems/revops-engine/lib/recipe.mjs`
- Test: `/Users/nplmini/code/work/systems/revops-engine/lib/recipe.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `/Users/nplmini/code/work/systems/revops-engine/lib/recipe.test.mjs`:

```js
test("buildPlan emits one concrete command per stage matching the registry argv", () => {
  const stages = resolveStages(DEFAULT_RECIPE, "/play");
  const plan = buildPlan(stages, "batch123");
  assert.equal(plan.length, 5);
  assert.deepEqual(plan.map((p) => p.order), [1, 2, 3, 4, 5]);
  assert.equal(plan[0].command, "node run-stage1.mjs batch123 companies /play/classifier/stage1-deterministic.sql");
  assert.equal(plan[1].command, "node classify-runner.mjs batch123 companies --play /play/classifier");
  assert.equal(plan[3].command, "node route-runner.mjs batch123 contacts /play/classifier/routing-rules.json");
  // seed-safe: carries stage/entity/order for run-status.mjs seed --plan
  assert.deepEqual(plan[0], { stage: "stage1", entity: "companies", order: 1, command: plan[0].command });
});
```

Update the import line at the top of the same file from:

```js
import { loadRecipe, resolveStages, DEFAULT_RECIPE } from "./recipe.mjs";
```

to:

```js
import { loadRecipe, resolveStages, buildPlan, DEFAULT_RECIPE } from "./recipe.mjs";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/recipe.test.mjs`
Expected: FAIL — `buildPlan is not a function` (or import error).

- [ ] **Step 3: Write minimal implementation**

Append to `/Users/nplmini/code/work/systems/revops-engine/lib/recipe.mjs` (after `resolveStages`):

```js
// buildPlan: turn resolved stage descriptors into the concrete `node <runner> <args>` command per
// stage (WITHOUT --run-id — the driver appends that). Pure (no fs/spawn) so the agent-facing emitter
// and the deterministic run-prep.mjs both build commands the same way. The registry stays the single
// source of truth for what command a stage maps to.
export function buildPlan(stages, batchId) {
  return stages.map((s) => {
    const argv = s.buildArgs({ batchId, entity: s.entity, configDir: s.configDir, configPath: s.configPath });
    return { stage: s.stage, entity: s.entity, order: s.order, command: `node ${s.runner} ${argv.join(" ")}` };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/recipe.test.mjs`
Expected: PASS (all recipe tests green).

- [ ] **Step 5: Commit**

```bash
cd /Users/nplmini/code/work && git add systems/revops-engine/lib/recipe.mjs systems/revops-engine/lib/recipe.test.mjs && git commit -m "revops-engine: buildPlan() — resolve stages to concrete commands (pure)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `--print-plan` dry-run mode on run-prep.mjs

**Files:**
- Modify: `/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs`
- Test: `/Users/nplmini/code/work/systems/revops-engine/run-prep.print-plan.test.mjs` (create)

- [ ] **Step 1: Write the failing test**

Create `/Users/nplmini/code/work/systems/revops-engine/run-prep.print-plan.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const PLAY = "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies";
const MARKER = "--- PLAN JSON ---";

test("run-prep --print-plan emits a parseable plan and exits 0", () => {
  const res = spawnSync("node", ["run-prep.mjs", "TESTBATCH", "--play", PLAY, "--print-plan"], {
    cwd: ENGINE, encoding: "utf8",
  });
  assert.equal(res.status, 0, res.stderr);
  const i = res.stdout.indexOf(MARKER);
  assert.ok(i >= 0, "plan marker present in stdout");
  const plan = JSON.parse(res.stdout.slice(i + MARKER.length).trim());
  assert.equal(plan.length, 5);
  assert.equal(plan[0].stage, "stage1");
  assert.equal(plan[0].order, 1);
  assert.ok(plan[0].command.startsWith("node run-stage1.mjs TESTBATCH companies "));
  // the readiness report is printed too (a non-empty human block, before the marker)
  assert.ok(res.stdout.slice(0, i).trim().length > 0, "readiness report printed before plan");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test run-prep.print-plan.test.mjs`
Expected: FAIL — no `--- PLAN JSON ---` marker (the flag isn't handled yet; `run-prep.mjs` falls through to seeding/running, which will error without a live batch, so `res.status !== 0` or the marker assertion fails).

- [ ] **Step 3: Write minimal implementation**

In `/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs`, update the recipe import line from:

```js
import { loadRecipe, resolveStages } from "./lib/recipe.mjs";
```

to:

```js
import { loadRecipe, resolveStages, buildPlan } from "./lib/recipe.mjs";
```

Then insert the dry-run branch immediately after the readiness report is printed and BEFORE the `--strict` / `allNowPresent` block. Locate this existing line:

```js
const readiness = checkReadiness(recipe, playDir);
console.log(formatReadiness(readiness, path.basename(playDir)));
```

and insert directly after it:

```js
// Dry run: emit the plain-English readiness report (above) + a parseable plan of the resolved
// concrete commands, then stop. This is the agent-driver seam — the play-prep skill reads this,
// then drives each command itself via the run-status.mjs CLI (it appends --run-id per stage).
// We print the plan even when inputs are missing (a dry run should always show the plan).
if (argv.includes("--print-plan")) {
  console.log(`\n--- PLAN JSON ---`);
  console.log(JSON.stringify(buildPlan(stages, batchId)));
  process.exit(0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test run-prep.print-plan.test.mjs`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm no regression**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/stage-registry.test.mjs lib/recipe.test.mjs lib/readiness.test.mjs run-prep.print-plan.test.mjs`
Expected: PASS — 15+ tests, 0 fail.

- [ ] **Step 6: Commit**

```bash
cd /Users/nplmini/code/work && git add systems/revops-engine/run-prep.mjs systems/revops-engine/run-prep.print-plan.test.mjs && git commit -m "revops-engine: run-prep.mjs --print-plan dry-run (agent-driver seam)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Rewire the play-prep-planner to drive from the recipe via the CLI

**Files:**
- Modify: `/Users/nplmini/code/work/practices/revops/skills/play-prep/agents/play-prep-planner.md`

No automated test — this is skill prose. Verification is the end-to-end run in Task 6.

- [ ] **Step 1: Replace the "Run the funnel" section**

In `/Users/nplmini/code/work/practices/revops/skills/play-prep/agents/play-prep-planner.md`, replace the entire section that currently begins with `## Run the funnel (each step is a runner in systems/revops-engine/; capture only its stdout)` and ends just before `## Honor the mandate` with this exact text:

````markdown
## Drive the funnel (recipe-driven, via the run-status CLI)

You do not hardcode the stage list. You ask the machinery what the steps are, then drive them one at a
time, recording progress to `public.prep_run_status` so the Runs strip in projection-ui shows the run
live. `run-prep.mjs` is the deterministic sibling driver; you are the interactive one over the same
recipe + the same status table. Run everything from `/Users/nplmini/code/work/systems/revops-engine/`.

1. **Resolve the plan.**
   `node run-prep.mjs <batch_id> --play <playDir> --print-plan`
   This prints a plain-English readiness report and, after a `--- PLAN JSON ---` marker, a JSON array
   of steps `[{ stage, entity, order, command }]`. Narrate the readiness report plainly and **proceed**
   unless an input is genuinely fatal to the run (honor `feedback_no_blocker_overbuild` — inform, don't
   wall). Do not pass `--strict`; that is the script's opt-in, not your default. Keep the JSON plan.

2. **Seed the run.**
   Mint a run id: `runId=$(uuidgen)`.
   Seed the whole plan once (the JSON from step 1 is seed-safe — `seed` reads only stage/entity/order):
   `node lib/run-status.mjs seed --run-id "$runId" --batch <batch_id> --plan '<the JSON plan array>'`

3. **Drive each step in `order`.** For each step:
   - mark it running: `node lib/run-status.mjs set --run-id "$runId" --stage <stage> --status running`
   - run the step's `command` with the run id appended:
     `<command> --run-id "$runId"`
     (the runner writes its own `done` + counts on success, `error` on a nonzero exit — you do not
     re-mark `done` yourself).
   - narrate the counts from the runner's own stdout (you ran it, so you have them; the status table is
     the durable record the Runs strip reads — there is no read CLI and you do not need one). Surface
     any rule-vs-evidence conflict the runner flagged; do not resolve it by guessing.
   - if the runner exits nonzero: `node lib/run-status.mjs set --run-id "$runId" --stage <stage>
     --status error --message "<short reason>"` and **stop the run** (a failed stage is red, not
     skipped — mirrors `run-prep.mjs`).

4. **Emit the artifact.** `node generate-prep-plan.mjs <batch_id> <entity>` → writes
   `<playDir>/prep-plans/<batch_id>-<entity>-prep-plan.md`. Report the path.
````

- [ ] **Step 2: Confirm the surrounding sections still read correctly**

Run: `cd /Users/nplmini/code/work && sed -n '/## Drive the funnel/,/## Honor the mandate/p' practices/revops/skills/play-prep/agents/play-prep-planner.md | head -50`
Expected: the new section prints, immediately followed by the unchanged `## Honor the mandate` header. The `## Read first`, `## Honor the mandate`, and `## Output` sections are unchanged (the Output section's "Stop. Do not promote, do not dispatch the executor." line still stands — the approval gate is unchanged).

- [ ] **Step 3: Commit**

```bash
cd /Users/nplmini/code/work && git add practices/revops/skills/play-prep/agents/play-prep-planner.md && git commit -m "play-prep: planner drives the funnel from the recipe via the status CLI

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Refresh SKILL.md "What exists" + add "How the agent drives"

**Files:**
- Modify: `/Users/nplmini/code/work/practices/revops/skills/play-prep/SKILL.md`

- [ ] **Step 1: Replace the "What exists" section**

In `/Users/nplmini/code/work/practices/revops/skills/play-prep/SKILL.md`, replace the entire section that begins with `## What exists (use; do not rebuild)` and ends just before `## Parked / pending (say so honestly in the artifact)` with this exact text:

````markdown
## What exists (use; do not rebuild)
- Play bundle: `accounts/clients/<client>/plays/<play>/` — `playbook-*.md` (criteria),
  `client-guidance.md` (the executable rule set), `classifier/` (the play's stage1 SQL + semantic
  prompt + the dedup/route/contacts-screen config files), `prep-plans/` (the artifacts).
- **The plan is data, not prose.** `<play>/prep-recipe.json` declares the ordered `stages` and the
  `inputs` the run needs. The funnel is whatever the recipe says — you never hardcode the stage list.
- The machinery in `systems/revops-engine/`:
  - `lib/recipe.mjs` — `loadRecipe` / `resolveStages` / `buildPlan` (recipe → concrete commands).
  - `lib/stage-registry.mjs` — the safety boundary: a recipe can only name a known stage type.
  - `lib/readiness.mjs` — the input-readiness report (a report, not a gate).
  - `lib/run-status.mjs` — the run-progress primitive + its CLI (`seed` / `set` / `msg`). **This CLI is
    how the agent drives.** Each run writes `public.prep_run_status`, which the projection-ui Runs strip
    reads live.
  - `run-prep.mjs` — the deterministic sibling driver (headless/cron). `--print-plan` makes it emit the
    readiness report + the resolved plan JSON for the agent to drive. The runners: `run-stage1.mjs`
    (deterministic), `classify-runner.mjs` (semantic, isolated per-row), `dedup-runner.mjs`,
    `route-runner.mjs`, `contacts-screen-runner.mjs`, `generate-prep-plan.mjs` (the artifact). Each
    accepts `--run-id` and writes its own status.
- On-rails: `promote_staging_batch` (provenance-aware), `staging_batch_preview`,
  `list_staging_batches`. Validity guard: `projection-ui/lib/validity.ts`.
- Schema of the artifact: `practices/revops/skills/play-prep/schema.md`.

## How the agent drives
The **play-prep-planner** sub-agent runs `run-prep.mjs --print-plan` to get the readiness report + the
plan, then drives each stage itself via the `run-status.mjs` CLI (seed once, `set ... running` per
stage, run the stage's command with `--run-id`, let the runner mark its own `done`/`error`). It is the
interactive driver; `run-prep.mjs` (no flag) is the deterministic one. Both read the same recipe and
write the same status table.
````

- [ ] **Step 2: Confirm the file still reads correctly**

Run: `cd /Users/nplmini/code/work && sed -n '/## What exists/,/## The loop/p' practices/revops/skills/play-prep/SKILL.md | head -5; echo "..."; grep -n "## " practices/revops/skills/play-prep/SKILL.md`
Expected: the section headers in order are: non-negotiables, The loop, What exists, How the agent drives, Parked / pending. No duplicate or orphaned headers.

- [ ] **Step 3: Commit**

```bash
cd /Users/nplmini/code/work && git add practices/revops/skills/play-prep/SKILL.md && git commit -m "play-prep: SKILL.md names the recipe/status/readiness machinery + how the agent drives

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Executor language consistency (one line)

**Files:**
- Modify: `/Users/nplmini/code/work/practices/revops/skills/play-prep/agents/play-prep-executor.md`

The executor's behavior does not change (it keys off the approved artifact). One line references the
planner "ran dedup/hierarchy ... before the artifact" — keep it accurate now that the planner drives
those stages via the CLI rather than calling the runners directly by name.

- [ ] **Step 1: Update the wording**

In `/Users/nplmini/code/work/practices/revops/skills/play-prep/agents/play-prep-executor.md`, replace this line:

```markdown
The planner ran dedup/hierarchy (companies) and acquired-routing (contacts) before the artifact, so
their labels (`prep_dedup_*`, `prep_route_*`) are already in staging and were part of what the
operator approved. Verify they are present and match the artifact; do not re-run or alter them.
```

with:

```markdown
The planner drove the recipe's dedup/hierarchy (companies) and acquired-routing (contacts) stages
before emitting the artifact, so their labels (`prep_dedup_*`, `prep_route_*`) are already in staging
and were part of what the operator approved. Verify they are present and match the artifact; do not
re-run or alter them.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/nplmini/code/work && git add practices/revops/skills/play-prep/agents/play-prep-executor.md && git commit -m "play-prep: executor wording matches recipe-driven planner

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: End-to-end verification on the ngabs play (operator-run)

**This task needs a live staging batch + the DB.** It is the acceptance check, not a unit test. If no
live batch is available in this session, stop after Task 5 and hand this to Nick with the exact commands
below — do not fabricate a run.

- [ ] **Step 1: Dry-run the emitter against the real recipe**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node run-prep.mjs <real_batch_id> --play /Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies --print-plan`
Expected: readiness report for the ngabs inputs, then `--- PLAN JSON ---` and a 5-step plan whose
`command` lines match the stages (stage1, classify, dedup, route, contacts_screen).

- [ ] **Step 2: Invoke the play-prep skill on the batch and let the planner drive**

Trigger the skill ("prep the ngabs <batch_id> batch"). Watch the projection-ui Runs strip: each stage
should flip pending → running → done with counts, identically to a `run-prep.mjs` run. Confirm the
planner stops for approval and does not promote.

- [ ] **Step 3: Diff against a script run (parity)**

Confirm the agent-driven run produced the same staging labels (`prep_*` columns) and the same prep-plan
artifact content as a `node run-prep.mjs <batch_id> --play <dir>` run would. Spot-check the
`prep_run_status` rows: same stages, same terminal states.

- [ ] **Step 4: Mark Phase 4 done on the roadmap**

Only after Steps 1-3 pass, update `/Users/nplmini/code/work/practices/agentic-systems/ROADMAP.md`:
flip Phase 4 to done, set Phase 5 (approval gate + cost discipline) as the active focus. Commit.

```bash
cd /Users/nplmini/code/work && git add practices/agentic-systems/ROADMAP.md && git commit -m "roadmap: Phase 4 (agent-driven driver) done; Phase 5 next

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Done when

- `buildPlan` is covered by a passing unit test and `--print-plan` by a passing integration test; the
  full suite (Tasks 1-2) is green and the default `run-prep.mjs` path is unchanged.
- The play-prep-planner drives the funnel from `--print-plan` + the `run-status.mjs` CLI, with zero
  runner changes; SKILL.md and the executor read consistently.
- On the ngabs play, an agent-driven run produces the same staging labels + artifact + status rows as a
  script run, and stops for approval (Task 6).
