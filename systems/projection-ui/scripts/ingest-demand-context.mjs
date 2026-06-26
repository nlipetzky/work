// One-off seed: pull REAL transcripts from canon_engine and load them as demand-context
// capture events in revops-engine (public.dc_*). Captures only — verbatim transcript lines.
// Observations / patterns / artifacts are NOT fabricated; they're the operator's extraction
// work and stay empty until captured in the console.
//
// Run: node scripts/ingest-demand-context.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load .env.local manually (Node doesn't read it) ---
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const canon = createClient(env.CANON_SUPABASE_URL, env.CANON_SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
const revops = createClient(env.PROJECTION_SUPABASE_URL, env.PROJECTION_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function parseTranscript(raw) {
  const lines = raw.split(/\r?\n/);
  let start = 0;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === "Transcript") start = i + 1;
  const out = [];
  for (let i = start; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln) continue;
    const m = ln.match(/^([^:]{1,40}):\s*(.*)$/);
    if (m) {
      const who = m[1].trim();
      const text = m[2].trim();
      if (!text || text === "…") continue;
      out.push({ who, text, is_prospect: who !== "Nick Lipetzky" });
    } else if (out.length) {
      out[out.length - 1].text += " " + ln;
    }
  }
  return out;
}

const { data: transcripts, error: tErr } = await canon
  .from("transcripts")
  .select("id, transcript_title, account_name, meeting_type, meeting_date, participants, raw_transcript_text")
  .not("raw_transcript_text", "is", null)
  .gte("meeting_date", "2026-05-01")
  .order("meeting_date", { ascending: true });
if (tErr) throw tErr;

const usable = transcripts
  .filter((t) => t.raw_transcript_text.length > 4000 && t.raw_transcript_text.length < 30000)
  .slice(0, 6);

// idempotent: wipe any prior Konstellation demand account (cascades to its captures)
await revops.from("dc_accounts").delete().eq("name", "Konstellation AI");

const { data: acct, error: aErr } = await revops
  .from("dc_accounts")
  .insert({ name: "Konstellation AI", industry: "AI consulting · demand context", accent: "#5b9dff" })
  .select("id")
  .single();
if (aErr) throw aErr;

let n = 0;
for (const t of usable) {
  const lines = parseTranscript(t.raw_transcript_text);
  if (lines.length < 3) continue;
  n++;
  const others = (t.participants || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "Nick Lipetzky");
  const { error } = await revops.from("dc_captures").insert({
    account_id: acct.id,
    ref: "CE-" + String(n).padStart(2, "0"),
    company: others[0] || t.account_name,
    contact_role: t.account_name === "konstellationai" ? "Konstellation AI" : t.account_name,
    source: t.meeting_type || "Call transcript",
    event_date: t.meeting_date ? t.meeting_date.slice(0, 10) : null,
    status: "New",
    transcript: lines,
  });
  if (error) throw error;
  console.log(`  CE-${String(n).padStart(2, "0")}  ${others[0] || t.account_name}  (${lines.length} lines)`);
}

console.log(`\nIngested account "Konstellation AI" with ${n} capture events. Observations/patterns/artifacts: 0 (operator extraction).`);
