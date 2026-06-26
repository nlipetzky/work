/**
 * Canon Engine — Real-time change subscriptions (L2).
 *
 * Wraps Supabase Realtime to let consumers subscribe to canon_events
 * inserts. Supports filtering by event type, source type, and account.
 *
 * Requires Supabase Realtime to be enabled on the canon_events table
 * (Dashboard → Database → Replication → enable canon_events).
 *
 * Usage:
 *   const sub = subscribeToChanges(supabase, {
 *     eventTypes: ['sync', 'validate'],
 *     onEvent: (event) => console.log('Change:', event),
 *   });
 *   // Later:
 *   sub.unsubscribe();
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { EventType, SourceType, EmittedEvent } from './event-emitter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChangeSubscriptionOptions {
  /** Filter: only receive these event types */
  eventTypes?: EventType[];
  /** Filter: only receive events for these source types */
  sourceTypes?: SourceType[];
  /** Filter: only receive events for this account */
  accountName?: string;
  /** Callback for each matching event */
  onEvent: (event: EmittedEvent) => void;
  /** Callback for subscription errors */
  onError?: (error: Error) => void;
  /** Callback when subscription is established */
  onSubscribed?: () => void;
}

export interface ChangeSubscription {
  /** Unique channel name */
  channelName: string;
  /** The underlying Supabase Realtime channel */
  channel: RealtimeChannel;
  /** Unsubscribe and clean up */
  unsubscribe: () => void;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

let channelCounter = 0;

/**
 * Subscribe to real-time changes on the canon_events table.
 *
 * Events are filtered client-side (Supabase Realtime broadcasts all inserts
 * on the table; fine-grained server-side filtering uses Realtime's filter
 * syntax which only supports equality on one column).
 */
export function subscribeToChanges(
  supabase: UKBClient,
  opts: ChangeSubscriptionOptions,
): ChangeSubscription {
  const channelName = `canon-events-${++channelCounter}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'canon_events',
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const event = mapRowToEvent(row);

        // Client-side filtering
        if (opts.eventTypes && !opts.eventTypes.includes(event.eventType)) return;
        if (opts.sourceTypes && event.sourceType && !opts.sourceTypes.includes(event.sourceType)) return;
        if (opts.accountName && event.accountName !== opts.accountName) return;

        opts.onEvent(event);
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && opts.onSubscribed) {
        opts.onSubscribed();
      }
      if (status === 'CHANNEL_ERROR' && opts.onError) {
        opts.onError(new Error(`Realtime channel error on ${channelName}`));
      }
    });

  return {
    channelName,
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Subscribe to changes for a specific correlation ID (e.g., track a single sync run).
 */
export function subscribeToCorrelation(
  supabase: UKBClient,
  correlationId: string,
  onEvent: (event: EmittedEvent) => void,
  onError?: (error: Error) => void,
): ChangeSubscription {
  const channelName = `canon-corr-${correlationId.slice(0, 8)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'canon_events',
        filter: `correlation_id=eq.${correlationId}`,
      },
      (payload) => {
        onEvent(mapRowToEvent(payload.new as Record<string, unknown>));
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error(`Realtime channel error tracking correlation ${correlationId}`));
      }
    });

  return {
    channelName,
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRowToEvent(row: Record<string, unknown>): EmittedEvent {
  return {
    id: String(row.id ?? ''),
    eventType: row.event_type as EventType,
    sourceType: row.source_type as SourceType | undefined,
    sourceRef: row.source_ref as string | undefined,
    accountName: row.account_name as string | undefined,
    payload: row.payload as Record<string, unknown> | undefined,
    correlationId: row.correlation_id as string | undefined,
    createdAt: String(row.created_at ?? ''),
  };
}
