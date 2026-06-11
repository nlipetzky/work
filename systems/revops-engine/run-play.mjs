// run-play.mjs — the DETERMINISTIC play driver. Code-driven, not agent-driven.
//
// This is the spine of the agentic system: a program that runs the registered flow end to end,
// reads real state from the engine database (never from prose), verifies each step's count from
// the surface, stops hard at gates, and reports HONESTLY — a step that did not run cannot be
// claimed as done, and a gate that is not wired is printed as NOT WIRED, every time.
//
// The AI is a COMPONENT this program calls for judgment steps (classify, resolve) — it is never
// the orchestrator. You run this; you do not flog a chat session.
//
//   node run-play.mjs <batchId> <playDir> [--execute]     (default: --status, read-only truth)
//
// --status  : read the DB and report exactly where the batch is and which gates ran. No writes.
// --execute : additionally run the next not-yet-done step's registered command, then re-verify.
//             Stops before any gate (paid / approval) and prints what it's waiting on.

import fs from "fs";
import { spawnSync } from "child_process";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const args = process.argv.slice(2);
const batchId = args.find((a) => !a.startsWith("--"));
const playDir = args.filter((a) => !a.startsWith("--"))[1];
const EXECUTE = args.includes("--execute");
const JSON_OUT = args.includes("--json");

if (!batchId) { console.error("usage: run-play.mjs <batchId> <playDir> [--execute]"); process.exit(1); }

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const txt = await res.text();
  if (res.status >= 300) return { error: `${res.status}: ${txt.slice(0, 200)}` };
  try { return { rows: JSON.parse(txt) }; } catch { return { rows: [] }; }
}
const tableExists = async (schema, name) =>
  ((await q(`select 1 from information_schema.tables where table_schema='${schema}' and table_name='${name}'`)).rows || []).length > 0;
const scalar = async (sql) => { const r = await q(sql); return r.rows?.[0] ? Object.values(r.rows[0])[0] : null; };

