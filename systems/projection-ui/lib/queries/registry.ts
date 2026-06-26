import "server-only";
import { canonDb } from "@/lib/canon";
import { systemStates } from "@/lib/queries/systemState";
import type { EvidencedState } from "@/lib/systemState";

// The ecosystem map, read from canon_engine.public.systems (the canonical registry).
// Shapes systems for the /system constellation grid. The displayed lifecycle is the EVIDENCED
// state (computed from activities/assets/triggers), NOT the self-reported status label.

// Honest claim-divergence + gaps → warnings the surface shows.
function evidenceWarnings(st: EvidencedState | undefined, claimed: string | null): string[] {
  if (!st) return [];
  const w: string[] = [];
  if (st.claim_diverges) w.push(`claims "${claimed}", evidence supports "${st.state}"`);
  w.push(...st.gaps);
  return w;
}

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
  const [{ data, error }, states] = await Promise.all([
    canonDb()
      .from("systems")
      .select("system_slug,name,constellation,class,coverage,status,purpose,system_type")
      .neq("status", "archived")
      .order("system_slug", { ascending: true }),
    systemStates(),
  ]);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s: Record<string, unknown>) => {
    const status = (s.status as string) ?? "emerging";
    const coverage = (s.coverage as string) ?? null;
    const st = states.get(s.system_slug as string);
    const evidenced = st?.state ?? "stub";
    const home = s.constellation
      ? String(s.constellation).toLowerCase()
      : s.system_type === "client_engagement" ? "engagements" : "unassigned";
    return {
      name: (s.name as string) ?? (s.system_slug as string),
      slug: s.system_slug as string,
      home,
      class: s.class ? String(s.class).toLowerCase() : "supporting",
      lifecycle: evidenced, // evidenced state, not the self-reported status
      autonomy: "manual",
      stub: evidenced === "stub",
      outcome: (s.purpose as string) ?? "",
      warnings: [
        ...evidenceWarnings(st, status),
        ...(coverage === "Missing" ? ["coverage: Missing — required by its constellation, not built"] : []),
      ],
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

function toRecord(s: Record<string, unknown>, assets: Record<string, unknown>[], st?: EvidencedState) {
  const status = (s.status as string) ?? "emerging";
  const evidenced = st?.state ?? "stub";
  return {
    name: (s.name as string) ?? (s.system_slug as string),
    slug: s.system_slug as string,
    home: s.constellation ? String(s.constellation).toLowerCase() : "unassigned",
    clusters: [] as string[],
    class: s.class ? String(s.class).toLowerCase() : "supporting",
    lifecycle: evidenced, // evidenced state, not the claimed status
    claimed_status: status, // what the system claims (shown beside the evidenced state)
    claim_diverges: st?.claim_diverges ?? false,
    gaps: st?.gaps ?? [],
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
  const [{ data: sys, error }, states] = await Promise.all([
    db.from("systems").select("*").eq("system_slug", slug).maybeSingle(),
    systemStates(),
  ]);
  if (error) throw new Error(error.message);
  if (!sys) return null;
  const { data: assets } = await db
    .from("assets")
    .select("name,asset_type,write_owner,lifecycle_state,reconciled_against_reality,source_path,description,url")
    .eq("system_id", (sys as Record<string, unknown>).id as string);
  const st = states.get(slug);
  return {
    record: toRecord(sys, assets ?? [], st),
    warnings: [...evidenceWarnings(st, (sys as Record<string, unknown>).status as string), ...warningsFor(sys)],
    history: [],
  };
}

export async function listInventory() {
  const db = canonDb();
  const [{ data: sys, error }, { data: assets }, states] = await Promise.all([
    db.from("systems").select("*").order("system_slug", { ascending: true }),
    db.from("assets").select("system_id,name,asset_type,write_owner,lifecycle_state,reconciled_against_reality,source_path,description,url"),
    systemStates(),
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
    const sr = s as Record<string, unknown>;
    const st = states.get(sr.system_slug as string);
    const r = toRecord(s, byId.get(sr.id as string) ?? [], st);
    return {
      name: r.name, slug: r.slug, home: r.home, class: r.class,
      lifecycle: r.lifecycle, autonomy: r.autonomy, stub: r.stub,
      assets: r.assets, context: r.context,
      warnings: [...evidenceWarnings(st, sr.status as string), ...warningsFor(s)],
    };
  });
  return { count: systems.length, systems, errors: [] as string[] };
}
