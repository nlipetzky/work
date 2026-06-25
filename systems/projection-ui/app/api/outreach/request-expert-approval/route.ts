import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mark an item "for the SME's review" and hand it to Hermes (expert-liaison). The copy/offer
// goes out in (or commits) the expert's name, so the expert must certify it. Boris does NOT
// design the expert interaction ... this routes the item through the EXISTING expert_exchanges
// mechanism as a DRAFTED ask (a queued item, not an immediate send). The drafted asks collect
// in the /expert-liaison console; Hermes PACKAGES the batch into one coherent, non-overwhelming
// communication before sending (that packaging is the Expert Liaison build, owned by Hermes).
//
// Handles two item kinds:
//   { sequence_id }              -> an outreach_sequences row (copy)
//   { artifact_id, expert_slug } -> a canon_artifacts row (e.g. the offer ladder)

type Step = { order: number; action_type: string; delay_hours: number; subject?: string; copy: string };

function renderSequence(channel: string, frontEnd: string | null, steps: Step[], note?: { noted?: string }): string {
  const lines: string[] = [`Channel: ${channel}`];
  if (frontEnd) lines.push(`Leads with: ${frontEnd}`);
  lines.push("");
  if (note?.noted) lines.push(`Connect note: ${note.noted}`, "");
  for (const s of [...steps].sort((a, b) => a.order - b.order)) {
    const head = `${s.order}. [${s.action_type}${s.delay_hours ? ` +${s.delay_hours}h` : ""}]`;
    lines.push(s.subject ? `${head} Subject: ${s.subject}` : head, s.copy, "");
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  let body: { sequence_id?: string; artifact_id?: string; expert_slug?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const db = canonDb();

  let expert_slug: string | undefined;
  let engagement_type: string, engagement_id: string;
  let subject: string, askBody: string, artifact_types: string[];
  let metadata: Record<string, unknown>;

  if (body.sequence_id) {
    const { data: seq, error } = await db.from("outreach_sequences")
      .select("id, engagement_type, engagement_id, channel, sender_expert_slug, front_end_offer, steps, note_variants")
      .eq("id", body.sequence_id).single();
    if (error || !seq) return NextResponse.json({ ok: false, error: error?.message || "sequence not found" }, { status: 404 });
    if (!seq.sender_expert_slug) return NextResponse.json({ ok: false, error: "sequence has no sender expert" }, { status: 400 });
    expert_slug = seq.sender_expert_slug;
    engagement_type = seq.engagement_type; engagement_id = seq.engagement_id;
    subject = `Review outreach copy (${seq.channel}) going out in your name`;
    askBody =
      `This ${seq.channel} outreach sequence is written to go out under your name. Before anything sends, please ` +
      `confirm it represents you accurately ... flag anything that misstates your background, makes a claim you ` +
      `would not make, or that you would word differently.\n\n--- the sequence ---\n` +
      renderSequence(seq.channel, seq.front_end_offer, (seq.steps as Step[]) ?? [], seq.note_variants as { noted?: string });
    artifact_types = [`outreach-sequence:${seq.channel}`];
    metadata = { sequence_id: seq.id, channel: seq.channel, kind: "outreach-copy-approval" };
  } else if (body.artifact_id) {
    if (!body.expert_slug) return NextResponse.json({ ok: false, error: "expert_slug required for an artifact" }, { status: 400 });
    const { data: art, error } = await db.from("canon_artifacts")
      .select("id, engagement_type, engagement_id, artifact_type, content_md, version")
      .eq("id", body.artifact_id).single();
    if (error || !art) return NextResponse.json({ ok: false, error: error?.message || "artifact not found" }, { status: 404 });
    expert_slug = body.expert_slug;
    engagement_type = art.engagement_type; engagement_id = art.engagement_id;
    subject = `Review + certify: ${art.artifact_type} (v${art.version})`;
    askBody =
      `This ${art.artifact_type} sets the offer + pricing direction that downstream outreach commits in your name. ` +
      `Please review and certify it ... or flag the front-end offer you'd choose, anything on pricing (yours to set), ` +
      `and anything that misrepresents the work.\n\n--- ${art.artifact_type} v${art.version} ---\n${art.content_md}`;
    artifact_types = [art.artifact_type];
    metadata = { artifact_id: art.id, artifact_type: art.artifact_type, kind: "artifact-expert-review" };
  } else {
    return NextResponse.json({ ok: false, error: "sequence_id or artifact_id required" }, { status: 400 });
  }

  const { data, error } = await db.rpc("record_expert_exchange", {
    p_expert_slug: expert_slug,
    p_engagement_type: engagement_type,
    p_engagement_id: engagement_id,
    p_subject: subject,
    p_body: askBody,
    p_artifact_types: artifact_types,
    p_channel: "email",
    p_status: "drafted",
    p_metadata: metadata,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, exchange: Array.isArray(data) ? data[0] : data });
}
