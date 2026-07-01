// Composition / runs / evals readers for the new canon-backed SOP schema.
//
// Slice 2B introduces canon.public.sop_activities + activity_runs + activity_evals
// as the source-of-truth for activity composition (replacing the TS-only spec under
// systems/operating-sop/sops/). The migrations roll out separately from the UI, so
// every reader here MUST degrade gracefully when the tables don't exist yet:
//   - "relation does not exist" / undefined-table errors → null or [] (never throw)
//
// All reads go through the canon service-role client (canonDb) since these tables
// inherit the canon-engine RLS posture (deny-all + service_role only).

import "server-only";
import { canonDb } from "@/lib/canon";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ActivityComposition = {
  activityId: string;
  version: number;
  name: string;
  what: string;
  description: string | null;
  executorClass: string;
  ownerSystemSlug: string;
  functionPath: string | null;
  triggerEvent: string | null;
  schemas: { in?: string; out?: string } | null;
  adapters: string[];
  skills: { slug: string; title: string; description: string | null; path: string }[];
  routeComponent: string | null;
  reads: string[];
  writes: string[];
  provenanceConsumes: string[];
  provenanceWrites: string[];
};

export type ActivityRunRow = {
  runId: string;
  status: string;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  costUsd: number;
};

export type ActivityEvalsSummary = {
  totalFixtures: number;
  passedLastRun: number;
  passRatePct: number;
  lastRunAt: string | null;
  staleCount: number;
};

// Active/locked judgment_units targeting an activity, surfaced in the /operate
// cockpit as the activity's "defaults from the folder". Read from the canon view
// v_folder_active_units (standing in (active,locked) AND retired_at is null).
export type JudgmentRuling = {
  id: string;
  rulingKind: "constraint" | "disqualifier" | "default" | "entity_rule" | null;
  assertion: string;
  trigger: Record<string, unknown> | null;
  reasoning: string | null;
  standing: "proposed" | "active" | "locked";
  gatePosture: "push_to_veto" | "pull_to_approve" | null;
  provenance: string;
};

export type JudgmentOption = {
  id: string; // judgment_unit id
  assertion: string;
  reasoning: string | null;
  standing: "proposed" | "active" | "locked";
  provenance: string;
  targetOptionId: string | null;
  // Hydrated from activity_options when target_option_id resolves.
  option: {
    id: string;
    optionSlug: string;
    kind: "source" | "tactic";
    name: string;
    whenToUse: string | null;
    priority: number | null;
  } | null;
};

export type ActivityJudgment = {
  activityId: string;
  rulings: JudgmentRuling[];
  options: JudgmentOption[];
};

// ─── Error helpers ─────────────────────────────────────────────────────────

// Missing-table errors come in three shapes:
//   - Postgres raw: code === "42P01" ("undefined_table")
//   - PostgREST schema-cache: code === "PGRST205" ("Could not find the table ... in the schema cache")
//   - Plain message: "... does not exist" (some pg drivers strip codes)
// Catch all three so reads degrade to null/[] until the migration lands.
function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  if (typeof e.message === "string" && /does not exist|schema cache/i.test(e.message)) return true;
  return false;
}

// ─── Composition ───────────────────────────────────────────────────────────

