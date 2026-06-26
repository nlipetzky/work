import "server-only";
import { canonDb } from "@/lib/canon";

export interface SystemForRouting {
  system_slug: string;
  name: string;
  status: string | null;
  purpose: string | null;
  outputs: string | null;
  runs_surface: string | null;
}

// Compact systems inventory so the runner can route a task to the system that should PRODUCE it
// (and tell whether that system is live, still being built, or missing). Source: canon public.systems.
export async function listSystemsForRouting(): Promise<SystemForRouting[]> {
  const { data, error } = await canonDb()
    .from("systems")
    .select("system_slug, name, status, purpose, outputs, runs_surface")
    .order("status");
  if (error) throw new Error(error.message);
  return ((data ?? []) as SystemForRouting[]).filter(
    (s) => !["archived", "retired", "deprecated"].includes(s.status ?? ""),
  );
}
