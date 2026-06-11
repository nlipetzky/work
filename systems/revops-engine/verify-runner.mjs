// verify-runner.mjs — the EVIDENCE gate (sits after classify, before promote).
//
// classify INFERS from a one-paragraph blurb; it can FLAG but it cannot CONFIRM. This runner CONFIRMS
// the playbook's North-American physical-lab gate (G2) + wet-lab/process-operations gate (G3) by
// fetching the company's OWN website, extracting every NA site, and CLASSIFYING each site's function
// (rnd_wetlab / process_dev / gmp_mfg / qc_analytical / sales_admin / unclear) with an evidence URL.
// It also reconfirms the mRNA program (G1) from the site, catching upstream false positives.
// Prompt: <play>/classifier/verify-prompt.md (the proven ngAbs site-verification pattern, mRNA-adapted).
//
// A company is `prep_qualified` only when verdict='yes' (a real NA lab/process/GMP site is evidenced)
// AND the mRNA program is not contradicted on the site. No fetched evidence => not qualified.
//
// On-rails: writes prep_* working columns in STAGING only.
// Usage: node verify-runner.mjs <batch_id> companies --play <classifier_dir> [--limit N] [--concurrency K]

import fs from "fs";
import { flushBatched } from "./lib/db-batch.mjs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const TOKEN = envGet("SupaBase_CLI_access_token");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || envGet("ANTHROPIC_API_KEY");

const argv = process.argv.slice(2);
const batchId = argv[0];
const entity = (argv[1] && !argv[1].startsWith("--")) ? argv[1] : "companies";
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const PLAY_DIR = flag("--play", "");
const MODEL = flag("--model", "claude-sonnet-4-6");
const LIMIT = parseInt(flag("--limit", "0"), 10);
const CONCURRENCY = parseInt(flag("--concurrency", "3"), 10);
const stagingTbl = `staging.${entity}_${batchId}`;
if (!TOKEN || !ANTHROPIC_KEY) { console.error("missing SupaBase_CLI_access_token / ANTHROPIC_API_KEY"); process.exit(1); }
if (!batchId || !PLAY_DIR) { console.error("usage: verify-runner.mjs <batch_id> companies --play <classifier_dir> [--limit N]"); process.exit(1); }
const PROMPT_TPL = fs.readFileSync(`${PLAY_DIR}/verify-prompt.md`, "utf8");

async function sql(query, attempt = 0) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if ((res.status === 429 || res.status === 503 || res.status === 544) && attempt < 9) {
    await new Promise((r) => setTimeout(r, Math.min(20000, 1500 * Math.pow(1.7, attempt))));
    return sql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`mgmt-api ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

function htmlToText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}
async function fetchPage(url) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Teknova reagent-fit verification)" } });
    clearTimeout(t);
    if (!r.ok) return null;
    if (!/html|text/.test(r.headers.get("content-type") || "")) return null;
    const text = htmlToText(await r.text());
    return text.length > 120 ? text.slice(0, 3500) : null;
  } catch { return null; }
}
const PATHS = ["", "about", "about-us", "facilities", "locations", "our-locations", "contact", "contact-us",
  "careers", "manufacturing", "operations", "pipeline", "technology", "platform", "company"];
async function fetchSite(domain) {
  const base = `https://${domain}`;
  const settled = await Promise.allSettled(PATHS.map(async (p) => { const u = p ? `${base}/${p}` : base; return { u, text: await fetchPage(u) }; }));
  return settled.filter((s) => s.status === "fulfilled" && s.value.text).map((s) => s.value);
}

const hasProgram = (verdict) => verdict === "IN" || verdict === "NARROW" ? "yes" : verdict === "NEEDS_REVIEW" ? "unclear" : "no";

