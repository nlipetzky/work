// gate-ai-research.mjs — the GENERIC AI-research gate runner. One harness, swap the prompt.
//
// The "AI as a called function" layer: a deterministic program selects the rows, fills a prompt
// template per row, calls Claude (with web search) as a function, parses the structured JSON
// verdict, and writes it back to the staging row. The program orchestrates; the AI judges one
// row at a time. Every soft verification gate (wet-lab, lab-location, LinkedIn, …) is now a
// CONFIG — a prompt + an input/output mapping — not bespoke code.
//
//   node gate-ai-research.mjs <batchId> <gateConfigPath> [--entity companies] [--limit N] [--all]
//
// Default --limit 3 = a PILOT (paid: API + web search). Inspect, then pass --limit N or --all.
// Idempotent: only processes rows whose output column is still null.

import fs from "fs";
import path from "path";
import { anthropicMessages, textFromContent, countToolUses, parseJsonLoose } from "./lib/ai-call.mjs";

const ENV = "/Users/nplmini/code/work/.env";
const REF = "mrmnyscurmkfppicqqhk";
const ENGINE = "/Users/nplmini/code/work/systems/revops-engine";
const env = fs.readFileSync(ENV, "utf8");
const SUPA = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const ANTHROPIC = (env.match(/^ANTHROPIC_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--")));
const batchId = pos[0], configPath = pos[1];
const entity = (args.indexOf("--entity") >= 0 ? args[args.indexOf("--entity") + 1] : "companies");
const all = args.includes("--all");
const limit = all ? 100000 : Number(args.indexOf("--limit") >= 0 ? args[args.indexOf("--limit") + 1] : 3);
if (!batchId || !configPath) { console.error("usage: gate-ai-research.mjs <batchId> <gateConfigPath> [--limit N] [--all]"); process.exit(1); }

const cfg = JSON.parse(fs.readFileSync(path.resolve(ENGINE, configPath), "utf8"));
const promptTpl = fs.readFileSync(path.resolve(ENGINE, cfg.promptFile), "utf8");
const tbl = `staging.${entity}_${batchId}`;

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${SUPA}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const t = await r.text();
  if (r.status >= 300) { console.error("SQL ERROR", r.status, t.slice(0, 240)); process.exit(1); }
  try { return JSON.parse(t); } catch { return []; }
}
const esc = (v) => v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`;

// the AI call — Claude as a function, with web search. Shared path (lib/ai-call.mjs): same client +
// 429/529 backoff + loose-JSON parse as verify-runner. The only difference is this one passes tools.
async function research(filledPrompt) {
  try {
    const j = await anthropicMessages({
      apiKey: ANTHROPIC, model: cfg.model, maxTokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: cfg.maxSearchUses ?? 5 }],
      messages: [{ role: "user", content: filledPrompt }],
    });
    return { text: textFromContent(j), searches: countToolUses(j) };
  } catch (e) { return { error: String(e.message) }; }
}

// 1) ensure output columns
await sql(`alter table ${tbl} add column if not exists ${cfg.outputColumn} text;
           alter table ${tbl} add column if not exists ${cfg.detailColumn} text;`);

// 2) select eligible, unprocessed rows
const need = Object.values(cfg.inputs);
const rows = await sql(`select id, ${need.map((c) => `"${c}"`).join(", ")} from ${tbl}
  where (${cfg.runConditionSql}) and ${cfg.outputColumn} is null
  order by name limit ${limit};`);
const remaining = (await sql(`select count(*) n from ${tbl} where (${cfg.runConditionSql}) and ${cfg.outputColumn} is null`))[0]?.n;

console.log(`\n  GATE "${cfg.name}" on ${tbl}  —  processing ${rows.length} of ${remaining} unprocessed${all ? "" : "  (PILOT; --limit N or --all for more)"}`);
const tally = {};
for (const row of rows) {
  let prompt = promptTpl;
  for (const [ph, col] of Object.entries(cfg.inputs)) prompt = prompt.replaceAll(`{{${ph}}}`, row[col] ?? "");
  const res = await research(prompt);
  if (res.error) { console.log(`  ! ${row[cfg.inputs.Name] ?? row.id}: API ${res.error}`); continue; }
  const out = parseJsonLoose(res.text);
  const verdict = out?.[cfg.verdictField] ?? "parse_error";
  tally[verdict] = (tally[verdict] || 0) + 1;
  await sql(`update ${tbl} set ${cfg.outputColumn}=${esc(verdict)}, ${cfg.detailColumn}=${esc(JSON.stringify(out ?? { raw: res.text.slice(0, 500) }))} where id='${row.id}'`);
  console.log(`  [${verdict}] ${row[cfg.inputs.Name] ?? row.id}  (${res.searches} searches) — ${out?.reasoning?.slice(0, 90) ?? ""}`);
}
console.log(`  done: ${JSON.stringify(tally)}  | column ${cfg.outputColumn} written. Remaining unprocessed: ${remaining - rows.length}\n`);
