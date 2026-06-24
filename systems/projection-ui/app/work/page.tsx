// /work — the "Work Focus" Claude Design export, integrated whole: three tabs
// (Focus · Projects · Goals) switched client-side, exactly as the design does it.
// This server component reads LIVE from canon_engine and hands plain data to the
// client surface. No placeholder content: every slot is real, and the few slots
// with no canon source (hero rationale, calendar, autonomy trend, triage count,
// goal pace/▸progress) are honestly flagged in the UI rather than fabricated.

import { listProjects, type Project } from "@/lib/queries/projects";
import { listAllTasks, type Task } from "@/lib/queries/tasks";
import { latestWeeklyIntent, type WeeklyIntent } from "@/lib/queries/intent";
import { listActivities, type Activity } from "@/lib/queries/activities";
import { listGoals, type Goal } from "@/lib/queries/goals";
import { getNorthStar, type NorthStar } from "@/lib/queries/northStar";
import { listUpcomingEvents, type CalendarEvent } from "@/lib/queries/calendar";
import WorkSurface from "./WorkSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WorkPage() {
  let projects: Project[] = [];
  let tasks: Task[] = [];
  let intent: WeeklyIntent | null = null;
  let activities: Activity[] = [];
  let goals: Goal[] = [];
  let northStar: NorthStar | null = null;
  let events: CalendarEvent[] = [];
  let error: string | null = null;
  try {
    [projects, tasks, intent, activities, goals, northStar, events] = await Promise.all([
      listProjects(),
      listAllTasks(),
      latestWeeklyIntent(),
      listActivities(),
      listGoals(),
      getNorthStar(),
      listUpcomingEvents(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <WorkSurface
      projects={projects}
      tasks={tasks}
      intent={intent}
      activities={activities}
      goals={goals}
      northStar={northStar}
      events={events}
      error={error}
    />
  );
}
