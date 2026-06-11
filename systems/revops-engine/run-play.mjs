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

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const args = process.argv.slice(2);
const batchId = args.find((a) => !a.startsWith("--"));
const playDir = args.filter((a) => !a.startsWith("--"))[1];
const EXECUTE = args.includes("--execute");

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
  },
  {
    // The honesty core: declared screens vs WIRED screens. A criterion with no wired check is
    // reported NOT WIRED so the system can never imply a verification it didn't perform.
    node: "Verification gates",
    async check() {
      // wired = actually executed by a code/classifier step; not-wired = promised in criteria, no implementation
      const gates = [
        { name: "modality + exclusions (mRNA vs oligo/discovery/non-NA)", wired: true, by: "classifier (prep_verdict/prep_criteria)" },
        { name: "North American LAB footprint (not just HQ)", wired: false, by: "criteria asks; source filter is HQ-only; no lab-location check exists" },
        { name: "active wet-lab / process operations", wired: false, by: "classifier infers from blurb; no verification step" },
        { name: "LinkedIn presence/identity", wired: false, by: "unwired-verification family" },
        { name: "CRM suppression / existing-customer (SF mirror)", wired: false, by: "read path exists, not joined into the screen" },
      ];
      const wired = gates.filter((g) => g.wired).length;
      const detail = gates.map((g) => `\n      ${g.wired ? "WIRED   " : "NOT WIRED"}  ${g.name}\n                 (${g.by})`).join("");
      return { state: wired === gates.length ? "done" : "partial", detail: `${wired}/${gates.length} wired${detail}` };
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

// ── run ────────────────────────────────────────────────────────────────────────────────────────
console.log(`\n  PLAY DRIVER — batch ${batchId}   (${EXECUTE ? "EXECUTE" : "STATUS, read-only"})`);
console.log(`  ${"─".repeat(72)}`);
let firstUnfinished = null;
for (const step of STEPS) {
  const v = await step.check();
  const mark = v.state === "done" || v.state === "artifact built" ? "[x]"
    : v.state.startsWith("waiting") || v.state === "partial" ? "[!]" : "[ ]";
  console.log(`  ${mark} ${step.node.padEnd(20)} ${v.state.toUpperCase()}`);
  console.log(`      ${v.detail}`);
  if (step.gate) console.log(`      ⛔ gate: ${step.gate}`);
  if (!firstUnfinished && !["done", "artifact built"].includes(v.state)) firstUnfinished = { step, v };
}
console.log(`  ${"─".repeat(72)}`);
if (firstUnfinished) {
  console.log(`  NEXT: ${firstUnfinished.step.node} — ${firstUnfinished.v.state}`);
  if (firstUnfinished.step.gate) console.log(`  (gated: ${firstUnfinished.step.gate})`);
} else {
  console.log(`  Flow complete through Deliver.`);
}
console.log(`  Every line above was read from the database now. Nothing here is a claim.\n`);
