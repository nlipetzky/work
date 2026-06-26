/**
 * Canon Engine — Event/Audit log emitter.
 * Roadmap item X1. The "Receipt" pattern from Second Brain notebook.
 *
 * Logs every sync, ingestion, validation, enrichment, and status change
 * to the `canon_events` Supabase table. Provides a persistent audit trail
 * for debugging, governance compliance, and downstream change feeds.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventType =
  | 'sync'
  | 'ingest'
  | 'validate'
  | 'enrich'
  | 'status_change'
  | 'governance_scan'
  | 'error';

export type SourceType = 'canon' | 'transcript' | 'email' | 'document';

export interface CanonEvent {
  eventType: EventType;
  sourceType?: SourceType;
  /** File path (canon) or record ID (others) */
  sourceRef?: string;
  accountName?: string;
  /** Arbitrary structured payload — details of the event */
  payload?: Record<string, unknown>;
  /** Groups related events (e.g., one sync batch) */
  correlationId?: string;
}

export interface EmittedEvent extends CanonEvent {
  id: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Event Emitter
// ---------------------------------------------------------------------------

export interface CanonEventEmitter {
  /** Emit a single event to the audit log */
  emit(event: CanonEvent): Promise<EmittedEvent>;
  /** Emit multiple events in a batch */
  emitBatch(events: CanonEvent[]): Promise<EmittedEvent[]>;
  /** Create a scoped emitter with a shared correlation ID */
  scoped(correlationId?: string): ScopedEmitter;
}

export interface ScopedEmitter {
  correlationId: string;
  emit(event: Omit<CanonEvent, 'correlationId'>): Promise<EmittedEvent>;
  emitBatch(events: Omit<CanonEvent, 'correlationId'>[]): Promise<EmittedEvent[]>;
}

/**
 * Create a CanonEventEmitter backed by Supabase.
 */
export function createEventEmitter(supabase: UKBClient): CanonEventEmitter {
  async function emit(event: CanonEvent): Promise<EmittedEvent> {
    const row = {
      event_type: event.eventType,
      source_type: event.sourceType ?? null,
      source_ref: event.sourceRef ?? null,
      account_name: event.accountName ?? null,
      payload: event.payload ?? {},
      correlation_id: event.correlationId ?? null,
    };

    const { data, error } = await supabase
      .from('canon_events')
      .insert(row)
      .select('id, created_at')
      .single();

    if (error) {
      // Log but don't throw — audit failures shouldn't break pipelines
      console.error('[canon-events] Failed to emit event:', error.message, row);
      return {
        ...event,
        id: 'failed-' + randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
      };
    }

    return {
      ...event,
      id: data.id,
      createdAt: data.created_at,
    };
  }

  async function emitBatch(events: CanonEvent[]): Promise<EmittedEvent[]> {
    if (events.length === 0) return [];

    const rows = events.map((e) => ({
      event_type: e.eventType,
      source_type: e.sourceType ?? null,
      source_ref: e.sourceRef ?? null,
      account_name: e.accountName ?? null,
      payload: e.payload ?? {},
      correlation_id: e.correlationId ?? null,
    }));

    const { data, error } = await supabase
      .from('canon_events')
      .insert(rows)
      .select('id, created_at');

    if (error) {
      console.error('[canon-events] Failed to emit batch:', error.message);
      return events.map((e) => ({
        ...e,
        id: 'failed-' + randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
      }));
    }

    return events.map((e, i) => ({
      ...e,
      id: data[i]?.id ?? 'unknown',
      createdAt: data[i]?.created_at ?? new Date().toISOString(),
    }));
  }

  function scoped(correlationId?: string): ScopedEmitter {
    const corrId = correlationId ?? randomUUID();
    return {
      correlationId: corrId,
      emit: (event) => emit({ ...event, correlationId: corrId }),
      emitBatch: (events) =>
        emitBatch(events.map((e) => ({ ...e, correlationId: corrId }))),
    };
  }

  return { emit, emitBatch, scoped };
}

// ---------------------------------------------------------------------------
// Query helpers (read the audit log)
// ---------------------------------------------------------------------------

export interface EventQuery {
  eventType?: EventType;
  sourceType?: SourceType;
  sourceRef?: string;
  correlationId?: string;
  since?: string; // ISO 8601
  limit?: number;
}

/**
 * Query the event log.
 */
export async function queryEvents(
  supabase: UKBClient,
  query: EventQuery = {},
): Promise<EmittedEvent[]> {
  let q = supabase
    .from('canon_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(query.limit ?? 50);

  if (query.eventType) q = q.eq('event_type', query.eventType);
  if (query.sourceType) q = q.eq('source_type', query.sourceType);
  if (query.sourceRef) q = q.eq('source_ref', query.sourceRef);
  if (query.correlationId) q = q.eq('correlation_id', query.correlationId);
  if (query.since) q = q.gte('created_at', query.since);

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    eventType: row.event_type as EventType,
    sourceType: row.source_type as SourceType | undefined,
    sourceRef: row.source_ref as string | undefined,
    accountName: row.account_name as string | undefined,
    payload: row.payload as Record<string, unknown> | undefined,
    correlationId: row.correlation_id as string | undefined,
    createdAt: String(row.created_at),
  }));
}
