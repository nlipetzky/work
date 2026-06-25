import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonDb } from "@/lib/canon";

// The Outreach Producer (System M) — its own surface's data.
// This system DEVELOPS the cold-outreach offer ladder, then the copy that hinges on it,
// via the shared deterministic artifact engine (govern-artifacts.mjs: produce -> rules-gate
// -> judge -> propose). This query exposes the MACHINE so the surface can render it:
//   - the offer stage: its input contract (which approved artifacts it hinges on) + the
//     produced offer-ladder draft/approved state.
//   - the copy stage: gated until the offer ladder is approved (Phase 3).
// Pure-canon reads. Mutations go through the shared governed routes (run/confirm).

const WORK_ROOT = "/Users/nplmini/code/work";
const OFFER_TYPE = "outreach-offer-ladder";
const DOCTRINE = "practices/revops/reference/outreach-offer-doctrine.md";

// The offer producer's INPUT CONTRACT: the approved canon each option must hinge on, with the
// role each plays. If any is missing/unapproved the system blocks and names the gap (no fabrication).
const INPUT_CONTRACT: { type: string; role: string }[] = [
  { type: "offer-architecture-and-pricing", role: "CORE offer the front-end must ladder up to" },
  { type: "icp-and-disqualifiers", role: "Segment + hard exclusions (blue-ocean target)" },
  { type: "mechanism-of-action", role: "The differentiator the offer is built on" },
  { type: "customer-problem-model", role: "The pain a front-end offer solves a slice of" },
  { type: "faithfulness-constraints", role: "Hard rules: no public pricing, no attorney claim" },
];

export type ArtifactState = "gap" | "draft" | "approved";

function engagementRoot(et: string): string {
  switch (et) {
    case "venture": return "accounts/ventures";
    case "client": return "accounts/clients";
    case "prospect": return "accounts/prospects";
    case "practice": return "practices";
    default: return `accounts/${et}s`;
  }
}

export interface ContractInput { type: string; role: string; state: ArtifactState }
export interface OfferStage {
  state: ArtifactState;
  version: number | null;
  artifact_id: string | null;
  required_expertise: string[];
  source_present: boolean;       // is the assembled drafting source on disk
  contract: ContractInput[];     // the input contract + each input's canon state
  contractMet: boolean;          // every required input approved
  missing: string[];             // inputs not yet approved (the named gaps)
}
export interface SourceTag { line: string; source: string }
export interface SequenceStep {
  order: number;
  action_type: string;
  delay_hours: number;
  subject?: string;
  copy: string;
  source_map: SourceTag[];
}
export interface RuleCheck { name: string; ok: boolean }
export interface InputLineage {
  role: string;                 // HINGE | SUBSTANCE | VOICE | HARD_RULES | FORM
  artifact_type?: string;
  version?: number;
  artifact_id?: string;
  file?: string;
  missing?: boolean;
}
export interface Sequence {
  id: string;
  channel: "linkedin" | "email";
  state: "draft" | "approved";
  version: number;
  front_end_offer: string | null;
  sender_expert_slug: string | null;
  steps: SequenceStep[];
  note_variants: { noted?: string; noteless?: boolean } | null;
  flags: string[];
  rules_passed: RuleCheck[];
  inputs: InputLineage[];        // the provenance trail: what context produced this
  expert_review: ExpertReview | null; // routed to the SME (via Hermes) for approval?
}
export interface ExpertReview {
  exchange_id: string;
  expert_slug: string;
  status: "drafted" | "sent" | "answered" | "closed";
  response: string | null;
}
export interface ChannelSequences { linkedin: Sequence | null; email: Sequence | null }

export interface OutreachEngagement {
  engagement_type: string;
  engagement_id: string;
  offer: OfferStage;
  copyGated: boolean;            // copy stage locked until the offer ladder is approved
  sequences: ChannelSequences;
}
export interface OutreachSystem {
  engagements: OutreachEngagement[];
  doctrinePresent: boolean;
  keyReady: boolean;
}

async function filePresent(rel: string, minLen = 100): Promise<boolean> {
  try { return (await readFile(path.join(WORK_ROOT, rel), "utf8")).trim().length >= minLen; }
  catch { return false; }
}

