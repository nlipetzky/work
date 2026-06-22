import "server-only";
import { canonDb } from "@/lib/canon";

// The ecosystem map, read from canon_engine.public.systems (the canonical registry).
// Shapes systems for the /system constellation grid.

const STATUS_TO_LIFECYCLE: Record<string, string> = {
  operating: "operating",
  building: "engineering",
  emerging: "defined",
  paused: "defined",
  archived: "defined",
};

export interface RegSys {
  name: string;
  slug: string;
  home: string;
  class: string;
  lifecycle: string;
  autonomy: string;
  stub: boolean;
  outcome: string;
  warnings: string[];
  dates: never[];
  now: never[];
}

export async function listRegistrySystems(): Promise<RegSys[]> {
  const { data, error } = await canonDb()
    .from("systems")
    .select("system_slug,name,constellation,class,coverage,status,purpose,system_type")
    .neq("status", "archived")
    .order("system_slug", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s: Record<string, unknown>) => {
    const status = (s.status as string) ?? "emerging";
    const coverage = (s.coverage as string) ?? null;
    const home = s.constellation
      ? String(s.constellation).toLowerCase()
      : s.system_type === "client_engagement" ? "engagements" : "unassigned";
    return {
      name: (s.name as string) ?? (s.system_slug as string),
      slug: s.system_slug as string,
      home,
      class: s.class ? String(s.class).toLowerCase() : "supporting",
      lifecycle: STATUS_TO_LIFECYCLE[status] ?? "defined",
      autonomy: "manual",
      stub: !s.purpose,
      outcome: (s.purpose as string) ?? "",
      warnings: coverage === "Missing"
        ? ["coverage: Missing — required by its constellation, not built"]
        : [],
      dates: [],
      now: [],
    };
  });
}

function mapAssets(rows: Record<string, unknown>[]) {
  return (rows ?? []).map((a) => ({
    name: (a.name as string) ?? "",
    type: (a.asset_type as string) ?? "",
    ownership: (a.write_owner as string) ?? "",
    status: (a.lifecycle_state as string) ?? "",
    verified_by: a.reconciled_against_reality ? "reconciled" : null,
    note: (a.description as string) ?? undefined,
    path: (a.source_path as string) ?? (a.url as string) ?? undefined,
  }));
}

function toRecord(s: Record<string, unknown>, assets: Record<string, unknown>[]) {
  const status = (s.status as string) ?? "emerging";
  return {
    name: (s.name as string) ?? (s.system_slug as string),
    slug: s.system_slug as string,
    home: s.constellation ? String(s.constellation).toLowerCase() : "unassigned",
    clusters: [] as string[],
    class: s.class ? String(s.class).toLowerCase() : "supporting",
    lifecycle: STATUS_TO_LIFECYCLE[status] ?? "defined",
    flags: [] as string[],
    autonomy: "manual",
    outcome: (s.purpose as string) ?? "",
    stub: !s.purpose,
    runs_surface: (s.runs_surface as string) ?? (s.process_state_location as string) ?? null,
    contract: (s.contract as unknown) ?? null,
    assets: mapAssets(assets),
    context: [] as unknown[],
    flow: (s.flow as unknown) ?? [],
    flow_inputs: [] as unknown[],
    flow_outputs: [] as unknown[],
    dates: [] as unknown[],
    now: [] as unknown[],
    body: (s.body as string) ?? "",
    file: `canon_engine.public.systems/${s.system_slug as string}`,
  };
}

function warningsFor(s: Record<string, unknown>): string[] {
  return s.coverage === "Missing"
    ? ["coverage: Missing — required by its constellation, not built"]
    : [];
}

export async function getSystemDetail(slug: string) {
  const db = canonDb();
  const { data: sys, error } = await db.from("systems").select("*").eq("system_slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!sys) return null;
  const { data: assets } = await db
    .from("assets")
    .select("name,asset_type,write_owner,lifecycle_state,reconciled_against_reality,source_path,description,url")
    .eq("system_id", (sys as Record<string, unknown>).id as string);
  return { record: toRecord(sys, assets ?? []), warnings: warningsFor(sys), history: [] };
}

export async function listInventory() {
  const db = canonDb();
  const [{ data: sys, error }, { data: assets }] = await Promise.all([
    db.from("systems").select("*").order("system_slug", { ascending: true }),
    db.from("assets").select("system_id,name,asset_type,write_owner,lifecycle_state,reconciled_against_reality,source_path,description,url"),
  ]);
  if (error) throw new Error(error.message);
  const byId = new Map<string, Record<string, unknown>[]>();
  for (const a of assets ?? []) {
    const k = (a as Record<string, unknown>).system_id as string;
    if (!k) continue;
    if (!byId.has(k)) byId.set(k, []);
    byId.get(k)!.push(a as Record<string, unknown>);
  }
  const systems = (sys ?? []).map((s) => {
    const r = toRecord(s, byId.get((s as Record<string, unknown>).id as string) ?? []);
    return {
      name: r.name, slug: r.slug, home: r.home, class: r.class,
      lifecycle: r.lifecycle, autonomy: r.autonomy, stub: r.stub,
      assets: r.assets, context: r.context, warnings: warningsFor(s),
    };
  });
  return { count: systems.length, systems, errors: [] as string[] };
}
