import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Historical-run context loader for ITERATE mode.
// Reads canon.activity_runs filtered by activity_id and returns per-run digests
// plus an aggregate block (success rate, median duration, median cost, common
// failure clusters). The dispatcher calls this when an activity opens for
// iteration so downstream skills (eval-reviewer, prompt-tweak-proposer,
// regression-fixture-author) have a shared substrate to reason against.

export type HistoricalRunDigest = {
  runs: {
    runId: string;
    engagementId: string | null;
    startedAt: string;
    status: string;
    durationMs: number | null;
    costUsd: number;
    messagePreview: string | null;
  }[];
  aggregate: {
    totalRuns: number;
    successRate: number;
    commonFailures: string[];
    medianDurationMs: number | null;
    medianCostUsd: number;
  };
};

let _canon: SupabaseClient | null = null;

function canonDb(): SupabaseClient {
  if (_canon) return _canon;
  const url =
    process.env.CANON_SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.CANON_SUPABASE_SERVICE_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing CANON_SUPABASE_URL/CANON_SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY) for historical-runs loader.",
    );
  }
  _canon = createClient(url, key, { auth: { persistSession: false } });
  return _canon;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function clusterFailures(messages: string[]): string[] {
  // Normalize each failure message to a short signature, count occurrences,
  // return the top 5 signatures by frequency. Strips ids/timestamps/numbers so
  // semantically-equivalent failures cluster.
  const counts = new Map<string, number>();
  for (const raw of messages) {
    if (!raw) continue;
    const sig = raw
      .toLowerCase()
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "<uuid>")
      .replace(/\b\d{4}-\d{2}-\d{2}t[\d:.zZ+-]+/g, "<timestamp>")
      .replace(/\b\d+\b/g, "<n>")
      .slice(0, 160);
    counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sig, count]) => `${sig} (×${count})`);
}

function previewMessage(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input === "string") return input.slice(0, 160);
  try {
    return JSON.stringify(input).slice(0, 160);
  } catch {
    return null;
  }
}

export async function loadHistoricalRuns(
  activityId: string,
  limit: number = 20,
): Promise<HistoricalRunDigest> {
  const empty: HistoricalRunDigest = {
    runs: [],
    aggregate: {
      totalRuns: 0,
      successRate: 0,
      commonFailures: [],
      medianDurationMs: null,
      medianCostUsd: 0,
    },
  };

  let rows:
    | {
        run_id?: string;
        id?: string;
        engagement_id?: string | null;
        started_at?: string | null;
        finished_at?: string | null;
        status?: string | null;
        duration_ms?: number | null;
        cost_usd?: number | string | null;
        error_message?: string | null;
        message?: string | null;
        input?: unknown;
        output?: unknown;
      }[]
    | null = null;

  try {
    const db = canonDb();
    const { data, error } = await db
      .schema("public")
      .from("activity_runs")
      .select(
        "run_id,id,engagement_id,started_at,finished_at,status,duration_ms,cost_usd,error_message,message,input,output",
      )
      .eq("activity_id", activityId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Table likely doesn't exist yet (pre-migration) or activity has no runs.
      // Treat as empty rather than throwing so the dispatcher can still render.
      return empty;
    }
    rows = data ?? [];
  } catch {
    return empty;
  }

  if (!rows || rows.length === 0) return empty;

  const runs = rows.map((r) => {
    const startedAt = r.started_at ?? "";
    const finishedAt = r.finished_at ?? null;
    let durationMs = r.duration_ms ?? null;
    if (durationMs == null && startedAt && finishedAt) {
      const s = Date.parse(startedAt);
      const f = Date.parse(finishedAt);
      if (!Number.isNaN(s) && !Number.isNaN(f)) durationMs = f - s;
    }
    const cost =
      typeof r.cost_usd === "string"
        ? Number.parseFloat(r.cost_usd)
        : (r.cost_usd ?? 0);
    return {
      runId: r.run_id ?? r.id ?? "",
      engagementId: r.engagement_id ?? null,
      startedAt,
      status: r.status ?? "unknown",
      durationMs,
      costUsd: Number.isFinite(cost as number) ? (cost as number) : 0,
      messagePreview:
        previewMessage(r.error_message ?? r.message ?? r.output ?? r.input),
    };
  });

  const totalRuns = runs.length;
  const succeeded = runs.filter(
    (r) => r.status === "succeeded" || r.status === "success" || r.status === "ok",
  ).length;
  const successRate = totalRuns === 0 ? 0 : succeeded / totalRuns;

  const failureMessages = rows
    .filter(
      (r) =>
        (r.status ?? "").toLowerCase() === "failed" ||
        (r.status ?? "").toLowerCase() === "error",
    )
    .map((r) => r.error_message ?? r.message ?? "")
    .filter((m): m is string => Boolean(m));

  const durations = runs
    .map((r) => r.durationMs)
    .filter((d): d is number => d != null && Number.isFinite(d));
  const costs = runs.map((r) => r.costUsd).filter((c) => Number.isFinite(c));

  return {
    runs,
    aggregate: {
      totalRuns,
      successRate,
      commonFailures: clusterFailures(failureMessages),
      medianDurationMs: median(durations),
      medianCostUsd: median(costs) ?? 0,
    },
  };
}
