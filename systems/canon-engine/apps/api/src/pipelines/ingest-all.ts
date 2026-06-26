/**
 * Canon — Full ingestion pipeline (transcripts + emails + documents).
 * Ported from workflows/canon/ingest-all.ts (Inngest wrapper removed).
 * Direct function calls replace Inngest sendEvent fan-out.
 */
import { runIngestTranscripts } from "./ingest-transcripts.js";
import { runIngestEmails } from "./ingest-emails.js";
import { runIngestDocuments } from "./ingest-documents.js";

export async function runIngestAll(opts?: { lookbackHours?: number }): Promise<{
  triggered: string[];
  results: {
    transcripts: { ingested: number; errors: string[] };
    emails: { ingested: number; errors: string[] };
    documents: { ingested: number; skipped: number; errors: string[] };
  };
}> {
  const [transcripts, emails, documents] = await Promise.allSettled([
    runIngestTranscripts({ lookbackHours: opts?.lookbackHours ?? 24 }),
    runIngestEmails(),
    runIngestDocuments(),
  ]);

  return {
    triggered: ["transcripts", "emails", "documents"],
    results: {
      transcripts:
        transcripts.status === "fulfilled"
          ? transcripts.value
          : { ingested: 0, errors: [String(transcripts.reason)] },
      emails:
        emails.status === "fulfilled"
          ? emails.value
          : { ingested: 0, errors: [String(emails.reason)] },
      documents:
        documents.status === "fulfilled"
          ? documents.value
          : { ingested: 0, skipped: 0, errors: [String(documents.reason)] },
    },
  };
}
