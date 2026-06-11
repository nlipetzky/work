// Companies ingest loader: full CSV -> staging.companies_<batch_id>.
// Stages EVERY source column (faithful to the RevOps Surface export). Columns whose name
// matches a `companies` column are promoted by promote_staging_batch; the rest are review-only.
// Runs through the Supabase Management API (chunked) so row data never enters an agent context.
//
// Usage: node load-companies-csv-to-staging.mjs <csvPath> <batchId> <playDir> [--segment NAME] [--playbook NAME]
//        node load-companies-csv-to-staging.mjs <csvPath> <batchId> --no-play "<reason>"
//
// Every batch declares its play at load time (staging_batch_meta row -> the projection-ui
// staging header renders the play + Client Guidance links). A batch with no play context is
// the known failure mode this guards against; --no-play is the explicit escape, not a default.

import fs from "fs";
import path from "path";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 1] ?? "");
};
const positional = args.filter((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--")));

const csvPath = positional[0];
const batchId = positional[1];
const playDir = positional[2] ?? null;
const noPlayReason = flag("--no-play");

if (!csvPath || !batchId) {
  console.error("usage: load-companies-csv-to-staging.mjs <csvPath> <batchId> <playDir> [--segment NAME] [--playbook NAME]");
  process.exit(1);
}
if (!playDir && noPlayReason === null) {
  console.error(`REFUSED: batch "${batchId}" declares no play. Pass the play folder as the 3rd argument`);
  console.error(`(e.g. ~/code/work/accounts/clients/teknova/plays/<play-slug>) so the batch carries its`);
  console.error(`context links, or pass --no-play "<reason>" to load a context-orphaned batch on purpose.`);
  process.exit(1);
}

// Derive batch context from the play folder (overridable via --segment / --playbook).
const titleize = (slug) => slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
let META = null;
if (playDir) {
  const dir = path.resolve(playDir);
  if (!fs.existsSync(dir)) { console.error(`REFUSED: play dir not found: ${dir}`); process.exit(1); }
  const files = fs.readdirSync(dir);
  const playbookFile = files.find((f) => /playbook/i.test(f) && f.endsWith(".md")) ?? (files.includes("CLAUDE.md") ? "CLAUDE.md" : null);
  const guidanceFile = files.includes("client-guidance.md") ? "client-guidance.md" : null;
  META = {
    segment_name: flag("--segment") ?? titleize(path.basename(dir)),
    playbook_name: flag("--playbook") ?? (playbookFile ? playbookFile.replace(/\.md$/, "") : null),
    play_file_path: playbookFile ? path.join(dir, playbookFile) : null,
    guidance_file_path: guidanceFile ? path.join(dir, guidanceFile) : null,
  };
} else {
  console.log(`loading WITHOUT play context (--no-play: ${noPlayReason}) — staging header will show no links`);
}

const stagingTbl = `staging.companies_${batchId}`;
const SOURCE = batchId; // stamp provenance at load time (avoids the manual source backfill)
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
  // clay ngAbs shared-view export aliases (Clay field names differ from the RevOps Surface export)
  "Primary Industry": "industry", "LinkedIn URL": "company_linkedin_url",
  "Company Research Narrative": "company_research",
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
create table ${stagingTbl} (id uuid, engine_account_id uuid, account_id uuid, source text, ${ddlCols});`);

// 2) insert in chunks
const CHUNK = 20;
let inserted = 0;
for (let i = 0; i < data.length; i += CHUNK) {
  const slice = data.slice(i, i + CHUNK);
  const valuesSql = slice.map((r) => {
    const vals = colNames.map((c, ci) => { const v = (r[ci] ?? "").trim(); return v === "" ? "null" : esc(v); });
    return `(gen_random_uuid(), '${CONST.engine_account_id}', '${CONST.account_id}', ${esc(SOURCE)}, ${vals.join(", ")})`;
  }).join(",\n");
  await runSql(`insert into ${stagingTbl} (id, engine_account_id, account_id, source, ${insCols}) values\n${valuesSql};`);
  inserted += slice.length;
}

// 3) bind the batch to its play context (idempotent: replace this batch+entity's meta row)
if (META) {
  const v = (x) => (x === null ? "null" : esc(x));
  await runSql(`delete from public.staging_batch_meta where batch_id = ${esc(batchId)} and entity = 'companies';
insert into public.staging_batch_meta (batch_id, entity, segment_name, playbook_name, play_file_path, guidance_file_path, created_by)
values (${esc(batchId)}, 'companies', ${v(META.segment_name)}, ${v(META.playbook_name)}, ${v(META.play_file_path)}, ${v(META.guidance_file_path)}, 'revops-loader');`);
  console.log("batch meta:", META.segment_name, "|", META.playbook_name ?? "(no playbook name)");
}

const out = await runSql(`select count(*) as staged from ${stagingTbl};`);
console.log("source columns:", hdr.length, "| staging columns:", colNames.length);
console.log("rows inserted:", inserted);
console.log("count:", out);
