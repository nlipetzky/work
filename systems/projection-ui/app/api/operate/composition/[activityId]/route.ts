import { NextResponse } from "next/server";
import {
  getActivityComposition,
  getActivityRuns,
  getActivityEvals,
} from "@/lib/queries/sopComposition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/operate/composition/<activityId>
// Returns the canon composition + recent runs + evals summary for the activity.
// Used by the Inspector's Composition panel (slice 2B).

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ activityId: string }> },
) {
  const { activityId } = await ctx.params;
  if (!activityId) {
    return NextResponse.json({ error: "activityId missing" }, { status: 400 });
  }
  try {
    const [composition, runs, evals] = await Promise.all([
      getActivityComposition(activityId),
      getActivityRuns(activityId, 5),
      getActivityEvals(activityId),
    ]);
    if (!composition) {
      return NextResponse.json(
        { error: `activity not found in canon.sop_activities: ${activityId}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ composition, runs, evals });
  } catch (e) {
    // Serialize all known shapes: Error, PostgrestError ({code, message, details, hint}), plain.
    const detail =
      e instanceof Error
        ? { message: e.message, stack: e.stack?.split("\n").slice(0, 4) }
        : typeof e === "object" && e !== null
          ? Object.fromEntries(
              ["code", "message", "details", "hint"]
                .map((k) => [k, (e as Record<string, unknown>)[k]])
                .filter(([, v]) => v !== undefined),
            )
          : { raw: String(e) };
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
