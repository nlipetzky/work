// load-apollo-to-staging.mjs
// Source loader (Load node, signal-prospecting): Apollo org search + bulk-enrich -> staging.companies_<batchId>.
// FULL FAITHFUL CAPTURE: one text column per enriched field; nested fields JSON-stringified.
//
// Apollo's org SEARCH is firmographic-only (no description), so this loader searches to collect
// domains, then BULK-ENRICHES (description + headcount + ~48 fields), then stages. Mirrors
// load-explorium-to-staging.mjs conventions: requires the play folder (writes staging_batch_meta +
// play_dir), stamps --source (default "apollo") on every row, guarantees the canonical screener
// columns exist, dedupes by domain.
//
// Usage:
//   node load-apollo-to-staging.mjs <batchId> <playDir> \
//     --keywords "mRNA,messenger RNA,..." --countries us,ca [--naics 541714,325412] \
//     [--target 100] [--oversample 1.4] [--source apollo] [--dedupe-against companies_<batch>]

import fs from "fs";
import path from "path";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const APOLLO_BASE = "https://api.apollo.io/api/v1";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");
const APOLLO_KEY = envGet("APOLLO_API_KEY");
if (!TOKEN) { console.error("missing SupaBase_CLI_access_token in .env"); process.exit(1); }
if (!APOLLO_KEY) { console.error("missing APOLLO_API_KEY in .env"); process.exit(1); }

const args = process.argv.slice(2);
const flag = (name, def = null) => { const i = args.indexOf(name); return i === -1 ? def : (args[i + 1] ?? ""); };
const positional = args.filter((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--")));
const batchId = positional[0];
const playDir = positional[1] ?? null;
const noPlayReason = flag("--no-play");
const SOURCE = flag("--source", "apollo");
const target = parseInt(flag("--target", "100"), 10);
const oversample = parseFloat(flag("--oversample", "1.4"));
const COUNTRY = { us: "United States", ca: "Canada", mx: "Mexico" };
const locations = flag("--countries", "us,ca").split(",").map((s) => COUNTRY[s.trim().toLowerCase()] || s.trim()).filter(Boolean);
const keywords = flag("--keywords", "").split(",").map((s) => s.trim()).filter(Boolean);
const naics = flag("--naics", "").split(",").map((s) => s.trim()).filter(Boolean);
const dedupeAgainst = flag("--dedupe-against");

if (!batchId) { console.error("usage: load-apollo-to-staging.mjs <batchId> <playDir> --keywords ... --countries us,ca [--naics ...] [--target N]"); process.exit(1); }
if (!playDir && noPlayReason === null) { console.error('REFUSED: no play. Pass the play folder as the 2nd arg, or --no-play "<reason>".'); process.exit(1); }
if (keywords.length === 0 && naics.length === 0) { console.error("REFUSED: no filter. Pass --keywords and/or --naics."); process.exit(1); }

const stagingTbl = `staging.companies_${batchId}`;
const CONST = { engine_account_id: "00000000-0000-0000-0000-000000000001", account_id: "00000000-0000-0000-0000-000000000010" };
const RENAME = { short_description: "description", estimated_num_employees: "employee_count", naics_codes: "naics_code" };
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
const AH = { "Content-Type": "application/json", "Cache-Control": "no-cache", "X-Api-Key": APOLLO_KEY };
async function apolloSearch(page, perPage) {
  const body = { page, per_page: perPage };
  if (keywords.length) body.q_organization_keyword_tags = keywords;
  if (locations.length) body.organization_locations = locations;
  if (naics.length) body.organization_naics_codes = naics;
  const res = await fetch(`${APOLLO_BASE}/mixed_companies/search`, { method: "POST", headers: AH, body: JSON.stringify(body) });
  if (!res.ok) { const t = await res.text(); console.error(`Apollo search ${res.status}: ${t.slice(0, 300)}`); process.exit(1); }
  return res.json();
}
async function apolloEnrich(domains) {
  const res = await fetch(`${APOLLO_BASE}/organizations/bulk_enrich`, { method: "POST", headers: AH, body: JSON.stringify({ domains }) });
  if (!res.ok) { const t = await res.text(); console.error(`Apollo bulk_enrich ${res.status}: ${t.slice(0, 300)}`); process.exit(1); }
  return res.json();
}
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

(async () => {
  const want = Math.ceil(target * oversample);

  // 1) search-paginate to collect domains (search is firmographic-only; 1 credit/page)
  const domains = []; const seen = new Set(); let total = null;
  for (let page = 1; domains.length < want && page <= 6; page++) {
    const j = await apolloSearch(page, 100);
    total = j.pagination?.total_entries ?? total;
    const orgs = j.organizations || j.accounts || [];
    for (const o of orgs) {
      const d = o.primary_domain || stripDomain(o.website_url || "");
      if (d && !seen.has(d)) { seen.add(d); domains.push(d); }
    }
    if (orgs.length < 100) break;
  }
  console.log(`Apollo search total_entries (TAM): ${total ?? "n/a"} | unique domains collected: ${domains.length}`);

  // 2) dedupe against an existing batch by domain
  let dupExisting = 0, dlist = domains;
  if (dedupeAgainst) {
    const ex = await supa(`select distinct lower(coalesce(domain,'')) d from staging.${dedupeAgainst} where coalesce(domain,'') <> '';`);
    const exDom = new Set((ex || []).map((r) => stripDomain(r.d)));
    dlist = domains.filter((d) => { if (exDom.has(d)) { dupExisting++; return false; } return true; });
  }
  dlist = dlist.slice(0, want);
  if (dlist.length === 0) { console.error("no new domains to enrich"); process.exit(1); }

  // 3) bulk-enrich in batches of 10 (1 credit per match)
  let rows = [];
  for (let i = 0; i < dlist.length; i += 10) {
    const batch = dlist.slice(i, i + 10);
    const j = await apolloEnrich(batch);
    for (const o of (j.organizations || [])) rows.push(flatten(o));
  }
  rows.forEach((r) => { r.domain = stripDomain(r.domain || r.primary_domain || r.website_url || ""); });
  console.log(`enriched: ${rows.length} (of ${dlist.length} domains requested)`);

  // 4) column union (faithful) + guaranteed canonical screener columns
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
values (${esc(batchId)}, 'companies', ${v(META.segment_name)}, ${v(META.playbook_name)}, ${v(META.play_file_path)}, ${v(META.guidance_file_path)}, ${v(META.play_dir)}, 'apollo-loader');`);
    console.log("batch meta:", META.segment_name, "|", META.playbook_name ?? "(no playbook)");
  }

  console.log(`columns staged: ${colNames.length} (faithful capture) | dedupe vs ${dedupeAgainst || "none"}: ${dupExisting}`);
  console.log(`rows inserted: ${inserted} into ${stagingTbl} (source=${SOURCE})`);
})();
