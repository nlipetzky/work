#!/usr/bin/env node
/**
 * govern-artifacts.mjs — the Artifact Governance driver.
 *
 * The deterministic control loop for the system that designs, architects, and
 * builds other systems. CODE owns the process; the LLM is a *called function*
 * inside it (never the driver). Built directly on the 2026-06-23 agent-harness
 * research (practices/agentic-systems/reference/agent-harness-architecture-research-2026-06-23.md):
 *
 *   - Deterministic workflow, not an autonomous chat loop (Anthropic: workflows win for well-defined tasks).
 *   - Evaluator-optimizer: produce -> review-against-standard -> loop (bounded).
 *   - Verification ranked by robustness: deterministic RULES-GATE runs FIRST and hard-gates;
 *     the LLM-as-judge runs only on the fuzzy dimensions after the rules pass.
 *   - WRITES are single-threaded (one artifact at a time); no parallel-writer fan-out.
 *   - Context is isolated per artifact (only that artifact's inputs enter the window).
 *   - Each accepted draft is a governed, idempotent checkpoint via the propose_artifact RPC.
 *   - Human is oversight: AI produces the `draft`; a human `confirm` flips it to `approved`.
 *   - NO FABRICATION: the producer must emit INSUFFICIENT_SOURCE when inputs lack substance;
 *     the driver reports that artifact as blocked rather than inventing content.
 *
 * Governed writes go ONLY through the RPCs (propose_artifact / confirm_artifact),
 * never a direct INSERT — per the canon_engine _ai_context contract.
 *
 * Usage:
 *   node scripts/govern-artifacts.mjs status  <engagement_type> <engagement_id>
 *   node scripts/govern-artifacts.mjs run     <engagement_type> <engagement_id> [--artifact <type>] [--max-revisions 3]
 *   node scripts/govern-artifacts.mjs confirm <artifact_id> --by "<name>"
 *
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MODEL = "claude-opus-4-8";
const WORK_ROOT = "/Users/nplmini/code/work";

const SUPABASE_URL = process.env.CANON_SUPABASE_URL;
const SUPABASE_KEY = process.env.CANON_SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) fail("Missing CANON_SUPABASE_URL / CANON_SUPABASE_SERVICE_KEY");
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function fail(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1); }
function log(msg) { console.log(msg); }

// ---- deterministic rules gate (runs FIRST; the robust verification tier) ----
function checkRules(content, rules) {
  const failures = [];
  const lower = (content || "").toLowerCase();
  for (const rule of rules || []) {
    const [name, arg] = rule.split(":");
    if (name === "min_length") {
      if ((content || "").trim().length < Number(arg)) failures.push(`min_length: < ${arg} chars`);
    } else if (name === "no_markers") {
      const hits = arg.split(",").map(s => s.trim().toLowerCase()).filter(m => m && lower.includes(m));
      if (hits.length) failures.push(`no_markers: contains ${hits.join(", ")}`);
    } else if (name === "cites_source") {
      if (!/(\/[\w.-]+|\.md|\[\[)/.test(content || "")) failures.push("cites_source: no path/artifact reference found");
    } else if (name === "single_statement") {
      const cap = Number(arg) || 120;
      const body = (content || "").split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).join(" ");
      if (body.split(/\s+/).filter(Boolean).length > cap) failures.push(`single_statement: body exceeds ${cap} words`);
    } else if (name === "has_examples") {
      const bullets = (content || "").split("\n").filter(l => /^\s*[-*"]/.test(l)).length;
      if (bullets < 6 && !(lower.includes("in-voice") && lower.includes("out-of-voice")))
        failures.push("has_examples: needs >=6 sample lines or in/out-of-voice examples");
    }
  }
  return { pass: failures.length === 0, failures };
}

// ---- the LLM, as a called function (produce + review) ----
let anthropic = null;
function model() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) fail("Missing ANTHROPIC_API_KEY");
    anthropic = new Anthropic();
  }
  return anthropic;
}
async function callModel(system, user, maxTokens = 4000) {
  const r = await model().messages.create({
    model: MODEL, max_tokens: maxTokens, system,
    messages: [{ role: "user", content: user }],
  });
  return r.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
}

async function produce({ artifact_type, done_when, rubric, source, priorFeedback }) {
  const system =
    "You produce a single canon artifact for an agentic business. You are a called function, not an agent. " +
    "Use ONLY the provided source material. Do NOT invent facts, positioning, credentials, or an expert's POV. " +
    "If the source lacks the substance to meet the standard, output exactly 'INSUFFICIENT_SOURCE: <what is missing>' and nothing else. " +
    "House voice: no em dashes (use ellipses), no emojis, peer tone, specificity over abstraction.";
  const user =
    `ARTIFACT: ${artifact_type}\nDONE WHEN: ${done_when}\nSTANDARD (rubric): ${rubric || "(none)"}\n` +
    (priorFeedback ? `\nFIX THIS FEEDBACK FROM REVIEW:\n${priorFeedback}\n` : "") +
    `\nSOURCE MATERIAL:\n${source || "(none provided)"}\n\nReturn only the artifact content in markdown.`;
  return callModel(system, user);
}

async function review({ artifact_type, rubric, content }) {
  const system =
    "You are an adversarial reviewer scoring a canon artifact against its standard. " +
    "Judge only the fuzzy quality the rules cannot check. Be strict. " +
    "Output ONLY the JSON object, with no reasoning or text before or after it: " +
    "{\"pass\": boolean, \"feedback\": \"specific, actionable\"}.";
  const user = `ARTIFACT: ${artifact_type}\nSTANDARD: ${rubric || "(none)"}\n\nCONTENT:\n${content}`;
  const raw = await callModel(system, user, 1500);
  // robust extraction: the model sometimes prefixes prose before the JSON object
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { const j = JSON.parse(m[0]); return { pass: !!j.pass, feedback: j.feedback || "" }; } catch { /* fall through */ } }
  return { pass: false, feedback: `reviewer returned non-JSON: ${raw.slice(0, 200)}` };
}

