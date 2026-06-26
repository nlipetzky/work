/**
 * Ingestion manifest lifecycle tracking.
 *
 * Writes to the `ingestion_manifest` table in Canon/UKB Supabase so the
 * Trust Dashboard can display pipeline health, ingestion feed, and
 * account completeness.
 *
 * Status lifecycle: received → enriched → chunked → embedded | failed
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

export interface ManifestEntry {
  source_type: 'transcript' | 'email' | 'document' | 'canon';
  source_id: string;
  title?: string;
  account_name?: string;
  org?: string;
  source_size_bytes?: number;
}

/**
 * Record that an item has been received for ingestion.
 * Uses UPSERT on (source_type, source_id) for idempotency.
 */
export async function manifestReceived(
  supabase: UKBClient,
  entry: ManifestEntry,
): Promise<void> {
  await supabase
    .from('ingestion_manifest')
    .upsert(
      {
        source_type: entry.source_type,
        source_id: entry.source_id,
        title: entry.title ?? null,
        account_name: entry.account_name ?? null,
        org: entry.org ?? null,
        source_size_bytes: entry.source_size_bytes ?? null,
        status: 'received',
        received_at: new Date().toISOString(),
        // Reset downstream timestamps on re-ingest
        enriched_at: null,
        chunked_at: null,
        embedded_at: null,
        failed_at: null,
        error_message: null,
      },
      { onConflict: 'source_type,source_id' },
    )
    .then(({ error }) => {
      if (error) console.error('[manifest] received upsert failed:', error.message);
    });
}

/** Update manifest after LLM enrichment completes. */
export async function manifestEnriched(
  supabase: UKBClient,
  sourceType: string,
  sourceId: string,
  confidence?: number,
): Promise<void> {
  await supabase
    .from('ingestion_manifest')
    .update({
      status: 'enriched',
      enriched_at: new Date().toISOString(),
      enrichment_confidence: confidence ?? null,
    })
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .then(({ error }) => {
      if (error) console.error('[manifest] enriched update failed:', error.message);
    });
}

/** Update manifest after chunking completes. */
export async function manifestChunked(
  supabase: UKBClient,
  sourceType: string,
  sourceId: string,
  chunkCount: number,
): Promise<void> {
  await supabase
    .from('ingestion_manifest')
    .update({
      status: 'chunked',
      chunked_at: new Date().toISOString(),
      chunk_count: chunkCount,
    })
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .then(({ error }) => {
      if (error) console.error('[manifest] chunked update failed:', error.message);
    });
}

/** Update manifest after embeddings are stored. */
export async function manifestEmbedded(
  supabase: UKBClient,
  sourceType: string,
  sourceId: string,
): Promise<void> {
  await supabase
    .from('ingestion_manifest')
    .update({
      status: 'embedded',
      embedded_at: new Date().toISOString(),
    })
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .then(({ error }) => {
      if (error) console.error('[manifest] embedded update failed:', error.message);
    });
}

/** Mark a manifest entry as failed. */
export async function manifestFailed(
  supabase: UKBClient,
  sourceType: string,
  sourceId: string,
  errorMessage: string,
): Promise<void> {
  await supabase
    .from('ingestion_manifest')
    .update({
      status: 'failed',
      failed_at: new Date().toISOString(),
      error_message: errorMessage.substring(0, 500),
    })
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .then(({ error }) => {
      if (error) console.error('[manifest] failed update failed:', error.message);
    });
}
