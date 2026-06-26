import { NextResponse } from "next/server";
import { commitPlan } from "@/lib/planning/commit";
import type { PlanDecision } from "@/lib/planning/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Commit an approved plan via the enforced moves (setWeeklyIntent / proposeProject / proposeTask).
export async function POST(req: Request) {
  try {
    const decision = (await req.json()) as PlanDecision;
    if (!decision || !Array.isArray(decision.moves)) {
      return NextResponse.json({ ok: false, error: "moves[] required" }, { status: 400 });
    }
    const result = await commitPlan(decision);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
