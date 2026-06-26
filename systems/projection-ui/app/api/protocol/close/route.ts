import { NextResponse } from "next/server";
import { getRun, updateRun } from "@/lib/protocol/runs";
import { mirror } from "@/lib/protocol/mirror";
import { logConversation } from "@/lib/moves";
import { MODELS } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Close out" — mirror the day, then log the session (agent_sessions row + next_session_pointer)
// so the next run resumes cleanly. Reuses the run id as the session id for a clean round-trip.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      run_id: string;
      title?: string;
      summary?: string;
      key_decisions?: string;
      action_items?: string;
      canon_refs?: string[];
      asset_refs?: string[];
      next_session_pointer?: string;
    };
    if (!body.run_id) return NextResponse.json({ ok: false, error: "run_id required" }, { status: 400 });

    const run = await getRun(body.run_id);
    const mirrorText = await mirror();
    const today = new Date().toISOString().slice(0, 10);
    const { id: sessionId } = await logConversation({
      session_id: body.run_id,
      title: body.title ?? `Daily protocol — ${today}`,
      summary: body.summary ?? mirrorText,
      key_decisions: body.key_decisions,
      action_items: body.action_items,
      canon_refs: body.canon_refs,
      asset_refs: body.asset_refs,
      next_session_pointer: body.next_session_pointer ?? run?.next_action?.first_5_minutes,
      model: MODELS.judgment,
    });
    const updated = await updateRun(body.run_id, {
      mirror: mirrorText,
      session_id: sessionId,
      step: "log",
      status: "done",
      ended: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, session_id: sessionId, mirror: mirrorText, run: updated });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
