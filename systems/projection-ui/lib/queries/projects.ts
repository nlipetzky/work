import "server-only";
import { canonDb } from "@/lib/canon";

export interface Project {
  id: string;
  slug: string;
  name: string;
  goal_id: string | null;
  area: string | null;
  status: string;
  outcome: string | null;
  next_action: string | null;
}

// All projects. Source of truth: canon_engine.public.projects.
// Goals view groups by goal_id; Focus view filters to active.
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await canonDb()
    .from("projects")
    .select("id, slug, name, goal_id, area, status, outcome, next_action")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}
