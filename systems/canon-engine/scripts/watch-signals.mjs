#!/usr/bin/env node
/**
 * watch-signals.mjs — the always-on signal watch (front of the flywheel).
 *
 * Queries FREE authoritative sources for FRESH signals in CIPO's segment and lands the surfaced
 * companies in the prospects spine. Idempotent (dedup on source + source_ref), so it can run on a
 * cron / launchd as a standing watch. No deepline, no provider credits ... this is the free front.
 *   - NIH RePORTER (no key): recent SBIR/STTR awardees (R41/R42/R43/R44) -> small biotech/medtech businesses. PRIMARY.
 *   - USPTO Open Data Portal (needs USPTO_API key): recent A61 filings, SMALL/MICRO-entity only -> small filers.
 *   - ClinicalTrials.gov v2 (no key): industry trial sponsors. OFF by default (--include-trials); sponsor field skews big-pharma.
 *
 * Usage: node scripts/watch-signals.mjs [engagement_type] [engagement_id] [--since-days N] [--recipe NAME]
 * Env: REVOPS_SUPABASE_URL, REVOPS_SUPABASE_SERVICE_KEY (+ optional PATENTSVIEW_API_KEY)
 *
 * Writes to revops-engine.public.prospects (the collapsed signal-landing table).
 * The earlier canon-engine.public.prospects table is deprecated — the canon→revops
 * bridge it forced was unbuilt for months, so we collapsed it.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.REVOPS_SUPABASE_URL, process.env.REVOPS_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const SINCE_DAYS = Number(flag("since-days", 30));
const RECIPE = flag("recipe", null);
const INCLUDE_TRIALS = argv.includes("--include-trials"); // CT.gov sponsor field skews big-pharma; opt-in only
const sinceDate = new Date(Date.now() - SINCE_DAYS * 864e5).toISOString().slice(0, 10);
const todayDate = new Date().toISOString().slice(0, 10);

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
      // keep only small/micro-entity filers — big pharma files as "Undiscounted" (the same big-company bias we're avoiding)
      const ent = md.entityStatusData || {};
      const isSmall = ent.smallEntityStatusIndicator === true || /small|micro/i.test(ent.businessEntityStatusCategory || "");
      if (!isSmall) continue;
      // USPTO small-entity status also covers universities / hospitals / nonprofits — NOT the ICP (they have tech-transfer offices, not a CIPO need)
      if (/\b(univers|institut|college|foundation|hospital|regents|trustees|board of|medical center|health system|research council)\b/i.test(company) || /r&db/i.test(company)) continue;
      const signal = { type: "patent", application: ref, filingDate: md.filingDate, title: md.inventionTitle, cpc: md.class || null, entity: ent.businessEntityStatusCategory || null };
      fetched++;
      if (await land("uspto", ref, company, signal)) inserted++;
    }
  } catch (e) { console.error(`  uspto error: ${e.message}`); }
  console.log(`uspto (patents): ${fetched} fresh small/micro-entity A61 filings, ${inserted} new companies landed`);
}

// ---- NIH RePORTER: SBIR/STTR awardees (free, reliable) — small biotech/medtech businesses, the CIPO ICP bullseye ----
async function watchNihSbir() {
  const ACT = ["R43", "R44", "R41", "R42"]; // SBIR Phase I/II, STTR Phase I/II — all small-business-only mechanisms
  const phaseOf = (a) => (a === "R43" || a === "R41") ? "I" : "II";
  const progOf = (a) => (a === "R43" || a === "R44") ? "SBIR" : "STTR";
  const PAGE = 100, MAX = 300; // cap companies landed per run
  let fetched = 0, inserted = 0, offset = 0;
  try {
    while (offset < MAX) {
      const body = {
        criteria: { activity_codes: ACT, award_notice_date: { from_date: sinceDate, to_date: todayDate } },
        include_fields: ["ApplId", "CoreProjectNum", "FiscalYear", "ActivityCode", "Organization", "ProjectTitle", "AwardAmount", "AgencyIcAdmin", "ContactPiName", "AwardNoticeDate"],
        offset, limit: PAGE, sort_field: "award_notice_date", sort_order: "desc",
      };
      const r = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) { console.error(`  nih-reporter http ${r.status}: ${(await r.text()).slice(0, 160)}`); break; }
      const j = await r.json();
      const results = j.results || [];
      if (!results.length) break;
      for (const rec of results) {
        const org = rec.organization || {};
        const company = org.org_name;
        const uei = org.org_ueis?.[0] || org.primary_uei || org.org_duns?.[0] || rec.appl_id;
        if (!company || !uei) continue;
        const act = rec.activity_code;
        const signal = {
          type: "sbir-award", program: progOf(act), phase: phaseOf(act), activityCode: act,
          agency: "NIH", ic: rec.agency_ic_admin?.abbreviation || null,
          fiscalYear: rec.fiscal_year, awardAmount: rec.award_amount, awardNoticeDate: rec.award_notice_date || null,
          projectTitle: rec.project_title || null, pi: rec.contact_pi_name?.trim() || null,
          orgCity: org.org_city || null, orgState: org.org_state || null, uei: org.org_ueis?.[0] || org.primary_uei || null,
        };
        fetched++;
        if (await land("nih-reporter", uei, company, signal)) inserted++;
      }
      if (results.length < PAGE) break;
      offset += PAGE;
    }
  } catch (e) { console.error(`  nih-reporter error: ${e.message}`); }
  console.log(`nih-reporter (SBIR/STTR): ${fetched} fresh awards, ${inserted} new companies landed (since ${sinceDate})`);
}

console.log(`\n▸ signal watch for ${ET}/${EID} (window: last ${SINCE_DAYS}d)\n`);
await watchNihSbir();   // PRIMARY: SBIR/STTR awardees — small biotech/medtech businesses
await watchPatents();   // SECONDARY: small/micro-entity USPTO A61 filings
if (INCLUDE_TRIALS) await watchClinicalTrials();
else console.log("clinicaltrials: skipped (lead-sponsor field skews big-pharma; pass --include-trials to re-enable)");
const { count } = await db.from("prospects").select("*", { count: "exact", head: true }).eq("engagement_type", ET).eq("engagement_id", EID);
console.log(`\nprospects spine now holds ${count} companies for ${ET}/${EID}.\n`);
