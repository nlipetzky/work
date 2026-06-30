import "server-only";
import { canonDb } from "@/lib/canon";
import { rankNextActions } from "@/lib/ranking.mjs";
import type { RankInput, RankResult, WeeklyIntentLike } from "@/lib/ranking";
import { latestWeeklyIntent } from "@/lib/queries/intent";
import { dueMotions } from "@/lib/queries/expertLiaison";

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

// Phase 4 — follow-up persistence sweep. An overdue expert_motion the operator owes a move on
// (status='active', next_action_due fired) becomes a synthetic rankable so it competes in the
// SAME formula and surfaces as a ranked next action. No new surface: it rides the existing path.
// Importance/urgency = important/urgent (an owed follow-up), leverage = labor (an irreducibly-human
// relationship move), due = the motion's due date (date-only → the overdue time_mult applies).
function motionsToRankable(motions: Awaited<ReturnType<typeof dueMotions>>): RankInput[] {
  return motions
    .filter((m) => m.ball_in_court === "operator")
    .map((m) => ({
      id: `motion:${m.id}`,
      title: `Follow up with ${m.expert_slug ?? "the expert"} on ${m.goal ?? "their open ask"}`,
      importance: "important",
      urgency: "urgent",
      due: m.next_action_due.slice(0, 10),
      first_5_minutes: `The motion clock fired and the ball is in your court (${m.next_action_kind ?? "nudge"}). Send the owed follow-up to ${m.expert_slug ?? "the expert"}.`,
      recurring: false,
      area: "Client engagement",
      leverage: "labor",
      wealth_test: null,
      project: null,
    }));
}

// The computed "one next action" + ordered backlog. Deterministic; the model never ranks.
export async function rankedNextActions(): Promise<RankResult> {
  const [tasks, intent, motions] = await Promise.all([
    listRankableTasks(),
    latestWeeklyIntent(),
    dueMotions(),
  ]);
  const candidates = [...tasks, ...motionsToRankable(motions)];
  return rankNextActions(candidates, (intent as WeeklyIntentLike | null) ?? null);
}
