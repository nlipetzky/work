import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonDb } from "@/lib/canon";

// The Targeting system (signal-targeting) — the INPUT side of list-building. Its surface governs the
// fundamental artifacts that define + drive a list build, produced by the shared govern-artifacts
// machine gated by the Targeting & Enrichment Doctrine, hinging on the approved marketing canon.
// Pure-canon reads. Mutations go through the shared governed routes (produce / confirm / expert-review).

const WORK_ROOT = "/Users/nplmini/code/work";
const DOCTRINE = "practices/revops/reference/targeting-enrichment-doctrine.md";

// the fundamental list-build artifacts this surface governs
const TARGETING: { type: string; role: string }[] = [
  { type: "segment-criteria", role: "Account-level targeting: who is in / out of the segment" },
  { type: "icp-titles", role: "Contact-level: which titles / personas at a qualified account" },
  { type: "enrichment-spec", role: "What data to collect per record + which are qualify-gates" },
  { type: "list-qualification", role: "The gate: qualified / edge / not-qualified verdict" },
  { type: "discovery-recipe", role: "THE RECIPE: the signal → qualified-leads pipeline synthesizing the four inputs" },
];
// the approved marketing canon they hinge on (the input contract)
const HINGES: { type: string; role: string }[] = [
  { type: "icp-and-disqualifiers", role: "ICP + hard exclusions" },
  { type: "customer-problem-model", role: "The pain" },
  { type: "mechanism-of-action", role: "The differentiator / what fit looks like" },
  { type: "offer-architecture-and-pricing", role: "The offer" },
  { type: "outreach-offer-ladder", role: "The front-end offer the list will receive" },
];
const TARGETING_SET = new Set(TARGETING.map((t) => t.type));

export type ArtifactState = "gap" | "draft" | "approved";
export interface ExpertReview { exchange_id: string; expert_slug: string; status: "drafted" | "sent" | "answered" | "closed"; response: string | null; verdict: "approved" | "flagged" | null }
export interface HingeInput { type: string; role: string; state: ArtifactState }
export interface ArtifactNeeds { summary: string; questions: string[] }
export interface OperatorNote { note: string; author: string; created_at: string }
export interface CritiquePoint { dimension: string; severity: "blocker" | "major" | "minor"; issue: string; fix: string; providers?: string }
export interface Critique {
  verdict: "buildable" | "buildable-with-fixes" | "not-buildable" | string;
  summary: string | null;
  pushback: CritiquePoint[];
  doctrine_updates: string[];
  subscription_aware: boolean;
  created_at: string;
}
export interface TargetingArtifact {
  artifact_type: string;
  role: string;
  state: ArtifactState;
  version: number | null;
  artifact_id: string | null;
  required_expertise: string[];
  needs: ArtifactNeeds | null;      // what the producer says it still needs (when blocked)
  expert_review: ExpertReview | null;
  critique: Critique | null;        // the deepline craft critic's latest buildability review
  notes: OperatorNote[];            // operator/expert context injected via the input channel
}
export interface TargetingEngagement {
  engagement_type: string;
  engagement_id: string;
  contract: HingeInput[];
  contractMet: boolean;
  missing: string[];
  artifacts: TargetingArtifact[];
  approved: number;
  total: number;
}
export interface TargetingSystem { engagements: TargetingEngagement[]; doctrinePresent: boolean; keyReady: boolean }

async function filePresent(rel: string, minLen = 100): Promise<boolean> {
  try { return (await readFile(path.join(WORK_ROOT, rel), "utf8")).trim().length >= minLen; }
  catch { return false; }
}

