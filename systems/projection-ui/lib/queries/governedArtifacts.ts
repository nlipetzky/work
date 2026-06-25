import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonDb } from "@/lib/canon";

// What the Artifact Assembler governs, across ALL engagements (multi-tenant): each
// engagement's artifact manifest joined to live canon_artifacts state, PLUS what each
// artifact is waiting on (its standard + whether its source material exists). This is
// the "what inputs are missing" view.

const WORK_ROOT = "/Users/nplmini/code/work";

export type ArtifactState = "gap" | "draft" | "approved";

// engagement_type -> the folder root holding its context. Tenant-type-aware so this
// works for ventures, clients, prospects, practices ... not just one tenant.
function engagementRoot(et: string): string {
  switch (et) {
    case "venture": return "accounts/ventures";
    case "client": return "accounts/clients";
    case "prospect": return "accounts/prospects";
    case "practice": return "practices";
    default: return `accounts/${et}s`;
  }
}
export function sourcePathFor(et: string, eid: string, layer: string | null, artifactType: string): string {
  return path.join(WORK_ROOT, engagementRoot(et), eid, "context", layer ?? "", `${artifactType}.md`);
}
async function sourcePresent(p: string): Promise<boolean> {
  try {
    const txt = await readFile(p, "utf8");
    if (txt.trim().length < 200) return false;
    return !/(TODO|To define|empty —|_\(empty|INSUFFICIENT)/i.test(txt);
  } catch { return false; }
}

export interface ArtifactNeeds { summary: string; questions: string[] }
export interface GovernedItem {
  artifact_type: string;
  state: ArtifactState;
  version: number | null;
  artifact_id: string | null;
  done_when: string | null;   // the standard: what this artifact must satisfy
  layer: string | null;       // artifact layer (used to resolve the source path)
  source_path: string;        // where its raw input is read from
  source_present: boolean;    // does usable source material exist yet
  needs: ArtifactNeeds | null; // the Assembler's articulation of what it still needs
  required_expertise: string[]; // which expertise (by role) must certify this artifact
}
export interface GovernedEngagement {
  engagement_type: string;
  engagement_id: string;
  items: GovernedItem[];
  approved: number;
  total: number;
  missingSource: number;      // gaps with no source material yet
}
export interface GovernedArtifacts {
  engagements: GovernedEngagement[];
  totalApproved: number;
  total: number;
  keyReady: boolean;          // is the AI key available to the run env
}

export async function getGovernedArtifacts(): Promise<GovernedArtifacts> {
  const db = canonDb();
  const [{ data: manifest, error: mErr }, { data: artifacts, error: aErr }] = await Promise.all([
    db.from("canon_artifact_manifest").select("engagement_type, engagement_id, artifact_type, required, required_expertise, needs, canon_artifact_types(layer, done_when)"),
    db.from("canon_artifacts").select("id, engagement_type, engagement_id, artifact_type, version, status").in("status", ["draft", "approved"]),
  ]);
  if (mErr) throw new Error(mErr.message);
  if (aErr) throw new Error(aErr.message);

  const live = new Map<string, { id: string; version: number; status: string }>();
  for (const a of artifacts ?? []) {
    const key = `${a.engagement_type}:${a.engagement_id}:${a.artifact_type}`;
    const prev = live.get(key);
    if (!prev || a.version > prev.version) live.set(key, { id: a.id, version: a.version, status: a.status });
  }

  const byEng = new Map<string, GovernedEngagement>();
  for (const m of (manifest ?? []).filter((r) => r.required)) {
    const ek = `${m.engagement_type}:${m.engagement_id}`;
    let eng = byEng.get(ek);
    if (!eng) { eng = { engagement_type: m.engagement_type, engagement_id: m.engagement_id, items: [], approved: 0, total: 0, missingSource: 0 }; byEng.set(ek, eng); }
    const hit = live.get(`${ek}:${m.artifact_type}`);
    const state: ArtifactState = hit ? (hit.status as ArtifactState) : "gap";
    const types = m.canon_artifact_types as unknown as { layer: string | null; done_when: string | null } | null;
    const layer = types?.layer ?? null;
    const sp = sourcePathFor(m.engagement_type, m.engagement_id, layer, m.artifact_type);
    const present = state === "gap" ? await sourcePresent(sp) : true;
    const rawNeeds = m.needs as unknown as ArtifactNeeds | null;
    eng.items.push({
      artifact_type: m.artifact_type, state, version: hit?.version ?? null, artifact_id: hit?.id ?? null,
      done_when: types?.done_when ?? null, layer, source_path: sp.replace(WORK_ROOT + "/", ""), source_present: present,
      needs: rawNeeds && (rawNeeds.summary || rawNeeds.questions?.length) ? { summary: rawNeeds.summary ?? "", questions: rawNeeds.questions ?? [] } : null,
      required_expertise: (m.required_expertise as string[] | null) ?? [],
    });
    eng.total += 1;
    if (state === "approved") eng.approved += 1;
    if (state === "gap" && !present) eng.missingSource += 1;
  }

  const engagements = [...byEng.values()].map((e) => ({ ...e, items: e.items.sort((a, b) => a.artifact_type.localeCompare(b.artifact_type)) }))
    .sort((a, b) => a.engagement_id.localeCompare(b.engagement_id));
  const total = engagements.reduce((n, e) => n + e.total, 0);
  const totalApproved = engagements.reduce((n, e) => n + e.approved, 0);
  return { engagements, totalApproved, total, keyReady: !!process.env.ANTHROPIC_API_KEY };
}
