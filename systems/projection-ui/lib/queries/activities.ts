import "server-only";
import { canonDb } from "@/lib/canon";

export interface Activity {
  id: string;
  system_id: string | null;
  name: string;
  description: string | null;
  current_automation_level: string | null;
  target_automation_level: string | null;
  channel: string | null;
  architecture: string | null;
  ai_role: string | null;
  context_contract: string | null;
  ensured: boolean | null;
  last_ensured_at: string | null;
  verification: string | null;
  owner: string | null;
  // system the activity runs under, with its goal chain (for run-layer grouping)
  system: {
    name: string;
    goal: { title: string } | null;
  } | null;
}

// Run-layer: activities joined to their system → goal. Ordered by system then name
// so the page can group them under their system heading.
// Source of truth: canon_engine.public.activities.
export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await canonDb()
    .from("activities")
    .select(
      "id,system_id,name,description,current_automation_level,target_automation_level,channel,architecture,ai_role,context_contract,ensured,last_ensured_at,verification,owner,system:systems(name,goal:goals(title))",
    )
    .order("system_id", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Activity[];
}

export interface AutonomyGradient {
  autonomous: number;
  ensured: number;
  pct: number;
}

// The vision gradient: of the activities we've ensured exist, what share runs
// autonomously. pct is 0 when nothing is ensured yet (no fake denominator).
export async function autonomyGradient(): Promise<AutonomyGradient> {
  const { data, error } = await canonDb()
    .from("activities")
    .select("ensured,current_automation_level");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { ensured: boolean | null; current_automation_level: string | null }[];
  const { autonomous, ensured } = rows.reduce(
    (acc, r) => {
      if (r.ensured) {
        acc.ensured += 1;
        if (r.current_automation_level === "autonomous") acc.autonomous += 1;
      }
      return acc;
    },
    { autonomous: 0, ensured: 0 },
  );
  const pct = ensured === 0 ? 0 : Math.round((autonomous / ensured) * 100);
  return { autonomous, ensured, pct };
}
