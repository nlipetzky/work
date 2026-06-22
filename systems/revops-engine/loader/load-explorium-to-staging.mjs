// load-explorium-to-staging.mjs
// Source loader (Load node, signal-prospecting): Explorium /v1/businesses -> staging.companies_<batchId>.
// FULL FAITHFUL CAPTURE: one text column per source field; nested fields JSON-stringified; nothing
// dropped (re-pulling costs money, and tomorrow's question needs fields you didn't think of).
//
// Follows load-companies-csv-to-staging.mjs conventions: requires the play folder (writes
// staging_batch_meta + play_dir), stamps --source (default "explorium") on every row, batch-id'd
// staging table, schema-flexible. Also guarantees the canonical screener columns exist (so the
// classifier's read-fields SELECT works regardless of which provider sourced the batch).
//
// Usage:
//   node load-explorium-to-staging.mjs <batchId> <playDir> \
//     --keywords "mRNA,messenger RNA,..." --countries us,ca [--naics 541714,325412] \
//     [--target 100] [--oversample 1.4] [--source explorium] [--dedupe-against companies_<batch>]
//   node load-explorium-to-staging.mjs <batchId> --no-play "<reason>" --keywords ...

import fs from "fs";
import path from "path";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const EXPLORIUM_BASE = "https://api.explorium.ai";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");
const EXPLORIUM_KEY = envGet("EXPLORIUM_API_KEY");
if (!TOKEN) { console.error("missing SupaBase_CLI_access_token in .env"); process.exit(1); }
if (!EXPLORIUM_KEY) { console.error("missing EXPLORIUM_API_KEY in .env"); process.exit(1); }

const args = process.argv.slice(2);
const flag = (name, def = null) => { const i = args.indexOf(name); return i === -1 ? def : (args[i + 1] ?? ""); };
const positional = args.filter((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--")));
const batchId = positional[0];
const playDir = positional[1] ?? null;
const noPlayReason = flag("--no-play");
const SOURCE = flag("--source", "explorium");
const target = parseInt(flag("--target", "100"), 10);
const oversample = parseFloat(flag("--oversample", "1.4"));
const countries = flag("--countries", "us,ca").split(",").map((s) => s.trim()).filter(Boolean);
const keywords = flag("--keywords", "").split(",").map((s) => s.trim()).filter(Boolean);
const naics = flag("--naics", "").split(",").map((s) => s.trim()).filter(Boolean);
const dedupeAgainst = flag("--dedupe-against"); // staging table name (no schema) to dedupe domains against

if (!batchId) { console.error("usage: load-explorium-to-staging.mjs <batchId> <playDir> --keywords ... --countries us,ca [--naics ...] [--target N] [--oversample F]"); process.exit(1); }
if (!playDir && noPlayReason === null) { console.error('REFUSED: no play. Pass the play folder as the 2nd arg, or --no-play "<reason>".'); process.exit(1); }
if (keywords.length === 0 && naics.length === 0) { console.error("REFUSED: no filter. Pass --keywords and/or --naics so the pull is scoped."); process.exit(1); }

const stagingTbl = `staging.companies_${batchId}`;
const CONST = { engine_account_id: "00000000-0000-0000-0000-000000000001", account_id: "00000000-0000-0000-0000-000000000010" };
// Explorium field -> canonical screener column (so read-fields / stage1 work unchanged across sources).
const RENAME = {
  business_description: "description", naics_description: "industry",
  number_of_employees_range: "employee_count", naics: "naics_code",
};
const CANONICAL_COLS = ["name", "domain", "description", "keywords", "industry", "employee_count", "naics_code"];
const RESERVED = new Set(["id", "engine_account_id", "account_id", "source"]);

const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;
const sanitize = (h) => { const s = String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); return s || "col"; };
const stripDomain = (raw) => !raw ? "" : String(raw).replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "").trim().toLowerCase();

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
    play_dir: dir,
  };
}

async function supa(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const txt = await res.text();
  if (res.status >= 300) { console.error("SQL ERROR", res.status, txt.slice(0, 300)); process.exit(1); }
  return txt ? JSON.parse(txt) : null;
}

async function explorium(pageSize, page) {
  const filters = { country_code: { values: countries } };
  if (keywords.length) filters.website_keywords = { values: keywords };
  if (naics.length) filters.naics_category = { values: naics };
  const res = await fetch(`${EXPLORIUM_BASE}/v1/businesses`, {
    method: "POST", headers: { "Content-Type": "application/json", "api_key": EXPLORIUM_KEY },
    body: JSON.stringify({ filters, mode: "full", page_size: pageSize, page }),
  });
  if (!res.ok) { const t = await res.text(); console.error(`Explorium /v1/businesses ${res.status}: ${t.slice(0, 400)}`); process.exit(1); }
  return res.json();
}

