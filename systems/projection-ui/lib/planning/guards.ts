// Pure, testable guards around the model's plan proposal. No server-only, no DB. They keep the
// driver honest: the model never invents goal ids, and system references resolve to the real
// inventory (or are marked as new systems to build).

import type { PlanMove, ProposedIntent } from "@/lib/planning/types";

export function intentSum(i: ProposedIntent): number {
  return i.client_engagement_pct + i.prospect_engagement_pct + i.infrastructure_pct + i.finance_pct + i.admin_pct + i.personal_pct;
}

/** Keep the intent only if it's well-formed (sums ~100). Otherwise drop it (the move would reject). */
export function normalizeIntent(intent: ProposedIntent | null): ProposedIntent | null {
  if (!intent) return null;
  const sum = intentSum(intent);
  return sum >= 95 && sum <= 105 ? intent : null;
}

export interface SystemRef {
  slug: string;
  status: string | null;
  surface: string | null; // a real projection-UI surface, or null = not openable
  runnable: boolean; // evidenced beta/operating — a system can have a surface yet be a stub
}

// A surface counts as real only if it's a concrete pointer, not empty or a "pending"/"planned" note.
export function hasRealSurface(surface: string | null | undefined): boolean {
  if (!surface || !surface.trim()) return false;
  return !/\b(pending|planned|tbd|none|future)\b/i.test(surface);
}

/**
 * Reconcile raw moves against the live spine + systems inventory:
 * - null out any ladder_goal_id that isn't a real active goal.
 * - resolve the system: match by slug or name → carry the real slug + status; otherwise (a build of
 *   a system that doesn't exist) leave system_slug null and status null = "new system to build".
 * - a non-build move that resolves to no live system is downgraded to build (you can't run/iterate
 *   something that doesn't exist).
 * - order foundation-first, otherwise preserve the model's dependency order.
 */
export function reconcileMoves(
  raw: PlanMove[],
  goalsById: Map<string, string>,
  systemsBySlug: Map<string, SystemRef>,
  systemsByName: Map<string, SystemRef>,
): PlanMove[] {
  const moves = raw.map((m) => {
    const ladderOk = m.ladder_goal_id && goalsById.has(m.ladder_goal_id);
    const ref =
      (m.system_slug && systemsBySlug.get(m.system_slug)) ||
      systemsByName.get((m.system_name ?? "").trim().toLowerCase()) ||
      null;
    const realSurface = ref && hasRealSurface(ref.surface) ? ref.surface : null;
    let mode = m.mode;
    // can't run a system that isn't live (no row), has no real surface, or isn't evidenced-runnable
    // (a stub can still carry a surface) — that's a build.
    if (mode !== "build" && !ref) mode = "build";
    if (mode === "run" && (!realSurface || !ref!.runnable)) mode = "build";
    return {
      ...m,
      mode,
      ladder_goal_id: ladderOk ? m.ladder_goal_id! : null,
      ladder_goal_title: ladderOk ? goalsById.get(m.ladder_goal_id!)! : null,
      system_slug: ref ? ref.slug : null,
      system_status: ref ? ref.status : null,
      surface: realSurface, // the move only carries a surface that genuinely exists
      steps: (m.steps ?? []).filter((s) => s && s.trim()),
    } as PlanMove;
  });
  // foundation first, otherwise stable (model's dependency order).
  return moves
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (a.m.foundational === b.m.foundational ? a.i - b.i : a.m.foundational ? -1 : 1))
    .map(({ m }) => m);
}