// ── The canonical flow (mirrors registry/signal/signal-prospecting/system.md `flow:`) ──────────
// Each step reads REAL state and returns an honest verdict. No step trusts a prior claim.
const STEPS = [
  {
    node: "Load",
    async check() {
      const t = `companies_${batchId}`;
      if (!(await tableExists("staging", t))) return { state: "not started", detail: "no staging table" };
      const n = await scalar(`select count(*) from staging.${t}`);
      return { state: "done", detail: `${n} rows staged`, count: Number(n) };
    },
  },
  {
    node: "Screen",
    async check() {
      const t = `companies_${batchId}`;
      if (!(await tableExists("staging", t))) return { state: "blocked", detail: "load first" };
      const total = Number(await scalar(`select count(*) from staging.${t}`));
      const scored = Number(await scalar(`select count(*) from staging.${t} where prep_verdict is not null`));
      if (scored === 0) return { state: "not started", detail: `0/${total} screened` };
      const r = await q(`select coalesce(prep_verdict,'(null)') v, count(*) n from staging.${t} group by 1 order by 2 desc`);
      const parts = (r.rows || []).map((x) => `${x.v}=${x.n}`).join(" + ");
      const sum = (r.rows || []).reduce((a, x) => a + Number(x.n), 0);
      const ok = sum === total ? "sums ✓" : `SUM MISMATCH (${sum}≠${total})`;
      return { state: scored === total ? "done" : "partial", detail: `${total} = ${parts}  [${ok}]`, count: total };
    },
    // Auto-executable: deterministic, free compute. Runs only when there are unscreened rows.
    exec: {
      runnableWhen: async () => {
        const t = `companies_${batchId}`;
        if (!(await tableExists("staging", t))) return false;
        const total = Number(await scalar(`select count(*) from staging.${t}`));
        const scored = Number(await scalar(`select count(*) from staging.${t} where prep_verdict is not null`));
        return total > 0 && scored < total;
      },
      cmd: () => ["node", "run-prep.mjs", batchId, ...(playDir ? ["--play", playDir] : [])],
    },
  },
  {
    // The honesty core: declared screens vs WIRED screens. A criterion with no wired check is
    // reported NOT WIRED so the system can never imply a verification it didn't perform.
    // Advisory: always reports, never blocks the driver — it's a truth panel, not a step to run.
    node: "Verification gates",
    advisory: true,
    async check() {
      // wired = actually executed by a code/classifier step; not-wired = promised in criteria, no implementation
      // CRM gate is wired the moment its output column exists on the batch (it either ran or it didn't).
      const t = `companies_${batchId}`;
      const crmRan = !!(await scalar(`select 1 from information_schema.columns where table_schema='staging' and table_name='${t}' and column_name='crm_status'`));
      let crmDetail = "deterministic SF join (gate-crm-suppression.mjs)";
      if (crmRan) {
        const r = await q(`select count(*) filter (where crm_status is not null) m, count(*) filter (where crm_status='open_opp_review') o, count(*) filter (where crm_status='dnc_suppress') d from staging.${t}`);
        const x = r.rows?.[0] || {};
        crmDetail = `ran: ${x.m} SF-matched (open-opp:${x.o} · dnc:${x.d}) — gate-crm-suppression.mjs`;
      }
      // wet-lab / NA-lab gate: the generic AI-research runner (gate-ai-research.mjs + gates/wetlab).
      // Wired the moment its output column exists; paid, so operator-triggered, not auto-run.
      const wetRan = !!(await scalar(`select 1 from information_schema.columns where table_schema='staging' and table_name='${t}' and column_name='gate_wetlab'`));
      let wetDetail = "generic AI-research gate (gate-ai-research.mjs + gates/wetlab) — PAID, operator-run";
      if (wetRan) {
        const r = await q(`select count(*) filter (where gate_wetlab is not null) done, count(*) filter (where gate_wetlab='yes') y, count(*) filter (where gate_wetlab='no') n from staging.${t}`);
        const x = r.rows?.[0] || {};
        wetDetail = `ran on ${x.done} (yes:${x.y} NA wet-lab/process/GMP, no:${x.n}) — gate-ai-research.mjs`;
      }
      const gates = [
        { name: "modality + exclusions (mRNA vs oligo/discovery/non-NA)", wired: true, by: "classifier (prep_verdict/prep_criteria)" },
        { name: "CRM suppression / existing-customer (SF mirror)", wired: crmRan, by: crmDetail },
        { name: "NA lab footprint + wet-lab/process/GMP ops", wired: wetRan, by: wetDetail },
        { name: "LinkedIn presence/identity", wired: false, by: "unwired — a generic AI-research gate config away (swap the prompt)" },
      ];
      const wired = gates.filter((g) => g.wired).length;
      const detail = gates.map((g) => `\n      ${g.wired ? "WIRED   " : "NOT WIRED"}  ${g.name}\n                 (${g.by})`).join("");
      return { state: wired === gates.length ? "done" : "partial", detail: `${wired}/${gates.length} wired${detail}` };
    },
  },
  {
    node: "CRM suppression",
    async check() {
      const t = `companies_${batchId}`;
      const ran = !!(await scalar(`select 1 from information_schema.columns where table_schema='staging' and table_name='${t}' and column_name='crm_status'`));
      if (!ran) return { state: "not started", detail: "gate not run — wired, deterministic SF join" };
      const r = await q(`select count(*) filter (where crm_status is not null) m, count(*) filter (where crm_status='open_opp_review') o, count(*) filter (where crm_status='dnc_suppress') d, count(*) filter (where crm_status='existing_customer') e from staging.${t}`);
      const x = r.rows?.[0] || {};
      return { state: "done", detail: `${x.m} SF-matched — open-opp:${x.o} (review), dnc:${x.d} (suppress), existing:${x.e} (keep+flag)`, count: Number(x.m) };
    },
    exec: {
      runnableWhen: async () => {
        const t = `companies_${batchId}`;
        if (!(await tableExists("staging", t))) return false;
        const scored = Number(await scalar(`select count(*) from staging.${t} where prep_verdict is not null`));
        const ran = !!(await scalar(`select 1 from information_schema.columns where table_schema='staging' and table_name='${t}' and column_name='crm_status'`));
        return scored > 0 && !ran;   // screened but CRM gate hasn't run yet
      },
      cmd: () => ["node", "gate-crm-suppression.mjs", batchId],
    },
  },
  {
    node: "Flag-resolve",
    async check() {
      const t = `companies_${batchId}`;
      const hasCol = await scalar(`select 1 from information_schema.columns where table_schema='staging' and table_name='${t}' and column_name='prep_attention'`);
      if (!hasCol) return { state: "not started", detail: "no prep_attention column" };
      const r = await q(`select coalesce(prep_attention,'(none)') a, count(*) n from staging.${t} group by 1 order by 2 desc`);
      const open = Number(await scalar(`select count(*) from staging.${t} where prep_attention in ('open','escalated')`));
      const parts = (r.rows || []).map((x) => `${x.a}=${x.n}`).join(" + ");
      return { state: open === 0 ? "done" : "waiting on operator", detail: `${parts}  (${open} need a decision)`, count: open };
    },
  },
  {
    node: "Promote",
    async check() {
      const n = Number(await scalar(`select count(*) from public.companies where source = '${batchId.replace(/'/g, "''")}'`) || 0);
      return { state: n > 0 ? "done" : "not started", detail: `${n} promoted to Core for source=${batchId}`, count: n };
    },
  },
  {
    node: "Contacts",
    async check() {
      const t = `contacts_${batchId}`;
      if (!(await tableExists("staging", t))) return { state: "not started", detail: "no contacts batch — gap: contact loader not built" };
      const n = await scalar(`select count(*) from staging.${t}`);
      return { state: "done", detail: `${n} contacts staged`, count: Number(n) };
    },
    gate: "PAID — pilot + price + approval before scaled contact pull",
  },
  {
    node: "Deliver",
    async check() {
      const out = playDir ? `${playDir}/output/${batchId}-companies-review.csv` : null;
      const exists = out && fs.existsSync(out);
      return { state: exists ? "artifact built" : "not started", detail: exists ? out : "no review CSV yet" };
    },
    gate: "export waits for operator approval; expert-facing delivery routes through Hermes",
  },
];

