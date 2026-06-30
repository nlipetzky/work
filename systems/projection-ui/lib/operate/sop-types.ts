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

export type SopDetail = {
  bundle: SopBundle;
  active_run: SopRun | null;
  activity_status: Record<string, ActivityStatus>;
  activity_live: Record<string, ActivityLive>;
  stage_status: Record<string, StageStatus>;
};