// flatten one business -> { canonicalCol: textValue }; nested values JSON-stringified (faithful).
function flatten(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    let col = RENAME[k] || sanitize(k);
    if (RESERVED.has(col)) col = "src_" + col;
    out[col] = (Array.isArray(v) || typeof v === "object") ? JSON.stringify(v) : String(v);
  }
  return out;
}

async function exploriumCredits() {
  const r = await fetch(`${EXPLORIUM_BASE}/v1/credits`, { headers: { "api_key": EXPLORIUM_KEY } });
  if (!r.ok) return null;
  return r.json();
}

(async () => {
  const want = Math.ceil(target * oversample);

  // Pre-flight: fail fast and CLEARLY if the account can't cover the pull (the /v1/credits endpoint
  // is free). Names the account allocation so a wrong/empty account is obvious up front, instead of
  // an opaque mid-pull 403.
  const credits = await exploriumCredits();
  const remaining = credits ? (credits.remaining_credits ?? credits.remaining ?? null) : null;
  if (remaining != null) {
    console.log(`Explorium credits: ${remaining} remaining of ${credits.allocated_credits ?? "?"} allocated`);
    if (remaining < want) {
      console.error(`REFUSED: this pull needs ~${want} credits but only ${remaining} remain. Top up the Explorium account, or lower --target/--oversample. (Allocation ${credits.allocated_credits ?? "?"} — confirm this is the intended account.)`);
      process.exit(1);
    }
  }

  let fetched = [], total = null;
  for (let page = 1; fetched.length < want && page <= 50; page++) {
    const ps = Math.min(100, want - fetched.length);
    const j = await explorium(ps, page);
    total = j.total_results ?? total;
    const data = j.data || [];
    fetched.push(...data);
    if (data.length < ps) break; // exhausted
  }
  console.log(`Explorium total_results (TAM): ${total ?? "n/a"} | fetched: ${fetched.length} (target ${target} x ${oversample} = ${want})`);
  if (fetched.length === 0) { console.error("no businesses returned — check filters"); process.exit(1); }

  let rows = fetched.map(flatten);
  rows.forEach((r) => { r.domain = stripDomain(r.domain || r.website || ""); });

  // dedupe within the pull by domain
  const seen = new Set(); let dupWithin = 0;
  rows = rows.filter((r) => { if (!r.domain) return true; if (seen.has(r.domain)) { dupWithin++; return false; } seen.add(r.domain); return true; });

  // dedupe against an existing batch by domain
  let dupExisting = 0;
  if (dedupeAgainst) {
    const ex = await supa(`select distinct lower(coalesce(domain,'')) d from staging.${dedupeAgainst} where coalesce(domain,'') <> '';`);
    const exDom = new Set((ex || []).map((r) => stripDomain(r.d)));
    rows = rows.filter((r) => { if (r.domain && exDom.has(r.domain)) { dupExisting++; return false; } return true; });
  }

  // column union (faithful) + guaranteed canonical screener columns
  const colSet = new Set();
  for (const r of rows) for (const k of Object.keys(r)) colSet.add(k);
  for (const c of CANONICAL_COLS) colSet.add(c);
  const colNames = [...colSet];
  const ddlCols = colNames.map((c) => `"${c}" text`).join(", ");
  const insCols = colNames.map((c) => `"${c}"`).join(", ");

  await supa(`drop table if exists ${stagingTbl}; create table ${stagingTbl} (id uuid, engine_account_id uuid, account_id uuid, source text, ${ddlCols});`);
  const CHUNK = 20; let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const valuesSql = slice.map((r) => {
      const vals = colNames.map((c) => { const v = r[c]; return (v == null || v === "") ? "null" : esc(v); });
      return `(gen_random_uuid(), '${CONST.engine_account_id}', '${CONST.account_id}', ${esc(SOURCE)}, ${vals.join(", ")})`;
    }).join(",\n");
    await supa(`insert into ${stagingTbl} (id, engine_account_id, account_id, source, ${insCols}) values\n${valuesSql};`);
    inserted += slice.length;
  }

  if (META) {
    const v = (x) => (x == null ? "null" : esc(x));
    await supa(`delete from public.staging_batch_meta where batch_id = ${esc(batchId)} and entity = 'companies';
insert into public.staging_batch_meta (batch_id, entity, segment_name, playbook_name, play_file_path, guidance_file_path, play_dir, created_by)
values (${esc(batchId)}, 'companies', ${v(META.segment_name)}, ${v(META.playbook_name)}, ${v(META.play_file_path)}, ${v(META.guidance_file_path)}, ${v(META.play_dir)}, 'explorium-loader');`);
    console.log("batch meta:", META.segment_name, "|", META.playbook_name ?? "(no playbook)");
  }

  console.log(`columns staged: ${colNames.length} (faithful capture) | dedupe within-pull: ${dupWithin} | dedupe vs ${dedupeAgainst || "none"}: ${dupExisting}`);
  console.log(`rows inserted: ${inserted} into ${stagingTbl} (source=${SOURCE})`);
})();
