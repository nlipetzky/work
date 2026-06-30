import { NextResponse } from "next/server";
import { getRun } from "@/lib/operate-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/operate/run/[runId]
// Tails the run-ledger row for a given run_id. The UI polls this every 1-2s
// while a run is active; switches to terminal-state UI on done/error.

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  const row = await getRun(runId);
  if (!row) {
    return NextResponse.json({ error: `run not found: ${runId}` }, { status: 404 });
  }
  return NextResponse.json(row);
}
