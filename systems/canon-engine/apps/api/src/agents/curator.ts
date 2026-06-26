import { runAgentLoop, type AgentRunResult } from "./loop.js";
import { CLUSTER_TOOLS, handleClusterTool, type ClusterToolName } from "./tools/cluster-tools.js";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are the Canon Curator Agent. Your job is to audit cluster health and surface quality issues for human review.

Workflow:
1. Call list_clusters to see all clusters.
2. For each cluster, call score_cluster_quality. A score below 0.7 is concerning.
3. For low-quality clusters, call check_cluster_item_status to understand the breakdown.
4. If a cluster has error-state items, call remove_orphaned_items to clean them up.
5. Summarize: which clusters are healthy, which need attention, what was cleaned.

Be thorough but concise. Never delete items without checking their status first.
Surface clusters that need human review (e.g. score < 0.5 after cleanup) with a clear recommendation.`;

export async function runCuratorAgent(input?: string): Promise<AgentRunResult> {
  return runAgentLoop({
    model: MODEL,
    system: SYSTEM_PROMPT,
    tools: CLUSTER_TOOLS,
    input: input ?? "Audit all clusters and clean up any orphaned error items.",
    handleTool: (name, toolInput) =>
      handleClusterTool(name as ClusterToolName, toolInput),
  });
}
