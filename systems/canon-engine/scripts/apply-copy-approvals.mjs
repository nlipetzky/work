#!/usr/bin/env node
/**
 * apply-copy-approvals.mjs — the consume side of the copy sign-off membrane (INTRA-CANON).
 *
 * Mirrors the SHAPE of revops-engine/apply-expert-verdicts.mjs, but everything lives in the SAME
 * canon project (mzzjvoiwughcnmmqzbxv), so there is NO Management-API / cross-project hop. It uses
 * the local canon Supabase client + the RPCs directly.
 *
 * Reads resolved bindings from expert_binding_for_system('cold-outreach'). For each still-emitted
 * motion whose verdicts resolve to approve (or whose resolution is goal_satisfied / resolved_to_default),
 * it marks the motion consumed (apply-exactly-once), and IF the originating request payload carries a
 * sequence_id, it flips that outreach_sequences row draft -> approved via confirm_outreach_sequence.
 *
 * Usage: node scripts/apply-copy-approvals.mjs
 *
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY (loads /Users/nplmini/code/work/.env)
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";

// load .env (driver-style) — mirrors produce-sequence.mjs
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8").catch(() => ""))?.split("\n") ?? []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = process.env.CANON_SUPABASE_URL, SUPABASE_KEY = process.env.CANON_SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) fail("Missing CANON_SUPABASE_URL / CANON_SUPABASE_SERVICE_KEY");
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function fail(m) { console.error(`\n✗ ${m}\n`); process.exit(1); }

// resolutions that count as "approve" even without an explicit approved verdict
const APPROVING_RESOLUTIONS = new Set(["goal_satisfied", "resolved_to_default"]);

const { data: bindings, error: bindErr } = await db.rpc("expert_binding_for_system", { p_system: "cold-outreach" });
if (bindErr) fail(`expert_binding_for_system failed: ${bindErr.message}`);

let applied = 0, skipped = 0;

for (const b of bindings || []) {
  if ((b.binding_status || "emitted") !== "emitted") { continue; } // already consumed

  const verdicts = Array.isArray(b.verdicts) ? b.verdicts : [];
  const approvedByVerdict = verdicts.some((v) => v.verdict === "approved" || v.verdict === "approve");
  const approvedByResolution = APPROVING_RESOLUTIONS.has(b.resolution);
  if (!approvedByVerdict && !approvedByResolution) { skipped++; continue; } // declined / still-open rulings are not auto-applied

  // The originating request carries the sequence coordinates (sequence_id in payload).
  const { data: reqs, error: reqErr } = await db
    .from("expert_requests")
    .select("payload")
    .eq("motion_id", b.motion_id)
    .order("created_at", { ascending: true })
    .limit(1);
  if (reqErr) { console.error(`motion ${b.motion_id}: request lookup failed (${reqErr.message}), skipping`); skipped++; continue; }
  const payload = reqs?.[0]?.payload || {};
  const sequenceId = payload.sequence_id;

  // Flip the outreach_sequences row draft -> approved, if this request is about a produced sequence.
  if (sequenceId) {
    const { error: confErr } = await db.rpc("confirm_outreach_sequence", {
      p_sequence_id: sequenceId,
      p_confirmed_by: "expert-liaison",
    });
    if (confErr) { console.error(`motion ${b.motion_id}: confirm_outreach_sequence(${sequenceId}) failed (${confErr.message}), skipping`); skipped++; continue; }
  }

  const note = sequenceId ? `approved sequence ${sequenceId} (${b.expert_slug})` : `approved (${b.expert_slug})`;
  const { error: consErr } = await db.rpc("mark_motion_consumed", { p_motion_id: b.motion_id, p_note: note });
  if (consErr) { console.error(`motion ${b.motion_id}: mark_motion_consumed failed (${consErr.message})`); skipped++; continue; }

  console.log(`applied: motion ${b.motion_id} -> ${sequenceId ? `sequence ${sequenceId} approved` : "consumed (no sequence_id)"}`);
  applied++;
}

console.log(`apply-copy-approvals: applied=${applied}, skipped=${skipped}`);