export async function getTargetingSystem(): Promise<TargetingSystem> {
  const db = canonDb();
  const [{ data: man, error: mErr }, { data: arts, error: aErr }, { data: exch, error: eErr }, { data: crit, error: cErr }, { data: notes, error: nErr }] = await Promise.all([
    db.from("canon_artifact_manifest")
      .select("engagement_type, engagement_id, artifact_type, required_expertise, needs")
      .in("artifact_type", TARGETING.map((t) => t.type)),
    db.from("canon_artifacts")
      .select("id, engagement_type, engagement_id, artifact_type, version, status")
      .in("status", ["draft", "approved"]),
    db.from("expert_exchanges")
      .select("id, expert_slug, status, response, metadata")
      .eq("metadata->>kind", "artifact-expert-review").order("created_at", { ascending: false }),
    db.from("artifact_critiques")
      .select("engagement_type, engagement_id, artifact_type, verdict, summary, pushback, doctrine_updates, subscription_aware, created_at")
      .order("created_at", { ascending: false }),
    db.from("artifact_operator_notes")
      .select("engagement_type, engagement_id, artifact_type, note, author, created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (mErr) throw new Error(mErr.message);
  if (aErr) throw new Error(aErr.message);
  if (eErr) throw new Error(eErr.message);
  if (cErr) throw new Error(cErr.message);
  if (nErr) throw new Error(nErr.message);

  // operator/expert notes per (engagement, artifact_type)
  const notesByKey = new Map<string, OperatorNote[]>();
  for (const n of notes ?? []) {
    const k = `${n.engagement_type}:${n.engagement_id}:${n.artifact_type}`;
    if (!notesByKey.has(k)) notesByKey.set(k, []);
    notesByKey.get(k)!.push({ note: n.note, author: n.author, created_at: n.created_at });
  }

  // latest critique per (engagement, artifact_type)
  const critByKey = new Map<string, Critique>();
  for (const c of crit ?? []) {
    const k = `${c.engagement_type}:${c.engagement_id}:${c.artifact_type}`;
    if (critByKey.has(k)) continue; // ordered created_at desc; first wins
    critByKey.set(k, {
      verdict: c.verdict, summary: c.summary ?? null,
      pushback: (c.pushback as CritiquePoint[]) ?? [], doctrine_updates: (c.doctrine_updates as string[]) ?? [],
      subscription_aware: !!c.subscription_aware, created_at: c.created_at,
    });
  }

  // latest live artifact per (engagement, type)
  const live = new Map<string, { id: string; version: number; status: string }>();
  for (const a of arts ?? []) {
    const k = `${a.engagement_type}:${a.engagement_id}:${a.artifact_type}`;
    const prev = live.get(k);
    if (!prev || a.version > prev.version) live.set(k, { id: a.id, version: a.version, status: a.status });
  }
  const stateOf = (et: string, eid: string, type: string): ArtifactState => {
    const h = live.get(`${et}:${eid}:${type}`);
    return h ? (h.status as ArtifactState) : "gap";
  };
  // latest expert-review per artifact_id
  const reviewByArtifact = new Map<string, ExpertReview>();
  for (const x of exch ?? []) {
    const md = (x.metadata as { artifact_id?: string; verdict?: string } | null) ?? {};
    if (!md.artifact_id || reviewByArtifact.has(md.artifact_id)) continue;
    const verdict = md.verdict === "approved" || md.verdict === "flagged" ? md.verdict : null;
    reviewByArtifact.set(md.artifact_id, { exchange_id: x.id, expert_slug: x.expert_slug, status: x.status as ExpertReview["status"], response: x.response ?? null, verdict });
  }

  // group manifest rows by engagement (only engagements that have the targeting artifacts wired)
  const byEng = new Map<string, { et: string; eid: string; rows: Map<string, { required_expertise: string[]; needs: ArtifactNeeds | null }> }>();
  for (const m of man ?? []) {
    if (!TARGETING_SET.has(m.artifact_type)) continue;
    const key = `${m.engagement_type}:${m.engagement_id}`;
    let e = byEng.get(key);
    if (!e) { e = { et: m.engagement_type, eid: m.engagement_id, rows: new Map() }; byEng.set(key, e); }
    const rawNeeds = m.needs as unknown as ArtifactNeeds | null;
    e.rows.set(m.artifact_type, {
      required_expertise: (m.required_expertise as string[] | null) ?? [],
      needs: rawNeeds && (rawNeeds.summary || rawNeeds.questions?.length) ? { summary: rawNeeds.summary ?? "", questions: rawNeeds.questions ?? [] } : null,
    });
  }

  const engagements: TargetingEngagement[] = [];
  for (const { et, eid, rows } of byEng.values()) {
    const contract: HingeInput[] = HINGES.map((h) => ({ ...h, state: stateOf(et, eid, h.type) }));
    const missing = contract.filter((c) => c.state !== "approved").map((c) => c.type);
    const artifacts: TargetingArtifact[] = TARGETING.map((t) => {
      const hit = live.get(`${et}:${eid}:${t.type}`);
      const meta = rows.get(t.type);
      return {
        artifact_type: t.type, role: t.role,
        state: (hit?.status as ArtifactState) ?? "gap",
        version: hit?.version ?? null, artifact_id: hit?.id ?? null,
        required_expertise: meta?.required_expertise ?? [],
        needs: meta?.needs ?? null,
        expert_review: hit ? (reviewByArtifact.get(hit.id) ?? null) : null,
        critique: critByKey.get(`${et}:${eid}:${t.type}`) ?? null,
        notes: notesByKey.get(`${et}:${eid}:${t.type}`) ?? [],
      };
    });
    engagements.push({
      engagement_type: et, engagement_id: eid,
      contract, contractMet: missing.length === 0, missing,
      artifacts,
      approved: artifacts.filter((a) => a.state === "approved").length,
      total: artifacts.length,
    });
  }
  engagements.sort((a, b) => a.engagement_id.localeCompare(b.engagement_id));
  return { engagements, doctrinePresent: await filePresent(DOCTRINE, 400), keyReady: !!process.env.ANTHROPIC_API_KEY };
}
