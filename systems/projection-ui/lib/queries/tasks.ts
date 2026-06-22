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
  project: { name: string } | null;
}

// Open tasks with their parent project name. Source: canon_engine.public.tasks.
export async function listOpenTasks(): Promise<Task[]> {
  const { data, error } = await canonDb()
    .from("tasks")
    .select("id,title,status,importance,urgency,due,first_5_minutes, project:projects(name)")
    .eq("status", "open")
    .order("due", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Task[];
}

export function isDoFirst(t: Task): boolean {
  return t.importance === "important" && t.urgency === "urgent";
}
