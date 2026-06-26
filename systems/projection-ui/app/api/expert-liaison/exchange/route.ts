import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";
import { toPlainText } from "@/lib/text/plain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Expert Liaison console actions, all through the governed-write RPCs (never direct writes):
//   action=create      -> record_expert_exchange  (compose a new ask, status drafted)
//   action=update      -> update_expert_exchange  (edit body / advance status / record response)
//   action=set_contact -> set_expert_contact      (set an expert's email etc.)
// Pure-canon: no Gmail. Sending the ask happens in the user's own mail client (mailto from the UI).

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const action = body.action as string | undefined;
  const db = canonDb();

  if (action === "create") {
    const { expert_slug, engagement_type, engagement_id, subject, ask_body, artifact_types } = body as {
      expert_slug?: string; engagement_type?: string; engagement_id?: string;
      subject?: string; ask_body?: string; artifact_types?: string[];
    };
    if (!expert_slug || !engagement_type || !engagement_id) {
      return NextResponse.json({ ok: false, error: "expert_slug, engagement_type, engagement_id required" }, { status: 400 });
    }
    const { data, error } = await db.rpc("record_expert_exchange", {
      p_expert_slug: expert_slug, p_engagement_type: engagement_type, p_engagement_id: engagement_id,
      p_subject: subject ?? null, p_body: ask_body != null ? toPlainText(ask_body) : null, p_artifact_types: artifact_types ?? [],
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, exchange: Array.isArray(data) ? data[0] : data });
  }

  if (action === "update") {
    const { id, subject, ask_body, status, response } = body as {
      id?: string; subject?: string; ask_body?: string; status?: string; response?: string;
    };
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const nowIso = new Date().toISOString();
    const { data, error } = await db.rpc("update_expert_exchange", {
      p_id: id,
      p_subject: subject ?? null,
      p_body: ask_body != null ? toPlainText(ask_body) : null,
      p_status: status ?? null,
      p_response: response ?? null,
      p_sent_at: status === "sent" ? nowIso : null,
      p_answered_at: status === "answered" ? nowIso : null,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, exchange: Array.isArray(data) ? data[0] : data });
  }

  if (action === "set_contact") {
    const { slug, email } = body as { slug?: string; email?: string };
    if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
    const { data, error } = await db.rpc("set_expert_contact", {
      p_slug: slug, p_contact: email ? { email } : {},
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, expert: Array.isArray(data) ? data[0] : data });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
