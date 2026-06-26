import "server-only";
import { canonDb } from "@/lib/canon";
import { rankedNextActions } from "@/lib/queries/ranking";
import { listSystemsForRouting } from "@/lib/queries/systems";
import { systemStates } from "@/lib/queries/systemState";
import { hasRealSurface } from "@/lib/planning/guards";
import { structuredCall } from "@/lib/ai";
import type { NextAction } from "@/lib/protocol/types";

// Step 3 — Surface focus. The SCORE is deterministic (lib/ranking). The model only PHRASES why
// the top row is the lever + the first-5-minutes — SYSTEMS-FIRST (the first move is to run the
// system that produces this, or to build it; never Nick's manual labor) and accounting for what
// Nick already did (recent sent email). AI is a called function.

const SYSTEMS_DOCTRINE = `Nick is building a studio of SYSTEMS that do the work — the systems are the goal, not Nick's hands.
Reason systems-first for the first move:
1. Identify which system from the inventory should PRODUCE this output.
2. If that system has a REAL SURFACE (shown in the inventory), the first move is to OPEN that exact surface and trigger it — not to hand-produce anything.
3. If the producing system has NO SURFACE, is still building/emerging, or doesn't exist, the first move is to BUILD or advance it (route to Boris / Forge). Building the system IS the work here.
4. Only prescribe manual human work when it is irreducibly human — a decision, a relationship, an approval — and name it as such.
HONESTY (critical): the systems inventory is an aspirational MAP — most systems are planned, not built. NEVER tell Nick to "open" or "go to" a system unless it has a real surface listed. If it says NO SURFACE, it does not exist for him to open — say so and frame the move as building it. Never invent a surface, tool, or system Nick can't actually open. And never tell Nick to do by hand what a system should make.`;

const RATIONALE_SCHEMA = {
  type: "object" as const,
  properties: {
    why_lever: { type: "string", description: "One or two sentences: why this is the highest-leverage next move right now." },
    first_5_minutes: { type: "string", description: "The first move, SYSTEMS-FIRST: trigger the system that should produce this output (name it + its surface), or — if that system isn't live yet or doesn't exist — spec/build it (route to Boris / Forge). Only prescribe manual work if it's irreducible human judgment, and say so. Never tell Nick to hand-produce what a system should make. If a recent sent email shows a step is already done, give the actual next move instead." },
    produced_by: { type: ["string", "null"], description: "The system that should produce this output + its state, e.g. 'Forge Production (operating)' or 'no system yet — build it'." },
    recent_activity_note: { type: ["string", "null"], description: "Set ONLY when a recent sent email POSITIVELY shows Nick already did a step relevant to this action (quote what you saw). Otherwise null. NEVER use this to assert a step was NOT done — absence of email is not evidence." },
  },
  required: ["why_lever", "first_5_minutes"],
};

// Recent outbound email so the rationale can see what Nick already sent. Case-insensitive on
// direction (the ingestion casing is being reconciled — see the sent-email-ingestion handoff).
// "stale" is judged by LAG vs inbound, not an absolute age: a Sent leg that's broken-but-recent
// (newest sent only 2d old while inbound is current) must NOT be trusted to infer 'already-done'.
async function recentSentEmail(days = 7, limit = 12): Promise<{ stale: boolean; lines: string[] }> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const db = canonDb();
  const [{ data: out }, { data: lastIn }] = await Promise.all([
    db.from("email_messages").select("date, to_addresses, snippet").ilike("direction", "outbound").gte("date", since).order("date", { ascending: false }).limit(limit),
    db.from("email_messages").select("date").ilike("direction", "inbound").order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const rows = out ?? [];
  const newestOut = rows[0]?.date ? Date.parse(rows[0].date) : 0;
  const newestIn = lastIn?.date ? Date.parse(lastIn.date) : 0;
  // Untrustworthy if there's no sent mail at all, or sent lags inbound by 2+ days (a stalled leg).
  const lagDays = newestOut ? (newestIn - newestOut) / 86400000 : Infinity;
  const stale = lagDays >= 2;
  const lines = rows.map((r: any) => `- ${r.date?.slice(0, 10)} → ${r.to_addresses}: ${r.snippet ?? "(no snippet)"}`);
  return { stale, lines };
}

export async function computeNextAction(): Promise<NextAction | null> {
  const rank = await rankedNextActions();
  if (!rank.top) return null;
  const t = rank.top;
  const f = t.factors;
  const overrode = rank.overrodeUrgent
    ? `It outranks the more urgent "${rank.overrodeUrgent.beatTitle}" because its leverage compounds.`
    : "";

  const sent = await recentSentEmail();
  const caveat =
    "\nThis is NOT a complete record of Nick's actions (the Sent-ingestion leg is known-flaky). Only treat a step as done if you SEE an email for it here; otherwise recommend it normally — never claim a step is untouched/undone from its absence.";
  const emailBlock = sent.stale
    ? `RECENT SENT EMAIL: stale/incomplete — the Sent leg is lagging. Do NOT infer anything from what's missing; phrase the step normally.${caveat}`
    : sent.lines.length
      ? `RECENT SENT EMAIL (last 7d — if one positively shows a step is already done, account for it):\n${sent.lines.join("\n")}${caveat}`
      : `RECENT SENT EMAIL: none found in the last 7 days.${caveat}`;

  // Systems inventory so the first move routes to the system that PRODUCES this output.
  const [systems, states] = await Promise.all([listSystemsForRouting(), systemStates()]);
  const systemsBlock = systems
    .map((s) => {
      const ev = states.get(s.system_slug)?.state ?? "stub";
      const surf = hasRealSurface(s.runs_surface) && (ev === "beta" || ev === "operating") ? `OPEN AT: ${s.runs_surface}` : "NO RUNNABLE SURFACE — must be built";
      return `- ${s.name} [evidenced: ${ev}] ${surf}: ${(s.purpose ?? "").slice(0, 80)}`;
    })
    .join("\n");

  const out = await structuredCall<{ why_lever: string; first_5_minutes: string; recent_activity_note?: string | null; produced_by?: string | null }>({
    system:
      "You are Atlas, Nick's chief of staff. Explain the single next action you've computed. Be terse, concrete, peer-to-peer. No preamble. The score is decided by code — phrase WHY it's the lever and the systems-first first move.\n\n" +
      SYSTEMS_DOCTRINE,
    schemaName: "next_action_rationale",
    schema: RATIONALE_SCHEMA,
    maxTokens: 2400,
    prompt:
      `NEXT ACTION: ${t.title}\n` +
      `Goal: ${t.project?.goal?.title ?? "(orphan, no goal)"}\n` +
      `Leverage: ${t.leverage ?? "none"} / ${t.wealth_test ?? "?"}\n` +
      `Importance/Urgency: ${t.importance}/${t.urgency}; due ${t.due ?? "none"}\n` +
      `Score ${t.score} (base ${f.base} × leverage ${f.leverage_mult} × wealth ${f.wealth_mult} × area ${f.area_mult} × time ${f.time_mult}).\n` +
      `Existing first-5-min note (may be stale, may wrongly prescribe manual work): ${t.first_5_minutes ?? "(none)"}\n${overrode}\n\n` +
      `SYSTEM INVENTORY (which one should produce this? is it live?):\n${systemsBlock}\n\n` +
      `${emailBlock}\n\n` +
      `Give why_lever, a systems-first first_5_minutes, produced_by, and recent_activity_note.`,
  });
  return { rank, why_lever: out.why_lever, first_5_minutes: out.first_5_minutes, recent_activity_note: out.recent_activity_note ?? null, produced_by: out.produced_by ?? null };
}
