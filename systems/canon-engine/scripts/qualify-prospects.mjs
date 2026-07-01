#!/usr/bin/env node
/**
 * qualify-prospects.mjs — slice 3: the account qualify gate (qualified / edge / not_qualified + tier).
 *
 * Deterministic spine, AI as a called function. For each contacted prospect it feeds the captured data
 * (science from enrichment.nih.phr/abstract, the funding TRAJECTORY, phase, TABA, contacts found) to a
 * model judge with the CIPO ICP rubric, and gets back a structured, explainable verdict. Writes the
 * native columns (qualified bool, verdict text) + enrichment.qualify {tier, entity_type, reasons,
 * flags, rationale}, and advances stage: qualified -> 'qualified', edge -> 'edge', else 'disqualified'.
 *
 * BYO key: ANTHROPIC_API_KEY. Default = PLAN. --execute runs the judge + writes.
 * Usage: node scripts/qualify-prospects.mjs [engagement_type] [engagement_id] [--limit N] [--model M] [--execute]
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
const ANTHROPIC = process.env.ANTHROPIC_API_KEY;

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const LIMIT = Number(flag("limit", 300));
const MODEL = flag("model", "claude-haiku-4-5-20251001");
const EXECUTE = argv.includes("--execute");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RUBRIC = `You are qualifying companies for Konstellation CIPO, which sells IP-intelligence + a fractional Chief-IP-Officer advisory subscription (Scout/Shield/Arsenal tiers) to early-stage deep-tech medical-device / biotech startups. These are NIH SBIR/STTR awardees, so every one is small-business and TABA-funded (non-dilutive money earmarked for outside IP/commercialization help).

Decide a verdict for the account from the data provided. Be strict and explainable; cite the signals.

TARGET (verdict "qualified"): a real PRODUCT company — a device, therapeutic, diagnostic, or proprietary platform with a technical, patentable edge — that is commercializing toward market, with IP material to its value. Grant-funded counts (do NOT disqualify for being SBIR/grant-funded vs venture-backed). Map maturity to tier, do not disqualify for it:
  - early (few awards, recent first award, smaller cumulative NIH $) -> Scout/Shield
  - growth (more awards, larger cumulative $, multi-year) -> Arsenal
DISQUALIFY (verdict "not_qualified"): accelerators / incubators; pure research shops or "SBIR mills" that live on serial grants with no product-commercialization arc; health-IT / software / consulting / services without a hard-tech, patentable core; CROs / contract-research / contract-manufacturing; clearly large/established/public companies that already have in-house IP counsel; law firms / IP-services firms.
EDGE (verdict "edge", route to human): plausibly a fit but the product/IP/commercialization arc or the stage is genuinely unclear from the data.

Use the funding trajectory as a MATURITY signal (tier), not an auto-disqualifier — a $16M / 19-award company is growth-stage (Arsenal), not out, UNLESS it reads as a research shop. The real disqualifiers are ENTITY TYPE (accelerator / research-shop / services / CRO / too-big), not the funding source.`;

const SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["qualified", "edge", "not_qualified"] },
    tier: { type: "string", enum: ["Scout", "Shield", "Arsenal", "none"] },
    entity_type: { type: "string", enum: ["venture-track-startup", "grant-funded-product-startup", "research-shop-or-sbir-mill", "accelerator-or-incubator", "health-it-or-services", "cro-or-contract", "mature-or-established", "other"] },
    reasons: { type: "array", items: { type: "string" }, description: "named signals that drove the verdict" },
    concern_flags: { type: "array", items: { type: "string" } },
    rationale: { type: "string", description: "one sentence" },
  },
  required: ["verdict", "tier", "entity_type", "reasons", "rationale"],
};

async function judge(payload) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 700,
      tools: [{ name: "verdict", description: "Record the qualification verdict.", input_schema: SCHEMA }],
      tool_choice: { type: "tool", name: "verdict" },
      messages: [{ role: "user", content: `${RUBRIC}\n\nCompany data (JSON):\n${JSON.stringify(payload)}` }],
    }),
  });
  if (!r.ok) { console.error(`  anthropic ${r.status}: ${(await r.text()).slice(0, 160)}`); return null; }
  const j = await r.json();
  const tu = (j.content || []).find((c) => c.type === "tool_use");
  return tu?.input || null;
}

const { data: prospects } = await db.from("prospects")
  .select("id, company_name, domain, signal, enrichment")
  .eq("engagement_type", ET).eq("engagement_id", EID).eq("stage", "contacted")
  .order("created_at", { ascending: false }).limit(LIMIT);
const n = (prospects ?? []).length;
console.log(`\n▸ qualify-prospects ${ET}/${EID}: ${n} contacted account(s) · model ${MODEL}\n`);
if (!EXECUTE) { console.log(`[PLAN ONLY] would run ${n} judge calls + write verdicts. Re-run with --execute.\n`); process.exit(0); }
if (!ANTHROPIC) { console.error("ANTHROPIC_API_KEY missing."); process.exit(1); }

const STAGE = { qualified: "qualified", edge: "edge", not_qualified: "disqualified" };
let qualified = 0, edge = 0, no = 0, failed = 0;
const tierCount = {};
for (const p of prospects ?? []) {
  const nih = p.enrichment?.nih || {};
  const payload = {
    company: p.company_name, domain: p.domain, source: p.source,
    patent_signal: p.source === "uspto" ? { title: p.signal?.title, cpc: p.signal?.cpc, entity_status: p.signal?.entity, application: p.signal?.application } : null,
    science_public_health_relevance: (nih.phr || "").slice(0, 700),
    abstract_excerpt: (nih.abstract || "").slice(0, 800),
    project_title: nih.project_title || p.signal?.projectTitle,
    nih_institute: nih.institute?.name || p.signal?.ic,
    phase: p.signal?.phase, latest_award_amount: nih.award_amount || p.signal?.awardAmount,
    trajectory: nih.trajectory || null,
    taba_ceiling_usd: p.enrichment?.taba?.ceiling_usd ?? null,
    contacts_found: (p.enrichment?.contacts || []).filter((c) => c.email).length,
  };
  const v = await judge(payload);
  await sleep(120);
  if (!v) { failed++; continue; }
  const verdict = v.verdict;
  if (verdict === "qualified") qualified++; else if (verdict === "edge") edge++; else no++;
  tierCount[v.tier] = (tierCount[v.tier] || 0) + 1;
  const { error } = await db.from("prospects").update({
    qualified: verdict === "qualified",
    verdict,
    stage: STAGE[verdict] || "contacted",
    enrichment: { ...p.enrichment, qualify: { ...v, judged_at: new Date().toISOString(), judge_model: MODEL } },
    updated_at: new Date().toISOString(),
  }).eq("id", p.id);
  if (error) console.error(`  update ${p.company_name}: ${error.message}`);
}
console.log(`\n[EXECUTE] qualified ${qualified} · edge ${edge} · not_qualified ${no} · failed ${failed}`);
console.log(`  tiers: ${JSON.stringify(tierCount)}\n`);
