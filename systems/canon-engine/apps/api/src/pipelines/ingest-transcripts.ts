/**
 * Canon — Transcript ingestion pipeline.
 * Ported from workflows/canon/ingest-transcripts.ts (Inngest wrapper removed).
 * Fetches meeting transcripts via Google Meet + Drive APIs, enriches, chunks, embeds.
 */
import { fetchTranscripts } from "@canon-engine/ingestion/google";
import { createTranscriptEnricher } from "@canon-engine/ingestion/pipelines/adapters/index.js";
import { createCanonDeps } from "./deps.js";

export async function runIngestTranscripts(opts?: {
  lookbackHours?: number;
}): Promise<{ ingested: number; errors: string[] }> {
  const lookbackHours = opts?.lookbackHours ?? 72;
  const deps = createCanonDeps(createTranscriptEnricher);
  const result = await fetchTranscripts(deps, deps.supabase, { lookbackHours });

  if (result.ingested > 0) {
    console.log(
      `[ingest-transcripts] Ingested ${result.ingested} transcript(s), ${result.errors.length} error(s)`,
    );
  }

  return result;
}
