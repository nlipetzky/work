import type Anthropic from "@anthropic-ai/sdk";
import { voyageUsageLog, createCanonClient } from "@canon-engine/db";

export type ConfigToolName =
  | "read_voyage_usage_log"
  | "update_canon_config"
  | "read_canon_status";

export const CONFIG_TOOLS: Anthropic.Tool[] = [
  {
    name: "read_voyage_usage_log",
    description:
      "Read Voyage AI embedding usage for today and recent days. Returns spend vs. daily budget.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "update_canon_config",
    description:
      "Update a canon-engine configuration value (e.g. VOYAGE_DAILY_BUDGET_USD). Writes to the canon_config table.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string", description: "Config key to update" },
        value: { type: "string", description: "New value (always stored as string)" },
        reason: { type: "string", description: "Reason for the change (audit trail)" },
      },
      required: ["key", "value", "reason"],
    },
  },
  {
    name: "read_canon_status",
    description:
      "Read overall Canon Engine health: ingestion cursor positions, recent errors, embedding budget status.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

export async function handleConfigTool(
  name: ConfigToolName,
  _input: Record<string, unknown>,
): Promise<unknown> {
  const supabase = createCanonClient();

  switch (name) {
    case "read_voyage_usage_log": {
      const todaySpend = await voyageUsageLog.todaySpend(supabase);
      const budget = parseFloat(process.env.VOYAGE_DAILY_BUDGET_USD ?? "5");
      const { data: recentRows } = await supabase
        .from("voyage_usage_log")
        .select("created_at, cost_usd, request_count, model")
        .order("created_at", { ascending: false })
        .limit(20);
      return {
        today_spend_usd: todaySpend,
        daily_budget_usd: budget,
        remaining_usd: Math.max(0, budget - todaySpend),
        budget_exhausted: todaySpend >= budget,
        recent_entries: recentRows ?? [],
      };
    }

    case "update_canon_config": {
      const input = _input as { key: string; value: string; reason: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("canon_config")
        .upsert({ key: input.key, value: input.value, updated_reason: input.reason, updated_at: new Date().toISOString() });
      if (error) throw new Error(`canon_config upsert failed: ${(error as Error).message}`);
      return { ok: true, key: input.key, value: input.value };
    }

    case "read_canon_status": {
      const todaySpend = await voyageUsageLog.todaySpend(supabase);
      const budget = parseFloat(process.env.VOYAGE_DAILY_BUDGET_USD ?? "5");
      // Cast to any for tables not yet in generated Database types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const [{ data: cursors }, { data: recentErrors }, { data: recentChunks }] =
        await Promise.all([
          db
            .from("ingestion_state")
            .select("source_type, last_seen_at, last_seen_id")
            .order("source_type"),
          db
            .from("ingestion_errors")
            .select("source_type, error_message, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("chunks")
            .select("source_type, created_at")
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      return {
        ingestion_cursors: cursors ?? [],
        recent_errors: recentErrors ?? [],
        last_chunk_at: recentChunks?.[0]?.created_at ?? null,
        voyage_budget: {
          today_spend_usd: todaySpend,
          daily_budget_usd: budget,
          budget_exhausted: todaySpend >= budget,
        },
      };
    }

    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown config tool: ${String(exhaustive)}`);
    }
  }
}
