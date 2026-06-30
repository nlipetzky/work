import "server-only";
import { canonDb } from "@/lib/canon";
import type {
  AuthorityVector, Expert, ExchangeStatus, Exchange, RequestType, RequestStatus,
  ExpertRequest, MotionSatisfaction, MotionStatus, BallInCourt, NextActionKind,
  GoalPredicate, Motion, DueMotion,
} from "./expertLiaison-shared";

// Client-safe types + matchExpert live in ./expertLiaison-shared (no server-only) so "use client"
// components can import them. Re-export here so existing server importers keep one import path.
export * from "./expertLiaison-shared";

// Reads for the Expert Liaison console. Pure-canon: experts + expert_exchanges from
// canon_engine. The gap/needs queue reuses getGovernedArtifacts() and the curation ledger
// reuses getSourceAssessments() (composed in the page). No Gmail / external reads.

export async function getExperts(): Promise<Expert[]> {
  const { data, error } = await canonDb()
    .from("experts")
    .select("slug, name, core_title, summary, authority_vectors, linguistic_dna, expertise, source_files, contact, provenance")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    slug: e.slug, name: e.name, core_title: e.core_title ?? null, summary: e.summary ?? null,
    authority_vectors: (e.authority_vectors as AuthorityVector[] | null) ?? [],
    linguistic_dna: e.linguistic_dna ?? null,
    expertise: (e.expertise as string[] | null) ?? [],
    source_files: (e.source_files as string[] | null) ?? [],
    contact: (e.contact as Record<string, unknown> | null) ?? {},
    provenance: e.provenance ?? null,
  }));
}

export async function getExchanges(): Promise<Exchange[]> {
  const { data, error } = await canonDb()
    .from("expert_exchanges")
    .select("id, expert_slug, engagement_type, engagement_id, channel, subject, body, artifact_types, status, response, sent_at, answered_at, created_at, metadata")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((x) => ({
    id: x.id, expert_slug: x.expert_slug, engagement_type: x.engagement_type, engagement_id: x.engagement_id,
    channel: x.channel, subject: x.subject ?? null, body: x.body ?? null,
    artifact_types: (x.artifact_types as string[] | null) ?? [],
    status: x.status as ExchangeStatus, response: x.response ?? null,
    sent_at: x.sent_at ?? null, answered_at: x.answered_at ?? null, created_at: x.created_at,
    metadata: (x.metadata as Record<string, unknown> | null) ?? {},
  }));
}

// ---------------------------------------------------------------- Phase 2: inbound + motions
// The expert-liaison engine. Inbound = open expert_requests not yet triaged. Motions = the
// open/active goal-bearing exchanges with an expert, with their next-action clock and ball.

export async function getOpenRequests(): Promise<ExpertRequest[]> {
  const { data, error } = await canonDb()
    .from("expert_requests")
    .select("id, motion_id, request_type, target_type, target_ref, expert_slug, engagement_type, engagement_id, concerning_system, source_system, source_ref, goal_key, subject, body, payload, status, created_by, session_id, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id, motion_id: r.motion_id ?? null, request_type: r.request_type as RequestType,
    target_type: r.target_type ?? null, target_ref: r.target_ref ?? null, expert_slug: r.expert_slug ?? null,
    engagement_type: r.engagement_type ?? null, engagement_id: r.engagement_id ?? null,
    concerning_system: r.concerning_system ?? null, source_system: r.source_system ?? null,
    source_ref: r.source_ref ?? null, goal_key: r.goal_key ?? null, subject: r.subject ?? null,
    body: r.body ?? null, payload: (r.payload as Record<string, unknown> | null) ?? {},
    status: r.status as RequestStatus, created_by: r.created_by ?? null, session_id: r.session_id ?? null,
    created_at: r.created_at,
  }));
}

// Phase 4 — follow-up persistence. Motions whose next-action clock has fired (status='active'
// AND next_action_due <= now). The daily-protocol sweep (lib/queries/ranking.ts) folds these
// into the ranked next actions so an overdue motion surfaces as "Follow up with <expert> on
// <goal>" without anyone remembering. Mirrors the autonomous hourly Inngest cron in
// systems/expert-liaison-engine/workflows/. Read-only — never writes motion state.
export async function dueMotions(): Promise<DueMotion[]> {
  const { data, error } = await canonDb()
    .from("expert_motions")
    .select("id, expert_slug, goal, concerning_system, ball_in_court, next_action_kind, next_action_due")
    .eq("status", "active")
    .lte("next_action_due", new Date().toISOString())
    .order("next_action_due", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((m): m is typeof m & { next_action_due: string } => m.next_action_due != null)
    .map((m) => ({
      id: m.id,
      expert_slug: m.expert_slug ?? null,
      goal: m.goal ?? null,
      concerning_system: m.concerning_system ?? null,
      ball_in_court: (m.ball_in_court as BallInCourt | null) ?? null,
      next_action_kind: (m.next_action_kind as NextActionKind | null) ?? null,
      next_action_due: m.next_action_due,
    }));
}

export async function getMotions(): Promise<Motion[]> {
  const { data, error } = await canonDb()
    .from("expert_motions")
    .select("id, target_type, target_ref, expert_slug, engagement_type, engagement_id, concerning_system, goal, goal_key, goal_predicate, satisfaction, status, ball_in_court, next_action_due, next_action_kind, opened_from_request_ids, resolution, resolution_reason, bind_target, bound_at, meta, created_at, updated_at")
    .in("status", ["open", "active"])
    .order("next_action_due", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  const now = Date.now();
  return (data ?? []).map((m) => ({
    id: m.id, target_type: m.target_type ?? null, target_ref: m.target_ref ?? null,
    expert_slug: m.expert_slug ?? null, engagement_type: m.engagement_type ?? null,
    engagement_id: m.engagement_id ?? null, concerning_system: m.concerning_system ?? null,
    goal: m.goal ?? null, goal_key: m.goal_key ?? null,
    goal_predicate: (m.goal_predicate as GoalPredicate | null) ?? {},
    satisfaction: (m.satisfaction as MotionSatisfaction | null) ?? "none",
    status: m.status as MotionStatus, ball_in_court: (m.ball_in_court as BallInCourt | null) ?? null,
    next_action_due: m.next_action_due ?? null, next_action_kind: (m.next_action_kind as NextActionKind | null) ?? null,
    opened_from_request_ids: (m.opened_from_request_ids as string[] | null) ?? [],
    resolution: m.resolution ?? null, resolution_reason: m.resolution_reason ?? null,
    bind_target: (m.bind_target as Record<string, unknown> | null) ?? null, bound_at: m.bound_at ?? null,
    meta: (m.meta as Record<string, unknown> | null) ?? {}, created_at: m.created_at, updated_at: m.updated_at ?? null,
    overdue: m.next_action_due != null && new Date(m.next_action_due).getTime() < now,
  }));
}