const DONE = new Set(["done", "artifact built"]);
const line = (step, v) => renderLine({ node: step.node, state: v.state, detail: v.detail, gate: step.gate || null });
const renderLine = (r) => {
  const mark = DONE.has(r.state) ? "[x]" : r.state.startsWith("waiting") || r.state === "partial" ? "[!]" : "[ ]";
  console.log(`  ${mark} ${r.node.padEnd(20)} ${r.state.toUpperCase()}`);
  console.log(`      ${r.detail}`);
  if (r.gate) console.log(`      ⛔ gate: ${r.gate}`);
};

// ── STATUS: read-only truth ──────────────────────────────────────────────────────────────────
async function status() {
  const results = [];
  let next = null;
  for (const step of STEPS) {
    const v = await step.check();
    results.push({ node: step.node, state: v.state, detail: v.detail, gate: step.gate || null, count: v.count ?? null });
    if (!next && !DONE.has(v.state) && !step.advisory) next = { step, v };  // advisory panels never count as "next"
  }
  if (JSON_OUT) {                       // machine-readable for the autonomous wrapper / a surface
    console.log(JSON.stringify({
      batchId, readAt: new Date().toISOString(), steps: results,
      next: next ? { node: next.step.node, state: next.v.state, gate: next.step.gate || null } : null,
    }));
    return;
  }
  console.log(`\n  PLAY DRIVER — batch ${batchId}   (STATUS, read-only)`);
  console.log(`  ${"─".repeat(72)}`);
  for (const r of results) renderLine(r);
  console.log(`  ${"─".repeat(72)}`);
  if (next) {
    console.log(`  NEXT: ${next.step.node} — ${next.v.state}`);
    if (next.step.gate) console.log(`  (gated — needs you: ${next.step.gate})`);
  } else console.log(`  Flow complete through Deliver.`);
  console.log(`  Every line above was read from the database now. Nothing here is a claim.\n`);
}

// ── EXECUTE: the driver runs auto-executable steps itself, re-verifies, stops at gates ─────────
async function execute() {
  console.log(`\n  PLAY DRIVER — batch ${batchId}   (EXECUTE — code-driven, stops at gates)`);
  console.log(`  ${"─".repeat(72)}`);
  for (const step of STEPS) {
    let v = await step.check();
    if (DONE.has(v.state)) { line(step, v); continue; }
    if (step.advisory) { line(step, v); continue; }   // truth panel — reports, never halts the walk
    // not done. Three cases: a gate (stop), auto-executable (run + re-verify), or needs-operator/config (stop).
    if (step.gate) { line(step, v); console.log(`  ${"─".repeat(72)}`);
      console.log(`  STOPPED at ${step.node} — this gate needs you: ${step.gate}\n`); return; }
    if (step.exec && await step.exec.runnableWhen()) {
      const cmd = step.exec.cmd();
      console.log(`  [>] ${step.node.padEnd(20)} RUNNING  ${cmd.join(" ")}`);
      const r = spawnSync(cmd[0], cmd.slice(1), { cwd: "/Users/nplmini/code/work/systems/revops-engine", stdio: "inherit" });
      if (r.status !== 0) { console.log(`  ${"─".repeat(72)}`);
        console.log(`  STOPPED — ${step.node} exited ${r.status}. Fix and re-run.\n`); return; }
      v = await step.check();          // re-verify from the DB, never trust the command's own word
      line(step, v);
      if (!DONE.has(v.state)) { console.log(`  ${"─".repeat(72)}`);
        console.log(`  STOPPED — ${step.node} ran but DB does not show it done. Investigate.\n`); return; }
      continue;
    }
    // not done, not a gate, not auto-runnable → needs operator decision or config
    line(step, v);
    console.log(`  ${"─".repeat(72)}`);
    console.log(`  STOPPED at ${step.node} — needs you (decision or config), then re-run.\n`); return;
  }
  console.log(`  ${"─".repeat(72)}`);
  console.log(`  Flow complete through Deliver.\n`);
}

await (EXECUTE ? execute() : status());
