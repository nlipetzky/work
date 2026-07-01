#!/usr/bin/env node
/**
 * produce-sequence.mjs — the Outreach Producer's COPY driver (System M, Stage 2).
 *
 * Forks the govern-artifacts shape: CODE owns the loop, the LLM is a called function at
 * produce + judge only, the deterministic rules-gate runs FIRST, writes are single-threaded and
 * go through the record/confirm RPCs. No fabrication: INSUFFICIENT_SOURCE -> flagged, not invented.
 *
 * Copy HINGES on the APPROVED outreach-offer-ladder. If the offer is not approved, the driver
 * BLOCKS and names the gap. Every produced row carries its INPUT LINEAGE (provenance) and the
 * doctrine-compliance checklist.
 *
 * Usage:
 *   node scripts/produce-sequence.mjs run    <engagement_type> <engagement_id> <linkedin|email> [--offer "<label>"] [--max-revisions 3]
 *   node scripts/produce-sequence.mjs confirm <sequence_id> --by "<name>"
 *
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY (loads /Users/nplmini/code/work/.env)
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MODEL = "claude-opus-4-8";
const WORK_ROOT = "/Users/nplmini/code/work";

// load .env (driver-style)
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8").catch(() => ""))?.split("\n") ?? []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = process.env.CANON_SUPABASE_URL, SUPABASE_KEY = process.env.CANON_SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) fail("Missing CANON_SUPABASE_URL / CANON_SUPABASE_SERVICE_KEY");
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function fail(m) { console.error(`\n✗ ${m}\n`); process.exit(1); }
function log(m) { console.log(m); }

// ---- channel doctrine: the FORM standard + the deterministic shape ----
const REFUSED = ["agentic", "canon", "constellation", "orbit", "star system", "star-system"]; // brand terms that must not leak into cold copy
const CHANNELS = {
  linkedin: {
    doctrineFile: "practices/revops/reference/linkedin-outreach-doctrine.md",
    shape: "connect_note (with noted + noteless variants) -> dm (the weighted post-accept message) -> profile_visit (stacked with the DM) -> >=1 follow_up -> breakup",
    actionTypes: ["connect_note", "dm", "profile_visit", "follow_up", "breakup"],
  },
  email: {
    doctrineFile: "practices/revops/reference/cold-email-doctrine.md",
    shape: "email (the opener, with a subject) -> follow_up x2 (triple-tap, each with a subject) -> breakup. No link in the first email. Each body <= 6 sentences.",
    actionTypes: ["email", "follow_up", "breakup"],
  },
};

// ---- the LLM, as a called function ----
let _ai = null;
function ai() { if (!_ai) { if (!process.env.ANTHROPIC_API_KEY) fail("Missing ANTHROPIC_API_KEY"); _ai = new Anthropic(); } return _ai; }
async function callModel(system, user, maxTokens = 4000) {
  const r = await ai().messages.create({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
  return r.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
}
function parseJson(raw) {
  const t = raw.replace(/^```json?\s*|\s*```$/g, "").trim();
  try { return JSON.parse(t); } catch { return null; }
}

async function produce({ channel, cfg, offer, source, priorFeedback }) {
  const system =
    "You are the copy producer for an outreach system. You are a called function, not an agent. " +
    "Produce a cold-outreach sequence for ONE channel, in the sender (SME) voice, leading with the chosen front-end offer. " +
    "Use ONLY the provided source material. Do NOT invent the expert's POV, credentials, facts, positioning, or pricing. " +
    "Every line of copy must be traceable to the source: tag each step with a source_map. " +
    "If the source lacks what you need, set that step's copy to 'INSUFFICIENT_SOURCE: <what is missing>' and add a flag. " +
    "House voice: no em dashes (use ellipses), no emojis, plain language a person reads on a phone, concrete over abstract. " +
    "Return STRICT JSON ONLY, no prose, matching: " +
    '{"channel":"' + channel + '","front_end_offer":"<which offer this leads with>","sender_expert_slug":"will-rosellini",' +
    '"steps":[{"order":1,"action_type":"<one of: ' + cfg.actionTypes.join("|") + '>","delay_hours":0,"subject":"<email only, else empty>","copy":"<the message>","source_map":[{"line":"<short phrase from copy>","source":"<which input it traces to>"}]}],' +
    '"note_variants":{"noted":"<linkedin connect note <=300 chars>","noteless":true},"flags":["<any blocked/unsourced lines>"]}';
  const user =
    `CHANNEL: ${channel}\nREQUIRED SEQUENCE SHAPE: ${cfg.shape}\n` +
    `FRONT-END OFFER TO LEAD WITH: ${offer || "(choose the single strongest front-end offer from the approved offer ladder and state which in front_end_offer)"}\n` +
    `HARD RULES: connect notes/first email carry no link and no pricing figure; never call the expert an attorney/lawyer/counsel; ` +
    `do not use these brand words: ${REFUSED.join(", ")}; aim at a reply/raised hand, not a cold close.\n` +
    (priorFeedback ? `\nFIX THIS FEEDBACK:\n${priorFeedback}\n` : "") +
    `\nSOURCE MATERIAL (your only inputs):\n${source}`;
  return callModel(system, user, 4500);
}

async function judge({ channel, seq }) {
  const system =
    "You are an adversarial reviewer scoring an outreach sequence against the doctrine. Be strict. " +
    "Judge only the fuzzy quality the rules cannot: voice fidelity to the SME; the opener aims at a reply not a hard close; " +
    "no invented POV (source fidelity); low-resistance/interesting CTA; concrete-visual-falsifiable copy. " +
    'Return STRICT JSON: {"pass": boolean, "feedback": "specific, actionable"}.';
  const raw = await callModel(system, `CHANNEL: ${channel}\n\nSEQUENCE JSON:\n${JSON.stringify(seq, null, 2)}`, 1000);
  const j = parseJson(raw);
  return j ? { pass: !!j.pass, feedback: j.feedback || "" } : { pass: false, feedback: `reviewer non-JSON: ${raw.slice(0, 160)}` };
}

// ---- deterministic rules-gate (the doctrine as machine checks) ----
function sentenceCount(s) { return (String(s || "").match(/[.!?](\s|$)/g) || []).length || (s ? 1 : 0); }
function gate(channel, seq) {
  const steps = Array.isArray(seq.steps) ? seq.steps : [];
  const types = steps.map(s => s.action_type);
  const allCopy = (steps.map(s => `${s.subject || ""} ${s.copy || ""}`).join("\n") + " " + JSON.stringify(seq.note_variants || {})).toLowerCase();
  const has = t => types.includes(t);
  const checks = [];
  const add = (name, ok) => checks.push({ name, ok: !!ok });

  if (channel === "linkedin") {
    const note = String(seq.note_variants?.noted || steps.find(s => s.action_type === "connect_note")?.copy || "");
    add("shape:connect_note", has("connect_note"));
    add("shape:post-accept dm", has("dm"));
    add("shape:profile_visit stacked", has("profile_visit"));
    add("shape:>=1 follow_up", types.filter(t => t === "follow_up").length >= 1);
    add("shape:breakup", has("breakup"));
    add("connect note <=300 chars", note.length > 0 && note.length <= 300);
    add("connect note: no link", !/https?:\/\/|www\./i.test(note));
    add(">=3h delays", steps.some(s => s.order > 1 && Number(s.delay_hours) >= 3));
  } else {
    add("shape:opener email", has("email"));
    add("shape:triple-tap (>=2 follow_up)", types.filter(t => t === "follow_up").length >= 2);
    add("shape:breakup", has("breakup"));
    add("every email has a subject", steps.filter(s => s.action_type !== "breakup").every(s => String(s.subject || "").trim().length > 0));
    add("bodies <=6 sentences", steps.every(s => sentenceCount(s.copy) <= 6));
    const first = steps.find(s => s.action_type === "email");
    add("first email: no link", !!first && !/https?:\/\/|www\./i.test(String(first.copy || "")));
  }
  add("no refused brand words", !REFUSED.some(w => allCopy.includes(w)));
  add("no attorney/lawyer/counsel", !/\b(attorney|lawyer|counsel|law licen|practicing law)\b/i.test(allCopy));
  add("no pricing figure", !/\$\s?\d|\b\d{2,3}\s?k\b/i.test(allCopy));
  add("every step source-tagged", steps.length > 0 && steps.every(s => Array.isArray(s.source_map) && s.source_map.length > 0));
  add("no INSUFFICIENT_SOURCE lines", !allCopy.includes("insufficient_source"));

  const failures = checks.filter(c => !c.ok).map(c => c.name);
  return { pass: failures.length === 0, failures, checks };
}

// ---- data access ----
async function approvedArtifact(et, eid, type) {
  const { data, error } = await db.from("canon_artifacts")
    .select("id, content_md, version").eq("engagement_type", et).eq("engagement_id", eid)
    .eq("artifact_type", type).eq("status", "approved").order("version", { ascending: false }).limit(1);
  if (error) throw new Error(`${type}: ${error.message}`);
  return data?.[0] || null;
}
async function diskFile(rel) { try { return await readFile(path.join(WORK_ROOT, rel), "utf8"); } catch { return null; } }

// engagement_type -> context root
function engRoot(et) { return et === "venture" ? "accounts/ventures" : et === "client" ? "accounts/clients" : et === "prospect" ? "accounts/prospects" : et === "practice" ? "practices" : `accounts/${et}s`; }

async function assembleContract(et, eid, channel, cfg) {
  const inputs = [];           // provenance lineage
  const parts = [];            // the producer's source text

  // HINGE — approved offer ladder (block if missing)
  const ladder = await approvedArtifact(et, eid, "outreach-offer-ladder");
  if (!ladder) return { blocked: "HINGE missing: outreach-offer-ladder is not approved. Approve the offer ladder first." };
  inputs.push({ role: "HINGE", artifact_type: "outreach-offer-ladder", version: ladder.version, artifact_id: ladder.id });
  parts.push(`## HINGE — approved offer ladder (lead the copy with one of these front-end offers)\n${ladder.content_md}`);

  // SUBSTANCE — approved canon
  for (const t of ["customer-problem-model", "mechanism-of-action", "icp-and-disqualifiers"]) {
    const a = await approvedArtifact(et, eid, t);
    if (a) { inputs.push({ role: "SUBSTANCE", artifact_type: t, version: a.version, artifact_id: a.id }); parts.push(`## SUBSTANCE — ${t} (approved v${a.version})\n${a.content_md}`); }
    else inputs.push({ role: "SUBSTANCE", artifact_type: t, missing: true });
  }
  // HARD RULES — faithfulness
  const faith = await approvedArtifact(et, eid, "faithfulness-constraints");
  if (faith) { inputs.push({ role: "HARD_RULES", artifact_type: "faithfulness-constraints", version: faith.version, artifact_id: faith.id }); parts.push(`## HARD RULES — faithfulness-constraints (approved v${faith.version})\n${faith.content_md}`); }

  // VOICE — engagement context files (not canon-approved; recorded as file provenance)
  for (const rel of ["context/creative/voice-codex.md", "context/creative/controlled-lexicon.md"]) {
    const p = path.join(engRoot(et), eid, rel);
    const txt = await diskFile(p);
    if (txt && txt.trim().length > 50) { inputs.push({ role: "VOICE", file: p }); parts.push(`## VOICE — ${path.basename(rel)}\n${txt}`); }
    else inputs.push({ role: "VOICE", file: p, missing: true });
  }
  // FORM — the channel doctrine + the offer doctrine
  for (const rel of [cfg.doctrineFile, "practices/revops/reference/outreach-offer-doctrine.md"]) {
    const txt = await diskFile(rel);
    if (txt) { inputs.push({ role: "FORM", file: rel }); parts.push(`## FORM — ${path.basename(rel)}\n${txt}`); }
  }
  return { source: parts.join("\n\n---\n\n"), inputs };
}

// ---- commands ----
async function cmdRun(et, eid, channel, offer, maxRev) {
  const cfg = CHANNELS[channel];
  if (!cfg) fail(`channel must be one of: ${Object.keys(CHANNELS).join(", ")}`);
  log(`\n▸ produce ${channel} sequence for ${et}/${eid}`);
  const contract = await assembleContract(et, eid, channel, cfg);
  if (contract.blocked) { log(`  ⨂ blocked: ${contract.blocked}`); process.exit(2); }

  let feedback = null, accepted = null, lastGate = null;
  for (let rev = 1; rev <= maxRev; rev++) {
    const raw = await produce({ channel, cfg, offer, source: contract.source, priorFeedback: feedback });
    const seq = parseJson(raw);
    if (!seq || !Array.isArray(seq.steps)) { feedback = `Return STRICT JSON with a steps array. You returned: ${raw.slice(0, 120)}`; log(`  rev${rev} ✗ non-JSON`); continue; }
    const g = gate(channel, seq); lastGate = g;
    if (!g.pass) { feedback = `Rules failed: ${g.failures.join("; ")}`; log(`  rev${rev} rules ✗ ${g.failures.join("; ")}`); continue; }
    const v = await judge({ channel, seq });
    if (!v.pass) { feedback = v.feedback; log(`  rev${rev} judge ✗ ${v.feedback.slice(0, 140)}`); continue; }
    accepted = seq; log(`  rev${rev} ✓ rules + judge passed`); break;
  }
  if (!accepted) { log(`  → could not produce a passing ${channel} sequence in ${maxRev} revisions. Not written.`); process.exit(3); }

  const { data, error } = await db.rpc("record_outreach_sequence", {
    p_engagement_type: et, p_engagement_id: eid, p_channel: channel,
    p_steps: accepted.steps, p_sender_expert_slug: accepted.sender_expert_slug || "will-rosellini",
    p_front_end_offer: accepted.front_end_offer || offer || null,
    p_note_variants: accepted.note_variants || {}, p_flags: accepted.flags || [],
    p_rules_passed: lastGate.checks, p_inputs: contract.inputs,
    p_approver: "outreach-producer (produce-sequence.mjs)",
    p_metadata: { driver: "produce-sequence.mjs", model: MODEL },
  });
  if (error) fail(`record failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  log(`  → recorded ${channel} sequence draft v${row.version} (${row.id}). ${accepted.flags?.length ? `${accepted.flags.length} flag(s).` : ""} Awaiting human approve.\n`);

  // Emit the expert sign-off request through the expert-liaison-engine (soft-log; never fail the copy run).
  // source_ref = the sequence id makes this idempotent per produced sequence. Hermes triages it into a motion.
  try {
    const { data: reqData, error: reqError } = await db.rpc("record_expert_request", {
      p_request_type: "approval",
      p_engagement_type: et,
      p_engagement_id: eid,
      p_expert_slug: accepted.sender_expert_slug || "will-rosellini",
      p_concerning_system: "cold-outreach",
      p_source_system: "produce-sequence.mjs",
      p_source_ref: row.id,
      p_subject: `Copy sign-off: ${channel} sequence`,
      p_payload: { sequence_id: row.id, channel, flags: accepted.flags || [], version: row.version },
    });
    if (reqError) log(`  ⚠ expert-request emit soft-failed: ${reqError.message}`);
    else { const req = Array.isArray(reqData) ? reqData[0] : reqData; log(`  → expert sign-off request emitted (${req?.id}).`); }
  } catch (e) { log(`  ⚠ expert-request emit soft-failed: ${e.message}`); }
}

async function cmdConfirm(id, by) {
  if (!by) fail('confirm requires --by "<name>"');
  const { data, error } = await db.rpc("confirm_outreach_sequence", { p_sequence_id: id, p_confirmed_by: by });
  if (error) fail(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  log(`✓ approved ${row.channel} sequence v${row.version} (by ${by}).`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf(`--${n}`); return i >= 0 ? rest[i + 1] : d; };
if (cmd === "run") await cmdRun(rest[0], rest[1], rest[2], flag("offer"), Number(flag("max-revisions", 3)));
else if (cmd === "confirm") await cmdConfirm(rest[0], flag("by"));
else fail("usage: run <et> <eid> <linkedin|email> [--offer ..] | confirm <id> --by ..");
