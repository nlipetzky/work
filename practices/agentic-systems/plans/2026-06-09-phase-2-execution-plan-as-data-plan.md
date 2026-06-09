# Phase 2 — Execution Plan as Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a prep run defined by a per-play `prep-recipe.json` the engine reads, and give `revops-engine` a `CLAUDE.md` that account folders import — so the funnel is data-driven and a session launched from an account sees the system.

**Architecture:** A stage **registry** (code) maps a stage name to its runner + argv builder; a **recipe** (per-play JSON data) names known stage types in order; `run-prep.mjs` reads the recipe, validates against the registry, and runs each stage with the Phase-1 status lifecycle unchanged. The binding is a new `revops-engine/CLAUDE.md` plus an `@import` in the engagement's `CLAUDE.md`.

**Tech Stack:** Node ESM (`.mjs`), Node built-in test runner (`node --test`, no deps), Supabase Management API (via existing `lib/run-status.mjs`).

Spec: `practices/agentic-systems/specs/2026-06-09-phase-2-execution-plan-as-data-design.md`

---

### Task 1: Stage registry

**Files:**
- Create: `systems/revops-engine/lib/stage-registry.mjs`
- Test: `systems/revops-engine/lib/stage-registry.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `systems/revops-engine/lib/stage-registry.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { getStage, STAGES } from "./stage-registry.mjs";

test("getStage returns a runner + buildArgs for a known stage", () => {
  const def = getStage("stage1");
  assert.equal(def.runner, "run-stage1.mjs");
  assert.deepEqual(
    def.buildArgs({ batchId: "b1", entity: "companies", configDir: "/cfg", configPath: "/cfg/stage1.sql" }),
    ["b1", "companies", "/cfg/stage1.sql"],
  );
});

test("classify builds --play <configDir> and takes no config file", () => {
  const def = getStage("classify");
  assert.deepEqual(
    def.buildArgs({ batchId: "b1", entity: "companies", configDir: "/cfg", configPath: null }),
    ["b1", "companies", "--play", "/cfg"],
  );
});

test("all five stage types are registered", () => {
  assert.deepEqual(
    Object.keys(STAGES).sort(),
    ["classify", "contacts_screen", "dedup", "route", "stage1"],
  );
});

