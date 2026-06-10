import matter from "gray-matter";
import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";

export type Lifecycle = "defined" | "designed" | "architected" | "engineering" | "operating";
export type Autonomy = "manual" | "assisted" | "supervised" | "autonomous";
export type SystemClass = "core" | "supporting" | "generic";

export interface ContractIO { name: string; status: string }
export interface Metric { name: string; value: string | number | null }
export interface Contract {
  inputs: ContractIO[];
  outputs: ContractIO[];
  metrics: Metric[];
  stopping?: string;
  failure?: string;
  escalation?: string[];
  cost_envelope?: Record<string, string>;
}
export interface AssetRow {
  name: string; type: string; ownership: string;
  status: string; verified_by: string | null; note?: string;
}
export interface ContextRow {
  name: string; version: string | null;
  status: string; verified_by: string | null; note?: string;
}
export interface SystemRecord {
  name: string; slug: string; home: string; clusters: string[];
  class: SystemClass; lifecycle: Lifecycle; flags: string[];
  autonomy: Autonomy; outcome: string; stub: boolean;
  runs_surface: string | null;
  contract: Contract | null;
  assets: AssetRow[]; context: ContextRow[];
  body: string; file: string;
}

const LIFECYCLES: Lifecycle[] = ["defined", "designed", "architected", "engineering", "operating"];
const AUTONOMY: Autonomy[] = ["manual", "assisted", "supervised", "autonomous"];
const CLASSES: SystemClass[] = ["core", "supporting", "generic"];
const REQUIRED = ["name", "slug", "home", "class", "lifecycle", "autonomy", "outcome"] as const;

function fail(file: string, msg: string): never {
  throw new Error(`${file}: ${msg}`);
}

export function parseSystemMd(content: string, file: string): SystemRecord {
  const { data, content: body } = matter(content);
  for (const k of REQUIRED) {
    if (data[k] === undefined || data[k] === null || data[k] === "")
      fail(file, `missing required field "${k}"`);
  }
  if (!LIFECYCLES.includes(data.lifecycle))
    fail(file, `unknown lifecycle "${data.lifecycle}" (allowed: ${LIFECYCLES.join(", ")})`);
  if (!AUTONOMY.includes(data.autonomy))
    fail(file, `unknown autonomy "${data.autonomy}" (allowed: ${AUTONOMY.join(", ")})`);
  if (!CLASSES.includes(data.class))
    fail(file, `unknown class "${data.class}" (allowed: ${CLASSES.join(", ")})`);

  const contract: Contract | null = data.contract
    ? {
        inputs: data.contract.inputs ?? [],
        outputs: data.contract.outputs ?? [],
        metrics: data.contract.metrics ?? [],
        stopping: data.contract.stopping,
        failure: data.contract.failure,
        escalation: data.contract.escalation ?? [],
        cost_envelope: data.contract.cost_envelope,
      }
    : null;

  return {
    name: String(data.name),
    slug: String(data.slug),
    home: String(data.home),
    clusters: data.clusters ?? [],
    class: data.class,
    lifecycle: data.lifecycle,
    flags: data.flags ?? [],
    autonomy: data.autonomy,
    outcome: String(data.outcome).trim(),
    stub: data.stub === true,
    runs_surface: data.runs_surface ?? null,
    contract,
    assets: (data.assets ?? []).map((a: AssetRow) => ({ verified_by: null, ...a })),
    context: (data.context ?? []).map((c: ContextRow) => ({ verified_by: null, version: null, ...c })),
    body: body.trim(),
    file,
  };
}

const NEEDS_PROOF = new Set(["tested", "evaled"]);

export function validateRecord(r: SystemRecord): string[] {
  const w: string[] = [];
  for (const row of [...r.assets, ...r.context]) {
    if (NEEDS_PROOF.has(row.status) && !row.verified_by)
      w.push(`"${row.name}" claims ${row.status} but has no verified_by (filled is not trusted)`);
  }
  if (r.lifecycle === "operating" && !r.runs_surface)
    w.push(`claims operating but no runs_surface — runs must be visible before a system is Operating`);
  return w;
}

export interface RegistryEntry { record: SystemRecord; warnings: string[] }
export interface Registry {
  systems: RegistryEntry[];
  errors: string[];
  lastReviewed: string | null;
}

export function loadRegistry(root: string): Registry {
  const systems: RegistryEntry[] = [];
  const errors: string[] = [];
  let lastReviewed: string | null = null;

  const metaPath = path.join(root, "_meta.yml");
  if (existsSync(metaPath)) {
    const m = readFileSync(metaPath, "utf8").match(/last_reviewed:\s*(\S+)/);
    if (m) lastReviewed = m[1];
  }

  for (const c of readdirSync(root, { withFileTypes: true })) {
    if (!c.isDirectory() || c.name.startsWith("_") || c.name.startsWith(".")) continue;
    const cDir = path.join(root, c.name);
    for (const s of readdirSync(cDir, { withFileTypes: true })) {
      if (!s.isDirectory()) continue;
      const file = path.join(cDir, s.name, "system.md");
      if (!existsSync(file)) continue;
      try {
        const record = parseSystemMd(readFileSync(file, "utf8"), file);
        systems.push({ record, warnings: validateRecord(record) });
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }
  systems.sort((a, b) => a.record.slug.localeCompare(b.record.slug));
  return { systems, errors, lastReviewed };
}
