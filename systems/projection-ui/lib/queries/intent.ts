import "server-only";
import { canonDb } from "@/lib/canon";

export interface WeeklyIntent {
  week_of: string;
  client_engagement_pct: number | null;
  prospect_engagement_pct: number | null;
  infrastructure_pct: number | null;
  finance_pct: number | null;
  admin_pct: number | null;
  personal_pct: number | null;
  theme: string | null;
  status: string | null;
}

// Latest weekly intent declaration. Source: canon_engine.public.weekly_intent.
export async function latestWeeklyIntent(): Promise<WeeklyIntent | null> {
  const { data, error } = await canonDb()
    .from("weekly_intent")
    .select("week_of,client_engagement_pct,prospect_engagement_pct,infrastructure_pct,finance_pct,admin_pct,personal_pct,theme,status")
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WeeklyIntent | null) ?? null;
}
