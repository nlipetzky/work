// explorium-patent-companies-pull.mjs
// Fetches ~30 US patent-owning companies from Explorium (firmographics enrichment)
// and writes a CSV for the konstellation-ai patent-portfolio-mgmt play.
//
// Usage: node explorium-patent-companies-pull.mjs
// Output: accounts/ventures/konstellation-ai/plays/patent-portfolio-mgmt/output/cipo-companies-explorium.csv

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const OUTPUT_PATH = "/Users/nplmini/code/work/accounts/ventures/konstellation-ai/plays/patent-portfolio-mgmt/output/cipo-companies-explorium.csv";
const BASE = "https://api.explorium.ai";
const TARGET_ROWS = 25;

const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const API_KEY = envGet("EXPLORIUM_API_KEY");
if (!API_KEY) { console.error("EXPLORIUM_API_KEY not found in .env"); process.exit(1); }

// --- helpers ---

function csvField(v) {
  if (v == null) return "";
  const s = String(v).replace(/\r?\n|\r/g, " ").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function stripDomain(raw) {
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .trim();
}

// --- API calls ---

async function fetchBusinesses(pageSize) {
  const body = {
    filters: {
      country_code: { values: ["us"] },
      company_size: { values: ["51-200", "201-500", "501-1000"] },
      website_keywords: { values: ["medical device", "biotechnology", "semiconductor", "robotics"] },
    },
    mode: "full",
    page_size: pageSize,
    page: 1,
  };
  const res = await fetch(`${BASE}/v1/businesses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api_key": API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fetch /v1/businesses: ${res.status} ${res.statusText}\n${txt.slice(0, 500)}`);
  }
  return res.json();
}

async function bulkEnrich(businessIds) {
  const res = await fetch(`${BASE}/v1/businesses/firmographics/bulk_enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api_key": API_KEY },
    body: JSON.stringify({ business_ids: businessIds }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`bulk_enrich: ${res.status} ${res.statusText}\n${txt.slice(0, 500)}`);
  }
  return res.json();
}

// --- main ---

(async () => {
  // Fetch slightly more than target to cover rows with no domain
  const fetchSize = Math.min(50, TARGET_ROWS + 10);
  console.log(`Fetching ${fetchSize} businesses...`);
  const fetchResult = await fetchBusinesses(fetchSize);
  const businesses = fetchResult.data || [];
  console.log(`Received ${businesses.length} businesses (total_results: ${fetchResult.total_results ?? "n/a"})`);

  if (businesses.length === 0) {
    console.error("No businesses returned. Response:", JSON.stringify(fetchResult).slice(0, 500));
    process.exit(1);
  }

  // Enrich in batches of 50 (API limit)
  const ids = businesses.map(b => b.business_id);
  console.log(`Enriching ${ids.length} IDs in one batch...`);
  const enrichResult = await bulkEnrich(ids);
  const enrichedItems = enrichResult.data || [];

  // Build a lookup map: business_id -> enriched data
  const enrichMap = {};
  for (const item of enrichedItems) {
    enrichMap[item.business_id] = item.data || item;
  }

  // Merge fetch result (has name/domain) with enriched data
  const rows = [];
  for (const biz of businesses) {
    const enriched = enrichMap[biz.business_id] || {};
    const name = enriched.name || biz.name || "";
    const rawDomain = enriched.website || biz.domain || "";
    const domain = stripDomain(rawDomain);
    if (!domain) continue; // skip rows with no domain

    const industry = enriched.linkedin_industry_category || enriched.naics_description || enriched.sic_code_description || "";
    const desc = enriched.business_description || "";
    const keywords = industry;

    rows.push({ name, domain, industry, desc: desc.slice(0, 500), keywords });
    if (rows.length >= TARGET_ROWS) break;
  }

  console.log(`Rows with domain: ${rows.length}`);

  // Write CSV
  const header = "Company Name,Domain,Industry,company_description,keywords";
  const lines = [header];
  let emptyDescCount = 0;
  for (const r of rows) {
    if (!r.desc) emptyDescCount++;
    lines.push([
      csvField(r.name),
      csvField(r.domain),
      csvField(r.industry),
      csvField(r.desc),
      csvField(r.keywords),
    ].join(","));
  }
  fs.writeFileSync(OUTPUT_PATH, lines.join("\n") + "\n", "utf8");

  console.log(`\nCSV written to: ${OUTPUT_PATH}`);
  console.log(`Row count: ${rows.length}`);
  console.log(`Empty descriptions: ${emptyDescCount}`);
  console.log("\n--- 3 sample rows ---");
  for (const r of rows.slice(0, 3)) {
    console.log(`${r.name} | ${r.domain} | ${r.desc.slice(0, 120)}`);
  }
})();
