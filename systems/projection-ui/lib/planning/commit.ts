import "server-only";
import { setWeeklyIntent, proposeProject, proposeTask, registerSystem } from "@/lib/moves";
import type { PlanDecision, PlanMove, CommittedMove } from "@/lib/planning/types";

// Apply approved run/iterate/build moves via the ENFORCED moves.
// - build:   register a new system stub (emerging) → project (system_slug, the build) → tasks (build steps)
// - iterate: project on the existing system (system_slug) → tasks (the changes)
// - run:     a single task "Run <system>: <purpose>" pointing at the live system's surface
// A project ≡ a system build/iteration; its tasks are the steps.

function mondayOf(d: Date): string {
  const diff = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff)).toISOString().slice(0, 10);
}

export async function commitPlan(decision: PlanDecision): Promise<{ committed: CommittedMove[]; intent_set: boolean; skipped: string[] }> {
  const committed: CommittedMove[] = [];
  const skipped: string[] = [];
  const canonRef = `plan-intake ${decision.weekly_intent?.theme ?? new Date().toISOString().slice(0, 10)}`;
  const prov = { created_by: "atlas", canon_ref: canonRef };

  let intent_set = false;
  if (decision.weekly_intent) {
    const wi = decision.weekly_intent;
    await setWeeklyIntent({
      week_of: mondayOf(new Date()),
      client_engagement_pct: wi.client_engagement_pct, prospect_engagement_pct: wi.prospect_engagement_pct,
      infrastructure_pct: wi.infrastructure_pct, finance_pct: wi.finance_pct, admin_pct: wi.admin_pct, personal_pct: wi.personal_pct,
      theme: wi.theme,
    });
    intent_set = true;
  }

  for (const m of decision.moves as PlanMove[]) {
    try {
      if (m.mode === "run") {
        // operate a live system — one task pointing at its surface.
        const { id } = await proposeTask({
          title: `Run ${m.system_name}${m.steps[0] ? `: ${m.steps[0]}` : ""}`,
          project_id: null, allowOrphan: true,
          importance: m.foundational ? "important" : "not_important",
          urgency: m.foundational ? "urgent" : "not_urgent",
          first_5_minutes: m.surface ? `Operate ${m.system_name} at ${m.surface}.` : `Operate ${m.system_name} on its surface.`,
          provenance: prov,
        });
        committed.push({ mode: "run", system_name: m.system_name, project_id: null, task_ids: [id], registered_system_slug: null });
        continue;
      }

      if (!m.ladder_goal_id || !m.area) { skipped.push(`${m.mode} "${m.system_name}" (needs a goal + area)`); continue; }

      // build → register the system stub first, so the project points at a real system.
      let systemSlug = m.system_slug;
      let registered: string | null = null;
      if (m.mode === "build") {
        const r = await registerSystem({ name: m.system_name, purpose: m.what_it_does ?? undefined, goal_id: m.ladder_goal_id });
        systemSlug = r.system_slug;
        registered = r.system_slug;
      }

      const verb = m.mode === "build" ? "Build" : "Iterate";
      const { id: projectId } = await proposeProject({
        name: `${verb} ${m.system_name}`,
        goal_id: m.ladder_goal_id, area: m.area,
        outcome: m.what_it_does ?? undefined,
        system_slug: systemSlug ?? undefined,
        provenance: prov,
      });

      const taskIds: string[] = [];
      for (const step of m.steps) {
        const { id } = await proposeTask({
          title: step, project_id: projectId,
          importance: m.foundational ? "important" : "not_important",
          urgency: m.foundational ? "urgent" : "not_urgent",
          first_5_minutes: step, // the step IS the concrete move (a build step of this system)
          provenance: prov,
        });
        taskIds.push(id);
      }
      committed.push({ mode: m.mode, system_name: m.system_name, project_id: projectId, task_ids: taskIds, registered_system_slug: registered });
    } catch (e) {
      skipped.push(`${m.mode} "${m.system_name}" (${e instanceof Error ? e.message : String(e)})`);
    }
  }

  return { committed, intent_set, skipped };
}
