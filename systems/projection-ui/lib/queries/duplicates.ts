import { db } from "@/lib/supabase";

export interface DupPair {
  record_a: string;
  record_b: string;
  record_type: string;
  name_a: string | null;
  domain_a: string | null;
  name_b: string | null;
  domain_b: string | null;
  domain_score: number;
  name_score: number;
  combined_score: number;
}

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

export async function listDuplicates(opts: {
  threshold?: number;
  limit?: number;
}): Promise<{ pairs: DupPair[]; queueTotal: number }> {
  const threshold = opts.threshold ?? 0.7;
  const limit = Math.min(200, opts.limit ?? 50);

  const { data: queue, count, error } = await db
    .from("duplicate_review_queue_companies")
    .select("*", { count: "exact" })
    .gte("combined_score", threshold)
    .order("combined_score", { ascending: false })
    .limit(limit * 3);
  if (error) throw new Error(`listDuplicates: ${error.message}`);

  // drop pairs already decided
  const { data: resolved } = await db
    .from("duplicate_resolutions")
    .select("record_a, record_b");
  const decided = new Set((resolved ?? []).map((r) => pairKey(r.record_a, r.record_b)));

  const fresh = (queue ?? []).filter((r) => !decided.has(pairKey(r.record_a, r.record_b))).slice(0, limit);

  const ids = [...new Set(fresh.flatMap((r) => [r.record_a, r.record_b]))];
  const nameMap = new Map<string, { name: string | null; domain: string | null }>();
  if (ids.length) {
    const { data: companies } = await db.from("companies").select("id, name, domain").in("id", ids);
    for (const c of companies ?? []) nameMap.set(c.id, { name: c.name, domain: c.domain });
  }

  const pairs: DupPair[] = fresh.map((r) => ({
    record_a: r.record_a,
    record_b: r.record_b,
    record_type: r.record_type,
    name_a: nameMap.get(r.record_a)?.name ?? null,
    domain_a: nameMap.get(r.record_a)?.domain ?? null,
    name_b: nameMap.get(r.record_b)?.name ?? null,
    domain_b: nameMap.get(r.record_b)?.domain ?? null,
    domain_score: r.domain_score,
    name_score: r.name_score,
    combined_score: r.combined_score,
  }));

  return { pairs, queueTotal: count ?? 0 };
}

export async function resolveDuplicate(input: {
  record_a: string;
  record_b: string;
  record_type: string;
  resolution: "merged" | "not_duplicate" | "deferred";
  notes?: string;
}): Promise<void> {
  const { error } = await db.from("duplicate_resolutions").insert({
    record_a: input.record_a,
    record_b: input.record_b,
    record_type: input.record_type ?? "company",
    resolution: input.resolution,
    resolved_by: "projection-ui",
    notes: input.notes ?? null,
  });
  if (error) throw new Error(`resolveDuplicate: ${error.message}`);
}
