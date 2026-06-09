import { db } from "@/lib/supabase";

// prep_run_status is one row per (run_id, stage). The active/most-recent run is the run_id of the
// row with the latest updated_at. public.prep_run_status has RLS enabled with no policies; the
// service-role key in lib/supabase bypasses RLS, so PostgREST reads work the same as companies/contacts.

export type PrepStageStatus = "pending" | "running" | "done" | "error";

export interface PrepRunStep {
  run_id: string;
  batch_id: string;
  entity: string;
  stage: string;
  stage_order: number;
  status: PrepStageStatus;
  counts: Record<string, number>;
  message: string | null;
  started_at: string | null;
  updated_at: string;
}

export interface PrepRunStatus {
  runId: string | null;
  batchId: string | null;
  steps: PrepRunStep[];
}

export async function getActivePrepRun(): Promise<PrepRunStatus> {
  // Latest activity points at the active (or most-recently-finished) run.
  const { data: latest, error: e1 } = await db
    .from("prep_run_status")
    .select("run_id, batch_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (e1) throw new Error(e1.message);
  if (!latest || latest.length === 0) return { runId: null, batchId: null, steps: [] };

  const runId = latest[0].run_id as string;
  const batchId = latest[0].batch_id as string;

  const { data: steps, error: e2 } = await db
    .from("prep_run_status")
    .select("*")
    .eq("run_id", runId)
    .order("stage_order", { ascending: true });
  if (e2) throw new Error(e2.message);

  return { runId, batchId, steps: (steps ?? []) as PrepRunStep[] };
}
