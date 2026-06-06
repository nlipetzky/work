import { db } from "@/lib/supabase";

// Staging batches live in the `staging` schema as staging.<entity>_<batch_id>, created
// on demand by enrichment. Today the schema is empty AND there is no staging->canonical
// promotion function in the database. So v1 ships the Promote action DISABLED and flagged,
// not faked. This module reports exactly that state instead of pretending.
//
// Discovering staging.* tables needs information_schema, which PostgREST does not expose,
// and the `staging` schema is not in the API search path. When the engine starts landing
// batches, the unblock is: (1) a promotion RPC, (2) expose staging via an RPC that lists
// batches. Until then this returns the honest empty state.

export interface StagingState {
  batches: { name: string; rowCount: number; createdAt?: string }[];
  promotionEnabled: boolean;
  note: string;
  promotionLedger: Record<string, unknown>[];
}

export async function getStagingState(): Promise<StagingState> {
  // promotion ledger (empty today, but live) — shows past promotions when they happen
  const { data: ledger } = await db
    .from("staging_promotions")
    .select("batch_id, source_record_type, promoted_at, promoted_by, canonical_record_id, notes")
    .order("promoted_at", { ascending: false })
    .limit(100);

  return {
    batches: [],
    promotionEnabled: false,
    note:
      "Staging schema is empty and no promotion function exists in the database yet. " +
      "Promote is disabled until the engine lands batches and a promotion RPC is added. " +
      "This is the honest state, not a missing feature in the UI.",
    promotionLedger: ledger ?? [],
  };
}
