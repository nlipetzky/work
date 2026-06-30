// Compute-on-read for operating-sop SOPs.
//
// Slice 1 / Phase D: live reads against canon_engine (CIPO prospects). Revops-side
// activities stay on hand-authored static_status for slice 1 because CIPO is currently
// severed from revops-engine (no bridge / no staging batch yet — handoff open item #5,
// memory `project_cipo_pipeline_state`).
//
// Order of precedence per activity:
//   1. static_status === "blocked" wins (the SOP's current build pause)
//   2. Live read (when available for this activity)
//   3. Hand-authored static_status as fallback
//
// All live reads are defensive: any error degrades to static + a `reason` string in
// the live context — the page never crashes because of a DB hiccup.

import "server-only";
import { db } from "@/lib/supabase";
import {
  SOPS,
  SOPS_BY_ID,
  type ActivityStatus,
  type SopBundle,
  type SopRun,
  type StageStatus,
} from "@/lib/sops";

import type { ActivityLive, LiveSource, SopDetail } from "@/lib/operate/sop-types";

export { SOPS, SOPS_BY_ID };
export type { SopBundle, SopRun, ActivityStatus, StageStatus };
// Re-export the shared (non-server-only) types so existing importers keep working.
export type { ActivityLive, LiveSource, SopDetail };

// Slice 1: each SOP has zero-or-one hand-authored run in its bundle. When the
// canon schema lands, `sop_runs` will be a real table; this helper centralizes
// the "what's the active run" decision.
function activeRun(bundle: SopBundle): SopRun | null {
  return bundle.runs[0] ?? null;
}

// ActivityLive / LiveSource / SopDetail are defined in @/lib/operate/sop-types
// (no server-only dep) and re-exported above.

// ─── Live readers (one per activity that has a real source today) ─────────

async function readSignalBatch(engagementId: string): Promise<{ status: ActivityStatus; live: ActivityLive }> {
  try {
    const { count, error } = await db
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("engagement_id", engagementId);
    if (error) throw error;
    const n = count ?? 0;
    return {
      status: n > 0 ? "ok" : "unset",
      live: {
        source: "live",
        count: n,
        count_label: "prospects landed",
        count_query: `revops public.prospects where engagement_id='${engagementId}'`,
      },
    };
  } catch (e) {
    return { status: "unset", live: { source: "error", reason: `revops read failed: ${String(e)}` } };
  }
}

async function readFindContacts(engagementId: string): Promise<{ status: ActivityStatus; live: ActivityLive }> {
  try {
    const { count, error } = await db
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("engagement_id", engagementId)
      .in("stage", ["resolved", "qualified"]);
    if (error) throw error;
    const n = count ?? 0;
    return {
      status: n > 0 ? "ok" : "unset",
      live: {
        source: "live",
        count: n,
        count_label: "contacts resolved",
        count_query: `revops public.prospects where engagement_id='${engagementId}' and stage in (resolved, qualified)`,
      },
    };
  } catch (e) {
    return { status: "unset", live: { source: "error", reason: `revops read failed: ${String(e)}` } };
  }
}

async function readPromotedCompanies(_engagementId: string): Promise<{ status: ActivityStatus; live: ActivityLive }> {
  // CIPO is severed from revops-engine in slice 1 — no engagement filter to apply yet.
  // Report 0 with a clarifying reason so the inspector explains why this is unset.
  try {
    const { count, error } = await db
      .from("companies")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return {
      status: "unset",
      live: {
        source: "live",
        count: count ?? 0,
        count_label: "total companies in revops core (not CIPO-filtered)",
        count_query: "public.companies",
        reason:
          "CIPO pipeline is severed from revops-engine in slice 1 (no canon→revops bridge yet); count is the full revops core, not CIPO-filtered.",
      },
    };
  } catch (e) {
    return { status: "unset", live: { source: "error", reason: `revops read failed: ${String(e)}` } };
  }
}

