import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Judgment-unit actions for the /folder surface, all through the governed-write RPCs
// (never direct writes). Every branch returns { ok: true, <noun>: ... } or { ok: false, error }.
//   action=propose         -> record_judgment_unit   (a new unit, standing proposed)
//   action=ratify          -> ratify_judgment_unit    (to_standing 'active')
//   action=lock            -> ratify_judgment_unit    (to_standing 'locked')
//   action=veto            -> retire_judgment_unit     (sets retired_at)
//   action=route_to_expert -> route_unit_to_expert     (hand a unit to an expert)
//   action=sync            -> sync_unit_from_motion     (reconcile units from a motion)

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const action = body.action as string | undefined;
  const db = canonDb();

  if (action === "propose") {
    const {
      folder_slug, kind, assertion, provenance, proposed_by, ruling_kind,
      target_activity_id, target_option_id, target_recipe_id, trigger, reasoning,
      gate_posture, supersedes_id, motion_id, origin_session, origin_activity_run, metadata,
    } = body as {
      folder_slug?: string; kind?: string; assertion?: string; provenance?: string; proposed_by?: string;
      ruling_kind?: string; target_activity_id?: string; target_option_id?: string; target_recipe_id?: string;
      trigger?: Record<string, unknown>; reasoning?: string; gate_posture?: string; supersedes_id?: string;
      motion_id?: string; origin_session?: string; origin_activity_run?: string; metadata?: Record<string, unknown>;
    };
    if (!folder_slug || !kind || !assertion) {
      return NextResponse.json({ ok: false, error: "folder_slug, kind, assertion required" }, { status: 400 });
    }
    const { data, error } = await db.rpc("record_judgment_unit", {
      p_folder_slug: folder_slug,
      p_kind: kind,
      p_assertion: assertion,
      p_provenance: provenance ?? "human_injected",
      p_proposed_by: proposed_by ?? "operator",
      p_ruling_kind: ruling_kind ?? null,
      p_target_activity_id: target_activity_id ?? null,
      p_target_option_id: target_option_id ?? null,
      p_target_recipe_id: target_recipe_id ?? null,
      p_trigger: trigger ?? null,
      p_reasoning: reasoning ?? null,
      p_gate_posture: gate_posture ?? null,
      p_supersedes_id: supersedes_id ?? null,
      p_motion_id: motion_id ?? null,
      p_origin_session: origin_session ?? null,
      p_origin_activity_run: origin_activity_run ?? null,
      p_metadata: metadata ?? {},
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, unit: Array.isArray(data) ? data[0] : data });
  }

  if (action === "ratify" || action === "lock") {
    const { id, ratified_by } = body as { id?: string; ratified_by?: string };
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const { data, error } = await db.rpc("ratify_judgment_unit", {
      p_id: id,
      p_ratified_by: ratified_by ?? "operator",
      p_to_standing: action === "lock" ? "locked" : "active",
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, unit: Array.isArray(data) ? data[0] : data });
  }

  if (action === "veto") {
    const { id, by, reason } = body as { id?: string; by?: string; reason?: string };
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const { data, error } = await db.rpc("retire_judgment_unit", { p_id: id, p_by: by ?? "operator", p_reason: reason ?? null });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, unit: Array.isArray(data) ? data[0] : data });
  }

  if (action === "route_to_expert") {
    const { unit_id, engagement_type, engagement_id, expert_slug } = body as {
      unit_id?: string; engagement_type?: string; engagement_id?: string; expert_slug?: string;
    };
    if (!unit_id || !engagement_type || !engagement_id) {
      return NextResponse.json({ ok: false, error: "unit_id, engagement_type, engagement_id required" }, { status: 400 });
    }
    const { data, error } = await db.rpc("route_unit_to_expert", {
      p_unit_id: unit_id,
      p_engagement_type: engagement_type,
      p_engagement_id: engagement_id,
      p_expert_slug: expert_slug ?? null,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, request: Array.isArray(data) ? data[0] : data });
  }

  if (action === "sync") {
    const { folder_slug } = body as { folder_slug?: string };
    if (!folder_slug) return NextResponse.json({ ok: false, error: "folder_slug required" }, { status: 400 });
    const { data, error } = await db.rpc("sync_unit_from_motion", { p_folder_slug: folder_slug });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, units: Array.isArray(data) ? data : data ? [data] : [] });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
