import { NextResponse } from "next/server";
import {
  canPlanRun,
  executeRun,
  findActivity,
  randomUUID,
  seedRun,
} from "@/lib/operate-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/operate/run
// Body: { activity_id: string, mode: "plan" | "execute" }
// Returns: { run_id } immediately. Child runner writes to public.prep_run_status
// as it progresses; the UI polls /api/operate/run/[runId] to tail the ledger.

export async function POST(req: Request) {
  let body: { activity_id?: string; mode?: string };
  try {
    body = (await req.json()) as { activity_id?: string; mode?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const activityId = body.activity_id;
  const mode = body.mode === "execute" ? "execute" : "plan";
  if (!activityId) {
    return NextResponse.json({ error: "missing activity_id" }, { status: 400 });
  }

  const found = findActivity(activityId);
  if (!found) {
    return NextResponse.json({ error: `activity not found: ${activityId}` }, { status: 404 });
  }
  const { activity, run } = found;

  if (mode === "execute") {
    return NextResponse.json(
      {
        error:
          "EXECUTE not wired in slice 1 — credit-spender confirm flow is a slice-2 build",
      },
      { status: 501 },
    );
  }

  const gate = canPlanRun(activity);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 409 });
  }

  const runId = randomUUID();
  try {
    await seedRun(runId, activityId, "plan");
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  // Fire-and-forget: the child writes to the ledger; the route returns immediately.
  executeRun(runId, activity, "plan", run);

  return NextResponse.json({ run_id: runId, activity_id: activityId, mode: "plan" });
}
