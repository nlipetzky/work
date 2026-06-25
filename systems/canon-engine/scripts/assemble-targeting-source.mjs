#!/usr/bin/env node
/**
 * assemble-targeting-source.mjs — build the drafting source for each list-build artifact (re-runnable).
 *
 * The govern-artifacts driver reads ONE context file per artifact as its source. This composes that file
 * from everything the producer must reason from, so it is the single source of truth for a re-Produce:
 *   doctrine (the standard, incl. §6 custom authoritative sources)
 *   + the approved marketing canon (what we sell / to whom)
 *   + the latest sibling targeting artifacts (so they cohere; draft OR approved)
 *   + the latest craft-critique pushback (so a re-Produce OPTIMIZES against it)
 *   + operator/expert notes (the human seed, the knowledge the AI lacks)
 *
 * The discovery-recipe artifact hinges on all four input artifacts: it is the signal -> qualified-leads
 * pipeline that synthesizes them.
 *
 * Run from canon-engine/: node scripts/assemble-targeting-source.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const ET = "venture", EID = "konstellation-cipo";
const DOCTRINE = "practices/revops/reference/targeting-enrichment-doctrine.md";

const MARKETING = [
  ["icp-and-disqualifiers", "ICP + DISQUALIFIERS"],
  ["customer-problem-model", "CUSTOMER PROBLEM"],
  ["mechanism-of-action", "MECHANISM / what fit looks like"],
  ["offer-architecture-and-pricing", "OFFER"],
  ["outreach-offer-ladder", "OFFER LADDER (what the list receives)"],
];
// the four input artifacts (the criteria) ...
const INPUTS = [
  ["segment-criteria", "SEGMENT CRITERIA (account targeting)"],
  ["icp-titles", "ICP TITLES (contact personas)"],
  ["enrichment-spec", "ENRICHMENT SPEC (data points + qualify-gates)"],
  ["list-qualification", "LIST QUALIFICATION (the qualified/edge/not gate)"],
];
// ... and the recipe (the synthesis: signal -> qualified leads pipeline)
const RECIPE = ["discovery-recipe", "DISCOVERY RECIPE (the signal -> qualified-leads pipeline)"];

const TASK = {
  "segment-criteria": "Produce the account-level segment criteria for CIPO's cold-outreach list (source-agnostic; declare a Source Mode per §7).",
  "icp-titles": "Produce the contact-level ICP titles / persona tiers; name the email-acquisition waterfall + catch-all per doctrine §7.7.",
  "enrichment-spec": "Produce the enrichment spec: data points per account/contact, qualify-gate vs enrich-only, with the source for each (incl. §6 custom authoritative sources).",
  "list-qualification": "Produce the list-qualification gate: the deterministic qualified/edge/not verdict.",
  "discovery-recipe": "Produce the DISCOVERY RECIPE: the end-to-end, ordered, signal-driven pipeline that turns a live signal into qualified CIPO leads in a database, synthesizing the four input artifacts. For each step name the source/tool, the keying method, and the expected hit-rate/cost. Start from the strongest signal for this segment (e.g. USPTO PatentsView patent filings in our tech classes, per doctrine §6).",
};

async function latest(type) {
  const { data, error } = await db.from("canon_artifacts")
    .select("content_md, version, status").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).in("status", ["draft", "approved"]).order("version", { ascending: false }).limit(1);
  if (error) throw new Error(`${type}: ${error.message}`);
  return data?.[0] || null;
}
async function approvedMkt(type) {
  const { data } = await db.from("canon_artifacts")
    .select("content_md, version").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).eq("status", "approved").order("version", { ascending: false }).limit(1);
  return data?.[0] || null;
}
async function operatorNotes(type) {
  const { data } = await db.from("artifact_operator_notes")
    .select("note, author").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).order("created_at", { ascending: true });
  return data ?? [];
}
async function latestCritique(type) {
  const { data } = await db.from("artifact_critiques")
    .select("verdict, summary, pushback").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).order("created_at", { ascending: false }).limit(1);
  return data?.[0] || null;
}

const doctrine = await readFile(path.join(WORK_ROOT, DOCTRINE), "utf8");

async function build(target, role, hingeTypes) {
  let out = `# Drafting source — ${target} (CIPO)\n\n` +
    `Assembled from the doctrine + approved canon + sibling artifacts + the latest craft critique + expert\n` +
    `notes. This is the producer's only input; the governed ${target} is distilled FROM this.\n\n` +
    `TASK: ${TASK[target]}\n\n---\n\n## STANDARD: Targeting & Enrichment Doctrine\n\n${doctrine}\n`;

  for (const [type, r] of MARKETING) {
    const a = await approvedMkt(type);
    if (a) out += `\n---\n\n## ${r} (approved v${a.version})\n\n${a.content_md.trim()}\n`;
  }
  for (const [type, r] of hingeTypes) {
    const a = await latest(type);
    if (a) out += `\n---\n\n## HINGE — ${r} (${a.status} v${a.version})\n\n${a.content_md.trim()}\n`;
  }
  const crit = await latestCritique(target);
  if (crit && Array.isArray(crit.pushback) && crit.pushback.length) {
    out += `\n---\n\n## CRAFT REVIEW (deepline list-builder) — address these on this produce\nVerdict: ${crit.verdict}. ${crit.summary || ""}\n\n` +
      crit.pushback.map((p, i) => `${i + 1}. [${p.severity}] (${p.dimension}) ${p.issue}\n   FIX: ${p.fix}${p.providers ? `\n   PROVIDERS: ${p.providers}` : ""}`).join("\n") + "\n";
  }
  const notes = await operatorNotes(target);
  if (notes.length) {
    out += `\n---\n\n## OPERATOR / EXPERT NOTES (incorporate these ... domain knowledge the AI lacks)\n`;
    for (const n of notes) out += `\n- (${n.author}) ${n.note.trim()}\n`;
  }

  const dest = path.join(WORK_ROOT, "accounts/ventures", EID, "context/revops", `${target}.md`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, out, "utf8");
  console.log(`wrote ${target}.md (${out.length} chars)`);
}

// each input hinges on the OTHER inputs (so they cohere); the recipe hinges on ALL four inputs
for (const [type, role] of INPUTS) await build(type, role, INPUTS.filter(([t]) => t !== type));
await build(RECIPE[0], RECIPE[1], INPUTS);
