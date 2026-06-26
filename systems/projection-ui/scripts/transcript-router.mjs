// Canon Ingestion — autonomous transcript-arrival trigger.
// Detects new rows in canon_engine.public.transcripts past the trigger checkpoint and
// routes each to its consumer: an action_item in Atlas's inbox (capture_items) so the
// transcript is ingested and downstream systems update. Checkpointed + idempotent
// (deduped by metadata.transcript_id). Run autonomously by launchd every 5 min.
//
// Run manually: node scripts/transcript-router.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const canon = createClient(env.CANON_SUPABASE_URL, env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// 1. load the wired transcript trigger (its checkpoint)
const { data: trig, error: tErr } = await canon
  .from("system_triggers")
  .select("id, last_processed_at")
  .eq("event_type", "db_insert")
  .eq("source", "canon_engine.public.transcripts")
  .eq("status", "wired")
  .maybeSingle();
if (tErr) throw tErr;
if (!trig) { console.log("no wired transcript trigger; nothing to do"); process.exit(0); }

// 2. find transcripts arrived since the checkpoint
const since = trig.last_processed_at ?? "1970-01-01";
const { data: rows, error: rErr } = await canon
  .from("transcripts")
  .select("id, transcript_title, account_name, meeting_type, meeting_date, created_at")
  .gt("created_at", since)
  .order("created_at", { ascending: true });
if (rErr) throw rErr;

let routed = 0;
let maxCreated = since;
for (const t of rows ?? []) {
  if (t.created_at > maxCreated) maxCreated = t.created_at;
  // idempotent: skip if already routed
  const { data: existing } = await canon
    .from("capture_items")
    .select("id")
    .eq("source", "transcript")
    .filter("metadata->>transcript_id", "eq", t.id)
    .maybeSingle();
  if (existing) continue;

  const { error: cErr } = await canon.from("capture_items").insert({
    item_type: "action_item",
    source: "transcript",
    status: "open",
    title: `New transcript: ${t.transcript_title ?? t.account_name ?? "untitled"}`,
    body: "Auto-routed by the Canon Ingestion transcript trigger. Ingest into the corpus and update the downstream systems that consume calls (demand-context extraction, engagement context).",
    created_by: "system:transcript-router",
    metadata: { transcript_id: t.id, account_name: t.account_name, meeting_type: t.meeting_type, meeting_date: t.meeting_date },
  });
  if (cErr) throw cErr;
  routed++;
  console.log(`  routed ${t.transcript_title ?? t.id} -> Atlas inbox`);
}

// 3. advance checkpoint + stamp fire time
const { error: uErr } = await canon
  .from("system_triggers")
  .update({ last_processed_at: maxCreated, last_fired_at: new Date().toISOString() })
  .eq("id", trig.id);
if (uErr) throw uErr;

console.log(`transcript-router: ${rows?.length ?? 0} new since ${since}; ${routed} routed; checkpoint -> ${maxCreated}`);
