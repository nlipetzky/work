#!/usr/bin/env node
/**
 * watch-signals.mjs — the always-on signal watch (front of the flywheel).
 *
 * Queries FREE authoritative sources for FRESH signals in CIPO's segment and lands the surfaced
 * companies in the prospects spine. Idempotent (dedup on source + source_ref), so it can run on a
 * cron / launchd as a standing watch. No deepline, no provider credits ... this is the free front.
 *   - ClinicalTrials.gov v2 (no key): recent INDUSTRY-sponsored device/biotech trials -> sponsor company.
 *   - USPTO PatentsView (needs a free PATENTSVIEW_API_KEY in env): recent filings -> assignee company.
 *
 * Usage: node scripts/watch-signals.mjs [engagement_type] [engagement_id] [--since-days N] [--recipe NAME]
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY (+ optional PATENTSVIEW_API_KEY)
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const SINCE_DAYS = Number(flag("since-days", 30));
const RECIPE = flag("recipe", null);
const sinceDate = new Date(Date.now() - SINCE_DAYS * 864e5).toISOString().slice(0, 10);

async function land(source, source_ref, company_name, signal) {
  if (!company_name || !source_ref) return false;
  const { data, error } = await db.rpc("record_prospect", {
    p_engagement_type: ET, p_engagement_id: EID, p_source: source, p_source_ref: String(source_ref),
    p_company_name: company_name, p_signal: signal, p_recipe_name: RECIPE, p_metadata: {},
  });
  if (error) { console.error(`  land error: ${error.message}`); return false; }
  const row = Array.isArray(data) ? data[0] : data;
  return !!(row && row.id); // true = newly inserted, false = already seen
}

// ---- ClinicalTrials.gov v2 (free) ----
async function watchClinicalTrials() {
  const url = "https://clinicaltrials.gov/api/v2/studies?" + new URLSearchParams({
    "query.cond": "medical device OR biotechnology OR therapeutic OR diagnostic",
    "filter.advanced": `AREA[LeadSponsorClass]INDUSTRY AND AREA[LastUpdatePostDate]RANGE[${sinceDate},MAX]`,
    "sort": "LastUpdatePostDate:desc", "pageSize": "100",
  });
  let fetched = 0, inserted = 0;
  try {
    const j = await (await fetch(url)).json();
    for (const s of j.studies || []) {
      const p = s.protocolSection || {};
      const company = p.sponsorCollaboratorsModule?.leadSponsor?.name || p.identificationModule?.organization?.fullName;
      const nct = p.identificationModule?.nctId;
      const signal = {
        type: "clinical-trial", nctId: nct,
        phase: (p.designModule?.phases || []).join("/") || null,
        status: p.statusModule?.overallStatus || null,
        lastUpdate: p.statusModule?.lastUpdatePostDateStruct?.date || null,
        title: p.identificationModule?.briefTitle || null,
        condition: (p.conditionsModule?.conditions || []).slice(0, 4),
      };
      fetched++;
      if (await land("clinicaltrials", nct, company, signal)) inserted++;
    }
  } catch (e) { console.error(`  clinicaltrials error: ${e.message}`); }
  console.log(`clinicaltrials: ${fetched} fresh industry studies, ${inserted} new companies landed (since ${sinceDate})`);
}

// ---- USPTO Open Data Portal (needs USPTO_API key; api.uspto.gov) ----
async function watchPatents() {
  const key = process.env.USPTO_API || process.env.PATENTSVIEW_API_KEY;
  if (!key) { console.log("uspto: skipped (no USPTO_API in .env)"); return; }
  let fetched = 0, inserted = 0;
  try {
    // CPC A61 = Medical / veterinary science / hygiene (medical-device + biotech). Most recent filings first.
    const q = `applicationMetaData.cpcClassificationBag:A61* AND applicationMetaData.filingDate:[${sinceDate} TO *]`;
    const url = "https://api.uspto.gov/api/v1/patent/applications/search?" +
      `q=${encodeURIComponent(q)}&sort=${encodeURIComponent("applicationMetaData.filingDate desc")}&limit=100`;
    const j = await (await fetch(url, { headers: { "X-API-KEY": key } })).json();
    for (const rec of j.patentFileWrapperDataBag || []) {
      const md = rec.applicationMetaData || {};
      const company = md.firstApplicantName || md.applicantBag?.[0]?.applicantNameText;
      const ref = rec.applicationNumberText;
      if (!company || !ref) continue;
      const signal = { type: "patent", application: ref, filingDate: md.filingDate, title: md.inventionTitle, cpc: md.class || null };
      fetched++;
      if (await land("uspto", ref, company, signal)) inserted++;
    }
  } catch (e) { console.error(`  uspto error: ${e.message}`); }
  console.log(`uspto (patents): ${fetched} fresh A61 filings, ${inserted} new companies landed`);
}

console.log(`\n▸ signal watch for ${ET}/${EID} (window: last ${SINCE_DAYS}d)\n`);
await watchClinicalTrials();
await watchPatents();
const { count } = await db.from("prospects").select("*", { count: "exact", head: true }).eq("engagement_type", ET).eq("engagement_id", EID);
console.log(`\nprospects spine now holds ${count} companies for ${ET}/${EID}.\n`);