test("getStage throws on an unknown stage name", () => {
  assert.throws(() => getStage("nope"), /unknown stage "nope"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd systems/revops-engine && node --test lib/stage-registry.test.mjs`
Expected: FAIL — cannot find module `./stage-registry.mjs`.

- [ ] **Step 3: Write minimal implementation**

Create `systems/revops-engine/lib/stage-registry.mjs`:

```javascript
// stage-registry.mjs — maps a prep-funnel stage NAME to its runner script and how to build that
// runner's argv. A recipe can only name a known stage type, never an arbitrary executable. This is the
// safety boundary that lets a recipe be handed to an agent later.
//
// buildArgs receives ctx: { batchId, entity, configDir (abs dir), configPath (abs file | null) }
// and returns the positional/flag argv that runner expects (matches each runner's current parser).

export const STAGES = {
  stage1: {
    runner: "run-stage1.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
  classify: {
    runner: "classify-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, "--play", c.configDir],
  },
  dedup: {
    runner: "dedup-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
  route: {
    runner: "route-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
  contacts_screen: {
    runner: "contacts-screen-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
};

export function getStage(name) {
  const def = STAGES[name];
  if (!def) {
    throw new Error(`unknown stage "${name}" — not in stage registry (known: ${Object.keys(STAGES).join(", ")})`);
  }
  return def;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd systems/revops-engine && node --test lib/stage-registry.test.mjs`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add systems/revops-engine/lib/stage-registry.mjs systems/revops-engine/lib/stage-registry.test.mjs
git commit -m "revops-engine: stage registry (recipe safety boundary) + tests"
```

---

### Task 2: Recipe loader + validator

**Files:**
- Create: `systems/revops-engine/lib/recipe.mjs`
- Test: `systems/revops-engine/lib/recipe.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `systems/revops-engine/lib/recipe.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRecipe, resolveStages, DEFAULT_RECIPE } from "./recipe.mjs";

const PLAY = "/tmp/__nonexistent_play_dir__";

test("loadRecipe falls back to DEFAULT_RECIPE when no prep-recipe.json exists", () => {
  const r = loadRecipe(PLAY);
  assert.equal(r._source, "default");
  assert.equal(r.stages.length, 5);
});

test("resolveStages expands DEFAULT_RECIPE into ordered descriptors with abs config paths", () => {
  const stages = resolveStages(DEFAULT_RECIPE, "/play");
  assert.equal(stages.length, 5);
  assert.deepEqual(stages.map((s) => s.order), [1, 2, 3, 4, 5]);
  assert.equal(stages[0].stage, "stage1");
  assert.equal(stages[0].runner, "run-stage1.mjs");
  assert.equal(stages[0].configPath, "/play/classifier/stage1-deterministic.sql");
  assert.equal(stages[1].stage, "classify");
  assert.equal(stages[1].configPath, null); // classify takes no config file
});

test("resolveStages throws on an unknown stage", () => {
  const bad = { configDir: "classifier", stages: [{ stage: "bogus", entity: "companies" }] };
  assert.throws(() => resolveStages(bad, "/play"), /unknown stage "bogus"/);
});

test("resolveStages throws when a stage is missing entity", () => {
  const bad = { configDir: "classifier", stages: [{ stage: "stage1" }] };
  assert.throws(() => resolveStages(bad, "/play"), /missing "entity"/);
});

test("resolveStages throws on an empty stage list", () => {
  assert.throws(() => resolveStages({ stages: [] }, "/play"), /no stages/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd systems/revops-engine && node --test lib/recipe.test.mjs`
Expected: FAIL — cannot find module `./recipe.mjs`.

- [ ] **Step 3: Write minimal implementation**

Create `systems/revops-engine/lib/recipe.mjs`:

```javascript
// recipe.mjs — load + validate a play's prep-recipe.json into runnable stage descriptors.
//
// loadRecipe(playDir): reads <playDir>/prep-recipe.json, or returns DEFAULT_RECIPE if absent
//   (backward compatible — a play with no recipe runs today's five stages).
// resolveStages(recipe, playDir): validates structure + stage names against the registry and expands
//   each stage into { stage, entity, order, runner, buildArgs, configDir, configPath } with abs paths.
//   Pure (no fs) so it is unit-testable; throws on any malformed recipe (fail fast).

import fs from "fs";
import path from "path";
import { getStage } from "./stage-registry.mjs";

export const DEFAULT_RECIPE = {
  system: "revops-engine",
  configDir: "classifier",
  stages: [
    { stage: "stage1", entity: "companies", config: "stage1-deterministic.sql" },
    { stage: "classify", entity: "companies" },
    { stage: "dedup", entity: "companies", config: "dedup-rules.json" },
    { stage: "route", entity: "contacts", config: "routing-rules.json" },
    { stage: "contacts_screen", entity: "contacts", config: "contacts-screen-rules.json" },
  ],
};

export function loadRecipe(playDir) {
  const p = path.join(playDir, "prep-recipe.json");
  if (!fs.existsSync(p)) return { ...DEFAULT_RECIPE, _source: "default" };
  const recipe = JSON.parse(fs.readFileSync(p, "utf8"));
  return { ...recipe, _source: p };
}

export function resolveStages(recipe, playDir) {
  if (!Array.isArray(recipe.stages) || recipe.stages.length === 0) {
    throw new Error("recipe has no stages");
  }
  const configDir = path.join(playDir, recipe.configDir || "classifier");
  return recipe.stages.map((s, i) => {
    if (!s.stage) throw new Error(`recipe stage ${i} is missing "stage"`);
    if (!s.entity) throw new Error(`recipe stage "${s.stage}" is missing "entity"`);
    const def = getStage(s.stage); // throws on unknown stage type
    const configPath = s.config ? path.join(configDir, s.config) : null;
    return {
      stage: s.stage,
      entity: s.entity,
      order: i + 1,
      runner: def.runner,
      buildArgs: def.buildArgs,
      configDir,
      configPath,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd systems/revops-engine && node --test lib/recipe.test.mjs`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add systems/revops-engine/lib/recipe.mjs systems/revops-engine/lib/recipe.test.mjs
git commit -m "revops-engine: prep-recipe loader + validator (fail-fast) + tests"
```

---

### Task 3: Author the ngAbs recipe file

**Files:**
- Create: `accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`

- [ ] **Step 1: Write the recipe**

Create `accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`:

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

- [ ] **Step 2: Validate it loads and resolves**

Run (from `systems/revops-engine`):
```bash
node --input-type=module -e "import {loadRecipe,resolveStages} from './lib/recipe.mjs'; const d='/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies'; const r=loadRecipe(d); console.log('source:', r._source); const s=resolveStages(r,d); console.log(s.map(x=>x.order+':'+x.stage+'('+x.entity+') -> '+(x.configPath?x.configPath.split('/').pop():'no-config')).join('\n'));"
```
Expected: `source:` ends in `prep-recipe.json`; five lines, `1:stage1`, `2:classify -> no-config`, etc., config filenames matching `classifier/`.

- [ ] **Step 3: Commit**

```bash
git add accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json
git commit -m "ngabs: prep-recipe.json — declare the prep funnel as data"
```

---

### Task 4: Refactor run-prep.mjs to read the recipe

**Files:**
- Modify: `systems/revops-engine/run-prep.mjs` (full rewrite of the body)

- [ ] **Step 1: Replace run-prep.mjs**

Overwrite `systems/revops-engine/run-prep.mjs` with:

```javascript
// run-prep.mjs — the prep-funnel orchestrator + run_id source, driven by a per-play recipe.
//
// Reads <playDir>/prep-recipe.json (or the default five-stage recipe if absent), seeds the plan into
// prep_run_status, then runs each stage in order via its registered runner, threading --run-id so each
// writes its own done+counts. The orchestrator owns markRunning (before spawn) and markError (on nonzero
// exit) — a hard crash turns the stage red instead of hanging.
//
// Usage: node run-prep.mjs <batch_id> [--play <playDir>]   (playDir is the play ROOT, not classifier/)

import { fileURLToPath } from "url";
import path from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";
import { spawnSync } from "child_process";
import { seedPlan, markRunning, markError } from "./lib/run-status.mjs";
import { loadRecipe, resolveStages } from "./lib/recipe.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const batchId = argv[0];
const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const playDir = flag("--play",
  "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies");

if (!batchId) {
  console.error("usage: node run-prep.mjs <batch_id> [--play <playDir>]");
  process.exit(1);
}

const recipe = loadRecipe(playDir);
const stages = resolveStages(recipe, playDir); // throws on a malformed recipe (fail fast, before any run)
const runId = randomUUID();

console.log(`prep run ${runId}  batch=${batchId}  play=${playDir}  recipe=${recipe._source}`);
await seedPlan(runId, batchId, stages);

for (const s of stages) {
  console.log(`\n=== ${s.stage} (${s.entity}) ===`);
  if (s.configPath && !existsSync(s.configPath)) {
    await markError(runId, s.stage, `config not found: ${s.configPath}`);
    console.error(`\nstage ${s.stage}: config not found ${s.configPath} — stopping run ${runId}`);
    process.exit(1);
  }
  await markRunning(runId, s.stage);
  const args = s.buildArgs({ batchId, entity: s.entity, configDir: s.configDir, configPath: s.configPath });
  const res = spawnSync("node", [path.join(__dirname, s.runner), ...args, "--run-id", runId], { stdio: "inherit" });
  if (res.status !== 0) {
    const msg = res.error ? res.error.message : `runner exited ${res.status}`;
    await markError(runId, s.stage, msg);
    console.error(`\nstage ${s.stage} failed (${msg}) — stopping run ${runId}`);
    process.exit(res.status || 1);
  }
}

console.log(`\nprep run ${runId} complete (${stages.length}/${stages.length}).`);
console.log(runId);
```

- [ ] **Step 2: Behavioral verification — recipe-driven green run**

Run (from `systems/revops-engine`): `node run-prep.mjs ngabs_2026_06_05`
Expected: log line shows `recipe=.../prep-recipe.json` (not `default`); all five stages run; ends `complete (5/5)`. Note the printed `run_id`.

Then verify `prep_run_status` was seeded from the recipe (substitute the printed run_id):
```bash
node --input-type=module -e "import {sql} from './lib/run-status.mjs'; const rid='<RUN_ID>'; const r=await sql(\`select stage_order,stage,status from public.prep_run_status where run_id='\${rid}' order by stage_order\`); for(const x of r) console.log(x.stage_order+'. '+x.stage+' '+x.status); console.log('all done:', r.length===5 && r.every(x=>x.status==='done'));"
```
Expected: 5 rows, all `done`, `all done: true`.

- [ ] **Step 3: Behavioral verification — the Done-when test (edit recipe, no code change)**

Temporarily remove the `dedup` stage from `prep-recipe.json` (delete its line), then run `node run-prep.mjs ngabs_2026_06_05`. Expected: log shows four `===` stage headers (no dedup); ends `complete (4/4)`. Query the new run_id's rows and confirm exactly four stages, no `dedup`. **This proves stage removal needs no code change.** Then restore the `dedup` line in `prep-recipe.json`.

- [ ] **Step 4: Behavioral verification — fail-fast on unknown stage + no-recipe fallback**

Unknown stage: run `node run-prep.mjs ngabs_2026_06_05 --play /tmp` after creating `/tmp/prep-recipe.json` with a stage `"bogus"`. Expected: exits non-zero with `unknown stage "bogus"` and writes NO `prep_run_status` rows (it throws before `seedPlan`). Delete `/tmp/prep-recipe.json` after.

No-recipe fallback: `node run-prep.mjs <some_batch> --play /tmp` (no recipe file present). Expected: log shows `recipe=default` and it attempts the default five stages.

- [ ] **Step 5: Commit**

```bash
git add systems/revops-engine/run-prep.mjs
git commit -m "revops-engine: run-prep reads a per-play prep-recipe (stages as data)"
```

---

### Task 5: The binding — system CLAUDE.md + engagement import

**Files:**
- Create: `systems/revops-engine/CLAUDE.md`
- Modify: `accounts/clients/teknova/CLAUDE.md` (add one `@import` line near the top)

- [ ] **Step 1: Write the system context doc**

Create `systems/revops-engine/CLAUDE.md`:

```markdown
# System: revops-engine

The RevOps execution engine: a Supabase Postgres (project `mrmnyscurmkfppicqqhk`, "revops-engine-dev")
plus a set of Node runner scripts (`.mjs`) that move per-engagement data through a prep funnel and into a
permanent, growing database. This is the runtime the account folders' plays execute on.

## Vocabulary (locked)

- **Staging** — in-flight batches live in the Postgres `staging` schema (`staging.<entity>_<batch_id>`),
  not in CSV files.
- **Promote** — `promote_staging_batch` moves a batch's qualifying rows into Core, idempotently.
- **Core / Records** — `public.companies` + `public.contacts`, the permanent database that keeps
  everything and grows over time. Dedup by identity (email/domain); never delete.
- **Export** — a contract-gated subset projected out for delivery. The contract gate is at Export, never
  at Core.

## The prep funnel (recipe-driven)

A prep run screens a staging batch through stages: `stage1` (deterministic SQL) → `classify` (semantic,
per-row Anthropic) → `dedup` → `route` → `contacts_screen`. The stages and order are **data**, declared in
the play's `prep-recipe.json`, not hardcoded.

- `run-prep.mjs <batch_id> [--play <playDir>]` — orchestrator: mints a `run_id`, reads the recipe, runs
  each stage. The recipe's `system` field binds the play to this engine.
- `lib/stage-registry.mjs` — maps a stage name to its runner + argv. A recipe can only name a known stage.
- `lib/recipe.mjs` — loads/validates `prep-recipe.json` (falls back to a default five-stage recipe).
- The five runners (`run-stage1`, `classify-runner`, `dedup-runner`, `route-runner`,
  `contacts-screen-runner`) write `prep_*` working columns in STAGING only. Promotion is the only Core write.

## Run observability

`prep_run_status` (one row per `run_id`, stage) records each stage flipping pending → running → done/error
with counts; `lib/run-status.mjs` is the write primitive (the owned `deepline session` equivalent).
projection-ui's Runs page tails it. See `practices/agentic-systems/ROADMAP.md`.

## How the runners reach the DB

Supabase Management API: `POST https://api.supabase.com/v1/projects/mrmnyscurmkfppicqqhk/database/query`,
bearer token from `~/code/work/.env` key `SupaBase_CLI_access_token`. No supabase-js, no OAuth. Migrations
live in `supabase/migrations/` (local numbering 0001+; apply via the same token path).

## Gotchas

- The DB is a Micro instance; heavy cron matview refreshes can saturate it and return HTTP 544. See memory
  `project_revops_db_micro_cron_saturation` (fixed in migration 0012) before assuming your code is broken.
- Migration 0010 (drop n8n triggers) is intentionally held — do not apply.
```

- [ ] **Step 2: Add the `@import` to the engagement CLAUDE.md**

Open `accounts/clients/teknova/CLAUDE.md`. Near the top (after the opening frame, before deep
engagement detail), add:

```markdown
> This engagement's plays execute on the revops-engine system. Its context is imported here:
> @../../../systems/revops-engine/CLAUDE.md
```

Verify the relative depth: from `accounts/clients/teknova/CLAUDE.md`, `../../../` reaches the `work/` root,
then `systems/revops-engine/CLAUDE.md`. Confirm with:
```bash
ls /Users/nplmini/code/work/accounts/clients/teknova/../../../systems/revops-engine/CLAUDE.md
```
Expected: the path resolves (no "No such file").

- [ ] **Step 3: Commit**

```bash
git add systems/revops-engine/CLAUDE.md accounts/clients/teknova/CLAUDE.md
git commit -m "revops-engine: add system CLAUDE.md + import it from teknova engagement"
```

- [ ] **Step 4: Verify the binding loads (manual)**

In a NEW terminal, launch Claude from `accounts/clients/teknova/` (or a play under it) and confirm the
revops-engine system context is present (ask it "what's the staging→promote→core model and how does
run-prep find its stages?"). Expected: it answers from the imported system doc. This closes the
"account folder has no revops context" gap.

---

## Notes

- Roadmap: flip Phase 2 to `done` only after Task 4 Step 3 (the edit-recipe-no-code-change test) and
  Task 5 Step 4 (binding loads) both pass — that is the phase's `Done when`.
- Sibling artifacts that may want a follow-up (mention, don't do here): `ROADMAP.md` Phase 2 status flip;
  the `reference/` misplaced apify doc; the `capabilities/` utilization audit.
