import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Motion actions, all through the governed-write RPCs (never direct writes):
//   action=compose  -> compose_motion_exchange  (draft an expert_exchange linked to the motion)
//   action=advance  -> advance_motion(follow_up)
//   action=resolve  -> advance_motion(resolve)
//   action=escalate -> advance_motion(escalate)
// The composed exchange then appears in the existing Asks / Review packets tabs.

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const action = body.action as string | undefined;
  const db = canonDb();

  if (action === "compose") {
    const { motion_id, subject, body: msgBody, line_item_id, channel } = body as {
      motion_id?: string; subject?: string; body?: string; line_item_id?: string; channel?: string;
    };
    if (!motion_id) return NextResponse.json({ ok: false, error: "motion_id required" }, { status: 400 });
    const { data, error } = await db.rpc("compose_motion_exchange", {
      p_motion_id: motion_id,
      p_subject: subject ?? null,
      p_body: msgBody ?? null,
      p_line_item_id: line_item_id ?? null,
      p_channel: channel ?? null,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, exchange: Array.isArray(data) ? data[0] : data });
  }

  if (action === "advance" || action === "resolve" || action === "escalate") {
    const { motion_id, payload } = body as { motion_id?: string; payload?: Record<string, unknown> };
    if (!motion_id) return NextResponse.json({ ok: false, error: "motion_id required" }, { status: 400 });
    const event = action === "advance" ? "follow_up" : action;
    const { data, error } = await db.rpc("advance_motion", {
      p_motion_id: motion_id,
      p_event: event,
      p_payload: payload ?? {},
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, motion: Array.isArray(data) ? data[0] : data });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
