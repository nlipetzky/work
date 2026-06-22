// Migrate the system registry from Airtable (apppQjlZiktpbO4aX) into canon_engine
// (Postgres) as the canonical, agent-readable map. Systems + Assets only.
// - Systems: upsert by system_slug (preserves Postgres-only parked systems;
//   merge updates the 8 overlaps; inserts the ~20 Airtable-only).
// - Assets: replace (delete stale 46, import the canonical 104), keyed by airtable_id.
// Constellation link -> tag. Depends-on link -> array of slugs. No reference catalogs.
//
// Run: node /Users/nplmini/code/work/practices/agentic-systems/migrate-registry-to-canon.mjs
// Prints a summary only.

import { readFileSync } from "node:fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const AIRTABLE_BASE = "apppQjlZiktpbO4aX";
const T_SYSTEMS = "tbldwCzbavBcOlP2C";
const T_ASSETS = "tblu5JBzOxbEHLQmP";
const T_CONSTELLATIONS = "tblCCPj7Sm9md86y3";

function loadEnv() {
  const txt = readFileSync(ENV_PATH, "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const env = loadEnv();
const AT_KEY = env.AIRTABLE_API_KEY;
const CANON_URL = (env.CANON_SUPABASE_URL || "").replace(/\/$/, "");
const CANON_KEY = env.CANON_SUPABASE_SERVICE_KEY;
if (!AT_KEY || !CANON_URL || !CANON_KEY) {
  console.error("Missing env: AIRTABLE_API_KEY / CANON_SUPABASE_URL / CANON_SUPABASE_SERVICE_KEY");
  process.exit(1);
}

async function atFetchAll(table) {
  const rows = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AT_KEY}` } });
    if (!res.ok) throw new Error(`Airtable ${table}: ${res.status} ${await res.text()}`);
    const json = await res.json();
    rows.push(...json.records);
    offset = json.offset;
  } while (offset);
  return rows;
}

async function canon(method, path, body, prefer) {
  const res = await fetch(`${CANON_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: CANON_KEY,
      Authorization: `Bearer ${CANON_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`canon ${method} ${path}: ${res.status} ${await res.text()}`);
  return res;
}

const STATUS = new Set(["emerging", "building", "operating", "paused", "archived"]);
const MATURITY = new Set(["emerging", "forming", "stable"]);
const warnings = [];

function normStatus(v) {
  const s = (v || "").toLowerCase().trim();
  if (STATUS.has(s)) return s;
  warnings.push(`status "${v}" -> emerging`);
  return "emerging";
}
function normType(v) {
  const s = (v || "").toLowerCase().replace(/[\/ ]/g, "_").trim();
  if (s === "platform") return "platform";
  if (s.startsWith("client")) return "client_engagement";
  warnings.push(`system_type "${v}" -> platform`);
  return "platform";
}
function normMaturity(v) {
  const s = (v || "").toLowerCase().trim();
  if (MATURITY.has(s)) return s;
  return "emerging";
}
const LIFECYCLE = new Set(["built", "verified", "deployed", "running", "deferred", "archived"]);
function normLifecycle(v) {
  const s = (v || "").toLowerCase().trim();
  if (LIFECYCLE.has(s)) return s;
  if (!v) return "built";
  warnings.push(`lifecycle "${v}" -> built`);
  return "built";
}
const f = (r, k) => (r.fields[k] === undefined ? null : r.fields[k]);

async function main() {
  // 1. constellation recId -> name
  const constellations = await atFetchAll(T_CONSTELLATIONS);
  const conName = {};
  for (const c of constellations) conName[c.id] = f(c, "Name");

  // 2. systems
  const atSystems = await atFetchAll(T_SYSTEMS);
  const recToSlug = {};
  for (const s of atSystems) recToSlug[s.id] = f(s, "System ID");

  const systemRows = atSystems.map((s) => {
    const consLinks = f(s, "Constellations") || [];
    return {
      system_slug: f(s, "System ID"),
      name: f(s, "Name"),
      status: normStatus(f(s, "Status")),
      system_type: normType(f(s, "System Type")),
      definition_maturity: normMaturity(f(s, "Definition Maturity")),
      purpose: f(s, "Purpose"),
      owner: f(s, "Owner"),
      client: f(s, "Client"),
      inputs: f(s, "Inputs"),
      outputs: f(s, "Outputs"),
      key_metrics: f(s, "Key Metrics"),
      process_state_location: f(s, "Process State Location"),
      canonical_docs: f(s, "Canonical Docs"),
      ai_context_location: f(s, "_ai_context_location"),
      class: f(s, "Class"),
      coverage: f(s, "Coverage"),
      constellation: consLinks.length ? conName[consLinks[0]] : null,
      startup_instructions: f(s, "Startup Instructions"),
      airtable_id: s.id,
    };
  }).filter((r) => r.system_slug);

  await canon("POST", "systems?on_conflict=system_slug", systemRows, "resolution=merge-duplicates,return=minimal");

  // 3. canon systems airtable_id -> uuid (for asset->system link)
  const canonSystems = await (await canon("GET", "systems?select=id,system_slug,airtable_id", null)).json();
  const recToUuid = {};
  for (const cs of canonSystems) if (cs.airtable_id) recToUuid[cs.airtable_id] = cs.id;

  // 4. assets — replace stale set with canonical Airtable set
  const atAssets = await atFetchAll(T_ASSETS);
  const assetRows = atAssets
    .filter((a) => !f(a, "Exclude"))
    .map((a) => {
      const sysLink = f(a, "System") || [];
      return {
        system_id: sysLink.length ? recToUuid[sysLink[0]] || null : null,
        name: f(a, "Name"),
        asset_type: f(a, "Asset Type"),
        lifecycle_state: normLifecycle(f(a, "Lifecycle State")),
        external_id: f(a, "External ID"),
        source_path: f(a, "Source / Build File Path"),
        deployed_version: f(a, "Deployed Version"),
        last_verified: f(a, "Last Verified"),
        write_owner: f(a, "Write Owner"),
        reconciled_against_reality: !!f(a, "Reconciled Against Reality"),
        description: f(a, "Description"),
        notes: f(a, "Notes"),
        url: f(a, "JSON URL"),
        airtable_id: a.id,
      };
    })
    .filter((r) => r.name);

  await canon("DELETE", "assets?id=not.is.null", null, "return=minimal");
  // chunk inserts to stay under payload limits
  for (let i = 0; i < assetRows.length; i += 50) {
    await canon("POST", "assets", assetRows.slice(i, i + 50), "return=minimal");
  }

  // 5. summary
  const finalSystems = await (await canon("GET", "systems?select=system_slug,status,constellation,class,coverage&order=system_slug", null)).json();
  const finalAssets = await (await canon("GET", "assets?select=id", null)).json();
  console.log(JSON.stringify({
    airtable_systems: atSystems.length,
    canon_systems_total: finalSystems.length,
    assets_imported: assetRows.length,
    canon_assets_total: finalAssets.length,
    unlinked_assets: assetRows.filter((a) => !a.system_id).length,
    constellations_seen: constellations.length,
    warnings,
    systems_list: finalSystems.map((s) => `${s.system_slug} [${s.status}/${s.coverage ?? "?"}/${s.constellation ?? "-"}]`),
  }, null, 2));
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
