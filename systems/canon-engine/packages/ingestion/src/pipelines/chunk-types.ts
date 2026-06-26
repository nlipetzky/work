/**
 * @aos/pipelines — Shared types for the unified knowledge base.
 *
 * Defines SourceType and chunk metadata matching the Supabase pgvector
 * `chunks` table and `search_chunks()` RPC.
 */

// ---------------------------------------------------------------------------
// Source Types
// ---------------------------------------------------------------------------

export type SourceType = 'transcript' | 'email' | 'canon' | 'document';

// ---------------------------------------------------------------------------
// Chunk Metadata — matches columns returned by search_chunks() RPC
// ---------------------------------------------------------------------------

/** Base fields returned by search_chunks() for all source types. */
export interface ChunkMetadata {
  id: string;
  source_type: SourceType;
  source_id: string;
  source_path: string | null;
  chunk_index: number;
  chunk_text: string;
  title: string | null;
  account_name: string | null;
  topics: string | null;
  similarity: number;
}

export interface TranscriptChunkMetadata extends ChunkMetadata {
  source_type: 'transcript';
  meeting_date?: string;
  participants?: string;
  meeting_type?: string;
  speaker?: string;
}

export interface EmailChunkMetadata extends ChunkMetadata {
  source_type: 'email';
  from_address?: string;
  subject?: string;
  direction?: string;
}

export interface CanonChunkMetadata extends ChunkMetadata {
  source_type: 'canon';
  document_type?: string;
  /** Comma-separated tags; may include status and volatility values. */
  tags?: string;
}

export interface DocumentChunkMetadata extends ChunkMetadata {
  source_type: 'document';
  document_type?: string;
  tags?: string;
}