async function verifyRow(row) {
  const pages = await fetchSite(row.domain);
  if (pages.length === 0) {
    return { fetched: 0, v: { verdict: "unclear", mrna_program_on_site: { status: "not_found" }, reasoning: "site unreachable — no evidence fetched", sites: [] } };
  }
  const sys = PROMPT_TPL.replace("{{NAME}}", row.name).replace("{{DOMAIN}}", row.domain).replace("{{HAS_PROGRAM}}", hasProgram(row.prep_verdict));
  const content = pages.map((p) => `=== ${p.u} ===\n${p.text}`).join("\n\n").slice(0, 18000);
  const body = JSON.stringify({ model: MODEL, max_tokens: 2000, system: sys, messages: [{ role: "user", content: `Fetched pages for ${row.name} (${row.domain}). Use ONLY this content. Return ONLY the JSON.\n\n${content}` }] });
  let res, j;
  for (let attempt = 0; ; attempt++) {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body,
    });
    if ((res.status === 429 || res.status === 529) && attempt < 8) { await new Promise((r) => setTimeout(r, Math.min(30000, 2000 * Math.pow(1.7, attempt)))); continue; }
    j = await res.json();
    break;
  }
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${JSON.stringify(j).slice(0, 160)}`);
  let txt = (j.content?.[0]?.text || "").trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return { fetched: pages.length, v: JSON.parse(txt) };
}

// Batched-write adoption (§6.1 fix): accumulate per-row verify results, flush one UPDATE per 25.
// `prep_qualified` is still recomputed deterministically here — never trusted from the model.
const VERIFY_COLS = ["prep_verify", "prep_qualified", "prep_verify_fetched", "prep_verify_note"];
const VERIFY_CASTS = { prep_verify: "jsonb", prep_qualified: "boolean", prep_verify_fetched: "int" };
const FLUSH_AT = 25;
let buffer = [], flushed = 0;

function buildRow(row, fetched, v) {
  // qualified recomputed deterministically: a real NA lab site (verdict yes) AND mRNA not contradicted.
  const labSites = (v.sites || []).filter((s) => ["rnd_wetlab", "process_dev", "gmp_mfg"].includes(s.siteType));
  const qualified = v.verdict === "yes" && labSites.length > 0 && v.mrna_program_on_site?.status !== "contradicted";
  return {
    row: {
      id: row.id,
      prep_verify: JSON.stringify(v),
      prep_qualified: qualified ? "true" : "false",
      prep_verify_fetched: String(fetched),
      prep_verify_note: (v.reasoning || "").slice(0, 300),
    },
    qualified, labSites: labSites.length,
  };
}
function errRow(row, msg) {
  return { id: row.id, prep_verify: null, prep_qualified: null, prep_verify_fetched: null,
    prep_verify_note: `verify_error: ${String(msg).slice(0, 150)}` };
}
async function enqueue(r) {
  buffer.push(r);
  if (buffer.length >= FLUSH_AT) {
    flushed += await flushBatched(sql, stagingTbl, "id", VERIFY_COLS, buffer.splice(0, FLUSH_AT), { casts: VERIFY_CASTS });
  }
}
async function flushRest() {
  if (buffer.length) flushed += await flushBatched(sql, stagingTbl, "id", VERIFY_COLS, buffer.splice(0), { casts: VERIFY_CASTS });
}

async function pool(items, k, fn) { let i = 0; const w = Array.from({ length: Math.min(k, items.length) }, async () => { while (i < items.length) { const idx = i++; await fn(items[idx]); } }); await Promise.all(w); }

await sql(`alter table ${stagingTbl} add column if not exists prep_verify jsonb;
  alter table ${stagingTbl} add column if not exists prep_qualified boolean;
  alter table ${stagingTbl} add column if not exists prep_verify_fetched int;
  alter table ${stagingTbl} add column if not exists prep_verify_note text;`);

const limitClause = LIMIT > 0 ? `limit ${LIMIT}` : "";
const rows = await sql(`select id, name, domain, prep_verdict from ${stagingTbl}
  where prep_verdict in ('IN','NARROW','NEEDS_REVIEW') and coalesce(domain,'') <> '' ${limitClause}`);
console.log(`verifying ${rows.length} companies against the NA-site evidence gate (model=${MODEL}, conc=${CONCURRENCY})`);

let ok = 0, err = 0, qual = 0; const verd = {}; const prog = {};
await pool(rows, CONCURRENCY, async (row) => {
  try {
    const { fetched, v } = await verifyRow(row);
    const { row: outRow, qualified } = buildRow(row, fetched, v);
    await enqueue(outRow);
    verd[v.verdict] = (verd[v.verdict] || 0) + 1;
    const ps = v.mrna_program_on_site?.status || "n/a"; prog[ps] = (prog[ps] || 0) + 1;
    if (qualified) qual++;
    ok++; if (ok % 25 === 0) console.log(`  ...${ok}/${rows.length} (flushed ${flushed})`);
  } catch (e) { err++; await enqueue(errRow(row, e.message)); }
});
await flushRest();
console.log(`\nverified ok: ${ok}, errors: ${err}, rows flushed: ${flushed}`);
console.log("site verdict:", JSON.stringify(verd), "| mRNA-on-site:", JSON.stringify(prog));
console.log(`QUALIFIED (evidenced NA lab + mRNA not contradicted): ${qual} of ${ok}`);
