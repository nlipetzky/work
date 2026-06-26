import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";
import { composePacket, type PacketMemberInput } from "@/lib/packets/produce";
import { toPlainText } from "@/lib/text/plain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Expert Liaison review-packet actions, all through the governed-write RPCs (never direct writes):
//   action=package -> run the produce->judge loop over an expert's drafted asks, fold the verbatim
//                     reviewable copy in as a plain-text appendix, persist via record_review_packet
//   action=send    -> send_review_packet      (advances packet + its drafted members to sent)
//   action=answer  -> record_packet_answer    (captures reply, distributes per-member verdicts)
// The composed body is plain text (no markdown) so Nick copy-pastes it straight into Gmail.

function metaStr(m: Record<string, unknown> | null | undefined, k: string): string | null {
  const v = (m ?? {})[k];
  return typeof v === "string" ? v : null;
}

// Fold the cover + verbatim member copy into one plain-text, paste-ready email body.
function assembleBody(cover: string, members: { id: string; subject: string | null; body: string | null }[], order: string[]): string {
  const byId = new Map(members.map((m) => [m.id, m]));
  const ids = order.length ? order : members.map((m) => m.id);
  const appendix = ids
    .map((mid, i) => {
      const m = byId.get(mid);
      if (!m) return null;
      return `${i + 1}. ${toPlainText(m.subject ?? "")}\n\n${toPlainText(m.body ?? "")}`;
    })
    .filter(Boolean)
    .join("\n\n----------------------------------------\n\n");
  return (
    `${toPlainText(cover)}\n\n` +
    `========================================\nFOR YOUR REVIEW — full detail below (read only if you want to go deeper)\n========================================\n\n` +
    appendix
  );
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const action = body.action as string | undefined;
  const db = canonDb();

  if (action === "package") {
    const { expert_slug, engagement_type, engagement_id } = body as {
      expert_slug?: string; engagement_type?: string; engagement_id?: string;
    };
    if (!expert_slug || !engagement_type || !engagement_id) {
      return NextResponse.json({ ok: false, error: "expert_slug, engagement_type, engagement_id required" }, { status: 400 });
    }

    const [{ data: exRows, error: exErr }, { data: expRows, error: expErr }] = await Promise.all([
      db.from("expert_exchanges")
        .select("id, subject, body, status, metadata")
        .eq("expert_slug", expert_slug).eq("engagement_type", engagement_type).eq("engagement_id", engagement_id)
        .eq("status", "drafted")
        .order("created_at", { ascending: true }),
      db.from("experts").select("name, summary, contact").eq("slug", expert_slug).limit(1),
    ]);
    if (exErr) return NextResponse.json({ ok: false, error: exErr.message }, { status: 400 });
    if (expErr) return NextResponse.json({ ok: false, error: expErr.message }, { status: 400 });

    const expert = (expRows ?? [])[0] as { name?: string; summary?: string; contact?: { email?: string } } | undefined;
    const members: PacketMemberInput[] = (exRows ?? []).map((x) => ({
      id: x.id,
      subject: x.subject ?? null,
      body: x.body ?? null,
      kind: metaStr(x.metadata as Record<string, unknown>, "kind"),
      artifact_id: metaStr(x.metadata as Record<string, unknown>, "artifact_id"),
      sequence_id: metaStr(x.metadata as Record<string, unknown>, "sequence_id"),
      status: x.status,
    }));

    const result = await composePacket({
      expertSlug: expert_slug,
      expertName: expert?.name ?? expert_slug,
      expertEmail: expert?.contact?.email ?? null,
      expertSummary: expert?.summary ?? null,
      engagementType: engagement_type,
      engagementId: engagement_id,
      members,
    });

    if (!result.ok || !result.draft) {
      return NextResponse.json({ ok: false, error: result.error, gate: result.gate }, { status: 422 });
    }

    // fold the verbatim reviewable copy into the cover as a plain-text appendix (no portal yet);
    // the stored composed_body is the full paste-ready email.
    const fullBody = assembleBody(
      result.draft.body,
      (exRows ?? []).map((x) => ({ id: x.id, subject: x.subject ?? null, body: x.body ?? null })),
      result.draft.item_order,
    );

    const { data, error } = await db.rpc("record_review_packet", {
      p_expert_slug: expert_slug,
      p_engagement_type: engagement_type,
      p_engagement_id: engagement_id,
      p_member_exchange_ids: members.map((m) => m.id),
      p_composed_subject: result.draft.subject,
      p_composed_body: fullBody,
      p_item_order: result.draft.item_order,
      p_doctrine_version: result.doctrineVersion,
      p_rules_passed: result.rulesPassed,
      p_judge_notes: result.judgeNotes,
      p_metadata: { per_item: result.draft.per_item },
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, packet: Array.isArray(data) ? data[0] : data, judgeNotes: result.judgeNotes });
  }

  if (action === "send") {
    const { id } = body as { id?: string };
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const { data, error } = await db.rpc("send_review_packet", { p_id: id });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, packet: Array.isArray(data) ? data[0] : data });
  }

  if (action === "answer") {
    const { id, response, member_verdicts } = body as {
      id?: string; response?: string; member_verdicts?: Record<string, string>;
    };
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const { data, error } = await db.rpc("record_packet_answer", {
      p_id: id,
      p_response: response ?? null,
      p_member_verdicts: member_verdicts ?? {},
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, packet: Array.isArray(data) ? data[0] : data });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
