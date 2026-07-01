#!/usr/bin/env node
/**
 * find-contacts.mjs — slice 2 (discovery): find ICP-persona contacts at each resolved prospect.
 *
 * Two identity sources, both labeled per contact via `source`:
 *   - hunter-domain-search: Hunter domain-search returns names + positions + emails + confidence +
 *     LinkedIn in one call (abundant on Nick's Hunter balance). Filtered to the icp-titles personas.
 *   - nih-award: the named Principal Investigator on each NIH SBIR/STTR award (stored in signal.pi).
 *     The PI is the scientific founder/CSO ... a FIRST-CLASS contact (role='principal_investigator'),
 *     not a fallback. Email is filled via Hunter email-finder (name + domain). LinkedIn is backfilled
 *     in verify-contacts.mjs.
 *
 * Writes the picks into enrichment.contacts, advances resolved -> contacted.
 *
 * BYO key: HUNTER_API_KEY. Default = PLAN (free): reports the plan. --execute runs Hunter + writes.
 * Usage: node scripts/find-contacts.mjs [engagement_type] [engagement_id] [--limit N] [--per-company K] [--execute]
 * Env: REVOPS_SUPABASE_URL, REVOPS_SUPABASE_SERVICE_KEY, HUNTER_API_KEY
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
const HUNTER = process.env.HUNTER_API_KEY;

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const LIMIT = Number(flag("limit", 25));
const PER = Number(flag("per-company", 5));
const EXECUTE = argv.includes("--execute");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nk = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");

// icp-titles personas (function-first, from context/revops/icp-titles.md). Tier 1 = economic buyer,
// Tier 2 = IP / R&D champion, EXCLUDE = legal-counsel / sales / marketing / finance / ops (EX roles).
const EXCLUDE = /\b(general counsel|legal counsel|attorney|paralegal|\bcounsel\b|sales|account exec|business development|marketing|customer success|customer support|human resources|\bhr\b|recruit|talent|people ops|finance|controller|accounts? payable|bookkeep|office (administrator|manager)|reception|procurement|\bcfo\b|chief financial|chief marketing)\b/i;
const TIER1 = /\b(co-?founder|founder|chief executive|\bceo\b|president|owner|chief scientific|chief science|\bcso\b|chief technology|\bcto\b|chief operating|\bcoo\b|chief strategy|managing director)\b/i;
const TIER2 = /(head of (ip|intellectual property|r ?& ?d|research|product|technology)|vp[^a-z]+(r ?& ?d|research|product|engineering|technology|intellectual property|\bip\b)|intellectual property|\bpatent|r ?& ?d|research and development|director[^a-z].*(research|r ?& ?d|technology|product))/i;

function tierOf(pos) {
  const p = (pos || "").toLowerCase();
  if (!p) return null;
  if (EXCLUDE.test(p)) return null;
  if (TIER1.test(p)) return 1;
  if (TIER2.test(p)) return 2;
  return null;
}

// parse NIH RePORTER contact_pi_name ("LAST, FIRST MIDDLE"; ";"-separated for multi-PI) -> {first,last}
function parsePI(raw) {
  if (!raw) return null;
  const one = String(raw).split(";")[0].trim();
  if (!one) return null;
  const tc = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
  let first, last;
  if (one.includes(",")) { const [l, f] = one.split(","); last = (l || "").trim(); first = (f || "").trim().split(/\s+/)[0]; }
  else { const parts = one.split(/\s+/); first = parts[0]; last = parts[parts.length - 1]; }
  first = tc((first || "").replace(/[^A-Za-z'-]/g, "")); last = tc((last || "").replace(/[^A-Za-z'-]/g, ""));
  return (first && last) ? { first, last } : null;
}

async function hunterDomain(domain) {
  const r = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=25&api_key=${HUNTER}`);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.data?.emails || []).map((e) => ({
    first: e.first_name, last: e.last_name, position: e.position, seniority: e.seniority,
    department: e.department, email: e.value, confidence: e.confidence, verif: e.verification?.status || null,
    linkedin: e.linkedin || null, phone: e.phone_number || null,
  })).filter((c) => c.email);
}

async function hunterFind(domain, first, last) {
  try {
    const r = await fetch(`https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(first)}&last_name=${encodeURIComponent(last)}&api_key=${HUNTER}`);
    if (!r.ok) return null;
    const d = (await r.json()).data;
    return d?.email ? { email: d.email, confidence: d.score ?? null, verif: d.verification?.status || null, linkedin: d.linkedin_url || null } : null;
  } catch { return null; }
}

const { data: prospects } = await db.from("prospects")
  .select("id, company_name, domain, source, signal, enrichment")
  .eq("engagement_type", ET).eq("engagement_id", EID).eq("stage", "resolved")
  .order("created_at", { ascending: false }).limit(LIMIT);
const n = (prospects ?? []).length;
console.log(`\n▸ find-contacts (slice 2) ${ET}/${EID}: ${n} resolved prospect(s), up to ${PER} persona contacts each + PI\n`);

if (!EXECUTE) {
  console.log(`[PLAN ONLY] would run ${n} Hunter domain-searches + per-NIH-company a PI email-finder. Re-run with --execute.\n`);
  process.exit(0);
}
if (!HUNTER) { console.error("HUNTER_API_KEY missing."); process.exit(1); }

let withContacts = 0, totalContacts = 0, t1 = 0, t2 = 0, noPersona = 0, piLabeled = 0, piAdded = 0, piEmail = 0;
for (const p of prospects ?? []) {
  const prior = p.enrichment && typeof p.enrichment === "object" ? p.enrichment : {};
  let people = [];
  try { people = await hunterDomain(p.domain); } catch (e) { console.error(`  hunter ${p.domain}: ${e.message}`); }
  await sleep(200);
  const picks = people
    .map((c) => ({ ...c, tier: tierOf(c.position), source: "hunter-domain-search" }))
    .filter((c) => c.tier)
    .sort((a, b) => (a.tier - b.tier) || (b.confidence - a.confidence))
    .slice(0, PER);

  // Principal Investigator — first-class contact on every NIH award (named scientific lead ≈ founder/CSO)
  if (p.source === "nih-reporter") {
    const pi = parsePI(p.signal?.pi);
    if (pi) {
      const piKey = nk(pi.first) + nk(pi.last);
      const hit = picks.find((c) => (nk(c.first) + nk(c.last)) === piKey ||
        (nk(c.last) === nk(pi.last) && nk(c.first).slice(0, 3) === nk(pi.first).slice(0, 3)));
      if (hit) { hit.role = "principal_investigator"; hit.pi_award = "nih-sbir-sttr"; piLabeled++; }
      else {
        const found = await hunterFind(p.domain, pi.first, pi.last);
        await sleep(150);
        picks.unshift({
          first: pi.first, last: pi.last, position: "Principal Investigator (NIH SBIR/STTR award)",
          role: "principal_investigator", source: "nih-award", pi_award: "nih-sbir-sttr", tier: 1,
          seniority: "executive", department: "executive",
          email: found?.email || null, confidence: found?.confidence ?? null, verif: found?.verif || null, linkedin: found?.linkedin || null,
        });
        piAdded++; if (found?.email) piEmail++;
      }
    }
  }

  if (picks.length) { withContacts++; totalContacts += picks.length; t1 += picks.filter((c) => c.tier === 1).length; t2 += picks.filter((c) => c.tier === 2).length; }
  else noPersona++;
  const patch = { enrichment: { ...prior, contacts: picks, contacts_found_at: new Date().toISOString() }, updated_at: new Date().toISOString() };
  if (picks.length) patch.stage = "contacted";
  const { error } = await db.from("prospects").update(patch).eq("id", p.id);
  if (error) console.error(`  update ${p.company_name}: ${error.message}`);
}
console.log(`\n[EXECUTE] ${withContacts}/${n} companies with contacts · ${totalContacts} contacts (${t1} T1, ${t2} T2)`);
console.log(`  PI: ${piAdded} added (${piEmail} w/ email) + ${piLabeled} labeled on existing contacts · ${noPersona} companies no contact\n`);
