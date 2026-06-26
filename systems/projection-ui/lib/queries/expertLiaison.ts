import "server-only";
import { canonDb } from "@/lib/canon";

// Reads for the Expert Liaison console. Pure-canon: experts + expert_exchanges from
// canon_engine. The gap/needs queue reuses getGovernedArtifacts() and the curation ledger
// reuses getSourceAssessments() (composed in the page). No Gmail / external reads.

export interface AuthorityVector { title: string; points: string[] }
export interface Expert {
  slug: string;
  name: string;
  core_title: string | null;
  summary: string | null;
  authority_vectors: AuthorityVector[];
  linguistic_dna: string | null;
  expertise: string[];
  source_files: string[];
  contact: Record<string, unknown>;
  provenance: string | null;
}

export type ExchangeStatus = "drafted" | "sent" | "answered" | "closed";
export interface Exchange {
  id: string;
  expert_slug: string;
  engagement_type: string;
  engagement_id: string;
  channel: string;
  subject: string | null;
  body: string | null;
  artifact_types: string[];
  status: ExchangeStatus;
  response: string | null;
  sent_at: string | null;
  answered_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export async function getExperts(): Promise<Expert[]> {
  const { data, error } = await canonDb()
    .from("experts")
    .select("slug, name, core_title, summary, authority_vectors, linguistic_dna, expertise, source_files, contact, provenance")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    slug: e.slug, name: e.name, core_title: e.core_title ?? null, summary: e.summary ?? null,
    authority_vectors: (e.authority_vectors as AuthorityVector[] | null) ?? [],
    linguistic_dna: e.linguistic_dna ?? null,
    expertise: (e.expertise as string[] | null) ?? [],
    source_files: (e.source_files as string[] | null) ?? [],
    contact: (e.contact as Record<string, unknown> | null) ?? {},
    provenance: e.provenance ?? null,
  }));
}

export async function getExchanges(): Promise<Exchange[]> {
  const { data, error } = await canonDb()
    .from("expert_exchanges")
    .select("id, expert_slug, engagement_type, engagement_id, channel, subject, body, artifact_types, status, response, sent_at, answered_at, created_at, metadata")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((x) => ({
    id: x.id, expert_slug: x.expert_slug, engagement_type: x.engagement_type, engagement_id: x.engagement_id,
    channel: x.channel, subject: x.subject ?? null, body: x.body ?? null,
    artifact_types: (x.artifact_types as string[] | null) ?? [],
    status: x.status as ExchangeStatus, response: x.response ?? null,
    sent_at: x.sent_at ?? null, answered_at: x.answered_at ?? null, created_at: x.created_at,
    metadata: (x.metadata as Record<string, unknown> | null) ?? {},
  }));
}

// Pick the expert whose expertise covers a required-expertise token, for an engagement.
export function matchExpert(experts: Expert[], requiredExpertise: string[]): Expert | null {
  if (!requiredExpertise.length) return null;
  return experts.find((e) => e.expertise.some((x) => requiredExpertise.includes(x))) ?? null;
}
