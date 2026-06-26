import type Anthropic from "@anthropic-ai/sdk";
import { runAgentLoop, type AgentRunResult } from "./loop.js";
import { CONFIG_TOOLS, handleConfigTool, type ConfigToolName } from "./tools/config-tools.js";
import { runIngesterAgent } from "./ingester.js";
import { runCuratorAgent } from "./curator.js";
import { runRerankTunerAgent } from "./rerank-tuner.js";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are the Canon Operator — a lightweight orchestrator for the Canon Engine.

Your tools:
- read_canon_status: read ingestion cursor positions, recent errors, budget health
- run_ingester: run the ingestion subagent (pulls new emails/transcripts/documents)
- run_curator: run the cluster curation subagent (audits and cleans clusters)
- run_rerank_tuner: run the budget governance subagent (reviews Voyage AI spend)

Workflow for a general maintenance pass:
1. Call read_canon_status to understand the current state.
2. Decide which subagents to run based on what you see:
   - If ingestion cursors are stale or there are recent errors → run_ingester
   - If clusters may have orphaned items → run_curator
   - If budget is near exhaustion or unusually low → run_rerank_tuner
3. Run the needed subagents and summarize their results.

You are an orchestrator — you interpret state, decide what to do, and delegate.
You do not perform the work yourself; you route it to the right subagent.
Be decisive. If the status is healthy, say so and stop.`;

const OPERATOR_TOOLS: Anthropic.Tool[] = [
  CONFIG_TOOLS.find((t) => t.name === "read_canon_status")!,
  {
    name: "run_ingester",
    description:
      "Run the ingestion subagent. Optionally pass specific instructions (e.g. 'ingest emails only').",
    input_schema: {
      type: "object" as const,
      properties: {
        input: {
          type: "string",
          description: "Optional instruction to pass to the ingester agent",
        },
      },
      required: [],
    },
  },
  {
    name: "run_curator",
    description:
      "Run the cluster curation subagent. Audits cluster quality and cleans orphaned items.",
    input_schema: {
      type: "object" as const,
      properties: {
        input: {
          type: "string",
          description: "Optional instruction to pass to the curator agent",
        },
      },
      required: [],
    },
  },
  {
    name: "run_rerank_tuner",
    description:
      "Run the rerank-tuner subagent. Reviews Voyage AI embedding budget and adjusts config if needed.",
    input_schema: {
      type: "object" as const,
      properties: {
        input: {
          type: "string",
          description: "Optional instruction to pass to the rerank-tuner agent",
        },
      },
      required: [],
    },
  },
];

async function handleOperatorTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "read_canon_status":
      return handleConfigTool("read_canon_status" as ConfigToolName, input);
    case "run_ingester":
      return runIngesterAgent(input.input as string | undefined);
    case "run_curator":
      return runCuratorAgent(input.input as string | undefined);
    case "run_rerank_tuner":
      return runRerankTunerAgent(input.input as string | undefined);
    default:
      throw new Error(`Unknown operator tool: ${name}`);
  }
}

export async function runOperatorAgent(input?: string): Promise<AgentRunResult> {
  return runAgentLoop({
    model: MODEL,
    system: SYSTEM_PROMPT,
    tools: OPERATOR_TOOLS,
    input: input ?? "Run a standard Canon Engine maintenance pass.",
    handleTool: handleOperatorTool,
  });
}
