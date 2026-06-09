// run-status.mjs — the prep funnel's run-progress primitive (writes public.prep_run_status).
//
// This is the owned equivalent of Deepline's `deepline session ...` commands:
//   seedPlan   ~ session start --steps '[...]'      (post the whole plan once; never re-seed)
//   markRunning~ session start --update i --status running
//   markDone   ~ session start --update i --status completed   (+ counts)
//   markError  ~ session start --update i --status error       (+ message)
//   setMessage ~ session status --message "..."     (live sub-step line, no state change)
//
// Two ways to drive it:
//   1. import it (the runners + run-prep.mjs orchestrator do this).
//   2. the thin CLI at the bottom (so a skill/agent can drive it later, exactly like `deepline session`).
//
// Connection mirrors the runners: Supabase Management API, token from work/.env. No supabase-js.

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const esc = (s) => String(s).replace(/'/g, "''");
const jsonb = (obj) => `'${esc(JSON.stringify(obj ?? {}))}'::jsonb`;

export async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mgmt-api ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// Post the whole plan once. stages: [{ stage, entity, order }]. Idempotent on (run_id, stage).
export async function seedPlan(runId, batchId, stages) {
  const values = stages
    .map((s) => `('${esc(runId)}','${esc(batchId)}','${esc(s.entity)}','${esc(s.stage)}',${Number(s.order)},'pending')`)
    .join(",\n");
  await sql(`insert into public.prep_run_status
      (run_id, batch_id, entity, stage, stage_order, status)
    values ${values}
    on conflict (run_id, stage) do nothing`);
}

export async function markRunning(runId, stage) {
  await sql(`update public.prep_run_status
    set status='running', started_at=now(), updated_at=now()
    where run_id='${esc(runId)}' and stage='${esc(stage)}'`);
}

export async function markDone(runId, stage, counts) {
  await sql(`update public.prep_run_status
    set status='done', counts=${jsonb(counts)}, updated_at=now()
    where run_id='${esc(runId)}' and stage='${esc(stage)}'`);
}

export async function markError(runId, stage, message) {
  await sql(`update public.prep_run_status
    set status='error', message='${esc(String(message ?? "").slice(0, 500))}', updated_at=now()
    where run_id='${esc(runId)}' and stage='${esc(stage)}'`);
}

// Live "what's happening right now" sub-step line. Does not change status.
export async function setMessage(runId, stage, message) {
  await sql(`update public.prep_run_status
    set message='${esc(String(message ?? "").slice(0, 500))}', updated_at=now()
    where run_id='${esc(runId)}' and stage='${esc(stage)}'`);
}

// --- thin CLI (the `deepline session` equivalent) ---------------------------------------------
// Only runs when invoked directly, not when imported.
//   node lib/run-status.mjs seed --run-id <u> --batch <b> --plan '[{"stage":"stage1","entity":"companies","order":1},...]'
//   node lib/run-status.mjs set  --run-id <u> --stage <s> --status running|done|error [--counts '{...}'] [--message "..."]
//   node lib/run-status.mjs msg  --run-id <u> --stage <s> --message "..."
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("lib/run-status.mjs");
if (isMain) {
  const a = process.argv.slice(2);
  const cmd = a[0];
  const flag = (name) => { const i = a.indexOf(name); return i >= 0 ? a[i + 1] : undefined; };
  const runId = flag("--run-id");
  const stage = flag("--stage");
  try {
    if (cmd === "seed") {
      await seedPlan(runId, flag("--batch"), JSON.parse(flag("--plan")));
    } else if (cmd === "set") {
      const status = flag("--status");
      if (status === "running") await markRunning(runId, stage);
      else if (status === "done") await markDone(runId, stage, JSON.parse(flag("--counts") || "{}"));
      else if (status === "error") await markError(runId, stage, flag("--message") || "");
      else throw new Error(`unknown --status ${status}`);
      const m = flag("--message");
      if (m && status !== "error") await setMessage(runId, stage, m);
    } else if (cmd === "msg") {
      await setMessage(runId, stage, flag("--message") || "");
    } else {
      console.error("usage: run-status.mjs <seed|set|msg> --run-id <u> [--stage <s>] ...");
      process.exit(1);
    }
  } catch (e) {
    console.error(`run-status: ${e.message}`);
    process.exit(1);
  }
}
