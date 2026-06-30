// Client-safe shared types + pure helpers for the Expert Liaison surface.
// NO "server-only" here: client components ("use client") import the types and matchExpert
// from this module. The data-fetching functions live in ./expertLiaison.ts (server-only),
// which re-exports everything here so existing server importers keep one import path.

export interface AuthorityVector { title: string; points: string[] }
export interface Expert {
  slug: string;
  name: string;
  core_title: string | null;
  summary: string | null;
  authority_vectors: AuthorityVector[];
  linguistic_dna: string | null;
  expertise: string[];
  source_files: string[];
  contact: Record<string, unknown>;
  provenance: string | null;
}

export type ExchangeStatus = "drafted" | "sent" | "answered" | "closed";
export interface Exchange {
  id: string;
  expert_slug: string;
  engagement_type: string;
  engagement_id: string;
  channel: string;
  subject: string | null;
  body: string | null;
  artifact_types: string[];
  status: ExchangeStatus;
  response: string | null;
  sent_at: string | null;
  answered_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

// Pick the expert whose expertise covers a required-expertise token. Pure — client-safe.
export function matchExpert(experts: Expert[], requiredExpertise: string[]): Expert | null {
  if (!requiredExpertise.length) return null;
  return experts.find((e) => e.expertise.some((x) => requiredExpertise.includes(x))) ?? null;
}

export type RequestType = "verdict" | "approval" | "direction" | "learning" | "onboarding";
export type RequestStatus = "open" | "triaged" | "attached" | "dismissed";
export interface ExpertRequest {
  id: string;
  motion_id: string | null;
  request_type: RequestType;
  target_type: string | null;
  target_ref: string | null;
  expert_slug: string | null;
  engagement_type: string | null;
  engagement_id: string | null;
  concerning_system: string | null;
  source_system: string | null;
  source_ref: string | null;
  goal_key: string | null;
  subject: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  status: RequestStatus;
  created_by: string | null;
  session_id: string | null;
  created_at: string;
}

export type MotionSatisfaction = "none" | "partial" | "full";
export type MotionStatus = "open" | "active" | "parked" | "achieved" | "abandoned";
export type BallInCourt = "expert" | "operator";
export type NextActionKind = "nudge" | "clarify" | "re_ask_revised" | "escalate" | "review_for_abandon";
export interface MotionLineItem { id: string; ask_label: string; state: string; exchange_id: string | null }
export interface GoalPredicate { rule?: string; line_items?: MotionLineItem[] }
export interface Motion {
  id: string;
  target_type: string | null;
  target_ref: string | null;
  expert_slug: string | null;
  engagement_type: string | null;
  engagement_id: string | null;
  concerning_system: string | null;
  goal: string | null;
  goal_key: string | null;
  goal_predicate: GoalPredicate;
  satisfaction: MotionSatisfaction;
  status: MotionStatus;
  ball_in_court: BallInCourt | null;
  next_action_due: string | null;
  next_action_kind: NextActionKind | null;
  opened_from_request_ids: string[];
  resolution: string | null;
  resolution_reason: string | null;
  bind_target: Record<string, unknown> | null;
  bound_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
  overdue: boolean;
}

// One overdue motion the operator owes a move on, shaped for the daily-protocol ranking.
export interface DueMotion {
  id: string;
  expert_slug: string | null;
  goal: string | null;
  concerning_system: string | null;
  ball_in_court: BallInCourt | null;
  next_action_kind: NextActionKind | null;
  next_action_due: string;
}
