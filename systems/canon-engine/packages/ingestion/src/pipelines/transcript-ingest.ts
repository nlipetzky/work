/**
 * Canon Engine — Transcript ingestion pipeline.
 *
 * Steps:
 * 1. Meeting ends → Workspace Events API detects transcript
 * 2. Pub/Sub → Cloud Function triggered
 * 3. Extract text from Google Doc (speaker labels + timestamps)
 * 4. LLM enrichment: summary, key decisions, action items, topic tags
 * 5. Upsert transcript record to Supabase
 * 6. Chunk transcript (500–800 tokens, speaker boundaries)
 * 7. Generate embeddings + insert chunks to Supabase pgvector
 *
 * Errors propagate — no silent swallowing. Pub/Sub retries on failure.
 * Uses google_drive_file_id unique constraint for idempotent upserts.
 */

import { chunkTranscript, parseSpeakerSegments } from './chunker.js';
import type { EmbeddingClient } from './embeddings.js';
import { formatVector } from './embeddings.js';
import { manifestReceived, manifestEnriched, manifestChunked, manifestEmbedded, manifestFailed } from './manifest.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CanonEventEmitter } from '../events/event-emitter.js';
type MeetingType = 'Strategy' | 'Standup' | 'Client Call' | 'Internal' | 'Sales' | 'Discovery';

// TODO: Replace `any` with generated Database type after running `supabase gen types`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Timezone-safe date extraction
// ---------------------------------------------------------------------------

/**
 * Extract a YYYY-MM-DD date string in the configured local timezone.
 *
 * Using .split('T')[0] on a UTC ISO string returns the UTC date, which is
 * wrong for evening meetings: a 7 PM PDT meeting is 2 AM UTC the next day,
 * so the UTC split gives tomorrow's date instead of today's.
 *
 * Uses the CANON_TIMEZONE env var (default: America/Los_Angeles).
 */
function toLocalDateString(isoString: string): string {
  const tz = process.env['CANON_TIMEZONE'] ?? 'America/Los_Angeles';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoString));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptInput {
  transcriptText: string;
  /** Google Doc URL — required for google_meet source, optional for uploaded files */
  googleDocUrl?: string;
  /** Unique source identifier. For Google Meet: drive file ID. For uploads: 'upload-<hash>' */
  driveFileId: string;
  meetingDate: string;
  participants: string[];
  meetingType: string;
  client: string;
  workspaceAccount?: string;
  account?: string;
  project?: string;
  /** Source type: 'google_meet' (default) or 'uploaded_file' */
  sourceType?: 'google_meet' | 'uploaded_file';
  /** Original filename for uploaded files */
  originalFilename?: string;
}

export interface LLMEnrichment {
  summary: string;
  keyDecisions: string;
  actionItems: string;
  topics: string[];
}

export interface TranscriptIngestResult {
  transcriptId: string;
  chunksInserted: number;
  enrichment: LLMEnrichment;
}

export interface TranscriptEnricher {
  enrich(transcriptText: string, context: {
    client: string;
    participants: string[];
    meetingType: string;
  }): Promise<LLMEnrichment>;
}

// ---------------------------------------------------------------------------
// Pipeline entry point
// ---------------------------------------------------------------------------

/**
 * Ingest a transcript: enrich → Supabase record → embed chunks → Supabase pgvector.
 *
 * Errors are NOT caught — they propagate to the Cloud Function handler
 * so Pub/Sub can retry on failure.
 */
