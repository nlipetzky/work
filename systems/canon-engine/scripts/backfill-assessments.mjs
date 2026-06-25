#!/usr/bin/env node
/**
 * backfill-assessments.mjs — seed the curation ledger with the CIPO lineage that was
 * proven BY HAND in the 2026-06-24 session (read Will transcripts + the Drive offering
 * doc + a Lexsy comp -> curated source -> Assembler produced the offering artifact).
 *
 * The automated assessor (Expert-Liaison-as-code, not yet built) will be the real writer;
 * this one-shot just makes the surface show true lineage instead of an empty table. It
 * records ONLY what the handoff documents as sourced this session, and leaves `snippet`
 * null where the verbatim passage wasn't captured (no fabrication).
 *
 * Write path is the SECURITY DEFINER RPC record_source_assessment (same discipline as
 * propose_artifact). Idempotent: refuses to double-insert unless --force (which clears
 * prior backfill rows for this engagement first).
 *
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY
 * Usage: node scripts/backfill-assessments.mjs [--force]
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.CANON_SUPABASE_URL;
const SUPABASE_KEY = process.env.CANON_SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\n✗ Missing CANON_SUPABASE_URL / CANON_SUPABASE_SERVICE_KEY\n");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const FORCE = process.argv.includes("--force");

const ENGAGEMENT = { type: "venture", id: "konstellation-cipo" };
const PROVENANCE = "hand-proven-backfill-2026-06-24";
const ASSESSED_BY = "expert-liaison/hermes (hand-proven)";
const OFFER_ARTIFACT_ID = "29c644e2-c7f5-4cd3-8ae6-cdd67ff0a533"; // offer-architecture-and-pricing v1 (draft)

// What was actually reviewed this session and fed into the offering. Transcript source_ids
// are the real public.transcripts UUIDs; the Drive doc + Lexsy comp are external references
// (not yet ingested into canon -> handoff item #5), so source_id carries their natural id.
const ROWS = [
  {
    source_type: "transcript",
    source_id: "2272b6b2-e517-48e2-82a2-5ed12de5dae7",
    source_locator: "2026-06-09 - konstellationai - Will Rosellini, Nick Lipetzky",
    outcome: "valuable",
    reasoning:
      "Will/Nick working session on the fractional-CIPO offering shape; fed the subscription model + tiering into offer-architecture-and-pricing.",
    artifact_type: "offer-architecture-and-pricing",
    artifact_id: OFFER_ARTIFACT_ID,
  },
  {
    source_type: "transcript",
    source_id: "cedda1ae-32f8-4266-845a-25fbe41d197b",
    source_locator: "2026-06-23 - konstellationai - Nick Lipetzky, Will Rosellini",
    outcome: "valuable",
    reasoning:
      "Follow-up session refining the offering (credits, IP Velocity Score, success fees, RPA); fed offer-architecture-and-pricing.",
    artifact_type: "offer-architecture-and-pricing",
    artifact_id: OFFER_ARTIFACT_ID,
  },
  {
    source_type: "document",
    source_id: "1aGNRzFtiTRb9sH7DZTlKfzqz_CwdU1q9kgQO7lhjbog",
    source_locator: "Drive: Will's 'PatentVest IP Intelligence Platform' pricing doc (re-pointed to Konstellation)",
    outcome: "valuable",
    reasoning:
      "Primary pricing source: Scout/Shield/Arsenal $2.5/5/10k tiers + credits + success fees. Re-pointed PatentVest -> Konstellation into offer-architecture-and-pricing.",
    artifact_type: "offer-architecture-and-pricing",
    artifact_id: OFFER_ARTIFACT_ID,
  },
  {
    source_type: "document",
    source_id: "lexsy.ai",
    source_locator: "Lexsy.ai competitor / pricing comparison (public)",
    outcome: "valuable",
    reasoning:
      "Comp used to sanity-check the subscription + credits structure and price points for offer-architecture-and-pricing.",
    artifact_type: "offer-architecture-and-pricing",
    artifact_id: OFFER_ARTIFACT_ID,
  },
];

async function main() {
  const { data: existing, error: exErr } = await db
    .from("source_assessments")
    .select("id")
    .eq("engagement_type", ENGAGEMENT.type)
    .eq("engagement_id", ENGAGEMENT.id)
    .eq("metadata->>provenance", PROVENANCE);
  if (exErr) { console.error(`\n✗ check failed: ${exErr.message}\n`); process.exit(1); }

  if (existing?.length) {
    if (!FORCE) {
      console.error(`\n✗ ${existing.length} backfill rows already present. Re-run with --force to replace.\n`);
      process.exit(1);
    }
    const ids = existing.map((r) => r.id);
    const { error: delErr } = await db.from("source_assessments").delete().in("id", ids);
    if (delErr) { console.error(`\n✗ clear failed: ${delErr.message}\n`); process.exit(1); }
    console.log(`cleared ${ids.length} prior backfill rows`);
  }

  let n = 0;
  for (const r of ROWS) {
    const { error } = await db.rpc("record_source_assessment", {
      p_source_type: r.source_type,
      p_source_id: r.source_id,
      p_source_locator: r.source_locator,
      p_engagement_type: ENGAGEMENT.type,
      p_engagement_id: ENGAGEMENT.id,
      p_assessed_by: ASSESSED_BY,
      p_outcome: r.outcome,
      p_reasoning: r.reasoning,
      p_snippet: null, // verbatim passage not captured in the hand-proven session; no fabrication
      p_artifact_type: r.artifact_type,
      p_artifact_id: r.artifact_id,
      p_fed_to_assembler: true,
      p_metadata: { provenance: PROVENANCE, note: "coarse hand-proven lineage; snippet-level extraction not captured" },
    });
    if (error) { console.error(`\n✗ insert failed (${r.source_locator}): ${error.message}\n`); process.exit(1); }
    n++;
    console.log(`recorded: ${r.source_type} ${r.source_locator} -> ${r.artifact_type}`);
  }
  console.log(`\n✓ backfilled ${n} assessments for ${ENGAGEMENT.type}/${ENGAGEMENT.id}\n`);
}

main();
