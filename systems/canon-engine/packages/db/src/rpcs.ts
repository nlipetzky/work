import type { CanonClient } from './client.js';
import type { Database } from './database.types.js';

type Fn = Database['public']['Functions'];

// ---------------------------------------------------------------------------
// Hybrid search — chunks (global, not cluster-scoped)
// ---------------------------------------------------------------------------

export type ChunkSearchRow = Fn['fn_canon_chunks_hybrid_search']['Returns'][number];

export interface HybridSearchArgs {
  queryText: string;
  queryEmbedding: string;
  limit?: number;
  rrfK?: number;
  sourceTypes?: string[];
}

export async function fnCanonChunksHybridSearch(
  client: CanonClient,
  args: HybridSearchArgs,
): Promise<ChunkSearchRow[]> {
  const { data, error } = await client.rpc('fn_canon_chunks_hybrid_search', {
    p_query_text: args.queryText,
    p_query_embedding: args.queryEmbedding,
    p_limit: args.limit,
    p_rrf_k: args.rrfK,
    p_source_types: args.sourceTypes,
  });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Hybrid search — cluster-scoped
// ---------------------------------------------------------------------------

export type ClusterSearchRow = Fn['fn_cluster_hybrid_search']['Returns'][number];

export interface ClusterHybridSearchArgs {
  clusterId: string;
  queryText: string;
  queryEmbedding: string;
  limit?: number;
  rrfK?: number;
  activeItemIds?: string[];
}

export async function fnClusterHybridSearch(
  client: CanonClient,
  args: ClusterHybridSearchArgs,
): Promise<ClusterSearchRow[]> {
  const { data, error } = await client.rpc('fn_cluster_hybrid_search', {
    p_cluster_id: args.clusterId,
    p_query_text: args.queryText,
    p_query_embedding: args.queryEmbedding,
    p_limit: args.limit,
    p_rrf_k: args.rrfK,
    p_active_item_ids: args.activeItemIds,
  });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Canon docs full-text search
// ---------------------------------------------------------------------------

export type CanonDocSearchRow = Fn['search_canon_docs']['Returns'][number];

export interface SearchCanonDocsArgs {
  query: string;
  tenantId?: string;
  limit?: number;
}

export async function searchCanonDocs(
  client: CanonClient,
  args: SearchCanonDocsArgs,
): Promise<CanonDocSearchRow[]> {
  const { data, error } = await client.rpc('search_canon_docs', {
    p_query: args.query,
    p_tenant_id: args.tenantId,
    p_limit: args.limit,
  });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Save / upsert a canon doc
// ---------------------------------------------------------------------------

export interface SaveCanonDocArgs {
  path: string;
  contentMd: string;
  tenantId: string;
  source?: string;
  updatedBy?: string;
}

export async function saveCanonDoc(
  client: CanonClient,
  args: SaveCanonDocArgs,
): Promise<string> {
  const { data, error } = await client.rpc('save_canon_doc', {
    p_path: args.path,
    p_content_md: args.contentMd,
    p_tenant_id: args.tenantId,
    p_source: args.source,
    p_updated_by: args.updatedBy,
  });
  if (error) throw error;
  return data as string;
}