export async function ingestTranscript(
  input: TranscriptInput,
  deps: {
    supabase: UKBClient;
    enricher: TranscriptEnricher;
    embeddings: EmbeddingClient;
    emitter?: CanonEventEmitter;
  },
): Promise<TranscriptIngestResult> {
  const { supabase, enricher, embeddings, emitter } = deps;

  // Manifest: mark received
  await manifestReceived(supabase, {
    source_type: 'transcript',
    source_id: input.driveFileId,
    title: `${input.meetingDate.split('T')[0]} - ${input.client}`,
    account_name: input.account || input.client,
    source_size_bytes: Buffer.byteLength(input.transcriptText, 'utf-8'),
  });

  try {

  // Step 1: LLM enrichment
  const enrichment = await enricher.enrich(input.transcriptText, {
    client: input.client,
    participants: input.participants,
    meetingType: input.meetingType,
  });

  await manifestEnriched(supabase, 'transcript', input.driveFileId);

  if (emitter) {
    await emitter.emit({
      eventType: 'enrich',
      sourceType: 'transcript',
      sourceRef: input.driveFileId,
      accountName: input.account || input.client,
      payload: { topics: enrichment.topics, summaryLength: enrichment.summary.length },
    });
  }

  // Step 2: Upsert transcript record (idempotent via google_drive_file_id)
  const dateOnly = toLocalDateString(input.meetingDate);
  const title = `${dateOnly} - ${input.client} - ${input.participants.slice(0, 3).join(', ')}`;

  const { data: transcript, error: transcriptError } = await supabase
    .from('transcripts')
    .upsert(
      {
        transcript_title: title,
        meeting_date: input.meetingDate,
        account_name: input.account || input.client,
        participants: input.participants.join(', '),
        meeting_type: input.meetingType as MeetingType,
        summary: enrichment.summary,
        key_decisions: enrichment.keyDecisions,
        action_items: enrichment.actionItems,
        topics: enrichment.topics.join(', '),
        google_doc_url: input.googleDocUrl ?? null,
        google_drive_file_id: input.driveFileId,
        raw_transcript_text: input.transcriptText,
      },
      { onConflict: 'google_drive_file_id' },
    )
    .select('id')
    .single();

  if (transcriptError) {
    throw new Error(`Failed to upsert transcript: ${transcriptError.message}`);
  }

  // Step 3: Chunk with speaker awareness
  const segments = parseSpeakerSegments(input.transcriptText);
  const chunks = chunkTranscript(segments);

  await manifestChunked(supabase, 'transcript', input.driveFileId, chunks.length);

  if (chunks.length === 0) {
    return { transcriptId: transcript.id, chunksInserted: 0, enrichment };
  }

  // Step 4: Generate embeddings
  const chunkTexts = chunks.map((c) => c.text);
  const embeddingVectors = await embeddings.embed(chunkTexts);

  // Step 5: Delete old chunks for this transcript (handles retries cleanly)
  await supabase
    .from('chunks')
    .delete()
    .eq('source_type', 'transcript')
    .eq('source_id', transcript.id);

  // Step 6: Insert chunks with embeddings
  const chunkRows = chunks.map((chunk, i) => ({
    source_type: 'transcript' as const,
    source_id: transcript.id,
    account_name: input.account || input.client,
    chunk_index: chunk.index,
    chunk_text: chunk.text,
    embedding: formatVector(embeddingVectors[i]),
    title,
    meeting_date: dateOnly,
    participants: input.participants.join(', '),
    meeting_type: input.meetingType,
    topics: enrichment.topics.join(', '),
    speaker: chunk.speaker || null,
  }));

  const { error: chunksError } = await supabase.from('chunks').insert(chunkRows);

  if (chunksError) {
    if (emitter) {
      await emitter.emit({
        eventType: 'error',
        sourceType: 'transcript',
        sourceRef: input.driveFileId,
        payload: { error: chunksError.message },
      });
    }
    throw new Error(`Failed to insert transcript chunks: ${chunksError.message}`);
  }

  await manifestEmbedded(supabase, 'transcript', input.driveFileId);

  if (emitter) {
    await emitter.emit({
      eventType: 'ingest',
      sourceType: 'transcript',
      sourceRef: transcript.id,
      accountName: input.account || input.client,
      payload: { chunksInserted: chunks.length, driveFileId: input.driveFileId },
    });
  }

  return {
    transcriptId: transcript.id,
    chunksInserted: chunks.length,
    enrichment,
  };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await manifestFailed(supabase, 'transcript', input.driveFileId, msg);
    throw err;
  }
}
