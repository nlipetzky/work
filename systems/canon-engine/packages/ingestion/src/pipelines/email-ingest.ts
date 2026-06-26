/**
 * Canon Engine — Email ingestion pipeline.
 *
 * Steps:
 * 1. Gmail watch() fires Pub/Sub notification
 * 2. Cloud Function triggered
 * 3. Fetch message via Gmail API
 * 4. Client matching via domain_lookup table in Supabase
 * 5. Thread resolution (upsert thread record)
 * 6. LLM enrichment (summary, topics, decisions, action items)
 * 7. Create message record linked to thread
 * 8. Chunk message body + thread summary → embed → Supabase pgvector
 *
 * Errors propagate — no silent swallowing. Pub/Sub retries on failure.
 * Uses message_id and thread_id unique constraints for idempotency.
 */

import { chunkText } from './chunker.js';
import type { EmbeddingClient } from './embeddings.js';
import { formatVector } from './embeddings.js';
import { manifestReceived, manifestEnriched, manifestChunked, manifestEmbedded, manifestFailed } from './manifest.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CanonEventEmitter } from '../events/event-emitter.js';

// TODO: Replace `any` with generated Database type after running `supabase gen types`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailMessage {
  messageId: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  date: string;
  subject: string;
  bodyText: string;
  direction: 'inbound' | 'outbound';
  labels: string[];
  hasAttachments: boolean;
  attachmentNames?: string;
  snippet?: string;
}

export interface EmailEnrichment {
  threadSummary: string;
  topics: string[];
  keyDecisions: string;
  actionItems: string;
  urgency: number;
  importance: number;
  classificationRationale: string;
}

export interface EmailIngestResult {
  messageId: string;
  threadId: string;
  chunksInserted: number;
  clientSlug: string;
  isNewThread: boolean;
}

export interface EmailEnricher {
  enrichThread(messages: EmailMessage[], existingSummary?: string): Promise<EmailEnrichment>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function deriveQuadrant(urgency: number, importance: number): string {
  const isUrgent = urgency >= 0.6;
  const isImportant = importance >= 0.6;
  if (isUrgent && isImportant) return 'do';
  if (!isUrgent && isImportant) return 'schedule';
  if (isUrgent && !isImportant) return 'delegate';
  return 'monitor';
}

export function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : '';
}

export function resolveDirection(messages: EmailMessage[]): 'Inbound' | 'Outbound' | 'Internal' {
  const hasInbound = messages.some((m) => m.direction === 'inbound');
  const hasOutbound = messages.some((m) => m.direction === 'outbound');
  if (hasInbound && hasOutbound) return 'Internal';
  if (hasOutbound) return 'Outbound';
  return 'Inbound';
}

export function collectParticipants(messages: EmailMessage[]): string[] {
  const participants = new Set<string>();
  for (const msg of messages) {
    participants.add(msg.from);
    for (const to of msg.to) participants.add(to);
    if (msg.cc) {
      for (const cc of msg.cc) participants.add(cc);
    }
  }
  return Array.from(participants);
}

// ---------------------------------------------------------------------------
// Pipeline entry point
// ---------------------------------------------------------------------------

/**
 * Ingest an email: domain lookup → thread upsert → enrich → message insert → chunks.
 *
 * Errors propagate for Pub/Sub retry.
 */
