#!/usr/bin/env node
/**
 * enrich-nih.mjs — capture the FULL NIH RePORTER record per company as personalization fuel.
 *
 * The signal-watch only kept the qualifying fields. This pulls everything else RePORTER exposes and
 * stores it associated with the right entity:
 *   - COMPANY (prospect.enrichment.nih): public-health-relevance (phr) + abstract (the patentable-claims
 *     map), award dates (project_end_date = the "why now"), award type/new-vs-renewal, NIH institute,
 *     RCDC spending categories, indexed terms, opportunity number, HQ geo, the funding TRAJECTORY (all
 *     of the org's NIH awards → total $, year span, phase progression), and publication count/PMIDs.
 *   - CONTACTS (prospect.enrichment.contacts): the FULL principal-investigator list (contact PI +
 *     co-PIs), each with profile_id; co-PIs not already present are added (flagged needs_email).
 *
 * One RePORTER projects query per company (by org name) yields both the latest award + the trajectory.
 * Free, no key. Default = PLAN. --execute writes.
 * Usage: node scripts/enrich-nih.mjs [engagement_type] [engagement_id] [--limit N] [--execute]
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
const LIMIT = Number(flag("limit", 300));
const EXECUTE = argv.includes("--execute");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const nk = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");

const FIELDS = ["ApplId", "CoreProjectNum", "FiscalYear", "ActivityCode", "AwardType", "IsNew", "Organization",
  "ProjectTitle", "AwardAmount", "AgencyIcAdmin", "ProjectStartDate", "ProjectEndDate", "BudgetEnd",
  "AwardNoticeDate", "SpendingCategoriesDesc", "Terms", "PrefTerms", "AbstractText", "PhrText",
  "OpportunityNumber", "PrincipalInvestigators", "ContactPiName", "ProjectDetailUrl", "FundingMechanism"];

async function reporterByOrg(orgName) {
  try {
    const r = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteria: { org_names: [orgName] }, include_fields: FIELDS, offset: 0, limit: 50, sort_field: "award_notice_date", sort_order: "desc" }),
    });
    if (!r.ok) return [];
    return (await r.json()).results || [];
  } catch { return []; }
}
async function reporterPubs(coreNums) {
  if (!coreNums.length) return { count: 0, pmids: [] };
  try {
    const r = await fetch("https://api.reporter.nih.gov/v2/publications/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteria: { core_project_nums: coreNums }, offset: 0, limit: 50 }),
    });
    if (!r.ok) return { count: 0, pmids: [] };
    const j = await r.json();
    return { count: j.meta?.total ?? (j.results || []).length, pmids: [...new Set((j.results || []).map((p) => p.pmid).filter(Boolean))].slice(0, 12) };
  } catch { return { count: 0, pmids: [] }; }
}

const { data: prospects } = await db.from("prospects")
  .select("id, company_name, domain, signal, enrichment")
  .eq("engagement_type", ET).eq("engagement_id", EID).eq("source", "nih-reporter")
  .order("created_at", { ascending: false }).limit(LIMIT);
const n = (prospects ?? []).length;
console.log(`\n▸ enrich-nih ${ET}/${EID}: ${n} NIH companies to deep-capture\n`);
if (!EXECUTE) { console.log(`[PLAN ONLY] would run ${n} RePORTER org queries + publication lookups, writing enrichment.nih + PI contacts. Re-run with --execute.\n`); process.exit(0); }

let captured = 0, withPhr = 0, withAbstract = 0, withTraj = 0, coPiAdded = 0, withPubs = 0;
for (const p of prospects ?? []) {
  const all = await reporterByOrg(p.company_name);
  await sleep(220);
  if (!all.length) { console.error(`  no RePORTER match: ${p.company_name}`); continue; }
  const uei = p.signal?.uei;
  let mine = all.filter((x) => (uei && (x.organization?.org_ueis || []).includes(uei)) || norm(x.organization?.org_name) === norm(p.company_name));
  if (!mine.length) mine = all;
  const sbir = mine.filter((x) => /^R4[1234]$/.test(x.activity_code || ""));
  const primary = sbir[0] || mine[0];

  const fyears = mine.map((x) => x.fiscal_year).filter(Boolean);
  const trajectory = {
    total_awards: mine.length,
    total_nih_funding: mine.reduce((s, x) => s + (x.award_amount || 0), 0),
    first_fiscal_year: fyears.length ? Math.min(...fyears) : null,
    latest_fiscal_year: fyears.length ? Math.max(...fyears) : null,
    activity_codes: [...new Set(mine.map((x) => x.activity_code).filter(Boolean))],
    awards: mine.slice(0, 12).map((x) => ({ fy: x.fiscal_year, activity: x.activity_code, amount: x.award_amount, title: x.project_title })),
  };
  const coreNums = [...new Set(mine.map((x) => x.core_project_num).filter(Boolean))];
  const pubs = await reporterPubs(coreNums);
  await sleep(180);

  const pis = (primary.principal_investigators || []).map((pi) => ({
    profile_id: pi.profile_id ?? null, first: pi.first_name ?? null, last: pi.last_name ?? null,
    full_name: pi.full_name ?? null, is_contact_pi: !!pi.is_contact_pi, title: pi.title ?? null,
  }));
  const nih = {
    captured_at: new Date().toISOString(),
    project_title: primary.project_title ?? null,
    phr: primary.phr_text ?? null,
    abstract: primary.abstract_text ?? null,
    fiscal_year: primary.fiscal_year ?? null,
    award_amount: primary.award_amount ?? null,
    award_type: primary.award_type ?? null,
    is_new: primary.is_new ?? null,
    activity_code: primary.activity_code ?? null,
    funding_mechanism: primary.funding_mechanism ?? null,
    institute: { code: primary.agency_ic_admin?.code ?? null, abbr: primary.agency_ic_admin?.abbreviation ?? null, name: primary.agency_ic_admin?.name ?? null },
    opportunity_number: primary.opportunity_number ?? null,
    project_start_date: primary.project_start_date ?? null,
    project_end_date: primary.project_end_date ?? null,
    budget_end: primary.budget_end ?? null,
    award_notice_date: primary.award_notice_date ?? null,
    spending_categories: primary.spending_categories_desc || [],
    terms: String(primary.pref_terms || primary.terms || "").split(";").map((t) => t.trim()).filter(Boolean).slice(0, 40),
    org_city: primary.organization?.org_city ?? null, org_state: primary.organization?.org_state ?? null,
    project_detail_url: primary.project_detail_url ?? null,
    principal_investigators: pis,
    trajectory,
    publications: pubs,
  };

  // merge PI list into contacts: tag existing, add co-PIs not present (email pending)
  const prior = p.enrichment && typeof p.enrichment === "object" ? p.enrichment : {};
  const contacts = Array.isArray(prior.contacts) ? [...prior.contacts] : [];
  for (const pi of pis) {
    if (!pi.first || !pi.last) continue;
    const piKey = nk(pi.first) + nk(pi.last);
    const hit = contacts.find((c) => (nk(c.first) + nk(c.last)) === piKey);
    if (hit) { hit.nih_profile_id = pi.profile_id; if (pi.is_contact_pi && !hit.role) hit.role = "principal_investigator"; }
    else {
      contacts.push({
        first: pi.first, last: pi.last, nih_profile_id: pi.profile_id,
        position: pi.is_contact_pi ? "Principal Investigator (NIH SBIR/STTR award)" : "Co-Investigator (NIH SBIR/STTR award)",
        role: pi.is_contact_pi ? "principal_investigator" : "co_principal_investigator",
        source: "nih-award", tier: 1, seniority: "executive", department: "executive",
        email: null, linkedin: null, needs_email: true,
      });
      coPiAdded++;
    }
  }

  const { error } = await db.from("prospects").update({ enrichment: { ...prior, nih, contacts }, updated_at: new Date().toISOString() }).eq("id", p.id);
  if (error) { console.error(`  update ${p.company_name}: ${error.message}`); continue; }
  captured++; if (nih.phr) withPhr++; if (nih.abstract) withAbstract++; if (trajectory.total_awards > 1) withTraj++; if (pubs.count > 0) withPubs++;
}
console.log(`\n[EXECUTE] deep-captured ${captured}/${n} · ${withPhr} w/ public-health-relevance · ${withAbstract} w/ abstract · ${withTraj} w/ multi-award trajectory · ${withPubs} w/ publications · ${coPiAdded} co-PIs added as contacts\n`);
