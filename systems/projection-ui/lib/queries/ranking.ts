import "server-only";
import { canonDb } from "@/lib/canon";
import { rankNextActions } from "@/lib/ranking.mjs";
import type { RankInput, RankResult, WeeklyIntentLike } from "@/lib/ranking";
import { latestWeeklyIntent } from "@/lib/queries/intent";

// Joins open tasks → project (area) → goal (leverage / wealth_test / area), the inputs the
// ranking formula needs. Source of truth: canon_engine.public.{tasks,projects,goals}.
async function listRankableTasks(): Promise<RankInput[]> {
  const { data, error } = await canonDb()
    .from("tasks")
    .select(
      "id,title,importance,urgency,due,first_5_minutes,recurring," +
        "project:projects(id,name,area,goal:goals(id,title,leverage,wealth_test,area))",
    )
    .eq("status", "open");
  if (error) throw new Error(error.message);

  // Flatten the goal's leverage signal onto the task; area falls back project → goal.
  return (data ?? []).map((row: any) => {
    const project = row.project ?? null;
    const goal = project?.goal ?? null;
    return {
      id: row.id,
      title: row.title,
      importance: row.importance,
      urgency: row.urgency,
      due: row.due,
      first_5_minutes: row.first_5_minutes,
      recurring: row.recurring ?? false,
      area: project?.area ?? goal?.area ?? null,
      leverage: goal?.leverage ?? null,
      wealth_test: goal?.wealth_test ?? null,
      project: project ? { id: project.id, name: project.name, goal: goal ? { id: goal.id, title: goal.title } : null } : null,
    } as RankInput;
  });
}

// The computed "one next action" + ordered backlog. Deterministic; the model never ranks.
export async function rankedNextActions(): Promise<RankResult> {
  const [tasks, intent] = await Promise.all([listRankableTasks(), latestWeeklyIntent()]);
  return rankNextActions(tasks, (intent as WeeklyIntentLike | null) ?? null);
}
