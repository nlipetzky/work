// Clay ngAbs contacts loader: CSV -> staging.contacts_<batch_id>.
// Variant of load-csv-to-staging.mjs for the Clay-built "ngAbs Contacts" base, whose headers
// differ from the Apollo/RevOps export (Work Email, Job Title, LinkedIn Profile, and a single
// combined `Location` field instead of split City/State). Same geo/name normalization, same
// North-America-only filter, same on-rails staging (no canonical writes). Source stamped at load.
//
// Usage: node load-clay-ngabs-contacts.mjs <csvPath> <batchId>

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";

const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) =>
  (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");

const csvPath = process.argv[2];
const batchId = process.argv[3] || "clay_ngabs";
const stagingTbl = `staging.contacts_${batchId}`;

// --- batch config (Clay ngAbs) ---
const CONST = {
  engine_account_id: "00000000-0000-0000-0000-000000000001",
  account_id: "00000000-0000-0000-0000-000000000010",
};
// staging column -> source CSV header (Clay ngAbs Contacts shared-view export).
// Columns whose name matches a `contacts` column are promoted by promote_staging_batch; the rest
// (full_name, company_name, company_domain, employment_verification, committee_scope) are
// review-only. city/state_region/source are overridden by computed values below. company_id is
// resolved from company_domain after insert.
const COLUMNS = {
  email: "Work Email",
  first_name: "First Name",
  last_name: "Last Name",
  title: "Job Title",
  linkedin_url: "LinkedIn Profile",
  email_verified_status: "Validate Email",
  city: "Location",          // computed (split from Location)
  state_region: "Location",  // computed (split from Location)
  source: "Location",        // computed (constant = batchId)
  // review-only (no matching contacts column -> not promoted, shown for evaluation)
  full_name: "Full Name",
  company_name: "Company Table Data",
  company_domain: "Company Domain",
  employment_verification: "Employment Verification State",
  committee_scope: "Committee Scope",
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
    }
  }
  if (!country) {
    const key = (state || city || "").trim().toLowerCase();
    if (REGION_COUNTRY[key]) country = REGION_COUNTRY[key];
  }
  return { city: city || null, state_region: state || null, country };
}

// Clay `Location` is one combined field ("City, ST", "City, ST, Country", "City, Country").
// Split into (city, state) and hand to normalizeGeo, which infers/validates country.
function splitLocation(loc) {
  const parts = String(loc || "").split(",").map((s) => s.trim()).filter(Boolean);
  return { city: parts[0] || null, state: parts[1] || null };
}

// --- name normalization ---
const CRED_RE = /\b(PhD|Ph\.?D|MD|M\.D|MBA|RN|BSN|MS|BS|BA|DO|DVM|DDS|DMD|PharmD|DrPH|DABT|MPH|ScD|Esq|CPA|LSSBB|CSSBB|CSCP|PMP|Jr\.?|Sr\.?|II|III|IV)\b\.?/gi;
const HONORIFIC_RE = /^\s*(Dr|Mr|Mrs|Ms|Prof|Professor)\.?\s+/i;

function cleanNamePart(raw) {
  if (!raw) return "";
  let s = String(raw).trim().replace(HONORIFIC_RE, "");
  const comma = s.indexOf(",");
  if (comma >= 0) s = s.slice(0, comma);
  s = s.replace(CRED_RE, " ").replace(/\s+/g, " ").replace(/^[\s,]+|[\s,]+$/g, "").trim();
  return s;
}
function titleCase(s) {
  return String(s).split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(" ");
}
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
const hdr = rows[0].map((h) => h.replace(/^﻿/, "")); // strip BOM on first header
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
  const loc = splitLocation(cell(r, "Location"));
  const geo = normalizeGeo(loc.city, loc.state);
  const email = cell(r, "Work Email");
  const first = cleanNamePart(cell(r, "First Name")) || cell(r, "First Name") || null;
  let last = cleanNamePart(cell(r, "Last Name")) || null;
  if (!last) last = lastFromEmail(email, first);

  // North America only: drop contacts whose resolved country is outside US/Canada/Mexico.
  // Unknown/null country is KEPT.
  if (geo.country && !NA.has(geo.country)) {
    removed.push(`${[first, last].filter(Boolean).join(" ")} — ${cell(r, "Company Table Data") || "?"} [${geo.country}]`);
    continue;
  }

  const full = [first, last].filter(Boolean).join(" ") || null;
  const computed = {
    first_name: first, last_name: last, full_name: full,
    city: geo.city, state_region: geo.state_region, source: batchId,
  };
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
  (select count(*) from ${stagingTbl} where email is null) as no_email;
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
