/**
 * Canon pipeline shared dependencies.
 *
 * Merged from workflows/canon/lib.ts + workflows/canon/create-emitter.ts.
 * Import prefix changed: @aos/canon/* → @canon-engine/ingestion/*
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClaudeClient } from "@canon-engine/ingestion/pipelines/adapters/index.js";
import { createEmbeddingClient } from "@canon-engine/ingestion/pipelines/embeddings.js";
import { randomUUID } from "node:crypto";

export function getCanonSupabase(): SupabaseClient {
  return createClient(
    process.env.CANON_SUPABASE_URL!,
    process.env.CANON_SUPABASE_SERVICE_KEY!,
  );
}

export interface CanonDeps<TEnricher> {
  supabase: SupabaseClient;
  enricher: TEnricher;
  embeddings: ReturnType<typeof createEmbeddingClient>;
  emitter: ReturnType<typeof createCanonEmitter>;
}

export function createCanonDeps<TEnricher>(
  enricherFactory: (claude: ReturnType<typeof createClaudeClient>) => TEnricher,
): CanonDeps<TEnricher> {
  const supabase = getCanonSupabase();
  const claude = createClaudeClient();
  return {
    supabase,
    enricher: enricherFactory(claude),
    embeddings: createEmbeddingClient(process.env.OPENAI_API_KEY!),
    emitter: createCanonEmitter(supabase),
  };
}

// ---------------------------------------------------------------------------
// Canon event emitter (inlined from create-emitter.ts — no @aos/canon/events
// export yet; this can be replaced once that export is added).
// ---------------------------------------------------------------------------

type EventType = "sync" | "ingest" | "validate" | "enrich" | "status_change" | "governance_scan" | "error";
type SourceType = "canon" | "transcript" | "email" | "document";

interface CanonEvent {
  eventType: EventType;
  sourceType?: SourceType;
  sourceRef?: string;
  accountName?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
}

interface EmittedEvent extends CanonEvent {
  id: string;
  createdAt: string;
}

export function createCanonEmitter(supabase: SupabaseClient) {
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
      .from("canon_events")
      .insert(row)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[canon-events] Failed to emit event:", error.message, row);
      return {
        ...event,
        id: "failed-" + randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
      };
    }

    return { ...event, id: data.id, createdAt: data.created_at };
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
      .from("canon_events")
      .insert(rows)
      .select("id, created_at");
    if (error) {
      console.error("[canon-events] Failed to emit batch:", error.message);
      return events.map((e) => ({
        ...e,
        id: "failed-" + randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
      }));
    }
    return events.map((e, i) => ({
      ...e,
      id: data[i]?.id ?? "unknown",
      createdAt: data[i]?.created_at ?? new Date().toISOString(),
    }));
  }

  function scoped(correlationId?: string) {
    const id = correlationId ?? randomUUID();
    return {
      correlationId: id,
      emit: (event: Omit<CanonEvent, "correlationId">) =>
        emit({ ...event, correlationId: id }),
      emitBatch: (events: Array<Omit<CanonEvent, "correlationId">>) =>
        emitBatch(events.map((e) => ({ ...e, correlationId: id }))),
    };
  }

  return { emit, emitBatch, scoped };
}
