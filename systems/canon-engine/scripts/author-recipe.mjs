#!/usr/bin/env node
/**
 * author-recipe.mjs — the recipe-authoring agent.
 *
 * Given an INTENT (a signal / "find companies doing X"), it COMPOSES a new discovery recipe
 * (signal -> qualified-leads pipeline, doctrine §8) GROUNDED IN THE LIVE deepline tool universe
 * (`deepline tools search`) + the §6 custom authoritative sources, synthesizing the engagement's
 * targeting artifacts. This is the agentic leap: the system composes pipelines from an intent, not
 * just one fixed recipe. Anti-fabrication: every tool the recipe names must be a real deepline tool_id
 * (from the live catalog) or a named custom source; tools_used is the provenance. The recipe later
 * compiles to a deepline play (deepline-plays) for execution.
 *
 * Usage: node scripts/author-recipe.mjs <engagement_type> <engagement_id> <recipe_name> "<intent>"
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const MODEL = "claude-opus-4-8";
const WORK_ROOT = "/Users/nplmini/code/work";
const DEEPLINE = "/Users/nplmini/.agents/skills/deepline-gtm";
const DOCTRINE_REL = "practices/revops/reference/targeting-enrichment-doctrine.md";
const CUSTOM_SOURCES = ["uspto-patentsview", "clinicaltrials-gov", "nih-reporter", "sbir-gov"];

for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
function fail(m) { console.error(`\n✗ ${m}\n`); process.exit(1); }

const [ET, EID, NAME, ...intentParts] = process.argv.slice(2);
const INTENT = intentParts.join(" ");
if (!ET || !EID || !NAME || !INTENT) fail('usage: author-recipe.mjs <et> <eid> <name> "<intent>"');

// ---- TOOL DISCOVERY: query the live deepline tool universe (best-effort; knowledge-only fallback) ----
function deeplineSearch(q) {
  try { return execSync(`deepline tools search ${JSON.stringify(q)}`, { timeout: 25000, encoding: "utf8", maxBuffer: 4_000_000 }); }
  catch { return ""; }
}
const STAGE_QUERIES = [
  INTENT, "company search structured filters", "people search title filters", "email finder",
  "email verify deliverability", "company enrichment", "job postings hiring", "funding round investor",
  "technographics", "web research extract",
];
let catalog = "", liveIds = new Set();
for (const q of STAGE_QUERIES) {
  const out = deeplineSearch(q);
  if (!out) continue;
  catalog += `\n# search: ${q}\n${out.slice(0, 3500)}\n`;
  for (const m of out.matchAll(/"id":\s*"([a-z0-9_]+)"/g)) liveIds.add(m[1]);
  for (const m of out.matchAll(/(?:^|\s)-\s+([a-z0-9_]+)\s*\[/gm)) liveIds.add(m[1]);
  for (const m of out.matchAll(/toolId:\s*([a-z0-9_]+)/g)) liveIds.add(m[1]);
}
const haveLiveCatalog = liveIds.size > 0;
catalog = catalog.slice(0, 24000);

// ---- context: doctrine, the 4 targeting artifacts, the worked-example recipe, enrichment craft ----
async function latest(type) {
  const { data } = await db.from("canon_artifacts").select("content_md, version, status")
    .eq("engagement_type", ET).eq("engagement_id", EID).eq("artifact_type", type)
    .in("status", ["draft", "approved"]).order("version", { ascending: false }).limit(1);
  return data?.[0] || null;
}
async function loadDoc(rel, base = DEEPLINE) { try { return (await readFile(path.join(base, rel), "utf8")).slice(0, 42000); } catch { return ""; } }

const doctrine = await loadDoc(DOCTRINE_REL, WORK_ROOT);
const exemplar = await latest("discovery-recipe");
const inputs = (await Promise.all(["segment-criteria", "icp-titles", "enrichment-spec", "list-qualification"]
  .map(async (t) => { const a = await latest(t); return a ? `### ${t} (${a.status} v${a.version})\n${a.content_md}` : ""; }))).join("\n\n");
const enriching = await loadDoc("enriching-and-researching.md");

const system =
  "You are the Deepline execution-plan-creator / list-builder, composing a NEW discovery recipe from an intent. " +
  "A recipe = an ordered, signal-driven pipeline (doctrine §8) that turns a LIVE signal into qualified leads in a database, designed to run CONTINUOUSLY as a standing watch. " +
  "Compose it GROUNDED IN REAL TOOLS: every step's source/tool MUST be either (a) a real deepline tool_id from the LIVE TOOL CATALOG provided, or " +
  "(b) one of these named custom authoritative sources: " + CUSTOM_SOURCES.join(", ") + " (used when the commercial catalog has no facet, e.g. patents -> uspto-patentsview). " +
  "Do NOT invent tools or capabilities. For each step name the tool/source, the keying method (how the prior step's output becomes this step's input), and the expected hit-rate/cost so the funnel is sized honestly. " +
  "Synthesize the engagement's four targeting artifacts. The recipe will later compile to a deepline play (deepline-plays) for execution. " +
  "If the entry signal cannot be grounded in any catalog tool OR custom source, do not fabricate ... set content_md to 'INSUFFICIENT_SOURCE: <why>'. " +
  'Return STRICT JSON only: {"name":"<slug>","signal":"<short entry signal>","content_md":"<the full ordered recipe markdown>","tools_used":["<tool_id or custom-source>", ...]}.';
const user =
  `INTENT: ${INTENT}\nRECIPE NAME: ${NAME}\n\n` +
  `LIVE TOOL CATALOG (real deepline tool ids you may use${haveLiveCatalog ? "" : " — EMPTY: deepline unavailable, rely on custom sources + the enrichment craft below"}):\n${catalog || "(none)"}\n\n` +
  `CUSTOM AUTHORITATIVE SOURCES (§6): ${CUSTOM_SOURCES.join(", ")}\n\n` +
  `DOCTRINE (the standard, incl. §6 custom sources + §8 recipe shape):\n${doctrine}\n\n` +
  `WORKED-EXAMPLE RECIPE (the shape to follow):\n${exemplar?.content_md || "(none)"}\n\n` +
  `TARGETING ARTIFACTS (synthesize these):\n${inputs}\n\n` +
  `DEEPLINE ENRICHMENT CRAFT (waterfall / provider patterns):\n${enriching}`;

const ai = new Anthropic();
const r = await ai.messages.create({ model: MODEL, max_tokens: 6000, system, messages: [{ role: "user", content: user }] });
const raw = r.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
const m = raw.match(/\{[\s\S]*\}/);
if (!m) fail(`agent returned non-JSON: ${raw.slice(0, 200)}`);
let rec; try { rec = JSON.parse(m[0]); } catch (e) { fail(`JSON parse: ${e.message}`); }
const content = String(rec.content_md || "");
if (content.startsWith("INSUFFICIENT_SOURCE")) fail(`agent could not ground the recipe: ${content.slice(0, 200)}`);
if (content.length < 600) fail(`recipe too thin (${content.length} chars)`);

// ---- provenance + anti-fabrication: derive tools_used from the recipe BODY (don't trust the LLM field) ----
// real deepline tools actually referenced in the recipe + custom sources named by friendly name
const grounded = [...liveIds].filter(id => content.includes(id));
if (/uspto|patentsview/i.test(content)) grounded.push("uspto-patentsview");
if (/clinicaltrials/i.test(content)) grounded.push("clinicaltrials-gov");
if (/nih ?reporter|reporter\.nih/i.test(content)) grounded.push("nih-reporter");
if (/\bsbir\b/i.test(content)) grounded.push("sbir-gov");
const toolsUsed = [...new Set(grounded)];
// anti-fabrication: tool-id-shaped tokens in the body that are NOT in the live catalog (likely invented)
const PROVIDERS = "apollo|crustdata|theirstack|predictleads|hunter|findymail|prospeo|zerobounce|exa|serper|leadmagic|deeplineagent|parallel|peopledatalabs|lusha|contactout|rocketreach|wiza|dropleads|bettercontact|fullenrich|icypeas|datagma|forager|trestle|upcell|limadata|builtwith|dataforseo|openwebninja|firecrawl";
const candidates = [...new Set([...content.matchAll(new RegExp(`\\b((?:${PROVIDERS})_[a-z0-9_]+)\\b`, "g"))].map(m => m[1]))];
const fabricated = haveLiveCatalog ? candidates.filter(t => !liveIds.has(t)) : [];
if (fabricated.length) console.error(`  ! ungrounded tool ids in recipe (not in live catalog): ${fabricated.join(", ")}`);

const { data, error } = await db.rpc("record_discovery_recipe", {
  p_engagement_type: ET, p_engagement_id: EID, p_name: rec.name || NAME, p_content_md: content,
  p_signal: rec.signal || null, p_intent: INTENT, p_tools_used: toolsUsed,
  p_authored_by: "recipe-authoring-agent",
  p_metadata: { model: MODEL, live_catalog: haveLiveCatalog, live_tool_count: liveIds.size, ungrounded_tools: fabricated },
});
if (error) fail(`record_discovery_recipe: ${error.message}`);
const row = Array.isArray(data) ? data[0] : data;
console.log(`✓ authored recipe "${row.name}" v${row.version} (${row.id}) — signal: ${rec.signal}; ${toolsUsed.length} tools grounded${haveLiveCatalog ? ` (live catalog: ${liveIds.size} tools)` : " (knowledge-only)"}${fabricated.length ? `; ${fabricated.length} UNGROUNDED` : ""}`);
