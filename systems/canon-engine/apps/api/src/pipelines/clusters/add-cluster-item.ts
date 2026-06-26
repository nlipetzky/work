import { getCanonSupabase } from "../deps.js";

const CANON_NATIVE_TYPES = new Set(["canon", "transcript", "email", "document"]);

export async function runAddClusterItem(args: {
  cluster_id: string;
  item_id: string;
}): Promise<
  | { status: "already_ready"; item_id: string }
  | { status: "ready"; chunk_count: number; item_id: string }
  | { status: "error"; reason: "no_chunks"; item_id: string }
  | { status: "queued_for_extraction"; item_id: string; source_type: string }
> {
  const { cluster_id, item_id } = args;
  const supabase = getCanonSupabase();

  const { data: itemData, error: itemError } = await supabase
    .from("cluster_items")
    .select("id, cluster_id, source_type, source_id, title, external_uri, upload_kind, status")
    .eq("id", item_id)
    .eq("cluster_id", cluster_id)
    .single();

  if (itemError || !itemData) {
    throw new Error(`cluster_item not found: ${item_id} (${itemError?.message ?? "no data"})`);
  }

  if (itemData.status === "ready") {
    return { status: "already_ready", item_id };
  }

  if (CANON_NATIVE_TYPES.has(itemData.source_type)) {
    const { count, error: countError } = await supabase
      .from("chunks")
      .select("id", { count: "exact", head: true })
      .eq("source_type", itemData.source_type)
      .eq("source_id", itemData.source_id);

    if (countError) throw new Error(`chunk count query failed: ${countError.message}`);

    const chunkCount = count ?? 0;

    if (chunkCount === 0) {
      const { error } = await supabase
        .from("cluster_items")
        .update({
          status: "error",
          error_message: `No chunks found for ${itemData.source_type}/${itemData.source_id}. Source may not be ingested yet.`,
        })
        .eq("id", item_id);
      if (error) throw new Error(`Failed to mark item error: ${error.message}`);
      return { status: "error", reason: "no_chunks", item_id };
    }

    const { error } = await supabase
      .from("cluster_items")
      .update({ status: "ready" })
      .eq("id", item_id);
    if (error) throw new Error(`Failed to mark item ready: ${error.message}`);

    return { status: "ready", chunk_count: chunkCount, item_id };
  }

  // External source types (url, youtube, audio, upload, paste)
  // Leave status='pending'; caller must invoke runExtractClusterItem separately.
  return {
    status: "queued_for_extraction",
    item_id,
    source_type: itemData.source_type,
  };
}