export async function getOutreachSystem(): Promise<OutreachSystem> {
  const db = canonDb();
  // engagements that have the offer producer wired (manifest row for the offer-ladder)
  const [{ data: man, error: mErr }, { data: arts, error: aErr }, { data: seqs, error: sErr }, { data: exch, error: eErr }] = await Promise.all([
    db.from("canon_artifact_manifest")
      .select("engagement_type, engagement_id, artifact_type, required_expertise")
      .eq("artifact_type", OFFER_TYPE),
    db.from("canon_artifacts")
      .select("id, engagement_type, engagement_id, artifact_type, version, status")
      .in("status", ["draft", "approved"]),
    db.from("outreach_sequences")
      .select("id, engagement_type, engagement_id, channel, status, version, front_end_offer, sender_expert_slug, steps, note_variants, flags, rules_passed, inputs")
      .in("status", ["draft", "approved"]).order("version", { ascending: false }),
    db.from("expert_exchanges")
      .select("id, expert_slug, status, response, metadata")
      .eq("metadata->>kind", "outreach-copy-approval").order("created_at", { ascending: false }),
  ]);
  if (mErr) throw new Error(mErr.message);
  if (aErr) throw new Error(aErr.message);
  if (sErr) throw new Error(sErr.message);
  if (eErr) throw new Error(eErr.message);

  // latest expert-approval exchange per sequence (the SME sign-off route)
  const reviewMap = new Map<string, ExpertReview>();
  for (const x of exch ?? []) {
    const sid = (x.metadata as { sequence_id?: string } | null)?.sequence_id;
    if (!sid || reviewMap.has(sid)) continue;
    reviewMap.set(sid, { exchange_id: x.id, expert_slug: x.expert_slug, status: x.status, response: x.response ?? null });
  }

  // latest live sequence per (engagement, channel)
  const seqMap = new Map<string, Sequence>();
  for (const s of seqs ?? []) {
    const k = `${s.engagement_type}:${s.engagement_id}:${s.channel}`;
    if (seqMap.has(k)) continue; // first hit wins (ordered version desc)
    seqMap.set(k, {
      id: s.id, channel: s.channel, state: s.status as "draft" | "approved", version: s.version,
      front_end_offer: s.front_end_offer ?? null, sender_expert_slug: s.sender_expert_slug ?? null,
      steps: (s.steps as SequenceStep[]) ?? [], note_variants: (s.note_variants as Sequence["note_variants"]) ?? null,
      flags: (s.flags as string[]) ?? [], rules_passed: (s.rules_passed as RuleCheck[]) ?? [],
      inputs: (s.inputs as InputLineage[]) ?? [],
      expert_review: reviewMap.get(s.id) ?? null,
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

  const engagements: OutreachEngagement[] = [];
  for (const m of man ?? []) {
    const et = m.engagement_type, eid = m.engagement_id;
    const hit = live.get(`${et}:${eid}:${OFFER_TYPE}`);
    const offerState: ArtifactState = hit ? (hit.status as ArtifactState) : "gap";
    const contract: ContractInput[] = INPUT_CONTRACT.map((c) => ({ ...c, state: stateOf(et, eid, c.type) }));
    const missing = contract.filter((c) => c.state !== "approved").map((c) => c.type);
    const sourceRel = path.join(engagementRoot(et), eid, "context/revops", `${OFFER_TYPE}.md`);
    engagements.push({
      engagement_type: et,
      engagement_id: eid,
      offer: {
        state: offerState,
        version: hit?.version ?? null,
        artifact_id: hit?.id ?? null,
        required_expertise: (m.required_expertise as string[] | null) ?? [],
        source_present: await filePresent(sourceRel, 400),
        contract,
        contractMet: missing.length === 0,
        missing,
      },
      copyGated: offerState !== "approved",
      sequences: {
        linkedin: seqMap.get(`${et}:${eid}:linkedin`) ?? null,
        email: seqMap.get(`${et}:${eid}:email`) ?? null,
      },
    });
  }
  engagements.sort((a, b) => a.engagement_id.localeCompare(b.engagement_id));
  return {
    engagements,
    doctrinePresent: await filePresent(DOCTRINE, 400),
    keyReady: !!process.env.ANTHROPIC_API_KEY,
  };
}
