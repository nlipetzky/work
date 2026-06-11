// run-play-all.mjs — the autonomous wrapper. Runs OUTSIDE a chat session (launchd-scheduled).
//
// Discovers every in-flight company batch from staging_batch_meta (which carries the play_dir,
// because the loader binds it at load), runs the deterministic driver on each, and writes the
// combined truth to .run-status.json — so the system's real state stays fresh on a surface
// without anyone running anything or sitting in a session.
//
//   node run-play-all.mjs            # status of every in-flight batch -> .run-status.json
//
// Read-only by design: it reports where every batch is and what's waiting on the operator. It
// does NOT auto-advance or spend — advancing steps stays an explicit `run-play --execute` until
// auto-advance is itself proven (automate what's proven manually first).

import fs from "fs";
import { spawnSync } from "child_process";

const ENGINE = "/Users/nplmini/code/work/systems/revops-engine";
const REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync("/Users/nplmini/code/work/.env", "utf8");
const SUPA = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${SUPA}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const t = await r.text();
  if (r.status >= 300) { console.error("SQL ERROR", r.status, t.slice(0, 200)); process.exit(1); }
  try { return JSON.parse(t); } catch { return []; }
}

// in-flight company batches + their registered play dir
const batches = await sql(`
  select batch_id, play_dir
  from public.staging_batch_meta
  where entity = 'companies' and play_dir is not null
  order by batch_id`);

const report = [];
for (const b of batches) {
  // process.execPath = the absolute node binary — bare "node" isn't on launchd's minimal PATH
  const r = spawnSync(process.execPath, ["run-play.mjs", b.batch_id, b.play_dir, "--json"], { cwd: ENGINE, encoding: "utf8" });
  let parsed = null;
  try { parsed = JSON.parse((r.stdout || "").trim()); } catch { parsed = { batchId: b.batch_id, error: (r.stderr || "no output").slice(0, 200) }; }
  report.push(parsed);
}

const out = { generatedAt: new Date().toISOString(), batches: report };
fs.writeFileSync(`${ENGINE}/.run-status.json`, JSON.stringify(out, null, 2));

// human summary to the log
console.log(`run-play-all @ ${out.generatedAt} — ${report.length} in-flight batch(es)`);
for (const b of report) {
  if (b.error) { console.log(`  ${b.batchId}: ERROR ${b.error}`); continue; }
  const n = b.next ? `NEXT ${b.next.node} (${b.next.state})${b.next.gate ? " — gated" : ""}` : "complete";
  console.log(`  ${b.batchId}: ${n}`);
}
console.log(`  -> ${ENGINE}/.run-status.json`);
