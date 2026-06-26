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
  system_slug: string | null; // the system this project builds/iterates (project ≡ system build)
  goal: { id: string; title: string } | null;
}

// All projects joined to their goal for ladder rendering (R2) and project drill-down (R3).
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await canonDb()
    .from("projects")
    .select("id, slug, name, goal_id, area, status, outcome, next_action, system_slug, goal:goals(id,title)")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Project[];
}
