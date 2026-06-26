import { runAgentLoop, type AgentRunResult } from "./loop.js";
import { CONFIG_TOOLS, handleConfigTool, type ConfigToolName } from "./tools/config-tools.js";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are the Canon Rerank Tuner Agent. Your job is budget governance for Voyage AI embeddings.

Workflow:
1. Call read_voyage_usage_log to see today's spend vs. budget.
2. If budget is exhausted or near-exhausted (>90%), recommend reducing VOYAGE_DAILY_BUDGET_USD or flag for human review.
3. If budget usage is very low (<10% of daily budget by end of day), consider whether the budget is set too high.
4. Only call update_canon_config if you have a clear, data-backed reason to change a value.
5. Always provide a reason when updating config — it is written to the audit log.

Do not update config without explicit justification from the usage data.
Report your findings and any changes made clearly.`;

export async function runRerankTunerAgent(input?: string): Promise<AgentRunResult> {
  return runAgentLoop({
    model: MODEL,
    system: SYSTEM_PROMPT,
    tools: CONFIG_TOOLS.filter((t) =>
      ["read_voyage_usage_log", "update_canon_config"].includes(t.name),
    ),
    input: input ?? "Review Voyage AI usage and assess whether budget parameters need adjustment.",
    handleTool: (name, toolInput) =>
      handleConfigTool(name as ConfigToolName, toolInput),
  });
}