export async function getActivityComposition(
  activityId: string,
): Promise<ActivityComposition | null> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("sop_activities")
      .select("*")
      .eq("activity_id", activityId)
      .eq("is_current", true)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error)) return null;
      throw error;
    }
    if (!data) return null;

    // Resolve skill slugs → titles/paths from public.skills. The TS Activity
    // spec stores `skills` as a text[] of slugs on sop_activities.
    const skillSlugs: string[] = Array.isArray(data.skills) ? (data.skills as string[]) : [];
    let skills: ActivityComposition["skills"] = [];
    if (skillSlugs.length > 0) {
      try {
        const { data: skillRows, error: skillErr } = await db
          .from("skills")
          .select("slug, title, description, path")
          .in("slug", skillSlugs);
        if (skillErr) {
          if (!isMissingTable(skillErr)) throw skillErr;
        } else if (skillRows) {
          const bySlug = new Map(
            skillRows.map((r) => [
              r.slug as string,
              {
                slug: r.slug as string,
                title: (r.title as string) ?? (r.slug as string),
                description: (r.description as string | null) ?? null,
                path: (r.path as string) ?? "",
              },
            ]),
          );
          skills = skillSlugs.map(
            (s) =>
              bySlug.get(s) ?? {
                slug: s,
                title: s,
                description: null,
                path: "",
              },
          );
        }
      } catch (e) {
        if (!isMissingTable(e)) throw e;
        // public.skills missing → fall back to slug-only stubs.
        skills = skillSlugs.map((s) => ({ slug: s, title: s, description: null, path: "" }));
      }
    }

    return {
      activityId: data.activity_id as string,
      version: (data.version as number) ?? 1,
      name: (data.name as string) ?? (data.activity_id as string),
      what: (data.what as string) ?? "",
      description: (data.description as string | null) ?? null,
      executorClass: (data.executor_class as string) ?? "",
      ownerSystemSlug: (data.owning_system_slug as string) ?? "",
      functionPath: (data.function_path as string | null) ?? null,
      triggerEvent: (data.trigger_event as string | null) ?? null,
      schemas: (data.schemas as { in?: string; out?: string } | null) ?? null,
      adapters: Array.isArray(data.adapters) ? (data.adapters as string[]) : [],
      skills,
      routeComponent: (data.route_component as string | null) ?? null,
      reads: Array.isArray(data.reads) ? (data.reads as string[]) : [],
      writes: Array.isArray(data.writes) ? (data.writes as string[]) : [],
      provenanceConsumes: Array.isArray(data.provenance_consumes)
        ? (data.provenance_consumes as string[])
        : [],
      provenanceWrites: Array.isArray(data.provenance_writes)
        ? (data.provenance_writes as string[])
        : [],
    };
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

// ─── Runs ──────────────────────────────────────────────────────────────────

