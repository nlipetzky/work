import type Anthropic from "@anthropic-ai/sdk";
import {
  runIngestAll,
  runIngestTranscripts,
  runIngestEmails,
  runIngestDocuments,
} from "../../pipelines/index.js";

export type IngestionToolName =
  | "ingest_all"
  | "ingest_emails"
  | "ingest_transcripts"
  | "ingest_documents";

export const INGESTION_TOOLS: Anthropic.Tool[] = [
  {
    name: "ingest_all",
    description:
      "Run a full ingestion pass: emails, transcripts, and documents. Returns counts of new records ingested per source.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "ingest_emails",
    description:
      "Ingest new email threads and messages from Gmail. Picks up where the last cursor left off.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "ingest_transcripts",
    description:
      "Ingest new meeting transcripts from Google Drive. Chunks and embeds each transcript.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "ingest_documents",
    description:
      "Ingest new documents from Google Drive. Chunks and embeds each document.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

export async function handleIngestionTool(
  name: IngestionToolName,
  _input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "ingest_all":
      return runIngestAll();
    case "ingest_emails":
      return runIngestEmails();
    case "ingest_transcripts":
      return runIngestTranscripts();
    case "ingest_documents":
      return runIngestDocuments();
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown ingestion tool: ${String(exhaustive)}`);
    }
  }
}
