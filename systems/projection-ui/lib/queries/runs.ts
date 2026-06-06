import { db } from "@/lib/supabase";

export async function listRuns(limit = 100): Promise<Record<string, unknown>[]> {
  const { data, error } = await db
    .from("enrichment_runs")
    .select(
      "id, status, scope_filter, contact_count, jobs_created, contacts_enriched, contacts_failed, total_cost, top_blocker, triggered_by, reason, started_at, completed_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listRuns: ${error.message}`);
  return data ?? [];
}

export async function getRunDetail(id: string): Promise<{
  run: Record<string, unknown>;
  contacts: Record<string, unknown>[];
}> {
  const { data: run, error } = await db.from("enrichment_runs").select("*").eq("id", id).single();
  if (error) throw new Error(`getRunDetail(${id}): ${error.message}`);

  const ids = (run.contact_ids as string[] | null) ?? [];
  let contacts: Record<string, unknown>[] = [];
  if (ids.length) {
    const { data } = await db
      .from("contacts")
      .select("id, first_name, last_name, email, title, last_enriched_at")
      .in("id", ids.slice(0, 500));
    contacts = data ?? [];
  }
  return { run: run as Record<string, unknown>, contacts };
}
