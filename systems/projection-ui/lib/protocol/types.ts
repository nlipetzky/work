// Shared types for the daily-protocol runner. Pure (no server-only) so the surface can import them.
import type { RankResult } from "@/lib/ranking";

export type RunStatus = "running" | "awaiting_triage" | "awaiting_close" | "done" | "abandoned";

export interface FreshnessEntry {
  source: string;
  last_ingest: string | null;
  stale_days: number | null;
}

export interface OrientResult {
  where_we_left_off: string;
  last_session_title: string | null;
  freshness: FreshnessEntry[];
}

export type TriageVerdict = "do" | "delegate" | "automate" | "drop";
export type PromoteShape = "task" | "project" | "consider" | "close";
export type SpineArea = "Client engagement" | "Prospect engagement" | "Infrastructure" | "Finance" | "Admin" | "Personal";

export interface TriageDraft {
  title: string;
  // task shape
  project_id?: string | null;
  importance?: "important" | "not_important";
  urgency?: "urgent" | "not_urgent";
  first_5_minutes?: string;
  // project shape
  goal_id?: string | null;
  area?: SpineArea;
  outcome?: string;
  // close shape
  close_status?: "deferred" | "resolved" | "dismissed";
  close_note?: string;
  // carried for provenance
  canon_ref?: string;
}

// One pre-computed triage proposal Atlas presents for one-click approve/override.
export interface TriageProposal {
  item_id: string;
  title: string;
  item_type: string;
  source: string;
  created_by: string | null;
  verdict: TriageVerdict;
  shape: PromoteShape; // how it lands on the spine if approved
  ladder_goal_id: string | null;
  ladder_goal_title: string | null;
  dedupe_note: string | null; // "looks like existing project X" or null
  rationale: string;
  // Draft fields for the promotion (editable by Nick before commit):
  draft: TriageDraft;
}

// What the surface sends back per item at commit (Nick's approved/overridden decision).
export interface TriageDecision {
  item_id: string;
  shape: PromoteShape;
  draft: TriageDraft;
}

export interface CommittedItem {
  item_id: string;
  shape: PromoteShape;
  spine_id: string | null;
}

export interface RitualFlag {
  kind: "weekly_intent_stale" | "stale_project" | "urgency_drift";
  message: string;
  ref_id?: string;
}

export interface NextAction {
  rank: RankResult;
  why_lever: string;
  first_5_minutes: string;
  // What recent sent email Atlas factored in (so it doesn't recommend an already-done step).
  // null when outbound email is stale/absent or nothing relevant was found.
  recent_activity_note: string | null;
  // The system that should produce this output + its state (systems-first routing).
  produced_by: string | null;
}

export interface ProtocolRun {
  id: string;
  status: RunStatus;
  step: string | null;
  orient: OrientResult | null;
  triage_proposals: TriageProposal[] | null;
  committed: CommittedItem[] | null;
  next_action: NextAction | null;
  flags: RitualFlag[] | null;
  mirror: string | null;
  session_id: string | null;
  started: string;
  ended: string | null;
}
