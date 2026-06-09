// Reusable ingest loader: CSV -> staging.<entity>_<batch_id>.
// Writes nothing to canonical. The promotion (staging -> working contacts/companies, on-rails)
// is done separately by public.promote_staging_batch(). This loader only stages.
//
// Runs the load through the Supabase Management API (personal access token) so the row data
// never passes through an agent context window.
//
// Usage: node load-csv-to-staging.mjs <csvPath> <batchId>
//
// The ngAbs mapping is config at the top; swap MAPPING/CONST for a different batch.

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";

const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) =>
  (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");

const csvPath = process.argv[2];
const batchId = process.argv[3] || "ngabs_2026_06_05";
const stagingTbl = `staging.contacts_${batchId}`;

// --- batch config (ngAbs) ---
const CONST = {
  engine_account_id: "00000000-0000-0000-0000-000000000001",
  account_id: "00000000-0000-0000-0000-000000000010",
};
// staging column -> source CSV header.
// Columns whose name matches a `contacts` column are promoted by promote_staging_batch; the
// rest (full_name, company_name, company_domain, employment_verification) are review-only,
// kept so the staging surface shows EVERY source field. company_id is resolved from
// company_domain below.
const COLUMNS = {
  email: "Email",
  first_name: "First Name",
  last_name: "Last Name",
  title: "Title",
  linkedin_url: "LinkedIn URL",
  email_verified_status: "Email Verified Status",
  role_segment: "Function", // function_classification has a strict enum; classify later
  city: "City",
  state_region: "State/Region",
  source: "Discovery Sources",
  // review-only (no matching contacts column -> not promoted, shown for evaluation)
  full_name: "Full Name",
  company_name: "Company Name",
  company_domain: "Company Domain",
  employment_verification: "Employment Verification Status",
};
// play/segment this batch is matched to (drives the Staging surface's play link)
const PLAY_DIR = "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies";
const META = {
  entity: "contacts",
  segment_id: "9cf46bf5-0aa5-4247-8800-713bd3e5404e",
  segment_name: "Next-Gen Antibodies",
  playbook_name: "Teknova Q2 Outbound",
  play_file_path: `${PLAY_DIR}/playbook-v1-2026-05-29.md`,
  guidance_file_path: `${PLAY_DIR}/client-guidance.md`,
};

// --- geography normalization (deterministic) ---
const US_STATES = {
  alabama:"AL",alaska:"AK",arizona:"AZ",arkansas:"AR",california:"CA",colorado:"CO",
  connecticut:"CT",delaware:"DE",florida:"FL",georgia:"GA",hawaii:"HI",idaho:"ID",
  illinois:"IL",indiana:"IN",iowa:"IA",kansas:"KS",kentucky:"KY",louisiana:"LA",maine:"ME",
  maryland:"MD",massachusetts:"MA",michigan:"MI",minnesota:"MN",mississippi:"MS",missouri:"MO",
  montana:"MT",nebraska:"NE",nevada:"NV","new hampshire":"NH","new jersey":"NJ","new mexico":"NM",
  "new york":"NY","north carolina":"NC","north dakota":"ND",ohio:"OH",oklahoma:"OK",oregon:"OR",
  pennsylvania:"PA","rhode island":"RI","south carolina":"SC","south dakota":"SD",tennessee:"TN",
  texas:"TX",utah:"UT",vermont:"VT",virginia:"VA",washington:"WA","west virginia":"WV",
  wisconsin:"WI",wyoming:"WY","district of columbia":"DC",
};
const CA_PROV = {
  ontario:"ON",quebec:"QC","british columbia":"BC",alberta:"AB",manitoba:"MB",saskatchewan:"SK",
  "nova scotia":"NS","new brunswick":"NB","newfoundland and labrador":"NL",
  "prince edward island":"PE","northwest territories":"NT",yukon:"YT",nunavut:"NU",
};
const US_CODES = new Set(Object.values(US_STATES));
const CA_CODES = new Set(Object.values(CA_PROV));
const COUNTRY_CANON = {
  "united states":"United States",usa:"United States",us:"United States",
  "united states of america":"United States",canada:"Canada",netherlands:"Netherlands",
  "the netherlands":"Netherlands",china:"China","united kingdom":"United Kingdom",uk:"United Kingdom",
  germany:"Germany",france:"France",switzerland:"Switzerland",ireland:"Ireland",belgium:"Belgium",
  denmark:"Denmark",sweden:"Sweden",spain:"Spain",italy:"Italy",australia:"Australia",
  japan:"Japan",india:"India",
};
const isCountry = (s) => COUNTRY_CANON[String(s).trim().toLowerCase()] !== undefined;
const canonCountry = (s) => COUNTRY_CANON[String(s).trim().toLowerCase()] || s;
// foreign regions / metros that don't carry an explicit country in the source
const REGION_COUNTRY = {
  "basel-stadt": "Switzerland", zurich: "Switzerland", geneva: "Switzerland",
  beijing: "China", shanghai: "China", guangdong: "China",
  utrecht: "Netherlands", "north brabant": "Netherlands", "noord-brabant": "Netherlands",
  "south holland": "Netherlands",
  "greater boston": "United States", "greater boston area": "United States",
};

function normalizeGeo(rawCity, rawState) {
  let city = (rawCity || "").trim();
  let state = (rawState || "").trim();
  let country = null;
  if (city && isCountry(city)) { country = canonCountry(city); city = ""; }
  if (state) {
    const sl = state.toLowerCase();
    if (isCountry(state)) { country = country || canonCountry(state); state = ""; }
    else if (US_STATES[sl]) { state = US_STATES[sl]; country = country || "United States"; }
    else if (CA_PROV[sl]) { state = CA_PROV[sl]; country = country || "Canada"; }
    else {
      const up = state.toUpperCase();
      const lead = (state.match(/^([A-Za-z]{2})\b/) || [])[1]?.toUpperCase();
      if (US_CODES.has(up)) { state = up; country = country || "United States"; }
      else if (CA_CODES.has(up)) { state = up; country = country || "Canada"; }
      else if (lead && US_CODES.has(lead)) { state = lead; country = country || "United States"; }
      // else: international city/region — leave as-is, resolve country below if known
    }
  }
  if (!country) {
    const key = (state || city || "").trim().toLowerCase();
    if (REGION_COUNTRY[key]) country = REGION_COUNTRY[key];
  }
  return { city: city || null, state_region: state || null, country };
}

// --- name normalization (brought from archive DQ enforcement, extended to last_name) ---
// Credential list from supabase migration 20260402100000_data_quality_enforcement.sql
// (fn_dq_enforce_contacts), which only cleaned first_name. Extended here to both names +
// comma-handling (anything after a comma in a name field is a credential/suffix).
const CRED_RE = /\b(PhD|Ph\.?D|MD|M\.D|MBA|RN|BSN|MS|BS|BA|DO|DVM|DDS|DMD|PharmD|DrPH|DABT|MPH|ScD|Esq|CPA|LSSBB|CSSBB|CSCP|PMP|Jr\.?|Sr\.?|II|III|IV)\b\.?/gi;
const HONORIFIC_RE = /^\s*(Dr|Mr|Mrs|Ms|Prof|Professor)\.?\s+/i;

// strip credentials/honorifics/suffixes; may return "" (caller decides what to do with empty)
function cleanNamePart(raw) {
  if (!raw) return "";
  let s = String(raw).trim().replace(HONORIFIC_RE, "");
  const comma = s.indexOf(",");
  if (comma >= 0) s = s.slice(0, comma); // everything after a comma is credentials/suffixes
  s = s.replace(CRED_RE, " ").replace(/\s+/g, " ").replace(/^[\s,]+|[\s,]+$/g, "").trim();
  return s;
}
function titleCase(s) {
  return String(s).split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(" ");
}
// recover a surname from the email local part when the last-name field is missing/all-credential
function lastFromEmail(email, first) {
  if (!email) return null;
  const local = String(email).split("@")[0].toLowerCase();
  const parts = local.split(/[._\-]+/).filter(Boolean);
  if (parts.length < 2) return null;
  const fn = (first || "").toLowerCase();
  let surname = fn && (parts[0] === fn || parts[0] === fn[0]) ? parts.slice(1).join(" ") : parts[parts.length - 1];
  if (!surname || surname.length < 2) return null;
  CRED_RE.lastIndex = 0;
  if (CRED_RE.test(surname)) { CRED_RE.lastIndex = 0; return null; }
  return titleCase(surname);
}

// --- minimal RFC4180-ish CSV parser ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
const hdr = rows[0];
const col = (name) => hdr.indexOf(name);
const data = rows.slice(1);

const allCols = Object.keys(COLUMNS);
const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;
const cell = (r, header) => {
  const i = col(header);
  const v = i >= 0 ? (r[i] ?? "").trim() : "";
  return v === "" ? null : v;
};

const stagingCols = [...allCols, "country"]; // country is derived by normalizeGeo
const NA = new Set(["United States", "Canada", "Mexico"]);
const removed = [];
const rowSql = [];
for (const r of data) {
  const geo = normalizeGeo(cell(r, "City"), cell(r, "State/Region"));
  const email = cell(r, "Email");
  const first = cleanNamePart(cell(r, "First Name")) || cell(r, "First Name") || null;
  let last = cleanNamePart(cell(r, "Last Name")) || null;
  if (!last) last = lastFromEmail(email, first); // all-credential/empty -> recover from email or null

  // North America only: drop contacts whose resolved country is outside US/Canada/Mexico.
  // Unknown/null country is KEPT — we don't drop on absence of a signal.
  if (geo.country && !NA.has(geo.country)) {
    removed.push(`${[first, last].filter(Boolean).join(" ")} — ${cell(r, "Company Name") || "?"} [${geo.country}]`);
    continue;
  }

  const full = [first, last].filter(Boolean).join(" ") || null;
  const computed = { first_name: first, last_name: last, full_name: full, city: geo.city, state_region: geo.state_region };
  const vals = allCols.map((c) => {
    let v;
    if (c in computed) v = computed[c];
    else { v = cell(r, COLUMNS[c]); if (c === "company_domain" && v) v = v.toLowerCase(); }
    return v == null || v === "" ? "null" : esc(v);
  });
  vals.push(geo.country == null ? "null" : esc(geo.country));
  rowSql.push(`(gen_random_uuid(), '${CONST.engine_account_id}', '${CONST.account_id}', ${vals.join(", ")})`);
}
const valuesSql = rowSql.join(",\n");

const sql = `
drop table if exists ${stagingTbl};
create table ${stagingTbl} (
  id uuid, engine_account_id uuid, account_id uuid, company_id uuid,
  ${stagingCols.map((c) => c + " text").join(", ")}
);
insert into ${stagingTbl} (id, engine_account_id, account_id, ${stagingCols.join(", ")})
values
${valuesSql};
update ${stagingTbl} s set company_id = c.id
  from public.companies c where lower(c.domain) = s.company_domain;
insert into public.staging_batch_meta
  (batch_id, entity, segment_id, segment_name, playbook_name, play_file_path, guidance_file_path, created_by)
values ('${batchId}', '${META.entity}', '${META.segment_id}', '${META.segment_name.replace(/'/g, "''")}',
        '${META.playbook_name.replace(/'/g, "''")}', '${META.play_file_path}', '${META.guidance_file_path}', 'revops-loader')
on conflict (batch_id) do update set
  segment_name = excluded.segment_name, playbook_name = excluded.playbook_name,
  play_file_path = excluded.play_file_path, guidance_file_path = excluded.guidance_file_path,
  segment_id = excluded.segment_id;
select
  (select count(*) from ${stagingTbl}) as staged,
  (select count(*) from ${stagingTbl} where company_id is not null) as company_linked,
  (select count(distinct company_id) from ${stagingTbl} where company_id is not null) as distinct_companies,
  (select count(*) from ${stagingTbl} where email is null) as no_email,
  (select count(*) from ${stagingTbl} where email_verified_status = 'catchall') as catchall;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
console.log("parsed rows:", data.length);
console.log("removed (non-North-America):", removed.length);
removed.forEach((x) => console.log("  drop:", x));
console.log("staged rows:", rowSql.length);
console.log("http status:", res.status);
console.log("result:", await res.text());
