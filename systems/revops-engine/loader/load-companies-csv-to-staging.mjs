// Companies ingest loader: full CSV -> staging.companies_<batch_id>.
// Stages EVERY source column (faithful to the RevOps Surface export). Columns whose name
// matches a `companies` column are promoted by promote_staging_batch; the rest are review-only.
// Runs through the Supabase Management API (chunked) so row data never enters an agent context.
//
// Usage: node load-companies-csv-to-staging.mjs <csvPath> <batchId>

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");

const csvPath = process.argv[2];
const batchId = process.argv[3] || "ngabs_2026_06_05";
const stagingTbl = `staging.companies_${batchId}`;
const CONST = {
  engine_account_id: "00000000-0000-0000-0000-000000000001",
  account_id: "00000000-0000-0000-0000-000000000010",
};

// source header -> canonical `companies` column (these get promoted). Person-named source
// columns are re-named to role-based (no person names in schema).
const RENAME = {
  "Company Name": "name", Domain: "domain", Industry: "industry", "HQ State": "hq_state",
  "Employee Count": "employee_count", "HQ Country": "country", "Company LinkedIn URL": "company_linkedin_url",
  "Stock Ticker": "ticker", "Funding Stage": "funding_stage", "Revenue Range": "revenue_range",
  "NAICS Code": "naics_code", "Company Research": "company_research", "Classification Notes": "classification_notes",
  "Company Score": "company_score", "Fit Score": "fit_score", "Playbook Fit Score": "playbook_fit_score",
  "Ellie Note": "client_sme_note", "Ellie Segment Override": "client_sme_segment_override",
};

function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}
const sanitize = (h) => {
  let s = h.replace(/^﻿/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return s || "col";
};

const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
const hdr = rows[0].map((h) => h.replace(/^﻿/, ""));
const seen = {};
const colNames = hdr.map((h) => {
  let name = RENAME[h] || sanitize(h);
  if (name === "id" || name === "engine_account_id" || name === "account_id") name = "src_" + name;
  if (seen[name] != null) { seen[name]++; name = name + "_" + seen[name]; } else seen[name] = 0;
  return name;
});
const data = rows.slice(1);

const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;
const ddlCols = colNames.map((c) => `"${c}" text`).join(", ");
const insCols = colNames.map((c) => `"${c}"`).join(", ");

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const txt = await res.text();
  if (res.status >= 300) { console.log("SQL ERROR", res.status, txt.slice(0, 300)); process.exit(1); }
  return txt;
}

// 1) create table
await runSql(`drop table if exists ${stagingTbl};
create table ${stagingTbl} (id uuid, engine_account_id uuid, account_id uuid, ${ddlCols});`);

// 2) insert in chunks
const CHUNK = 20;
let inserted = 0;
for (let i = 0; i < data.length; i += CHUNK) {
  const slice = data.slice(i, i + CHUNK);
  const valuesSql = slice.map((r) => {
    const vals = colNames.map((c, ci) => { const v = (r[ci] ?? "").trim(); return v === "" ? "null" : esc(v); });
    return `(gen_random_uuid(), '${CONST.engine_account_id}', '${CONST.account_id}', ${vals.join(", ")})`;
  }).join(",\n");
  await runSql(`insert into ${stagingTbl} (id, engine_account_id, account_id, ${insCols}) values\n${valuesSql};`);
  inserted += slice.length;
}

const out = await runSql(`select count(*) as staged from ${stagingTbl};`);
console.log("source columns:", hdr.length, "| staging columns:", colNames.length);
console.log("rows inserted:", inserted);
console.log("count:", out);
