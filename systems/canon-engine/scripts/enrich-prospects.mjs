#!/usr/bin/env node
/**
 * enrich-prospects.mjs — the execution step: advance signal-stage prospects toward qualified leads.
 *
 * SLICE 1 (resolve): local-first domain resolution (free join against public.companies) then Apollo
 * org-search for the remainder. Writes `domain` + a `resolve` block onto each prospect's enrichment and
 * advances signal -> resolved. Contacts + verified email (slice 2) and the qualify gate (slice 3) follow.
 *
 * BYO keys ... Nick's own providers, NOT Deepline: APOLLO_API_KEY. The local-core lookup is free.
 * Default = PLAN (free): reports the funnel, mutates nothing. --execute runs Apollo + writes.
 *
 * Usage: node scripts/enrich-prospects.mjs [engagement_type] [engagement_id] [--limit N] [--execute]
 * Env: REVOPS_SUPABASE_URL, REVOPS_SUPABASE_SERVICE_KEY, APOLLO_API_KEY
 *
 * Reads/writes revops-engine.public.prospects (the collapsed signal-landing table) and reads
 * public.companies (the enriched core) for the free local-first pass.
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
const APOLLO = process.env.APOLLO_API_KEY;
const SERPER = process.env.SERPER_API_KEY;

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const LIMIT = Number(flag("limit", 25));
const EXECUTE = argv.includes("--execute");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// normalize a company name for cross-source matching (mirror of the SQL normalizer used in the overlap check)
const norm = (s) => (s || "").toLowerCase()
  .replace(/\b(inc|llc|incorporated|corp|corporation|ltd|limited|co|plc|lp|pllc|company|holdings|the)\b/g, "")
  .replace(/[^a-z0-9]/g, "");

// human-readable clean for provider name search ... Apollo's q_organization_name returns null on "FOO BIO, INC."
const clean = (s) => (s || "").replace(/[,.]/g, " ")
  .replace(/\b(inc|llc|llp|incorporated|corp|corporation|ltd|limited|co|plc|lp|pllc|company|holdings)\b/gi, " ")
  .replace(/\s+/g, " ").trim();

// ---- load signal-stage prospects ----
const { data: prospects, error: pErr } = await db.from("prospects")
  .select("id, company_name, domain, enrichment")
  .eq("engagement_type", ET).eq("engagement_id", EID).eq("stage", "signal")
  .order("created_at", { ascending: false }).limit(LIMIT);
if (pErr) { console.error("load prospects:", pErr.message); process.exit(1); }
const n = (prospects ?? []).length;

// ---- local-first: build a normalized-name -> company index from the enriched core (free) ----
// PostgREST caps at 1000 rows/request, so paginate to cover the whole core.
async function loadCompanies() {
  const out = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("companies")
      .select("id, name, domain, employee_count, funding_stage, company_status, dnc_opt_out, sf_dnc_opt_out, existing_customer")
      .range(from, from + PAGE - 1);
    if (error) { console.error("companies page:", error.message); break; }
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}
const companies = await loadCompanies();
const localIndex = new Map();
for (const c of companies) {
  const k = norm(c.name);
  if (k.length >= 4 && c.domain && !localIndex.has(k)) localIndex.set(k, c);
}
const localHit = (name) => localIndex.get(norm(name));

console.log(`\n▸ enrich-prospects (slice 1: resolve) ${ET}/${EID}: ${n} signal-stage prospect(s), ${companies.length} in local core\n`);

// funnel sizing first (free)
let localCount = 0, needExternal = 0;
for (const p of prospects ?? []) { if (localHit(p.company_name)) localCount++; else needExternal++; }
console.log(`funnel: ${localCount} resolvable locally (free) · ${needExternal} need Apollo org-search (~1 search credit each)`);

if (!EXECUTE) {
  console.log(`\n[PLAN ONLY] mutated nothing. Re-run with --execute to resolve domains. Local writes are free; only the ${needExternal} non-local companies spend Apollo.\n`);
  process.exit(0);
}
if (!APOLLO) console.error("warning: APOLLO_API_KEY missing ... the non-local remainder will be marked unresolved.");

// ---- Apollo org-search by name -> primary domain (+ light firmographics) ----
async function apolloResolve(name) {
  try {
    const r = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache", "X-Api-Key": APOLLO },
      body: JSON.stringify({ q_organization_name: clean(name) || name, page: 1, per_page: 1 }),
    });
    if (r.status === 429) { await sleep(2000); return apolloResolve(name); }
    if (!r.ok) return null;
    const org = (await r.json()).organizations?.[0];
    if (!org?.primary_domain) return null;
    return { domain: org.primary_domain, founded_year: org.founded_year || null, linkedin: org.linkedin_url || null, apollo_org_id: org.id || null };
  } catch { return null; }
}

// ---- Serper (Google) web-search fallback for Apollo's strict-name-match misses (the top organic is the company site) ----
const SKIP_SLD = new Set(["linkedin", "crunchbase", "wikipedia", "facebook", "twitter", "instagram", "youtube",
  "bloomberg", "pitchbook", "dnb", "zoominfo", "glassdoor", "indeed", "govwin", "sbir", "nih", "clinicaltrials",
  "usaspending", "opencorporates", "rocketreach", "apollo", "medium", "github", "prnewswire", "businesswire",
  "globenewswire", "fiercebiotech", "biospace", "ycombinator", "f6s", "tracxn", "owler", "leadiq", "signalhire",
  "reuters", "forbes", "globaldata"]);
const hostname = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const sldOf = (host) => { const p = host.split("."); return (p.length >= 2 ? p[p.length - 2] : p[0]).replace(/[^a-z0-9]/g, ""); };

async function serperResolve(name) {
  if (!SERPER) return null;
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST", headers: { "X-API-KEY": SERPER, "Content-Type": "application/json" },
      body: JSON.stringify({ q: clean(name) + " official website", num: 8 }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const cn = norm(name);
    const firstTok = (clean(name).toLowerCase().split(/\s+/).find((w) => w.length >= 4)) || "";
    // accept a host only if it isn't an aggregator AND its domain relates to the company name
    const ok = (host) => {
      const sld = sldOf(host);
      if (!sld || sld.length < 4 || SKIP_SLD.has(sld)) return null;
      if (cn.includes(sld) || sld.includes(cn) || (firstTok.length >= 4 && sld.includes(firstTok))) return host;
      return null;
    };
    const kg = j.knowledgeGraph?.website;
    if (kg) { const h = ok(hostname(kg)); if (h) return { domain: h, detail: "kg" }; }
    for (const o of (j.organic || [])) { const h = ok(hostname(o.link || "")); if (h) return { domain: h, detail: "organic" }; }
    return null;
  } catch { return null; }
}

let rLocal = 0, rApollo = 0, rSerper = 0, unresolved = 0, suppressed = 0;
for (const p of prospects ?? []) {
  const prior = p.enrichment && typeof p.enrichment === "object" ? p.enrichment : {};
  let resolve;
  const c = localHit(p.company_name);
  if (c) {
    const supp = !!(c.dnc_opt_out || c.sf_dnc_opt_out);
    resolve = { status: "resolved", via: "local", domain: c.domain, company_id: c.id,
      employee_count: c.employee_count ?? null, funding_stage: c.funding_stage ?? null,
      company_status: c.company_status ?? null, existing_customer: c.existing_customer ?? null, suppressed: supp };
    rLocal++; if (supp) suppressed++;
  } else if (APOLLO) {
    const a = await apolloResolve(p.company_name);
    await sleep(200); // be gentle on Apollo's rate limit across a full run
    if (a) { resolve = { status: "resolved", via: "apollo", suppressed: false, ...a }; rApollo++; }
    else {
      const s = await serperResolve(p.company_name); // Serper backfills Apollo's strict-name-match misses
      await sleep(150);
      if (s) { resolve = { status: "resolved", via: "serper", suppressed: false, domain: s.domain, detail: s.detail }; rSerper++; }
      else { resolve = { status: "unresolved", via: "serper", reason: "no-confident-match" }; unresolved++; }
    }
  } else {
    resolve = { status: "unresolved", via: "none", reason: "no-apollo-key" }; unresolved++;
  }

  const patch = { enrichment: { ...prior, resolve, resolved_at: new Date().toISOString() }, updated_at: new Date().toISOString() };
  if (resolve.status === "resolved") { patch.domain = resolve.domain; patch.stage = "resolved"; }
  const { error } = await db.from("prospects").update(patch).eq("id", p.id);
  if (error) console.error(`  update ${p.company_name}: ${error.message}`);
}

console.log(`\n[EXECUTE] resolved ${rLocal} local + ${rApollo} apollo + ${rSerper} serper · ${unresolved} unresolved · ${suppressed} suppressed (do-not-contact)`);
const { count } = await db.from("prospects").select("*", { count: "exact", head: true })
  .eq("engagement_type", ET).eq("engagement_id", EID).eq("stage", "resolved");
console.log(`prospects at 'resolved' stage now: ${count}\n`);
