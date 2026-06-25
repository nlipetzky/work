#!/usr/bin/env node
/**
 * assess-sources.mjs — the Expert Liaison writer (handoff #4 core).
 *
 * The autonomous curation step: on new sources (meeting transcripts), judge relevance to the
 * artifacts still OPEN for an engagement and record what's valuable to the curation ledger
 * (source_assessments). Same doctrine as govern-artifacts.mjs: CODE owns the loop, the LLM is a
 * called function, deterministic rules gate first, single-threaded writes via the sanctioned RPC,
 * NO FABRICATION (the judge marks not_relevant rather than invent a connection).
 *
 * It ASSESSES + RECORDS only. It does NOT auto-modify an artifact's source (that stays a human/
 * console action — fed_to_assembler=false here). So the ledger fills autonomously; feeding the
 * Assembler remains gated.
 *
 * Checkpointed + idempotent: advances a dedicated system_triggers row; skips (source,artifact)
 * pairs already in the ledger. Mirrors scripts ../../projection-ui/scripts/transcript-router.mjs.
 *
 * Autonomous: launchd (com.nick.el-assessor) runs it on an interval; it only sees sources past
 * the checkpoint, so cost is bounded to genuinely new material.
 *
 * Manual / bounded:
 *   node scripts/assess-sources.mjs                          # autonomous mode (uses checkpoint)
 *   node scripts/assess-sources.mjs --since 2026-06-22 --limit 3   # bounded backfill / proof
 *   node scripts/assess-sources.mjs --engagement venture/konstellation-cipo --dry-run
 *
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY (sourced from work/.env).
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";
const TRIGGER_NAME = "Assess new sources for artifact relevance";

// account_name (on transcripts) -> the engagement those calls feed. Seeded for CIPO; extend here.
const ENGAGEMENT_ACCOUNTS = {
  "venture/konstellation-cipo": ["konstellationai"],
};

// ---- env (self-contained, for launchd) ----
function loadEnv() {
  for (const f of ["/Users/nplmini/code/work/.env", "/Users/nplmini/code/work/systems/projection-ui/.env.local"]) {
    try {
      for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch { /* file optional */ }
  }
}
loadEnv();

function fail(m) { console.error(`\n✗ ${m}\n`); process.exit(1); }
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
let _ai = null;
function ai() { if (!_ai) { if (!process.env.ANTHROPIC_API_KEY) fail("Missing ANTHROPIC_API_KEY"); _ai = new Anthropic(); } return _ai; }

// ---- flags ----
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const DRY = argv.includes("--dry-run");
const SINCE = flag("since");                       // override checkpoint (bounded run; does NOT advance checkpoint)
const LIMIT = Number(flag("limit", 0)) || 0;
const ONLY_ENG = flag("engagement");               // "venture/konstellation-cipo"

// ---- data access (mirrors govern-artifacts) ----
async function openArtifacts(et, eid) {
  // required artifacts that are NOT yet approved (gaps + drafts) — the ones still needing input.
  const [{ data: man, error: me }, { data: cur, error: ce }] = await Promise.all([
    db.from("canon_artifact_manifest").select("artifact_type, required, canon_artifact_types(done_when)").eq("engagement_type", et).eq("engagement_id", eid),
    db.from("canon_artifacts").select("artifact_type, id, version, status").eq("engagement_type", et).eq("engagement_id", eid).in("status", ["draft", "approved"]),
  ]);
  if (me) fail(me.message); if (ce) fail(ce.message);
  const live = new Map();
  for (const a of cur ?? []) { const p = live.get(a.artifact_type); if (!p || a.version > p.version) live.set(a.artifact_type, a); }
  return (man ?? []).filter((m) => m.required).map((m) => {
    const hit = live.get(m.artifact_type);
    return { artifact_type: m.artifact_type, done_when: m.canon_artifact_types?.done_when ?? null, artifact_id: hit?.id ?? null, status: hit?.status ?? "gap" };
  }).filter((a) => a.status !== "approved"); // approved = done; only assess against still-open artifacts
}

async function alreadyAssessed(sourceId, artifactType) {
  const { data } = await db.from("source_assessments").select("id").eq("source_id", sourceId).eq("artifact_type", artifactType).maybeSingle();
  return !!data;
}

