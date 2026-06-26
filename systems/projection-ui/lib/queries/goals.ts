import "server-only";
import { canonDb } from "@/lib/canon";

export interface Goal {
  id: string;
  slug: string;
  title: string;
  why_it_matters: string | null;
  horizon: string | null;
  target: string | null;
  status: string;
  area: string | null;
  rank: number | null;
  leverage: "code" | "media" | "capital" | "labor" | "none" | null;
  wealth_test: "asset" | "rented_time" | null;
}

// operator-os Goals, top of the spine. Active goals first, ordered by rank.
// Source of truth: canon_engine.public.goals.
export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await canonDb()
    .from("goals")
    .select("id, slug, title, why_it_matters, horizon, target, status, area, rank, leverage, wealth_test")
    .eq("status", "active")
    .order("rank", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Goal[];
}
