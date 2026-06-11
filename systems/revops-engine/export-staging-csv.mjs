// Deliver node (signal-prospecting): staging.<entity>_<batchId> -> a reviewable CSV artifact.
// The client/expert review sheet — NOT the Airtable transport (that's export-airtable-payload.mjs).
// Read-only SELECT via the Supabase Management API; row data never enters an agent context
// (only the written file path + a count print). Reusable across plays.
//
// Usage:
//   node export-staging-csv.mjs <batchId> <playDir> [--entity companies|contacts]
//        [--verdicts IN,NARROW,NEEDS_REVIEW] [--cols a,b,c] [--out /abs/path.csv]
//
// Defaults: entity=companies; a readable review column set (not all staged columns);
// no verdict filter (all rows) unless --verdicts given; output to <playDir>/output/<batch>-<entity>-review.csv.

import fs from "fs";
import path from "path";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i === -1 ? d : (args[i + 1] ?? d); };
const positional = args.filter((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--")));
const batchId = positional[0];
const playDir = positional[1];
const entity = flag("--entity", "companies");
const verdicts = (flag("--verdicts", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const qualifiedOnly = args.includes("--qualified");  // evidence-verified set (prep_qualified=true)

if (!batchId || !playDir) {
  console.error("usage: export-staging-csv.mjs <batchId> <playDir> [--entity companies|contacts] [--verdicts IN,NARROW] [--cols ...] [--out path]");
  process.exit(1);
}

const REVIEW_COLS = {
  companies: ["name", "domain", "website_url", "description", "employee_count", "industry",
    "city", "state", "country", "naics_code", "prep_verdict", "prep_attention", "prep_rationale", "source"],
  contacts: ["full_name", "title", "company_name", "company_domain", "email", "email_verified_status",
    "linkedin_url", "city", "state", "country", "prep_verdict", "prep_attention", "prep_rationale", "source"],
};
const stagingTbl = `staging.${entity}_${batchId}`;

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const txt = await res.text();
  if (res.status >= 300) { console.error("SQL ERROR", res.status, txt.slice(0, 300)); process.exit(1); }
  return JSON.parse(txt);
}

// resolve columns: requested (or default review set) intersected with what actually exists
const present = (await q(
  `select column_name from information_schema.columns where table_schema='staging' and table_name='${entity}_${batchId}'`
)).map((r) => r.column_name);
if (present.length === 0) { console.error(`REFUSED: ${stagingTbl} not found or empty`); process.exit(1); }
const wanted = flag("--cols") ? flag("--cols").split(",").map((s) => s.trim()) : REVIEW_COLS[entity] || present;
const cols = wanted.filter((c) => present.includes(c));
const dropped = wanted.filter((c) => !present.includes(c));
if (dropped.length) console.log(`note: columns not on this batch, skipped: ${dropped.join(", ")}`);

const conds = [];
if (verdicts.length) conds.push(`prep_verdict in (${verdicts.map((v) => `'${v.replace(/'/g, "''")}'`).join(",")})`);
if (qualifiedOnly) conds.push(`prep_qualified is true`);
const where = conds.length ? `where ${conds.join(" and ")}` : "";
const orderBy = present.includes("prep_verdict") ? "order by prep_verdict, name" : "order by 1";
const data = await q(`select ${cols.map((c) => `"${c}"`).join(", ")} from ${stagingTbl} ${where} ${orderBy};`);

// CSV with RFC-4180 quoting
const esc = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const lines = [cols.join(","), ...data.map((row) => cols.map((c) => esc(row[c])).join(","))];

const outPath = flag("--out") || path.join(path.resolve(playDir), "output", `${batchId}-${entity}-review.csv`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n");
console.log(`wrote ${data.length} rows × ${cols.length} cols -> ${outPath}`);
if (verdicts.length) console.log(`(filtered to verdicts: ${verdicts.join(", ")})`);
