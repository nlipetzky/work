import { runAgentLoop, type AgentRunResult } from "./loop.js";
import { INGESTION_TOOLS, handleIngestionTool, type IngestionToolName } from "./tools/ingestion-tools.js";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are the Canon Ingestion Agent. Your job is to run ingestion passes that pull new content (emails, transcripts, documents) into the Canon knowledge base.

When asked to ingest, decide which sources to pull based on the request:
- "run ingestion" or no specific source → call ingest_all
- "ingest emails" → call ingest_emails
- "ingest transcripts" → call ingest_transcripts
- "ingest documents" → call ingest_documents

After each tool call, report what was ingested (record counts, any errors). Be concise.
Do not re-run a tool that already returned results in this session unless explicitly asked.
If a tool returns an error, report it clearly and stop — do not retry.`;

export async function runIngesterAgent(input?: string): Promise<AgentRunResult> {
  return runAgentLoop({
    model: MODEL,
    system: SYSTEM_PROMPT,
    tools: INGESTION_TOOLS,
    input: input ?? "Run the standard ingestion pass for all sources.",
    handleTool: (name, toolInput) =>
      handleIngestionTool(name as IngestionToolName, toolInput),
  });
}
