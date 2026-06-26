import { NextResponse, type NextRequest } from "next/server";
import { createRun, updateRun, getRun } from "@/lib/protocol/runs";
import { orient } from "@/lib/protocol/orient";
import { precomputeTriage } from "@/lib/protocol/triage";
import { computeNextAction } from "@/lib/protocol/surface";
import { ritualFlags } from "@/lib/protocol/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET ?id= → fetch a run (used by the resumable /work/triage route).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const run = await getRun(id);
  if (!run) return NextResponse.json({ ok: false, error: "run not found" }, { status: 404 });
  return NextResponse.json({ ok: true, run });
}

// "Start my day" — runs the morning protocol: orient → triage pre-compute → surface next action →
// flag rituals. Persists everything on the run; leaves it awaiting Nick's triage commit.
export async function POST() {
  try {
    const run = await createRun();
    const [orientRes, proposals, nextAction, flags] = await Promise.all([
      orient(),
      precomputeTriage(),
      computeNextAction(),
      ritualFlags(),
    ]);
    const updated = await updateRun(run.id, {
      step: "surface",
      status: "awaiting_triage",
      orient: orientRes,
      triage_proposals: proposals,
      next_action: nextAction,
      flags,
    });
    return NextResponse.json({ ok: true, run: updated });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
