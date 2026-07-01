#!/usr/bin/env node
/**
 * request-copy-signoff.mjs — ONE-SHOT: route the already-drafted CIPO Teardown cold copy
 * to Will for sign-off through the expert-liaison-engine (canon).
 *
 * The copy is ALREADY WRITTEN (copy-cipo-teardown-will-v1.md). This does NOT regenerate it.
 * It emits ONE record_expert_request carrying the 5 decisions from the Hermes brief, so Hermes
 * can triage it into a motion and project the decisions into the motion's goal_predicate.
 *
 * Idempotent on source_ref='cipo-teardown-copy-v1' (re-running does not create a duplicate).
 *
 * Usage:  node scripts/request-copy-signoff.mjs
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
function log(m) { console.log(m); }

// The already-drafted copy + the 5-decision brief (relative to the CIPO venture folder).
const COPY_REL = "accounts/ventures/konstellation-cipo/artifacts/copy-cipo-teardown-will-v1.md";
const BRIEF_REL = "accounts/ventures/konstellation-cipo/artifacts/hermes-brief-will-teardown-copy.md";
const copyPath = path.join(WORK_ROOT, COPY_REL);
const briefPath = path.join(WORK_ROOT, BRIEF_REL);

// Confirm both artifacts exist before emitting (we reference them, we do not re-author them).
for (const [label, p] of [["copy", copyPath], ["brief", briefPath]]) {
  const txt = await readFile(p, "utf8").catch(() => null);
  if (!txt || txt.trim().length < 50) fail(`${label} artifact missing or empty: ${p}`);
}

// The 5 decisions from hermes-brief-will-teardown-copy.md, in leverage order.
const decisions = [
  "Verify the FDA claim (name the first US FDA approval of an AI medical device)",
  "Founder-peer opening (OK to open cold as a fellow founder ending Phase 2)",
  "TABA wedge (use the ~$50K IP-earmark angle, and where in the sequence)",
  "Target segment (confirm venture-/grant-backed deep-tech / biotech / med-device founders)",
  "Copy-approval mechanism (per-variant vs changes-only vs first-template)",
];

const { data, error } = await db.rpc("record_expert_request", {
  p_request_type: "approval",
  p_engagement_type: "venture",
  p_engagement_id: "konstellation-cipo",
  p_expert_slug: "will-rosellini",
  p_concerning_system: "cold-outreach",
  p_source_system: "request-copy-signoff.mjs",
  p_source_ref: "cipo-teardown-copy-v1",
  p_subject: "Will sign-off: CIPO Teardown cold copy (5 decisions)",
  p_payload: { copy_path: COPY_REL, brief_path: BRIEF_REL, decisions },
});
if (error) fail(`record_expert_request failed: ${error.message}`);
const req = Array.isArray(data) ? data[0] : data;
log(`\n✓ expert sign-off request recorded (${req?.id}). Hermes triages this into a motion.\n`);
