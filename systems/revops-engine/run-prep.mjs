// run-prep.mjs — the prep-funnel orchestrator + run_id source.
//
// Mints one run_id, seeds the plan into prep_run_status (all stages 'pending'), then runs the five
// stage runners in order, threading --run-id so each writes its own 'done' + counts on success. The
// orchestrator owns the 'running' transition (before each spawn) and 'error' (on nonzero exit) — so a
// hard crash a runner can't catch still turns the stage red instead of hanging silently.
//
// This is today's deterministic driver of the status primitive (lib/run-status.mjs). Later, the
// play-prep skill can drive the same primitive agent-side via its CLI — same rows, same surface.
//
// Usage:
//   node run-prep.mjs <batch_id> [--play <classifier_dir>]
//
// Default play dir is the ngAbs classifier folder; pass --play to point at another play.

import { fileURLToPath } from "url";
import path from "path";
import { randomUUID } from "crypto";
import { spawnSync } from "child_process";
import { seedPlan, markRunning, markError } from "./lib/run-status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const batchId = argv[0];
const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const PLAY_DIR = flag("--play",
  "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/classifier");

if (!batchId) {
  console.error("usage: node run-prep.mjs <batch_id> [--play <classifier_dir>]");
  process.exit(1);
}

const runId = randomUUID();
const runner = (f) => path.join(__dirname, f);

// The five-stage plan. order drives the UI strip; entity records which table the stage works on.
const stages = [
  { stage: "stage1",          entity: "companies", order: 1, runner: "run-stage1.mjs",
    args: [batchId, "companies", path.join(PLAY_DIR, "stage1-deterministic.sql")] },
  { stage: "classify",        entity: "companies", order: 2, runner: "classify-runner.mjs",
    args: [batchId, "companies", "--play", PLAY_DIR] },
  { stage: "dedup",           entity: "companies", order: 3, runner: "dedup-runner.mjs",
    args: [batchId, "companies", path.join(PLAY_DIR, "dedup-rules.json")] },
  { stage: "route",           entity: "contacts",  order: 4, runner: "route-runner.mjs",
    args: [batchId, "contacts", path.join(PLAY_DIR, "routing-rules.json")] },
  { stage: "contacts_screen", entity: "contacts",  order: 5, runner: "contacts-screen-runner.mjs",
    args: [batchId, "contacts", path.join(PLAY_DIR, "contacts-screen-rules.json")] },
];

console.log(`prep run ${runId}  batch=${batchId}  play=${PLAY_DIR}`);
await seedPlan(runId, batchId, stages);

for (const s of stages) {
  console.log(`\n=== ${s.stage} (${s.entity}) ===`);
  await markRunning(runId, s.stage);
  const res = spawnSync("node", [runner(s.runner), ...s.args, "--run-id", runId], { stdio: "inherit" });
  const code = res.status;
  if (code !== 0) {
    const msg = res.error ? res.error.message : `runner exited ${code}`;
    await markError(runId, s.stage, msg);
    console.error(`\nstage ${s.stage} failed (${msg}) — stopping run ${runId}`);
    process.exit(code || 1);
  }
}

console.log(`\nprep run ${runId} complete (5/5).`);
console.log(runId);
