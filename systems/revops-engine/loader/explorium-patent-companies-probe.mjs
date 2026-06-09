// explorium-patent-companies-probe.mjs
// Validates Explorium auth + response shape with a tiny 3-result fetch.
// Usage: node explorium-patent-companies-probe.mjs

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const API_KEY = envGet("EXPLORIUM_API_KEY");
if (!API_KEY) { console.error("EXPLORIUM_API_KEY not found in .env"); process.exit(1); }

const BASE = "https://api.explorium.ai";

async function fetchBusinesses(pageSize = 3) {
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
    console.error(`fetch /v1/businesses failed: ${res.status} ${res.statusText}`);
    console.error(txt.slice(0, 500));
    process.exit(1);
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
    console.error(`bulk_enrich failed: ${res.status} ${res.statusText}`);
    console.error(txt.slice(0, 500));
    process.exit(1);
  }
  return res.json();
}

(async () => {
  console.log("=== PROBE: fetching 3 businesses ===");
  const fetchResult = await fetchBusinesses(3);
  const businesses = fetchResult.data || fetchResult.businesses || fetchResult.results || [];
  console.log(`total_results: ${fetchResult.total_results ?? fetchResult.total ?? "n/a"}`);
  console.log(`businesses returned: ${businesses.length}`);
  if (businesses.length === 0) {
    console.log("raw response keys:", Object.keys(fetchResult));
    console.log(JSON.stringify(fetchResult, null, 2).slice(0, 1000));
    process.exit(1);
  }

  const ids = businesses.map(b => b.business_id);
  console.log("business_ids:", ids);

  console.log("\n=== PROBE: enriching with firmographics ===");
  const enrichResult = await bulkEnrich(ids);
  const enriched = enrichResult.data || enrichResult.businesses || enrichResult.results || enrichResult;
  console.log("enrich response keys:", Object.keys(enrichResult));
  const sample = Array.isArray(enriched) ? enriched[0] : enriched;
  console.log("sample enriched keys:", sample ? Object.keys(sample) : "none");
  console.log("SAMPLE:", JSON.stringify(sample, null, 2).slice(0, 800));
})();
