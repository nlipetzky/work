/**
 * POST /api/canon/agents/:agent/run
 *
 * HTTP trigger for each Canon SDK agent. Auth is provided by the bearer
 * middleware applied to all /api/canon routes in server.ts.
 *
 * Body: { input?: string }
 * Response: { ok: true, result: string, iterations: number }
 *         | { ok: false, error: string }
 */
import { makeRouter } from "../lib/router.js";
import { runOperatorAgent } from "../agents/operator.js";
import { runIngesterAgent } from "../agents/ingester.js";
import { runCuratorAgent } from "../agents/curator.js";
import { runRerankTunerAgent } from "../agents/rerank-tuner.js";

type AgentName = "operator" | "ingester" | "curator" | "rerank-tuner";

const AGENTS: Record<AgentName, (input?: string) => Promise<{ result: string; iterations: number }>> = {
  operator: runOperatorAgent,
  ingester: runIngesterAgent,
  curator: runCuratorAgent,
  "rerank-tuner": runRerankTunerAgent,
};

const router = makeRouter();

router.post("/:agent/run", async (c) => {
  const agentName = c.req.param("agent") as AgentName;

  const agentFn = AGENTS[agentName];
  if (!agentFn) {
    return c.json(
      {
        ok: false,
        error: `Unknown agent: "${agentName}". Valid agents: ${Object.keys(AGENTS).join(", ")}`,
      },
      400,
    );
  }

  let input: string | undefined;
  try {
    const body = await c.req.json().catch(() => ({}));
    input = typeof body?.input === "string" ? body.input : undefined;
  } catch {
    // no body — use default
  }

  try {
    const { result, iterations } = await agentFn(input);
    return c.json({ ok: true, result, iterations });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[agents] ${agentName} error:`, message);
    return c.json({ ok: false, error: message }, 500);
  }
});

export default router;
