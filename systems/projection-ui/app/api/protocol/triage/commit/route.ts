import { NextResponse } from "next/server";
import { commitTriage, openItemCount } from "@/lib/protocol/triage";
import { updateRun } from "@/lib/protocol/runs";
import type { TriageDecision } from "@/lib/protocol/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Commit Nick's approved/overridden triage decisions via the enforced semantic moves.
// Inbox must end empty; the run advances to awaiting_close only when open count hits 0.
export async function POST(req: Request) {
  try {
    const { run_id, decisions } = (await req.json()) as { run_id: string; decisions: TriageDecision[] };
    if (!run_id || !Array.isArray(decisions)) {
      return NextResponse.json({ ok: false, error: "run_id and decisions[] required" }, { status: 400 });
    }
    const committed = await commitTriage(run_id, decisions);
    const remaining = await openItemCount();
    const run = await updateRun(run_id, {
      committed,
      step: "triage",
      status: remaining === 0 ? "awaiting_close" : "awaiting_triage",
    });
    return NextResponse.json({ ok: true, committed, open_remaining: remaining, run });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
