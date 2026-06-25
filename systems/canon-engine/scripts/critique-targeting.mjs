#!/usr/bin/env node
/**
 * critique-targeting.mjs — the Deepline GTM list-builder, as a craft critic.
 *
 * Reviews a list-build targeting artifact for BUILDABILITY against real data-provider reality, using
 * the deepline-gtm craft docs as the standard (knowledge-based ... no paid provider calls by default).
 * This is the RevOps CRAFT axis: not writing quality (the govern-artifacts judge), not domain truth
 * (the engagement SME). It answers "would a real list-builder push back, and could they actually
 * build this?"
 *
 * Output: a structured critique (verdict + prioritized pushback + proposed doctrine updates), stored
 * via record_artifact_critique, AND injected into the artifact's drafting source so a re-Produce
 * optimizes against it. subscription_aware = whether the deepline CLI is present (live verification
 * possible); we do NOT spend credits here.
 *
 * Usage: node scripts/critique-targeting.mjs <engagement_type> <engagement_id> <artifact_type>
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const MODEL = "claude-opus-4-8";
const WORK_ROOT = "/Users/nplmini/code/work";
const DEEPLINE = "/Users/nplmini/.agents/skills/deepline-gtm";
const DOCTRINE_REL = "practices/revops/reference/targeting-enrichment-doctrine.md";

for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
function fail(m) { console.error(`\n✗ ${m}\n`); process.exit(1); }

// which deepline craft docs are the standard for each artifact
const DOCS = {
  "segment-criteria": ["finding-companies-and-contacts.md", "recipes/build-tam.md"],
  "icp-titles": ["finding-companies-and-contacts.md"],
  "enrichment-spec": ["enriching-and-researching.md"],
  "list-qualification": ["writing-outreach.md", "enriching-and-researching.md"],
};
const CAP = 70000; // per-doc char cap (keep the call bounded)

async function loadDoc(rel) {
  try { return (await readFile(path.join(DEEPLINE, rel), "utf8")).slice(0, CAP); } catch { return ""; }
}

const [ET, EID, TYPE] = process.argv.slice(2);
if (!ET || !EID || !TYPE || !DOCS[TYPE]) fail(`usage: critique-targeting.mjs <et> <eid> <${Object.keys(DOCS).join("|")}>`);

// the artifact under review (latest draft/approved)
const { data: artRows, error: aErr } = await db.from("canon_artifacts")
  .select("id, content_md, version, status").eq("engagement_type", ET).eq("engagement_id", EID)
  .eq("artifact_type", TYPE).in("status", ["draft", "approved"]).order("version", { ascending: false }).limit(1);
if (aErr) fail(aErr.message);
const art = artRows?.[0];
if (!art) fail(`no draft/approved ${TYPE} for ${ET}/${EID} to critique`);

const deeplineCraft = (await Promise.all(DOCS[TYPE].map(async (d) => `### deepline: ${d}\n${await loadDoc(d)}`))).join("\n\n");
// the studio's own doctrine carries CUSTOM authoritative sources (USPTO, clinicaltrials.gov, ...) that the
// deepline provider universe does not know about. The critic must judge buildability against BOTH, so it
// does not flag a signal as unbuildable when an authoritative source in our doctrine covers it.
let doctrine = "";
try { doctrine = await readFile(path.join(WORK_ROOT, DOCTRINE_REL), "utf8"); } catch { /* optional */ }
const craft = `### OUR TARGETING DOCTRINE (includes custom authoritative sources beyond deepline's providers)\n${doctrine}\n\n### DEEPLINE CRAFT DOCS (commercial provider reality)\n${deeplineCraft}`;
let subscriptionAware = false;
try { execSync("command -v deepline", { stdio: "ignore" }); subscriptionAware = true; } catch { /* knowledge-only */ }

