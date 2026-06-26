// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchParams {
  query: string;
  limit?: number;
  sourceTypes?: string[];
  rerank?: boolean;
}

export interface ChunkResult {
  chunk_id: string;
  source_type: string;
  source_id: string;
  title: string;
  chunk_text: string;
  chunk_index: number;
  meeting_date: string | null;
  participants: string | null;
  speaker: string | null;
  from_address: string | null;
  subject: string | null;
  document_type: string | null;
  similarity: number;
  rrf_score: number;
}

export interface SearchResponse {
  results: ChunkResult[];
  reranked: boolean;
  consumer: string;
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

export interface Cluster {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  account_id: string | null;
  tags: string[];
  visibility: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClusterCreateParams {
  name: string;
  slug?: string;
  description?: string;
  account_id?: string;
  tags?: string[];
  visibility?: 'private' | 'account' | 'global';
}

export interface ClusterUpdateParams {
  name?: string;
  description?: string;
  tags?: string[];
  visibility?: 'private' | 'account' | 'global';
}

export interface ClusterListParams {
  accountId?: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Cluster items
// ---------------------------------------------------------------------------

export interface ClusterItem {
  id: string;
  cluster_id: string;
  source_type: string;
  source_id: string | null;
  title: string | null;
  note: string | null;
  pinned_excerpt: string | null;
  status: string;
  added_at: string;
}

export interface ClusterItemCreateParams {
  source_type: string;
  source_id?: string | null;
  note?: string;
  pinned_excerpt?: string;
}

// ---------------------------------------------------------------------------
// Cluster chat
// ---------------------------------------------------------------------------

export interface ChatParams {
  query: string;
  session_id?: string;
  top_k?: number;
  rerank?: boolean;
  model?: string;
}

export type ChatEvent =
  | { type: 'citation'; chunk_id: string; title: string; source_type: string; source_id: string }
  | { type: 'token'; text: string }
  | { type: 'usage'; input_tokens: number; output_tokens: number }
  | { type: 'done'; session_id: string; turn_id: string }
  | { type: 'error'; message: string };

export interface ChatSession {
  session_id: string;
  last_turn: string;
}

export interface ChatTurn {
  id: string;
  cluster_id: string;
  session_id: string;
  role: string;
  content: string;
  model: string | null;
  citations: unknown;
  token_usage: unknown;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Voyage
// ---------------------------------------------------------------------------

export interface VoyageUsage {
  today_spend_usd: number;
  daily_budget_usd: number;
  remaining_usd: number;
  budget_exhausted: boolean;
}

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export interface IngestResponse {
  triggered: boolean;
  pid: number;
}