// When an artifact can't be produced, the Assembler ARTICULATES what it needs:
// a one-line summary + concrete questions a human (or Expert Liaison, by email) can
// ask the domain expert to get the missing material. Stored on the manifest row.
async function assessNeeds({ artifact_type, done_when, rubric, source }) {
  const system =
    "You assess what input a canon artifact still needs to meet its standard. " +
    "Return STRICT JSON: {\"summary\": \"one sentence naming what is missing\", " +
    "\"questions\": [\"specific question to ask the domain expert\", ...]} with 3-6 questions. " +
    "Questions must be concrete and answerable by the expert in conversation or email. Do not invent answers.";
  const user = `ARTIFACT: ${artifact_type}\nSTANDARD (done when): ${done_when}\nRUBRIC: ${rubric || "(none)"}\n\nCURRENT SOURCE (insufficient):\n${source || "(empty)"}`;
  const raw = await callModel(system, user, 800);
  try {
    const j = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, "").trim());
    return { summary: j.summary || "", questions: Array.isArray(j.questions) ? j.questions : [] };
  } catch { return { summary: raw.slice(0, 200), questions: [] }; }
}
async function writeNeeds(et, eid, type, needs) {
  const { error } = await db.from("canon_artifact_manifest")
    .update({ needs, needs_assessed_at: needs ? new Date().toISOString() : null })
    .eq("engagement_type", et).eq("engagement_id", eid).eq("artifact_type", type);
  if (error) log(`  (needs write failed: ${error.message})`);
}

// ---- data access ----
async function manifest(et, eid) {
  const { data, error } = await db
    .from("canon_artifact_manifest")
    .select("artifact_type, required, standard_rules, standard_rubric, canon_artifact_types(layer, done_when)")
    .eq("engagement_type", et).eq("engagement_id", eid);
  if (error) fail(error.message);
  return data;
}
async function currentArtifacts(et, eid) {
  const { data, error } = await db
    .from("canon_artifacts")
    .select("id, artifact_type, version, status")
    .eq("engagement_type", et).eq("engagement_id", eid)
    .in("status", ["draft", "approved"]);
  if (error) fail(error.message);
  return data;
}
// engagement_type -> context folder root (tenant-type-aware; not venture-only).
function engagementRoot(et) {
  switch (et) {
    case "venture": return "accounts/ventures";
    case "client": return "accounts/clients";
    case "prospect": return "accounts/prospects";
    case "practice": return "practices";
    default: return `accounts/${et}s`;
  }
}
async function draftSource(et, eid, layer, artifact_type) {
  // The drafting surface: the engagement's context file is the producer's raw input.
  const p = path.join(WORK_ROOT, engagementRoot(et), eid, "context", layer, `${artifact_type}.md`);
  try { return { path: p, text: await readFile(p, "utf8") }; }
  catch { return { path: p, text: "" }; }
}

