import "server-only";
import { canonDb } from "@/lib/canon";

export interface NorthStar {
  statement: string;
  description: string | null;
}

// The vision the whole spine ladders up to. Singleton row in canon_engine.
// Returns null if no vision has been declared (surface shows an honest gap, not design copy).
export async function getNorthStar(): Promise<NorthStar | null> {
  const { data, error } = await canonDb()
    .from("north_star")
    .select("statement,description")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as NorthStar | null) ?? null;
}
