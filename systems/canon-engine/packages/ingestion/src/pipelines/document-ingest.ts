/**
 * Canon Engine — Document ingestion pipeline.
 *
 * Steps:
 * 1. Pub/Sub → Cloud Function triggered (document-ingest topic)
 * 2. LLM enrichment: summary, key points, topic tags
 * 3. Upsert document record in Supabase documents table
 * 4. Chunk document text → embed → Supabase pgvector chunks table
 *
 * Errors propagate — no silent swallowing. Pub/Sub retries on failure.
 * Uses drive_file_id unique constraint for idempotent upserts.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmbeddingClient } from './embeddings.js';
import { formatVector } from './embeddings.js';
import { chunkText } from './chunker.js';
import { manifestReceived, manifestEnriched, manifestChunked, manifestEmbedded, manifestFailed } from './manifest.js';
import type { CanonEventEmitter } from '../events/event-emitter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentInput {
  /** The extracted document text. */
  documentText: string;
  /** Document title (from file name or metadata). */
  title: string;
  /** File type: 'pdf' | 'doc' | 'text'. */
  fileType: string;
  /** Google Drive file ID (if from Drive). Used as idempotency key. */
  driveFileId?: string;
  /** Google Drive URL. */
  driveUrl?: string;
  /** Document date (ISO 8601 — creation date or extraction date). */
  date: string;
  /** Account slug (optional, from file path or metadata). */
  account?: string;
  /** Source context, e.g., 'intake folder', 'email attachment'. */
  sourceContext?: string;
}

export interface DocumentEnrichment {
  summary: string;
  keyPoints: string;
  topics: string[];
  title: string;
}

export interface DocumentIngestResult {
  /** Supabase UUID for the upserted document record. */
  documentId: string;
  /** Number of chunks inserted. */
  chunksInserted: number;
  /** LLM-generated enrichment. */
  enrichment: DocumentEnrichment;
}

export interface DocumentEnricher {
  enrichDocument(
    documentText: string,
    context?: { title?: string; account?: string; fileType?: string },
  ): Promise<DocumentEnrichment>;
}

// ---------------------------------------------------------------------------
// Pipeline entry point
// ---------------------------------------------------------------------------

/**
 * Ingest a document: enrich → Supabase record → embed chunks → pgvector.
 *
 * Errors are NOT caught — they propagate to the Cloud Function handler
 * so Pub/Sub can retry on failure.
 */
export async function ingestDocument(
  input: DocumentInput,
  deps: {
    supabase: UKBClient;
    enricher: DocumentEnricher;
    embeddings: EmbeddingClient;
    emitter?: CanonEventEmitter;
  },
): Promise<DocumentIngestResult> {
  const { supabase, enricher, embeddings, emitter } = deps;
  const manifestSourceId = input.driveFileId || input.title;

  // Manifest: mark received
  await manifestReceived(supabase, {
    source_type: 'document',
    source_id: manifestSourceId,
    title: input.title,
    account_name: input.account,
    source_size_bytes: Buffer.byteLength(input.documentText, 'utf-8'),
  });

  try {

  // Step 1: LLM enrichment
  const enrichment = await enricher.enrichDocument(input.documentText, {
    title: input.title,
    account: input.account,
    fileType: input.fileType,
  });

  await manifestEnriched(supabase, 'document', manifestSourceId);

  if (emitter) {
    await emitter.emit({
      eventType: 'enrich',
      sourceType: 'document',
      sourceRef: input.driveFileId || input.title,
      accountName: input.account,
      payload: { topics: enrichment.topics, summaryLength: enrichment.summary.length },
    });
  }

  const finalTitle = enrichment.title || input.title;

  // Step 2: Upsert document record (idempotent via drive_file_id)
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .upsert(
      {
        document_title: finalTitle,
        date: input.date.split('T')[0],
        account_name: input.account ?? null,
        file_type: input.fileType,
        source_context: input.sourceContext ?? null,
        summary: enrichment.summary,
        key_points: enrichment.keyPoints,
        topics: enrichment.topics.join(', '),
        drive_url: input.driveUrl ?? null,
        drive_file_id: input.driveFileId ?? null,
        raw_text: input.documentText,
      },
      { onConflict: 'drive_file_id' },
    )
    .select('id')
    .single();

  if (docError) {
    throw new Error(`Failed to upsert document: ${docError.message}`);
  }

  // Step 3: Chunk
  const chunks = chunkText(input.documentText);

  await manifestChunked(supabase, 'document', manifestSourceId, chunks.length);

  if (chunks.length === 0) {
    return { documentId: doc.id, chunksInserted: 0, enrichment };
  }

  // Step 4: Generate embeddings
  const chunkTexts = chunks.map((c) => c.text);
  const vectors = await embeddings.embed(chunkTexts);

  // Step 5: Delete old chunks for this document (idempotent retries)
  await supabase
    .from('chunks')
    .delete()
    .eq('source_type', 'document')
    .eq('source_id', doc.id);

  // Step 6: Insert chunks
  const rows = chunks.map((chunk, i) => ({
    source_type: 'document' as const,
    source_id: doc.id,
    account_name: input.account ?? null,
    chunk_index: chunk.index,
    chunk_text: chunk.text,
    embedding: formatVector(vectors[i]),
    title: finalTitle,
    document_type: input.fileType,
    tags: enrichment.topics.join(', '),
  }));

  const { error: chunksError } = await supabase.from('chunks').insert(rows);

  if (chunksError) {
    if (emitter) {
      await emitter.emit({
        eventType: 'error',
        sourceType: 'document',
        sourceRef: input.driveFileId || input.title,
        payload: { error: chunksError.message },
      });
    }
    throw new Error(`Failed to insert document chunks: ${chunksError.message}`);
  }

  await manifestEmbedded(supabase, 'document', manifestSourceId);

  if (emitter) {
    await emitter.emit({
      eventType: 'ingest',
      sourceType: 'document',
      sourceRef: doc.id,
      accountName: input.account,
      payload: { chunksInserted: rows.length, driveFileId: input.driveFileId },
    });
  }

  return { documentId: doc.id, chunksInserted: rows.length, enrichment };

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await manifestFailed(supabase, 'document', manifestSourceId, errMsg);
    throw err;
  }
}
