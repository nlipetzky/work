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
