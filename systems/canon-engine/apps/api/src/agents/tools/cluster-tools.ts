import type Anthropic from "@anthropic-ai/sdk";
import { canonClusters, clusterItems, createCanonClient } from "@canon-engine/db";

export type ClusterToolName =
  | "list_clusters"
  | "check_cluster_item_status"
  | "remove_orphaned_items"
  | "score_cluster_quality";

export const CLUSTER_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_clusters",
    description: "List all clusters with their names and IDs.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "check_cluster_item_status",
    description: "Get status breakdown (pending/ready/error) for items in a specific cluster.",
    input_schema: {
      type: "object" as const,
      properties: {
        cluster_id: { type: "string", description: "UUID of the cluster to inspect" },
      },
      required: ["cluster_id"],
    },
  },
  {
    name: "remove_orphaned_items",
    description:
      "Remove cluster items that are in error state from a specific cluster. Returns count of removed items.",
    input_schema: {
      type: "object" as const,
      properties: {
        cluster_id: { type: "string", description: "UUID of the cluster to clean" },
      },
      required: ["cluster_id"],
    },
  },
  {
    name: "score_cluster_quality",
    description:
      "Compute a quality score (0-1) for a cluster based on the ratio of ready items to total items.",
    input_schema: {
      type: "object" as const,
      properties: {
        cluster_id: { type: "string", description: "UUID of the cluster to score" },
      },
      required: ["cluster_id"],
    },
  },
];

export async function handleClusterTool(
  name: ClusterToolName,
  input: Record<string, unknown>,
): Promise<unknown> {
  const supabase = createCanonClient();

  switch (name) {
    case "list_clusters": {
      const clusters = await canonClusters.list(supabase);
      return clusters.map((c) => ({ id: c.id, name: c.name, created_at: c.created_at }));
    }

    case "check_cluster_item_status": {
      const clusterId = input.cluster_id as string;
      const items = await clusterItems.list(supabase, clusterId);
      const byStatus: Record<string, number> = {};
      for (const item of items) {
        const s = item.status ?? "unknown";
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      }
      return { cluster_id: clusterId, total: items.length, by_status: byStatus };
    }

    case "remove_orphaned_items": {
      const clusterId = input.cluster_id as string;
      const { data: deleted, error } = await supabase
        .from("cluster_items")
        .delete()
        .eq("cluster_id", clusterId)
        .eq("status", "error")
        .select("id");
      if (error) throw new Error(`remove_orphaned_items failed: ${error.message}`);
      return { cluster_id: clusterId, removed: deleted?.length ?? 0 };
    }

    case "score_cluster_quality": {
      const clusterId = input.cluster_id as string;
      const items = await clusterItems.list(supabase, clusterId);
      const total = items.length;
      const ready = items.filter((i) => i.status === "ready").length;
      const score = total > 0 ? ready / total : 0;
      return { cluster_id: clusterId, total, ready, score: parseFloat(score.toFixed(3)) };
    }

    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown cluster tool: ${String(exhaustive)}`);
    }
  }
}