export async function ingestEmail(
  message: EmailMessage,
  workspaceAccount: string,
  deps: {
    supabase: UKBClient;
    enricher: EmailEnricher;
    embeddings: EmbeddingClient;
    emitter?: CanonEventEmitter;
  },
): Promise<EmailIngestResult> {
  const { supabase, enricher, embeddings, emitter } = deps;

  // Manifest: mark received
  await manifestReceived(supabase, {
    source_type: 'email',
    source_id: message.messageId,
    title: message.subject,
    source_size_bytes: Buffer.byteLength(message.bodyText, 'utf-8'),
  });

  try {

  // Step 1: Client matching via domain lookup
  const senderDomain = extractDomain(message.from);
  const { data: domainEntry } = await supabase
    .from('domain_lookup')
    .select('account_name, ignore')
    .eq('domain', senderDomain)
    .single();

  const clientSlug = domainEntry && !domainEntry.ignore
    ? domainEntry.account_name || 'unknown'
    : 'unknown';

  // Step 2: Check if thread exists
  const { data: existingThread } = await supabase
    .from('email_threads')
    .select('id, message_count, thread_summary')
    .eq('thread_id', message.threadId)
    .single();

  const isNewThread = !existingThread;

  // Step 3: LLM enrichment
  const enrichment = await enricher.enrichThread(
    [message],
    existingThread?.thread_summary || undefined,
  );

  // Update manifest with account once resolved
  if (clientSlug !== 'unknown') {
    await supabase
      .from('ingestion_manifest')
      .update({ account_name: clientSlug })
      .eq('source_type', 'email')
      .eq('source_id', message.messageId);
  }

  await manifestEnriched(supabase, 'email', message.messageId);

  if (emitter) {
    await emitter.emit({
      eventType: 'enrich',
      sourceType: 'email',
      sourceRef: message.messageId,
      accountName: clientSlug !== 'unknown' ? clientSlug : undefined,
      payload: { topics: enrichment.topics, isNewThread, threadId: message.threadId },
    });
  }

  // Step 4: Upsert thread record
  const direction = resolveDirection([message]);
  const participants = collectParticipants([message]);

  const threadFields: Record<string, unknown> = {
    thread_id: message.threadId,
    subject: message.subject,
    account_name: clientSlug !== 'unknown' ? clientSlug : null,
    participants: participants.join(', '),
    thread_last_activity: message.date,
    message_count: isNewThread ? 1 : (existingThread?.message_count || 0) + 1,
    direction,
    labels: message.labels.join(', '),
    topics: enrichment.topics.join(', '),
    thread_summary: enrichment.threadSummary,
    key_decisions: enrichment.keyDecisions,
    action_items: enrichment.actionItems,
    urgency: enrichment.urgency,
    importance: enrichment.importance,
    quadrant: deriveQuadrant(enrichment.urgency, enrichment.importance),
    classification_rationale: enrichment.classificationRationale,
  };

  if (isNewThread) {
    threadFields.thread_start_date = message.date;
  }

  const { data: thread, error: threadError } = await supabase
    .from('email_threads')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(threadFields as any, { onConflict: 'thread_id' })
    .select('id')
    .single();

  if (threadError) {
    throw new Error(`Failed to upsert email thread: ${threadError.message}`);
  }

  // Step 5: Insert message record (idempotent via message_id unique constraint)
  const { data: msg, error: msgError } = await supabase
    .from('email_messages')
    .upsert(
      {
        message_id: message.messageId,
        thread_id: thread.id,
        date: message.date,
        from_address: message.from,
        to_addresses: message.to.join(', '),
        cc_addresses: message.cc?.join(', ') || null,
        direction: message.direction === 'inbound' ? 'Inbound' : 'Outbound',
        body_text: message.bodyText,
        has_attachments: message.hasAttachments,
        attachment_names: message.attachmentNames || null,
        snippet: message.snippet || null,
      },
      { onConflict: 'message_id' },
    )
    .select('id')
    .single();

  if (msgError) {
    throw new Error(`Failed to upsert email message: ${msgError.message}`);
  }

  // Step 6: Chunk message body + thread summary
  const bodyChunks = chunkText(message.bodyText);
  const allChunkTexts: string[] = [];
  const chunkMeta: Array<{ chunkIndex: number; chunkType: 'message' | 'thread_summary' }> = [];

  for (const chunk of bodyChunks) {
    allChunkTexts.push(chunk.text);
    chunkMeta.push({ chunkIndex: chunk.index, chunkType: 'message' });
  }

  if (enrichment.threadSummary) {
    allChunkTexts.push(enrichment.threadSummary);
    chunkMeta.push({ chunkIndex: 0, chunkType: 'thread_summary' });
  }

  await manifestChunked(supabase, 'email', message.messageId, allChunkTexts.length);

  if (allChunkTexts.length === 0) {
    return { messageId: msg.id, threadId: thread.id, chunksInserted: 0, clientSlug, isNewThread };
  }

  // Step 7: Generate embeddings
  const embeddingVectors = await embeddings.embed(allChunkTexts);

  // Step 8: Delete old chunks for this thread (handles retries)
  await supabase
    .from('chunks')
    .delete()
    .eq('source_type', 'email')
    .eq('source_id', thread.id);

  // Step 9: Insert chunks
  const chunkRows = allChunkTexts.map((text, i) => ({
    source_type: 'email' as const,
    source_id: thread.id,
    account_name: clientSlug !== 'unknown' ? clientSlug : null,
    chunk_index: chunkMeta[i].chunkIndex,
    chunk_text: text,
    embedding: formatVector(embeddingVectors[i]),
    title: message.subject,
    from_address: message.from,
    subject: message.subject,
    direction: message.direction === 'inbound' ? 'Inbound' : 'Outbound',
    topics: enrichment.topics.join(', '),
  }));

  const { error: chunksError } = await supabase.from('chunks').insert(chunkRows);

  if (chunksError) {
    if (emitter) {
      await emitter.emit({
        eventType: 'error',
        sourceType: 'email',
        sourceRef: message.messageId,
        payload: { error: chunksError.message },
      });
    }
    throw new Error(`Failed to insert email chunks: ${chunksError.message}`);
  }

  await manifestEmbedded(supabase, 'email', message.messageId);

  if (emitter) {
    await emitter.emit({
      eventType: 'ingest',
      sourceType: 'email',
      sourceRef: message.messageId,
      accountName: clientSlug !== 'unknown' ? clientSlug : undefined,
      payload: { chunksInserted: allChunkTexts.length, threadId: thread.id, isNewThread },
    });
  }

  return {
    messageId: msg.id,
    threadId: thread.id,
    chunksInserted: allChunkTexts.length,
    clientSlug,
    isNewThread,
  };

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await manifestFailed(supabase, 'email', message.messageId, errMsg);
    throw err;
  }
}
