import "server-only";
import { canonDb } from "@/lib/canon";

export interface Task {
  id: string;
  title: string;
  status: string;
  importance: string | null;
  urgency: string | null;
  due: string | null;
  first_5_minutes: string | null;
  // project includes id (for task grouping) and goal chain (for ladder rendering)
  project: {
    id: string;
    name: string;
    goal_id: string | null;
    goal: { id: string; title: string } | null;
  } | null;
}

// Open tasks joined through projects → goals for ladder rendering (R2).
// Sorted by due ascending; caller re-ranks by importance×urgency (R1).
export async function listOpenTasks(): Promise<Task[]> {
  const { data, error } = await canonDb()
    .from("tasks")
    .select("id,title,status,importance,urgency,due,first_5_minutes,project:projects(id,name,goal_id,goal:goals(id,title))")
    .eq("status", "open")
    .order("due", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Task[];
}

// Open + done tasks (excludes dropped). Used by the Projects view, which needs
// completed tasks to render strike-through checklist rows and "X / Y done" progress.
export async function listAllTasks(): Promise<Task[]> {
  const { data, error } = await canonDb()
    .from("tasks")
    .select(
      "id,title,status,importance,urgency,due,first_5_minutes,project:projects(id,name,goal_id,goal:goals(id,title))",
    )
    .in("status", ["open", "done"])
    .order("due", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Task[];
}

export function isDoFirst(t: Task): boolean {
  return t.importance === "important" && t.urgency === "urgent";
}
