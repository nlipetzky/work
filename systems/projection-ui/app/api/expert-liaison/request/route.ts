import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inbound expert_requests actions, all through the governed-write RPCs (never direct writes):
//   action=record      -> record_expert_request   (a system drops a new request, status open)
//   action=open_motion -> triage_expert_request    (decision=open: spin up a fresh motion)
//   action=attach      -> triage_expert_request    (decision=attach: fold into an existing motion)
//   action=dismiss     -> triage_expert_request    (decision=dismiss)

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const action = body.action as string | undefined;
  const db = canonDb();

  if (action === "record") {
    const {
      request_type, engagement_type, engagement_id, expert_slug, concerning_system,
      subject, body: reqBody, payload, source_system, source_ref, goal_key, target_type, target_ref,
      created_by, session_id,
    } = body as {
      request_type?: string; engagement_type?: string; engagement_id?: string; expert_slug?: string;
      concerning_system?: string; subject?: string; body?: string; payload?: Record<string, unknown>;
      source_system?: string; source_ref?: string; goal_key?: string; target_type?: string; target_ref?: string;
      created_by?: string; session_id?: string;
    };
    if (!request_type) {
      return NextResponse.json({ ok: false, error: "request_type required" }, { status: 400 });
    }
    const { data, error } = await db.rpc("record_expert_request", {
      p_request_type: request_type,
      p_engagement_type: engagement_type ?? null,
      p_engagement_id: engagement_id ?? null,
      p_expert_slug: expert_slug ?? null,
      p_concerning_system: concerning_system ?? null,
      p_subject: subject ?? null,
      p_body: reqBody ?? null,
      p_payload: payload ?? {},
      p_source_system: source_system ?? null,
      p_source_ref: source_ref ?? null,
      p_goal_key: goal_key ?? null,
      p_target_type: target_type ?? null,
      p_target_ref: target_ref ?? null,
      p_created_by: created_by ?? null,
      p_session_id: session_id ?? null,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, request: Array.isArray(data) ? data[0] : data });
  }

  if (action === "open_motion" || action === "attach" || action === "dismiss") {
    const { request_id, goal, goal_key, concerning_system, goal_predicate, bind_target, attach_motion_id } = body as {
      request_id?: string; goal?: string; goal_key?: string; concerning_system?: string;
      goal_predicate?: Record<string, unknown>; bind_target?: Record<string, unknown>; attach_motion_id?: string;
    };
    if (!request_id) return NextResponse.json({ ok: false, error: "request_id required" }, { status: 400 });
    if (action === "attach" && !attach_motion_id) {
      return NextResponse.json({ ok: false, error: "attach_motion_id required" }, { status: 400 });
    }
    const decision = action === "open_motion" ? "open" : action === "attach" ? "attach" : "dismiss";
    const { data, error } = await db.rpc("triage_expert_request", {
      p_request_id: request_id,
      p_decision: decision,
      p_goal: goal ?? null,
      p_goal_key: goal_key ?? null,
      p_concerning_system: concerning_system ?? null,
      p_goal_predicate: goal_predicate ?? null,
      p_bind_target: bind_target ?? null,
      p_attach_motion_id: attach_motion_id ?? null,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, motion: Array.isArray(data) ? data[0] : data });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
