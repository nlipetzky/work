// Shared SOP/operate types with NO server-only dependency, so client
// components (OperateCockpit, ActivityDetail, SystemViewEmbed) can import them
// without dragging `lib/queries/operatingSop` (which imports "server-only")
// into the client bundle.

import type { SopBundle, SopRun, ActivityStatus, StageStatus } from "@/lib/sops";

export type LiveSource = "live" | "static" | "error";

export interface ActivityLive {
  source: LiveSource;
  count?: number;
  count_label?: string;
  count_query?: string;
  last_run_at?: string | null;
  last_run_status?: string | null;
  last_run_message?: string | null;
  reason?: string;
}

// Engagement-scoped Expert Liaison rollup, attached by the operatingSop detail
// builder. Optional: absent when the read soft-fails or there's no active run.
// Keyed ONLY on the run's engagement, never on canon sop_activities rows.
export interface ExpertLiaisonSummary {
  open_count: number;
  active_count: number;
  achieved_count: number;
  blocking_motions: Array<{
    motion_id: string;
    expert_slug: string | null;
    goal: string | null;
    status: string;
    ball_in_court: string | null;
    next_action_due: string | null;
    overdue: boolean;
  }>;
}

export type SopDetail = {
  bundle: SopBundle;
  active_run: SopRun | null;
  activity_status: Record<string, ActivityStatus>;
  activity_live: Record<string, ActivityLive>;
  stage_status: Record<string, StageStatus>;
  expert_liaison_summary?: ExpertLiaisonSummary;
};
