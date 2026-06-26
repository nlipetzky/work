import "server-only";
import { canonDb } from "@/lib/canon";
import { systemStates } from "@/lib/queries/systemState";
import { modeFromState, splitAndOrder } from "@/lib/roadmap.mjs";

// The living roadmap — computed on read from the spine + System State + goal rank. The Projects
// tab's data. Projects group by goal (rank = the binding constraint), each goal's work split into
// system-builds (system + evidenced rung + mode + progress, foundation-first) and residual human work.

export interface RoadmapProject {
  id: string;
  name: string;
  area: string | null;
  outcome: string | null;
  next_action: string | null;
  system_slug: string | null;
  system_name: string | null;
  evidenced_state: string | null; // null when no system
  mode: "build" | "iterate" | "run" | null;
  dependency_wired: boolean; // does the system have dependency edges (foundation-first computable)?
  tasks_done: number;
  tasks_total: number;
}

export interface RoadmapGoal {
  id: string;
  title: string;
  rank: number | null;
  area: string | null;
  why_it_matters: string | null;
  is_binding_constraint: boolean;
  system_builds: RoadmapProject[];
  human_work: RoadmapProject[];
}

export async function buildRoadmap(): Promise<{ goals: RoadmapGoal[]; orphans: RoadmapProject[] }> {
  const db = canonDb();
  const [{ data: goals }, { data: projects }, { data: tasks }, { data: systems }, states] = await Promise.all([
    db.from("goals").select("id, title, rank, area, why_it_matters").eq("status", "active").order("rank", { ascending: true, nullsFirst: false }),
    db.from("projects").select("id, name, area, outcome, next_action, goal_id, system_slug").eq("status", "active"),
    db.from("tasks").select("project_id, status").in("status", ["open", "completed", "dropped"]),
    db.from("systems").select("system_slug, name, depends_on"),
    systemStates(),
  ]);

  const sysBySlug = new Map((systems ?? []).map((s: any) => [s.system_slug, s]));
  // task progress per project
  const progress = new Map<string, { done: number; total: number }>();
  for (const t of (tasks ?? []) as any[]) {
    if (!t.project_id || t.status === "dropped") continue;
    const p = progress.get(t.project_id) ?? { done: 0, total: 0 };
    p.total += 1;
    if (t.status === "completed") p.done += 1;
    progress.set(t.project_id, p);
  }

  const toRoadmapProject = (p: any): RoadmapProject => {
    const sys = p.system_slug ? sysBySlug.get(p.system_slug) : null;
    const st = p.system_slug ? states.get(p.system_slug) : undefined;
    const evidenced = st?.state ?? null;
    const prog = progress.get(p.id) ?? { done: 0, total: 0 };
    return {
      id: p.id, name: p.name, area: p.area, outcome: p.outcome, next_action: p.next_action,
      system_slug: p.system_slug ?? null,
      system_name: sys?.name ?? p.system_slug ?? null,
      evidenced_state: evidenced,
      mode: evidenced ? modeFromState(evidenced) : null,
      dependency_wired: !!(sys?.depends_on && sys.depends_on.length > 0),
      tasks_done: prog.done, tasks_total: prog.total,
    };
  };

  const allProjects = (projects ?? []).map(toRoadmapProject);
  const byGoal = new Map<string, RoadmapProject[]>();
  const orphans: RoadmapProject[] = [];
  for (let i = 0; i < (projects ?? []).length; i++) {
    const goalId = (projects as any[])[i].goal_id;
    if (!goalId) { orphans.push(allProjects[i]); continue; }
    (byGoal.get(goalId) ?? byGoal.set(goalId, []).get(goalId)!).push(allProjects[i]);
  }

  // binding constraint = the lowest rank among active goals that has work.
  const minRank = Math.min(...((goals ?? []).map((g: any) => g.rank ?? 99)));
  const roadmapGoals: RoadmapGoal[] = (goals ?? []).map((g: any) => {
    const { systemBuilds, humanWork } = splitAndOrder(byGoal.get(g.id) ?? []);
    return {
      id: g.id, title: g.title, rank: g.rank, area: g.area, why_it_matters: g.why_it_matters,
      is_binding_constraint: g.rank === minRank,
      system_builds: systemBuilds, human_work: humanWork,
    };
  });

  return { goals: roadmapGoals, orphans };
}
