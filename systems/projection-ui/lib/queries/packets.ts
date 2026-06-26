import "server-only";
import { canonDb } from "@/lib/canon";
import type { Expert, Exchange } from "./expertLiaison";

// Reads + grouping for the EL "Review packets" section. A packet groups the pending (drafted)
// expert_exchanges asks for one expert+engagement into one bundle, joined to any stored
// expert_review_packets row (the composed communication + its lifecycle). Compute-on-read for
// the grouping; the composed draft itself is durable (migration 007).

export type PacketStatus = "drafted" | "sent" | "answered" | "closed";

export interface StoredPacket {
  id: string;
  expert_slug: string;
  engagement_type: string;
  engagement_id: string;
  member_exchange_ids: string[];
  item_order: string[];
  composed_subject: string | null;
  composed_body: string | null;
  status: PacketStatus;
  doctrine_version: string | null;
  rules_passed: Record<string, unknown>;
  judge_notes: Record<string, unknown>;
  response: string | null;
  sent_at: string | null;
  answered_at: string | null;
  created_at: string;
}

export interface PacketMemberView {
  id: string;
  subject: string | null;
  kind: string | null;
  artifact_id: string | null;
  sequence_id: string | null;
  status: string;
  verdict: string | null;
}

// One packet view per expert+engagement that has pending asks OR a live (non-closed) stored packet.
export interface PacketView {
  key: string; // expert_slug::engagement_type::engagement_id
  expert_slug: string;
  expert_name: string;
  expert_email: string | null;
  engagement_type: string;
  engagement_id: string;
  pending: PacketMemberView[]; // the drafted asks available to bundle
  packet: StoredPacket | null; // the live composed packet (drafted/sent/answered), if any
}

function metaStr(m: Record<string, unknown>, k: string): string | null {
  const v = m[k];
  return typeof v === "string" ? v : null;
}

export async function getStoredPackets(): Promise<StoredPacket[]> {
  const { data, error } = await canonDb()
    .from("expert_review_packets")
    .select(
      "id, expert_slug, engagement_type, engagement_id, member_exchange_ids, item_order, composed_subject, composed_body, status, doctrine_version, rules_passed, judge_notes, response, sent_at, answered_at, created_at",
    )
    .neq("status", "closed")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    expert_slug: p.expert_slug,
    engagement_type: p.engagement_type,
    engagement_id: p.engagement_id,
    member_exchange_ids: (p.member_exchange_ids as string[] | null) ?? [],
    item_order: (p.item_order as string[] | null) ?? [],
    composed_subject: p.composed_subject ?? null,
    composed_body: p.composed_body ?? null,
    status: p.status as PacketStatus,
    doctrine_version: p.doctrine_version ?? null,
    rules_passed: (p.rules_passed as Record<string, unknown> | null) ?? {},
    judge_notes: (p.judge_notes as Record<string, unknown> | null) ?? {},
    response: p.response ?? null,
    sent_at: p.sent_at ?? null,
    answered_at: p.answered_at ?? null,
    created_at: p.created_at,
  }));
}

// Build the review-packet views: group drafted exchanges by expert+engagement, attach the
// freshest live stored packet (drafted preferred, else the most recent non-closed).
export function buildPacketViews(experts: Expert[], exchanges: Exchange[], stored: StoredPacket[]): PacketView[] {
  const expertBySlug = new Map(experts.map((e) => [e.slug, e]));
  const groups = new Map<string, PacketView>();

  const keyOf = (slug: string, et: string, eid: string) => `${slug}::${et}::${eid}`;

  // seed from drafted exchanges
  for (const x of exchanges) {
    if (x.status !== "drafted") continue;
    const key = keyOf(x.expert_slug, x.engagement_type, x.engagement_id);
    if (!groups.has(key)) {
      const expert = expertBySlug.get(x.expert_slug);
      groups.set(key, {
        key,
        expert_slug: x.expert_slug,
        expert_name: expert?.name ?? x.expert_slug,
        expert_email: (expert?.contact as { email?: string } | undefined)?.email ?? null,
        engagement_type: x.engagement_type,
        engagement_id: x.engagement_id,
        pending: [],
        packet: null,
      });
    }
    groups.get(key)!.pending.push({
      id: x.id,
      subject: x.subject,
      kind: metaStr(x.metadata, "kind"),
      artifact_id: metaStr(x.metadata, "artifact_id"),
      sequence_id: metaStr(x.metadata, "sequence_id"),
      status: x.status,
      verdict: metaStr(x.metadata, "verdict"),
    });
  }

  // attach live stored packets (also surface a group that has a sent/answered packet but no
  // pending drafts left, so the answer flow stays visible after Send)
  const pickPacket = (a: StoredPacket, b: StoredPacket) => {
    if (a.status === "drafted" && b.status !== "drafted") return a;
    if (b.status === "drafted" && a.status !== "drafted") return b;
    return a.created_at >= b.created_at ? a : b;
  };
  for (const p of stored) {
    const key = keyOf(p.expert_slug, p.engagement_type, p.engagement_id);
    if (!groups.has(key)) {
      const expert = expertBySlug.get(p.expert_slug);
      groups.set(key, {
        key,
        expert_slug: p.expert_slug,
        expert_name: expert?.name ?? p.expert_slug,
        expert_email: (expert?.contact as { email?: string } | undefined)?.email ?? null,
        engagement_type: p.engagement_type,
        engagement_id: p.engagement_id,
        pending: [],
        packet: null,
      });
    }
    const g = groups.get(key)!;
    g.packet = g.packet ? pickPacket(g.packet, p) : p;
  }

  return [...groups.values()].sort((a, b) => b.pending.length - a.pending.length);
}

export async function getReviewPackets(experts: Expert[], exchanges: Exchange[]): Promise<PacketView[]> {
  const stored = await getStoredPackets();
  return buildPacketViews(experts, exchanges, stored);
}
