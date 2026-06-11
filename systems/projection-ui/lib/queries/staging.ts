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
  play_dir: string | null;
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

export interface PromotionRef {
  canonical_record_id: string;
  verdict: string | null;
  play_name: string | null;
}

export async function promotedRecords(
  batchId: string,
  sourceType: "staging_company" | "staging_contact",
): Promise<PromotionRef[]> {
  const { data, error } = await db
    .from("staging_promotions")
    .select("canonical_record_id, verdict, play_name")
    .eq("batch_id", batchId)
    .eq("source_record_type", sourceType);
  if (error) throw new Error(error.message);
  return (data ?? []) as PromotionRef[];
}

export async function companiesByIds(
  ids: string[],
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db
    .from("companies")
    .select("*")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

export async function contactsByIds(
  ids: string[],
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db
    .from("contacts")
    .select("*")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

// public.contacts has company_id but NO company_name. The Airtable Company link resolves by
// company name (typecast), so we resolve names from company_id to populate the link.
export async function companyNamesByIds(
  ids: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await db
    .from("companies")
    .select("id, name")
    .in("id", unique);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const r of (data ?? []) as { id: string; name: string | null }[]) {
    if (r.name) map[r.id] = r.name;
  }
  return map;
}