// ---- the LLM, as a called function ----
async function judge(source, artifacts) {
  const system =
    "You assess whether a meeting transcript contains load-bearing material for specific business artifacts under governance. " +
    "You are a called function, not an agent. For EACH artifact, decide if the transcript genuinely contains substance that should feed it. " +
    "Be conservative: default to relevant=false. Do NOT invent a connection. Only relevant=true when there is a concrete passage. " +
    "When relevant, extract the load-bearing snippet (a short verbatim-ish quote/paraphrase) and one-line reasoning. " +
    'Return STRICT JSON: {"assessments":[{"artifact_type":"...","relevant":true|false,"snippet":"...","reasoning":"..."}]} covering every artifact given.';
  const list = artifacts.map((a) => `- ${a.artifact_type}: ${a.done_when ?? "(no done-when)"}`).join("\n");
  const user =
    `ARTIFACTS UNDER GOVERNANCE (decide relevance for each):\n${list}\n\n` +
    `TRANSCRIPT: ${source.transcript_title ?? source.id} (${source.meeting_date ?? ""})\n` +
    `SUMMARY: ${source.summary ?? "(none)"}\n` +
    `KEY DECISIONS: ${JSON.stringify(source.key_decisions ?? "")}\n` +
    `TOPICS: ${JSON.stringify(source.topics ?? "")}\n\n` +
    `TRANSCRIPT TEXT (truncated):\n${(source.raw_transcript_text ?? "").slice(0, 8000)}`;
  const r = await ai().messages.create({ model: MODEL, max_tokens: 1500, system, messages: [{ role: "user", content: user }] });
  const raw = r.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  try {
    const j = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, "").trim());
    return Array.isArray(j.assessments) ? j.assessments : [];
  } catch { console.error(`  (judge returned non-JSON: ${raw.slice(0, 160)})`); return []; }
}

// ---- main ----
async function main() {
  // 1. checkpoint trigger (skip the lookup if --since overrides)
  let trig = null;
  if (!SINCE) {
    const { data, error } = await db.from("system_triggers").select("id, last_processed_at").eq("name", TRIGGER_NAME).eq("status", "wired").maybeSingle();
    if (error) fail(error.message);
    if (!data) { console.log(`no wired trigger "${TRIGGER_NAME}"; register it first (or pass --since for a bounded run)`); return; }
    trig = data;
  }
  const since = SINCE ?? trig?.last_processed_at ?? "1970-01-01";

  // 2. which engagements have open artifacts + a source mapping
  let pairs = Object.entries(ENGAGEMENT_ACCOUNTS).map(([k, accounts]) => { const [et, eid] = k.split("/"); return { et, eid, accounts }; });
  if (ONLY_ENG) { const [et, eid] = ONLY_ENG.split("/"); pairs = pairs.filter((p) => p.et === et && p.eid === eid); }

  let assessedSources = 0, recorded = 0, maxCreated = since;
  for (const { et, eid, accounts } of pairs) {
    const open = await openArtifacts(et, eid);
    if (!open.length) { console.log(`${et}/${eid}: no open artifacts; skip`); continue; }

    let q = db.from("transcripts")
      .select("id, transcript_title, account_name, meeting_date, summary, key_decisions, topics, raw_transcript_text, created_at")
      .in("account_name", accounts).gt("created_at", since).order("created_at", { ascending: true });
    if (LIMIT) q = q.limit(LIMIT);
    const { data: sources, error } = await q;
    if (error) fail(error.message);
    console.log(`\n${et}/${eid}: ${open.length} open artifacts · ${sources?.length ?? 0} new source(s) since ${since}`);

    for (const s of sources ?? []) {
      if (s.created_at > maxCreated) maxCreated = s.created_at;
      assessedSources++;
      console.log(`▸ ${s.transcript_title ?? s.id}`);
      const verdicts = await judge(s, open);
      for (const v of verdicts) {
        if (!v.relevant) continue;
        const art = open.find((a) => a.artifact_type === v.artifact_type);
        if (!art) continue;
        if (await alreadyAssessed(s.id, v.artifact_type)) { console.log(`   = ${v.artifact_type}: already in ledger, skip`); continue; }
        if (DRY) { console.log(`   ~ ${v.artifact_type}: VALUABLE (dry-run, not written)`); continue; }
        const { error: re } = await db.rpc("record_source_assessment", {
          p_source_type: "transcript", p_source_id: s.id, p_source_locator: s.transcript_title ?? s.id,
          p_engagement_type: et, p_engagement_id: eid, p_assessed_by: "expert-liaison/assessor",
          p_outcome: "valuable", p_reasoning: v.reasoning ?? null, p_snippet: v.snippet ?? null,
          p_artifact_type: v.artifact_type, p_artifact_id: art.artifact_id, p_fed_to_assembler: false,
          p_metadata: { assessor: true, model: MODEL },
        });
        if (re) { console.log(`   ✗ record failed (${v.artifact_type}): ${re.message}`); continue; }
        recorded++; console.log(`   ✓ ${v.artifact_type}: recorded valuable`);
      }
    }
  }

  // 3. advance checkpoint (only in autonomous mode; never on a --since bounded/proof run)
  if (trig && !SINCE && !DRY && maxCreated !== since) {
    await db.from("system_triggers").update({ last_processed_at: maxCreated, last_fired_at: new Date().toISOString() }).eq("id", trig.id);
  } else if (trig && !SINCE && !DRY) {
    await db.from("system_triggers").update({ last_fired_at: new Date().toISOString() }).eq("id", trig.id);
  }

  console.log(`\nassess-sources: ${assessedSources} source(s) assessed; ${recorded} valuable recorded${DRY ? " (dry-run)" : ""}${trig && !SINCE ? `; checkpoint -> ${maxCreated}` : ""}\n`);
}

main();