async function readPromotedContacts(_engagementId: string): Promise<{ status: ActivityStatus; live: ActivityLive }> {
  try {
    const { count, error } = await db
      .from("contacts")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return {
      status: "unset",
      live: {
        source: "live",
        count: count ?? 0,
        count_label: "total contacts in revops core (not CIPO-filtered)",
        count_query: "public.contacts",
        reason:
          "CIPO pipeline is severed from revops-engine in slice 1; count is the full revops core, not CIPO-filtered.",
      },
    };
  } catch (e) {
    return { status: "unset", live: { source: "error", reason: `revops read failed: ${String(e)}` } };
  }
}

// ─── Last-run enrichment from prep_run_status ──────────────────────────────
// prep_run_status's `stage` column is a revops-pipeline stage name. Map our
// activity_ids to those stage names so the inspector can show "last run at …".

const RUN_STATUS_STAGE_BY_ACTIVITY: Record<string, string> = {
  "classify-segment-screen": "classify_companies",
  "evidence-gate-verify": "verify_companies",
  "promote-companies": "promote_companies",
  "promote-contacts": "promote_contacts",
  "route-unreachable-edge": "route_unreachable",
};

async function readLastRun(activityId: string): Promise<Partial<ActivityLive>> {
  const stage = RUN_STATUS_STAGE_BY_ACTIVITY[activityId];
  if (!stage) return {};
  try {
    const { data, error } = await db
      .from("prep_run_status")
      .select("status, message, updated_at")
      .eq("stage", stage)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = data?.[0];
    if (!row) return {};
    return {
      last_run_at: row.updated_at as string | null,
      last_run_status: row.status as string | null,
      last_run_message: (row.message as string | null) ?? null,
    };
  } catch {
    // Soft-fail: no run-ledger enrichment, but everything else still renders.
    return {};
  }
}

// ─── activityStatus dispatch ───────────────────────────────────────────────

async function computeActivity(
  bundle: SopBundle,
  activityId: string,
): Promise<{ status: ActivityStatus; live: ActivityLive }> {
  const a = bundle.activities.find((x) => x.activity_id === activityId);

  // (1) static blocked wins
  if (a?.static_status === "blocked") {
    return {
      status: "blocked",
      live: {
        source: "static",
        reason: a.block_reason ?? "marked blocked by the SOP author",
      },
    };
  }

  // (2) per-activity live read — engagement comes from the active SopRun.
  // No active run → no live read possible; fall through to static fallback.
  const run = activeRun(bundle);
  const engagementId = run?.target_engagement ?? null;
  let computed: { status: ActivityStatus; live: ActivityLive } | null = null;
  if (engagementId !== null) {
    switch (activityId) {
      case "signal-batch":
        computed = await readSignalBatch(engagementId);
        break;
      case "find-icp-contacts":
        computed = await readFindContacts(engagementId);
        break;
      case "promote-companies":
        computed = await readPromotedCompanies(engagementId);
        break;
      case "promote-contacts":
        computed = await readPromotedContacts(engagementId);
        break;
    }
  }

  // (3) fallback to static if no live reader
  if (!computed) {
    computed = {
      status: a?.static_status ?? "unset",
      live: {
        source: "static",
        reason: "no live reader wired in slice 1; showing hand-authored static_status",
      },
    };
  }

  // Enrich with last-run timestamp where we have a mapping.
  const lastRun = await readLastRun(activityId);
  return { ...computed, live: { ...computed.live, ...lastRun } };
}

// ─── L1 stage rollup ──────────────────────────────────────────────────────
// Sync — operates on the pre-computed activity status map.

