import { db } from "@/lib/supabase";

// Staging batches live in the `staging` schema (staging.<entity>_<batch_id>), which PostgREST
// does not expose. We reach them through public SECURITY DEFINER RPCs:
//   list_staging_batches()        -> batches + row counts
//   staging_batch_preview(t, n)   -> sample rows
//   promote_staging_batch(b,e,by) -> on-rails promotion into the working tables

export interface StagingBatch {
  table_name: string;
  entity: string;
  batch_id: string;
  row_count: number;
  segment_name: string | null;
  playbook_name: string | null;
  play_file_path: string | null;
  guidance_file_path: string | null;
}

export interface StagingState {
  batches: StagingBatch[];
  promotionEnabled: boolean;
  note: string;
  promotionLedger: Record<string, unknown>[];
}

export async function getStagingState(): Promise<StagingState> {
  const { data: batches, error } = await db.rpc("list_staging_batches");
  const { data: ledger } = await db
    .from("staging_promotions")
    .select("batch_id, source_record_type, promoted_at, promoted_by, canonical_record_id, notes")
    .order("promoted_at", { ascending: false })
    .limit(100);

  return {
    batches: ((batches ?? []) as StagingBatch[]),
    promotionEnabled: true,
    note: error
      ? `Could not list staging batches: ${error.message}`
      : "In-flight batches in the staging schema. Promote moves a batch into the working contacts/companies tables, on-rails: per-field provenance, dedup by email/domain, idempotent.",
    promotionLedger: ledger ?? [],
  };
}

export async function getStagingPreview(
  table: string,
  limit = 50,
): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const { data, error } = await db.rpc("staging_batch_preview", { p_table: table, p_limit: limit });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, unknown>[];
  return { columns: rows.length ? Object.keys(rows[0]) : [], rows };
}

export async function promoteBatch(
  batchId: string,
  entity: string,
  promotedBy = "projection-ui",
): Promise<Record<string, unknown>> {
  const { data, error } = await db.rpc("promote_staging_batch", {
    p_batch_id: batchId,
    p_entity: entity,
    p_promoted_by: promotedBy,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data[0] : data) ?? {};
}