// ---- commands ----
async function cmdStatus(et, eid) {
  const man = await manifest(et, eid);
  if (!man.length) fail(`no manifest for ${et}/${eid}`);
  const cur = await currentArtifacts(et, eid);
  const byType = Object.fromEntries(cur.map(a => [a.artifact_type, a]));
  let approved = 0;
  log(`\nContext registry — ${et}/${eid}\n`);
  for (const m of man.sort((a, b) => a.artifact_type.localeCompare(b.artifact_type))) {
    const a = byType[m.artifact_type];
    const state = a ? `${a.status} v${a.version}` : "gap";
    if (a?.status === "approved") approved++;
    log(`  ${state === "gap" ? "·" : a.status === "approved" ? "✓" : "○"} ${m.artifact_type.padEnd(34)} ${state}`);
  }
  log(`\n  ${approved}/${man.length} approved.\n`);
}

async function cmdRun(et, eid, only, maxRev, force) {
  const man = (await manifest(et, eid)).filter(m => m.required && (!only || m.artifact_type === only));
  const cur = await currentArtifacts(et, eid);
  const have = new Set(cur.map(a => a.artifact_type)); // skip artifacts already in canon (unless --force)
  // SINGLE-THREADED writes: one artifact at a time, sequentially. No parallel fan-out.
  for (const m of man) {
    const type = m.artifact_type;
    if (have.has(type) && !force) { log(`— ${type}: already in canon, skipping (use --force to re-produce)`); continue; }
    const layer = m.canon_artifact_types?.layer;
    const doneWhen = m.canon_artifact_types?.done_when;
    const src = await draftSource(et, eid, layer, type);
    log(`\n▸ ${type} (${layer})`);
    let feedback = null, accepted = null;
    for (let rev = 1; rev <= maxRev; rev++) {
      const content = await produce({ artifact_type: type, done_when: doneWhen, rubric: m.standard_rubric, source: src.text, priorFeedback: feedback });
      if (content.startsWith("INSUFFICIENT_SOURCE")) { log(`  ⨂ blocked (needs input): ${content.slice(0, 160)}`); break; }
      const gate = checkRules(content, m.standard_rules);          // RULES FIRST
      if (!gate.pass) { feedback = `Rules failed: ${gate.failures.join("; ")}`; log(`  rev${rev} rules ✗ ${gate.failures.join("; ")}`); continue; }
      const verdict = await review({ artifact_type: type, rubric: m.standard_rubric, content }); // then LLM-judge
      if (!verdict.pass) { feedback = verdict.feedback; log(`  rev${rev} review ✗ ${verdict.feedback.slice(0, 160)}`); continue; }
      accepted = content; log(`  rev${rev} ✓ rules + review passed`); break;
    }
    if (!accepted) {
      // can't produce it yet — articulate what it needs so a human / Expert Liaison can collect it
      const needs = await assessNeeds({ artifact_type: type, done_when: doneWhen, rubric: m.standard_rubric, source: src.text });
      await writeNeeds(et, eid, type, needs);
      log(`  → needs recorded: ${needs.questions.length} question(s) for the expert`);
      continue;
    }
    // governed write / checkpoint: propose as draft (AI is approver-of-record)
    const { data, error } = await db.rpc("propose_artifact", {
      p_engagement_type: et, p_engagement_id: eid, p_artifact_type: type,
      p_name: type, p_content_md: accepted, p_path: src.path,
      p_approver: "creative-director/revops/canon (govern-artifacts)", p_approval_channel: "ai-review",
      p_approval_ref: null, p_metadata: { layer, driver: "govern-artifacts.mjs" },
    });
    if (error) { log(`  ✗ propose failed: ${error.message}`); continue; }
    const row = Array.isArray(data) ? data[0] : data;
    await writeNeeds(et, eid, type, null); // produced — clear any prior needs
    log(`  → proposed as draft v${row.version} (${row.id}). Awaiting human confirm.`);
  }
  log(`\nDone. Confirm drafts with: govern-artifacts.mjs confirm <id> --by "Nick"\n`);
}

async function cmdConfirm(id, by) {
  if (!by) fail("confirm requires --by \"<name>\"");
  const { data, error } = await db.rpc("confirm_artifact", { p_artifact_id: id, p_confirmed_by: by });
  if (error) fail(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  log(`✓ approved ${row.artifact_type} v${row.version} (confirmed by ${by}).`);
}

// ---- entry ----
const [cmd, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf(`--${n}`); return i >= 0 ? rest[i + 1] : d; };
if (cmd === "status") await cmdStatus(rest[0], rest[1]);
else if (cmd === "run") await cmdRun(rest[0], rest[1], flag("artifact"), Number(flag("max-revisions", 3)), rest.includes("--force"));
else if (cmd === "confirm") await cmdConfirm(rest[0], flag("by"));
else fail("usage: status|run|confirm (see header)");
