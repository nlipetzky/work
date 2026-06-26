/**
 * Canon — Uploaded transcript file ingestion pipeline.
 * Ported from workflows/canon/ingest-uploaded-transcript.ts (Inngest wrapper removed).
 * Accepts a transcript payload and feeds it through the Canon enrichment + embedding pipeline.
 *
 * Uses content hash as the unique source ID for idempotent upserts.
 */
import { createClient } from "@supabase/supabase-js";
import { ingestTranscript } from "@canon-engine/ingestion/pipelines/transcript-ingest.js";
import {
  createTranscriptEnricher,
  createClaudeClient,
} from "@canon-engine/ingestion/pipelines/adapters/index.js";
import { createEmbeddingClient } from "@canon-engine/ingestion/pipelines/embeddings.js";
import { createHash } from "node:crypto";

function getCanonSupabase() {
  return createClient(
    process.env.CANON_SUPABASE_URL!,
    process.env.CANON_SUPABASE_SERVICE_KEY!,
  );
}

function contentHash(text: string): string {
  return `upload-${createHash("sha256").update(text).digest("hex").slice(0, 16)}`;
}

export interface UploadedTranscriptInput {
  transcriptText: string;
  client: string;
  meetingDate: string;
  participants: string[];
  meetingType: string;
  originalFilename?: string;
  account?: string;
}

export async function runIngestUploadedTranscript(data: UploadedTranscriptInput): Promise<{
  transcriptId: string;
  chunksInserted: number;
  topics: string[];
  source: string;
}> {
  const supabase = getCanonSupabase();
  const claude = createClaudeClient();
  const enricher = createTranscriptEnricher(claude);
  const embeddings = createEmbeddingClient(process.env.OPENAI_API_KEY!);

  const sourceId = contentHash(data.transcriptText);

  const result = await ingestTranscript(
    {
      transcriptText: data.transcriptText,
      driveFileId: sourceId,
      meetingDate: data.meetingDate,
      participants: data.participants,
      meetingType: data.meetingType,
      client: data.client,
      account: data.account ?? data.client,
      sourceType: "uploaded_file",
      originalFilename: data.originalFilename,
    },
    { supabase, enricher, embeddings },
  );

  console.log(
    `[ingest-uploaded] Ingested "${data.originalFilename ?? "uploaded file"}" → ` +
      `transcript=${result.transcriptId}, chunks=${result.chunksInserted}`,
  );

  return {
    transcriptId: result.transcriptId,
    chunksInserted: result.chunksInserted,
    topics: result.enrichment.topics,
    source: data.originalFilename ?? "uploaded_file",
  };
}