function rollupStage(
  bundle: SopBundle,
  stageId: string,
  activity_status: Record<string, ActivityStatus>,
): StageStatus {
  const s = bundle.sop.stages.find((x) => x.stage_id === stageId);
  if (!s || s.workflow_ids.length === 0) return "pending";
  const seen: ActivityStatus[] = [];
  for (const wid of s.workflow_ids) {
    const wf = bundle.workflows.find((w) => w.workflow_id === wid);
    if (!wf) continue;
    for (const n of wf.nodes) {
      seen.push(activity_status[n.activity_id] ?? "unset");
    }
  }
  if (seen.length === 0) return "pending";
  if (seen.some((x) => x === "blocked")) return "blocked";
  if (seen.some((x) => x === "error")) return "deviated";
  if (seen.every((x) => x === "ok")) return "done";
  if (seen.some((x) => x === "ok")) return "in_progress";
  return "pending";
}

// ─── Detail (full bundle + status maps + live ctx) ─────────────────────────
// SopDetail type lives in @/lib/operate/sop-types (re-exported above).

export async function detail(bundle: SopBundle): Promise<SopDetail> {
  // Compute every activity in parallel.
  const results = await Promise.all(
    bundle.activities.map(async (a) => {
      const r = await computeActivity(bundle, a.activity_id);
      return [a.activity_id, r] as const;
    }),
  );

  const activity_status: Record<string, ActivityStatus> = {};
  const activity_live: Record<string, ActivityLive> = {};
  for (const [id, r] of results) {
    activity_status[id] = r.status;
    activity_live[id] = r.live;
  }

  const stage_status: Record<string, StageStatus> = {};
  for (const s of bundle.sop.stages) {
    stage_status[s.stage_id] = rollupStage(bundle, s.stage_id, activity_status);
  }
  return {
    bundle,
    active_run: activeRun(bundle),
    activity_status,
    activity_live,
    stage_status,
  };
}

export async function detailById(sopId: string): Promise<SopDetail | null> {
  const b = SOPS_BY_ID[sopId];
  return b ? detail(b) : null;
}

// ─── Summary (for /api/operate/list) ──────────────────────────────────────

export type StageSummary = {
  stage_id: string;
  order: number;
  name: string;
  status: StageStatus;
};

export type Rollup = {
  done: number;
  in_progress: number;
  blocked: number;
  pending: number;
  deviated: number;
};

export type SopSummary = {
  sop_id: string;
  name: string;
  description: string;
  active_run: SopRun | null;
  stage_count: number;
  stages: StageSummary[];
  rollup: Rollup;
  blocked_activities: string[];
  next_action: string;
};

export async function summarize(bundle: SopBundle): Promise<SopSummary> {
  const d = await detail(bundle);

  const stages: StageSummary[] = d.bundle.sop.stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      stage_id: s.stage_id,
      order: s.order,
      name: s.name,
      status: d.stage_status[s.stage_id] ?? "pending",
    }));

  const rollup: Rollup = {
    done: stages.filter((s) => s.status === "done").length,
    in_progress: stages.filter((s) => s.status === "in_progress").length,
    blocked: stages.filter((s) => s.status === "blocked").length,
    pending: stages.filter((s) => s.status === "pending").length,
    deviated: stages.filter((s) => s.status === "deviated").length,
  };

  const blocked_activities = d.bundle.activities
    .filter((a) => d.activity_status[a.activity_id] === "blocked")
    .map((a) => a.name);

  const firstBlocked = stages.find((s) => s.status === "blocked");
  const firstActive = stages.find((s) => s.status === "in_progress");
  const firstPending = stages.find((s) => s.status !== "done");
  const target = firstBlocked ?? firstActive ?? firstPending;
  const next_action = !target
    ? "All stages done."
    : target.status === "blocked"
      ? `Blocked at: ${blocked_activities[0] ?? target.name}`
      : `Next: ${target.name}`;

  return {
    sop_id: d.bundle.sop.sop_id,
    name: d.bundle.sop.name,
    description: d.bundle.sop.description,
    active_run: d.active_run,
    stage_count: d.bundle.sop.stages.length,
    stages,
    rollup,
    blocked_activities,
    next_action,
  };
}