export async function getActivityRuns(
  activityId: string,
  limit: number = 5,
): Promise<ActivityRunRow[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("activity_runs")
      .select("run_id, status, message, started_at, finished_at, duration_ms, cost_usd")
      .eq("activity_id", activityId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    if (!data) return [];
    return data.map((r) => ({
      runId: r.run_id as string,
      status: (r.status as string) ?? "unknown",
      message: (r.message as string | null) ?? null,
      startedAt: r.started_at as string,
      finishedAt: (r.finished_at as string | null) ?? null,
      durationMs: (r.duration_ms as number | null) ?? null,
      costUsd: typeof r.cost_usd === "number" ? r.cost_usd : Number(r.cost_usd ?? 0),
    }));
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// ─── Evals ─────────────────────────────────────────────────────────────────

export async function getActivityEvals(
  activityId: string,
): Promise<ActivityEvalsSummary | null> {
  const db = canonDb();
  try {
    // Fixtures authored against this activity.
    const { data: fixtures, error: fxErr } = await db
      .from("activity_evals")
      .select("eval_id, is_stale")
      .eq("activity_id", activityId);
    if (fxErr) {
      if (isMissingTable(fxErr)) return null;
      throw fxErr;
    }
    if (!fixtures || fixtures.length === 0) return null;

    const totalFixtures = fixtures.length;
    const staleCount = fixtures.filter((f) => f.is_stale === true).length;
    const evalIds = fixtures.map((f) => f.eval_id as string);

    // Most-recent eval run per fixture, then count passes.
    let passedLastRun = 0;
    let lastRunAt: string | null = null;
    try {
      const { data: runs, error: runErr } = await db
        .from("activity_eval_runs")
        .select("eval_id, passed, ran_at")
        .in("eval_id", evalIds)
        .order("ran_at", { ascending: false });
      if (runErr) {
        if (!isMissingTable(runErr)) throw runErr;
      } else if (runs) {
        const latestByEval = new Map<string, { passed: boolean; ran_at: string }>();
        for (const r of runs) {
          const id = r.eval_id as string;
          if (!latestByEval.has(id)) {
            latestByEval.set(id, {
              passed: r.passed === true,
              ran_at: r.ran_at as string,
            });
          }
        }
        for (const v of latestByEval.values()) {
          if (v.passed) passedLastRun += 1;
          if (!lastRunAt || v.ran_at > lastRunAt) lastRunAt = v.ran_at;
        }
      }
    } catch (e) {
      if (!isMissingTable(e)) throw e;
      // activity_eval_runs missing → fixtures exist but never executed.
    }

    const passRatePct =
      totalFixtures === 0 ? 0 : Math.round((passedLastRun / totalFixtures) * 100);

    return {
      totalFixtures,
      passedLastRun,
      passRatePct,
      lastRunAt,
      staleCount,
    };
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

// ─── Judgment (folder defaults) ──────────────────────────────────────────────

// Active/locked judgment_units targeting this activity, partitioned into
// rulings (recipe_edit + ruling kinds) and options (kind = "option"). The caller
// surfaces these as the activity's "defaults from the folder". Reads the view
// v_folder_active_units so only standing in (active,locked) + non-retired rows
// land, matching the canon contract. Degrades to null when canon tables are absent.
export async function getActivityJudgment(
  activityId: string,
): Promise<ActivityJudgment | null> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("v_folder_active_units")
      .select(
        "id, kind, ruling_kind, assertion, trigger, reasoning, standing, gate_posture, provenance, target_option_id",
      )
      .eq("target_activity_id", activityId)
      .order("created_at", { ascending: true });
    if (error) {
      if (isMissingTable(error)) return null;
      throw error;
    }
    if (!data) return null;

    const rulings: JudgmentRuling[] = [];
    const optionUnits: {
      id: string;
      assertion: string;
      reasoning: string | null;
      standing: "proposed" | "active" | "locked";
      provenance: string;
      targetOptionId: string | null;
    }[] = [];

    for (const row of data) {
      const kind = row.kind as string;
      if (kind === "option") {
        optionUnits.push({
          id: row.id as string,
          assertion: (row.assertion as string) ?? "",
          reasoning: (row.reasoning as string | null) ?? null,
          standing: (row.standing as JudgmentRuling["standing"]) ?? "active",
          provenance: (row.provenance as string) ?? "",
          targetOptionId: (row.target_option_id as string | null) ?? null,
        });
      } else {
        // recipe_edit + ruling → surfaced as rulings
        rulings.push({
          id: row.id as string,
          rulingKind: (row.ruling_kind as JudgmentRuling["rulingKind"]) ?? null,
          assertion: (row.assertion as string) ?? "",
          trigger: (row.trigger as Record<string, unknown> | null) ?? null,
          reasoning: (row.reasoning as string | null) ?? null,
          standing: (row.standing as JudgmentRuling["standing"]) ?? "active",
          gatePosture: (row.gate_posture as JudgmentRuling["gatePosture"]) ?? null,
          provenance: (row.provenance as string) ?? "",
        });
      }
    }

    // Hydrate activity_options for any target_option_id, preserving unit order.
    const optionIds = optionUnits
      .map((u) => u.targetOptionId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const byOptionId = new Map<string, JudgmentOption["option"]>();
    if (optionIds.length > 0) {
      try {
        const { data: optRows, error: optErr } = await db
          .from("activity_options")
          .select("id, option_slug, kind, name, when_to_use, priority")
          .in("id", optionIds);
        if (optErr) {
          if (!isMissingTable(optErr)) throw optErr;
        } else if (optRows) {
          for (const r of optRows) {
            byOptionId.set(r.id as string, {
              id: r.id as string,
              optionSlug: (r.option_slug as string) ?? "",
              kind: (r.kind as "source" | "tactic") ?? "source",
              name: (r.name as string) ?? (r.option_slug as string) ?? "",
              whenToUse: (r.when_to_use as string | null) ?? null,
              priority: (r.priority as number | null) ?? null,
            });
          }
        }
      } catch (e) {
        if (!isMissingTable(e)) throw e;
        // activity_options missing → option units surface without hydration.
      }
    }

    const options: JudgmentOption[] = optionUnits.map((u) => ({
      ...u,
      option: u.targetOptionId ? byOptionId.get(u.targetOptionId) ?? null : null,
    }));

    return { activityId, rulings, options };
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}
