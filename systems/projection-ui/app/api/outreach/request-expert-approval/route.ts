import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route a produced copy sequence to Hermes (expert-liaison) for the SME's approval.
// The copy goes out in the expert's name, so the expert must certify it. Boris does NOT
// design the expert interaction ... this hands the artifact to Hermes via the EXISTING
// expert_exchanges mechanism (a drafted ask), which then lives in the /expert-liaison console
// where Hermes sends it and captures the expert's answer. We only compose a routable draft;
// Hermes refines + sends. The exchange is linked back to the sequence via metadata.sequence_id.

type Step = { order: number; action_type: string; delay_hours: number; subject?: string; copy: string };

function renderSequence(channel: string, frontEnd: string | null, steps: Step[], note?: { noted?: string }): string {
  const lines: string[] = [];
  lines.push(`Channel: ${channel}`);
  if (frontEnd) lines.push(`Leads with: ${frontEnd}`);
  lines.push("");
  if (note?.noted) lines.push(`Connect note: ${note.noted}`, "");
  for (const s of [...steps].sort((a, b) => a.order - b.order)) {
    const head = `${s.order}. [${s.action_type}${s.delay_hours ? ` +${s.delay_hours}h` : ""}]`;
    lines.push(s.subject ? `${head} Subject: ${s.subject}` : head);
    lines.push(s.copy, "");
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  let body: { sequence_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { sequence_id } = body;
  if (!sequence_id) return NextResponse.json({ ok: false, error: "sequence_id required" }, { status: 400 });

  const db = canonDb();
  const { data: seq, error: sErr } = await db.from("outreach_sequences")
    .select("id, engagement_type, engagement_id, channel, sender_expert_slug, front_end_offer, steps, note_variants")
    .eq("id", sequence_id).single();
  if (sErr || !seq) return NextResponse.json({ ok: false, error: sErr?.message || "sequence not found" }, { status: 404 });
  if (!seq.sender_expert_slug) return NextResponse.json({ ok: false, error: "sequence has no sender expert to route to" }, { status: 400 });

  const rendered = renderSequence(seq.channel, seq.front_end_offer, (seq.steps as Step[]) ?? [], seq.note_variants as { noted?: string });
  const subject = `Approve outreach copy (${seq.channel}) going out in your name`;
  const askBody =
    `This ${seq.channel} outreach sequence is written to go out under your name. Before anything sends, ` +
    `please confirm it represents you accurately ... flag anything that misstates your background, makes a claim ` +
    `you would not make, or that you would word differently. Nothing sends without your approval.\n\n` +
    `--- the sequence ---\n${rendered}`;

  const { data, error } = await db.rpc("record_expert_exchange", {
    p_expert_slug: seq.sender_expert_slug,
    p_engagement_type: seq.engagement_type,
    p_engagement_id: seq.engagement_id,
    p_subject: subject,
    p_body: askBody,
    p_artifact_types: [`outreach-sequence:${seq.channel}`],
    p_channel: "email",
    p_status: "drafted",
    p_metadata: { sequence_id: seq.id, channel: seq.channel, kind: "outreach-copy-approval" },
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const exchange = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ ok: true, exchange });
}
