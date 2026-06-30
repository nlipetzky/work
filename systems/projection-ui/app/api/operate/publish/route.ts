import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/operate/publish
// Body: { activityId: string, version?: number, by?: string }
//
// Publishes an activity draft to current. If `version` is omitted, publishes the
// highest version for the activity (the latest ITERATE/BUILD draft). Calls the
// publish_activity_version RPC, which demotes the prior current row and promotes
// the target in one transaction. No-op (with a clear message) if the highest
// version is already current.

export async function POST(req: Request) {
  let body: { activityId?: string; version?: number; by?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const activityId = body.activityId?.trim();
  if (!activityId) {
    return NextResponse.json({ error: "activityId required" }, { status: 400 });
  }

  const db = canonDb();
  try {
    // Resolve target version + current state.
    const { data: rows, error: readErr } = await db
      .from("sop_activities")
      .select("version, is_current")
      .eq("activity_id", activityId)
      .order("version", { ascending: false });
    if (readErr) {
      return NextResponse.json(
        { error: { code: readErr.code, message: readErr.message } },
        { status: 500 },
      );
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: `activity not found: ${activityId}` }, { status: 404 });
    }

    const target = body.version ?? (rows[0].version as number);
    const targetRow = rows.find((r) => r.version === target);
    if (!targetRow) {
      return NextResponse.json(
        { error: `version ${target} not found for ${activityId}` },
        { status: 404 },
      );
    }
    if (targetRow.is_current === true) {
      return NextResponse.json({
        ok: true,
        noop: true,
        activityId,
        version: target,
        message: `v${target} is already current`,
      });
    }

    const { data, error } = await db.rpc("publish_activity_version", {
      p_activity_id: activityId,
      p_version: target,
      p_by: body.by ?? "operate-ui",
    });
    if (error) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, activityId, version: target, row: data });
  } catch (e) {
    const detail = e instanceof Error ? { message: e.message } : { raw: String(e) };
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