const system =
  "You are the Deepline GTM list-builder ... a senior RevOps operator who has shipped hundreds of real prospect lists across 50+ data providers. " +
  "You are reviewing a TARGETING ARTIFACT for BUILDABILITY, NOT writing quality. The question is: could a real list-builder actually " +
  "source / enrich / qualify against this spec with real providers, and where would you push back? Judge ONLY against execution reality, " +
  "using the deepline craft docs provided as your standard. Cover: searchable filters (does a provider actually support filtering on each " +
  "hard filter and signal, or is it theoretical?), enrichment reality (do the data points map to real providers, at what hit-rate / cost; " +
  "the verified-email waterfall and the catch-all problem), scoring / qualification realism, empty-list risk (too many hard filters), and " +
  "over-fishing / deliverability. Do NOT invent providers or capabilities not in the docs. IMPORTANT: judge buildability against BOTH the deepline " +
  "commercial providers AND the studio's own doctrine, which lists CUSTOM authoritative sources (e.g. USPTO PatentsView for patents, " +
  "ClinicalTrials.gov for trial phase) that are NOT in deepline's provider universe. If the doctrine already names an authoritative source that " +
  "covers a signal, it is BUILDABLE (as a derived enrichment gate) ... do not flag it as a blocker; at most note it must be specced as derived. " +
  "For each pushback, name the relevant provider(s) or tool(s). Be specific and prioritized. Also propose concrete additions to the doctrine that would prevent each issue next time. " +
  "Output STRICT JSON ONLY, no prose: " +
  '{"verdict":"buildable|buildable-with-fixes|not-buildable","summary":"one line","pushback":[{"dimension":"searchable-filters|enrichment-reality|scoring|empty-list-risk|deliverability|provider-coverage","severity":"blocker|major|minor","issue":"...","fix":"...","providers":"..."}],"doctrine_updates":["..."]}';
const user = `ARTIFACT TYPE: ${TYPE} (v${art.version}, ${art.status})\n\nARTIFACT CONTENT:\n${art.content_md}\n\n--- DEEPLINE CRAFT DOCS (your standard) ---\n${craft}`;

const ai = new Anthropic();
const r = await ai.messages.create({ model: MODEL, max_tokens: 3500, system, messages: [{ role: "user", content: user }] });
const raw = r.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
const m = raw.match(/\{[\s\S]*\}/);
if (!m) fail(`critic returned non-JSON: ${raw.slice(0, 200)}`);
let crit;
try { crit = JSON.parse(m[0]); } catch (e) { fail(`critic JSON parse: ${e.message}`); }
const pushback = Array.isArray(crit.pushback) ? crit.pushback : [];
const doctrineUpdates = Array.isArray(crit.doctrine_updates) ? crit.doctrine_updates : [];

// store the critique
const { error: rErr } = await db.rpc("record_artifact_critique", {
  p_engagement_type: ET, p_engagement_id: EID, p_artifact_type: TYPE, p_verdict: crit.verdict || "buildable-with-fixes",
  p_artifact_id: art.id, p_critic: "deepline-list-builder", p_summary: crit.summary || null,
  p_pushback: pushback, p_doctrine_updates: doctrineUpdates, p_subscription_aware: subscriptionAware,
  p_metadata: { model: MODEL, docs: DOCS[TYPE] },
});
if (rErr) fail(`record_artifact_critique: ${rErr.message}`);

// inject the pushback into the drafting source so a re-Produce optimizes against it (idempotent)
const srcPath = path.join(WORK_ROOT, "accounts/ventures", EID, "context/revops", `${TYPE}.md`);
const MARK = "\n\n---\n\n## CRAFT REVIEW (deepline list-builder) — address these on the next produce\n";
try {
  let src = await readFile(srcPath, "utf8");
  src = src.split(MARK)[0]; // strip any prior craft-review block
  const block = pushback.map((p, i) => `${i + 1}. [${p.severity}] (${p.dimension}) ${p.issue}\n   FIX: ${p.fix}${p.providers ? `\n   PROVIDERS: ${p.providers}` : ""}`).join("\n");
  await writeFile(srcPath, `${src}${MARK}Verdict: ${crit.verdict}. ${crit.summary || ""}\n\n${block}\n`, "utf8");
} catch { /* source file optional */ }

console.log(`✓ critique ${TYPE}: ${crit.verdict} — ${pushback.length} pushback, ${doctrineUpdates.length} doctrine update(s)${subscriptionAware ? " [deepline CLI present]" : " [knowledge-only]"}`);
