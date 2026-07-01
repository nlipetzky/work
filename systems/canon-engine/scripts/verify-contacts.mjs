#!/usr/bin/env node
/**
 * verify-contacts.mjs — slice 2 (post-discovery): verify emails + backfill LinkedIn on contacted prospects.
 *
 *  - VERIFY: Hunter email-verifier on each contact email; stamps verif / deliverable / email_score /
 *    accept_all + provenance (verified_at, verified_by='hunter'). Idempotent (skips already-stamped).
 *  - LINKEDIN BACKFILL: for contacts with no LinkedIn, Serper `"Name" "Company" site:linkedin.com/in`,
 *    then NAME-VALIDATE the hit against the result title before accepting (the linkedin-url-lookup
 *    skill's core discipline: 26% of unvalidated serper lookups returned the wrong person). Free ...
 *    uses the Serper result title instead of a paid Apify profile scrape.
 *
 * BYO keys: HUNTER_API_KEY, SERPER_API_KEY. Default = PLAN. --execute runs + writes.
 * Usage: node scripts/verify-contacts.mjs [engagement_type] [engagement_id] [--limit N] [--execute]
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
const SERPER = process.env.SERPER_API_KEY;

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const LIMIT = Number(flag("limit", 300));
const EXECUTE = argv.includes("--execute");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- name validation (from linkedin-url-lookup skill: last exact/substring, first exact/3+ prefix/nickname) ---
const NICK = { michael: ["mike", "mick"], robert: ["bob", "rob"], william: ["bill", "will", "willy"], elizabeth: ["liz", "beth", "eliza", "lisa"], daniel: ["dan", "danny"], sarah: ["sara"], sara: ["sarah"], alexander: ["alex", "sasha"], alexandra: ["alex"], jonathan: ["jon", "john"], christopher: ["chris"], matthew: ["matt"], nicholas: ["nick", "nik"], anthony: ["tony"], richard: ["rick", "rich", "dick"], joseph: ["joe", "joey"], thomas: ["tom", "tommy"], james: ["jim", "jimmy"], benjamin: ["ben"], samuel: ["sam"], andrew: ["andy", "drew"], edward: ["ed", "eddie"], stephen: ["steve"], steven: ["steve"], gregory: ["greg"], timothy: ["tim"], kenneth: ["ken"], patricia: ["pat", "patty"], jennifer: ["jen", "jenny"], katherine: ["kate", "katie", "kathy"], catherine: ["cathy", "kate"] };
const normName = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, " ").replace(/\s+/g, " ").trim();
function nameValidate(first, last, title) {
  const t = normName(title), ln = normName(last), fn = normName(first);
  if (!ln || !fn || !t) return false;
  if (!t.split(" ").some((w) => w === ln || (ln.length >= 4 && w.includes(ln)))) return false; // last must appear
  const variants = new Set([fn, ...(NICK[fn] || [])]);
  for (const [full, nicks] of Object.entries(NICK)) if (nicks.includes(fn)) variants.add(full);
  return t.split(" ").some((w) =>
    variants.has(w) || (fn.length >= 3 && w.length >= 3 && (w.startsWith(fn.slice(0, 3)) || fn.startsWith(w.slice(0, 3)))));
}

async function hunterVerify(email) {
  try {
    const r = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER}`);
    if (!r.ok) return null;
    const d = (await r.json()).data;
    return { status: d?.status || null, result: d?.result || null, score: d?.score ?? null, accept_all: !!d?.accept_all };
  } catch { return null; }
}

async function serperLinkedin(first, last, company) {
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST", headers: { "X-API-KEY": SERPER, "Content-Type": "application/json" },
      body: JSON.stringify({ q: `"${first} ${last}" "${company}" site:linkedin.com/in`, num: 5 }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    for (const o of (j.organic || [])) {
      const link = o.link || "";
      if (!/linkedin\.com\/in\//i.test(link)) continue;
      if (!nameValidate(first, last, o.title || "")) continue; // mandatory identity gate
      const slug = link.split(/\/in\//i)[1]?.split(/[?#/]/)[0];
      if (slug) return `https://www.linkedin.com/in/${slug}`;
    }
    return null;
  } catch { return null; }
}

const { data: prospects } = await db.from("prospects")
  .select("id, company_name, enrichment")
  .eq("engagement_type", ET).eq("engagement_id", EID).eq("stage", "contacted")
  .order("created_at", { ascending: false }).limit(LIMIT);
const n = (prospects ?? []).length;
const allContacts = (prospects ?? []).flatMap((p) => p.enrichment?.contacts || []);
const toVerify = allContacts.filter((c) => c.email && !c.verified_by).length;
const toBackfill = allContacts.filter((c) => !c.linkedin && c.first && c.last).length;
console.log(`\n▸ verify-contacts ${ET}/${EID}: ${n} companies, ${allContacts.length} contacts · ${toVerify} to verify · ${toBackfill} missing LinkedIn\n`);

if (!EXECUTE) { console.log(`[PLAN ONLY] would run ${toVerify} Hunter verifications + ${toBackfill} Serper LinkedIn lookups. Re-run with --execute.\n`); process.exit(0); }

let verified = 0, valid = 0, liFilled = 0, liStillMissing = 0;
for (const p of prospects ?? []) {
  const contacts = p.enrichment?.contacts || [];
  if (!contacts.length) continue;
  for (const c of contacts) {
    if (c.email && !c.verified_by) {
      const v = await hunterVerify(c.email); await sleep(150);
      if (v) {
        c.verif = v.status; c.deliverable = v.result; c.email_score = v.score; c.accept_all = v.accept_all;
        c.verified_at = new Date().toISOString(); c.verified_by = "hunter";
        verified++; if (v.status === "valid") valid++;
      }
    }
    if (!c.linkedin && c.first && c.last && SERPER) {
      const url = await serperLinkedin(c.first, c.last, p.company_name); await sleep(150);
      if (url) { c.linkedin = url; c.linkedin_source = "serper-validated"; liFilled++; }
      else liStillMissing++;
    }
  }
  const { error } = await db.from("prospects").update({ enrichment: { ...p.enrichment, contacts }, updated_at: new Date().toISOString() }).eq("id", p.id);
  if (error) console.error(`  update ${p.company_name}: ${error.message}`);
}
console.log(`\n[EXECUTE] verified ${verified} emails (${valid} valid) · LinkedIn backfilled ${liFilled}, still missing ${liStillMissing}\n`);
