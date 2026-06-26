/**
 * Canon — Email ingestion pipeline.
 * Ported from workflows/canon/ingest-emails.ts (Inngest wrapper removed).
 * Fetches Gmail messages, enriches with Claude, chunks, embeds, stores in pgvector.
 */
import { fetchEmails } from "@canon-engine/ingestion/google";
import { createEmailEnricher } from "@canon-engine/ingestion/pipelines/adapters/index.js";
import { createCanonDeps } from "./deps.js";

export async function runIngestEmails(): Promise<{ ingested: number; errors: string[] }> {
  const deps = createCanonDeps(createEmailEnricher);
  const result = await fetchEmails(deps, deps.supabase);

  if (result.ingested > 0) {
    console.log(
      `[ingest-emails] Ingested ${result.ingested} email(s), ${result.errors.length} error(s)`,
    );
  }

  return result;
}
