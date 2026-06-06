import { db } from "@/lib/supabase";
import { classifyValue, tallyColumn } from "@/lib/validity";
import type {
  Entity,
  ListResult,
  ProvenanceEntry,
  RecordDetail,
  ColumnInspectorResult,
} from "@/lib/types";

const SEARCH_FIELDS: Record<Entity, string[]> = {
  companies: ["name", "domain", "website", "ticker"],
  contacts: ["first_name", "last_name", "email", "title", "linkedin_url"],
};

// Columns shown first; everything else follows in table order. The whole table is shown,
// this is just a sensible left-anchor so the useful columns aren't buried at column 130.
const PRIORITY: Record<Entity, string[]> = {
  companies: [
    "name", "domain", "primary_modality", "modality_confirmed", "enrichment_status",
    "v2_needs_manual_review", "company_score", "fit_score", "country", "last_enriched_at",
  ],
  contacts: [
    "first_name", "last_name", "email", "email_verified_status", "title", "role_segment",
    "seniority_level", "enrichment_status", "lead_score", "last_enriched_at",
  ],
};

function orderColumns(entity: Entity, keys: string[]): string[] {
  const pri = PRIORITY[entity].filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !pri.includes(k));
  return [...pri, ...rest];
}

export async function listRecords(
  entity: Entity,
  opts: { search?: string; page?: number; pageSize?: number; sort?: string; desc?: boolean },
): Promise<ListResult> {
  const page = Math.max(0, opts.page ?? 0);
  const pageSize = Math.min(200, Math.max(10, opts.pageSize ?? 50));
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = db.from(entity).select("*", { count: "exact" });

  if (opts.search && opts.search.trim()) {
    const term = opts.search.trim().replace(/[%,()]/g, " ");
    const or = SEARCH_FIELDS[entity].map((f) => `${f}.ilike.%${term}%`).join(",");
    q = q.or(or);
  }

  const sort = opts.sort && opts.sort.length ? opts.sort : "updated_at";
  q = q.order(sort, { ascending: !(opts.desc ?? true), nullsFirst: false });
  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error) throw new Error(`listRecords(${entity}): ${error.message}`);

  const rows = data ?? [];
  const keys = rows.length ? Object.keys(rows[0]) : PRIORITY[entity];
  return {
    rows,
    total: count ?? 0,
    columns: orderColumns(entity, keys),
    page,
    pageSize,
  };
}

export async function exactCount(entity: Entity): Promise<number> {
  const { count, error } = await db.from(entity).select("id", { count: "exact", head: true });
  if (error) throw new Error(`exactCount(${entity}): ${error.message}`);
  return count ?? 0;
}

function parseProvenance(fp: unknown): ProvenanceEntry[] {
  if (!fp || typeof fp !== "object") return [];
  const map = fp as Record<string, Record<string, unknown>>;
  return Object.entries(map).map(([field, meta]) => ({
    field,
    source: (meta.source as string) ?? undefined,
    action: (meta.action as string) ?? undefined,
    provider: (meta.provider as string) ?? undefined,
    run_id: (meta.run_id as string) ?? (meta.jobId as string) ?? undefined,
    jobId: (meta.jobId as string) ?? undefined,
    captured_at: (meta.timestamp as string) ?? (meta.fetchedAt as string) ?? undefined,
    confidence: (meta.confidence as number | string) ?? undefined,
    raw: meta,
  }));
}

export async function getRecordDetail(entity: Entity, id: string): Promise<RecordDetail> {
  const { data: rec, error: e1 } = await db.from(entity).select("*").eq("id", id).single();
  if (e1) throw new Error(`getRecordDetail(${entity}/${id}): ${e1.message}`);

  // entity_id is a unique UUID per record across both entity types, so filtering on it
  // alone is sufficient — no entity_type singular/plural guessing.
  const { data: activity } = await db
    .from("entity_activity_log")
    .select("activity_type, outcome, provider, recipe_id, triggered_by, details, created_at")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: jobs } = await db
    .from("enrichment_jobs")
    .select("provider, provider_action, recipe_id, status, actual_cost, fields_updated, created_at, error_message")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    entity,
    id,
    record: rec as Record<string, unknown>,
    provenance: parseProvenance((rec as Record<string, unknown>).field_provenance),
    activity: activity ?? [],
    jobs: jobs ?? [],
  };
}

const VALIDITY_RULE =
  "REAL = non-empty value that is not a known placeholder sentinel " +
  '("Response", "Running…", "N Results Found", "Pending", "N/A", …). ' +
  "EMPTY = null / blank / empty array or object. PLACEHOLDER = a sentinel that a naive " +
  "non-null check would miscount as filled. This is the single shared definition; the agent " +
  "reads the same one.";

export async function getColumnInspector(
  entity: Entity,
  column: string,
): Promise<ColumnInspectorResult> {
  const sampleSize = 1000;
  const { data, error } = await db
    .from(entity)
    .select(`${column}, field_provenance`)
    .limit(sampleSize);
  if (error) throw new Error(`getColumnInspector(${entity}.${column}): ${error.message}`);

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const values = rows.map((r) => r[column]);
  const coverage = tallyColumn(values);

  // source distribution from field_provenance[column].source across the sample
  const sourceCounts = new Map<string, number>();
  for (const r of rows) {
    const fp = r.field_provenance as Record<string, Record<string, unknown>> | null;
    const src = fp?.[column]?.source as string | undefined;
    if (src && classifyValue(r[column]) === "real") {
      sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
    }
  }
  const sources = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Recipe metadata: data_standard_fields keyed by field name. Empty today (0 rows) —
  // report the absence honestly instead of inventing it.
  let recipeMeta: Record<string, unknown> | null = null;
  let recipeNote =
    "No recipe/prompt metadata recorded for this column yet. When enrichment runs on-rails " +
    "and writes data_standard_fields / enrichment_recipes, the prompt and logic appear here.";
  try {
    const { data: dsf } = await db
      .from("data_standard_fields")
      .select("*")
      .eq("field_name", column)
      .limit(1);
    if (dsf && dsf.length) {
      recipeMeta = dsf[0] as Record<string, unknown>;
      recipeNote = "From data_standard_fields.";
    }
  } catch {
    /* table may not be queryable; keep the honest note */
  }

  return {
    entity,
    column,
    validityRule: VALIDITY_RULE,
    coverage,
    sources,
    recipeMeta,
    recipeNote,
    sampleSize: rows.length,
  };
}
