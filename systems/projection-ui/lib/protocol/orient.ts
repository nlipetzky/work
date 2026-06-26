import "server-only";
import { canonDb } from "@/lib/canon";
import type { OrientResult, FreshnessEntry } from "@/lib/protocol/types";

// Step 1 — Orient. Deterministic (no model): load where we left off from the last operator-os
// session, and run a canon freshness check so the run never asserts a stale model.

const DAY_MS = 24 * 60 * 60 * 1000;

function staleDays(ts: string | null): number | null {
  if (!ts) return null;
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / DAY_MS);
}

export async function orient(): Promise<OrientResult> {
  const db = canonDb();

  // last operator-os session + its handoff pointer
  const { data: last } = await db
    .from("agent_sessions")
    .select("title, metadata, started")
    .eq("system_slug", "operator-os")
    .order("started", { ascending: false })
    .limit(1)
    .maybeSingle();
  const pointer = (last?.metadata as { next_session_pointer?: string } | null)?.next_session_pointer ?? null;

  // canon freshness: per-source, and per-DIRECTION for email so a dead outbound (Sent) leg
  // can't hide behind fresh inbound. We check by `created_at` (ingest time), not message date.
  const [{ data: tx }, { data: emIn }, { data: emOut }] = await Promise.all([
    db.from("transcripts").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("email_messages").select("created_at").ilike("direction", "inbound").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("email_messages").select("created_at").ilike("direction", "outbound").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const freshness: FreshnessEntry[] = [
    { source: "transcripts", last_ingest: tx?.created_at ?? null, stale_days: staleDays(tx?.created_at ?? null) },
    { source: "email (received)", last_ingest: emIn?.created_at ?? null, stale_days: staleDays(emIn?.created_at ?? null) },
    { source: "email (sent)", last_ingest: emOut?.created_at ?? null, stale_days: staleDays(emOut?.created_at ?? null) },
  ];

  // Flag a source stale at 3+ days, OR if sent email lags received by 2+ days (a stalled Sent leg).
  const inDays = freshness[1].stale_days;
  const outDays = freshness[2].stale_days;
  const sentLagging = inDays !== null && outDays !== null && outDays - inDays >= 2;
  const stale = freshness.filter((f) => f.stale_days !== null && f.stale_days >= 3);
  if (sentLagging && !stale.includes(freshness[2])) stale.push(freshness[2]);
  const staleLine = stale.length
    ? `Stale: ${stale.map((f) => `${f.source} (${f.stale_days}d)`).join(", ")}.`
    : "Canon fresh (email + transcripts within 3 days).";
  const pointerLine = pointer
    ? `Picking up: ${pointer}`
    : last?.title
      ? `Last session: ${last.title}.`
      : "No prior operator-os session logged.";

  return { where_we_left_off: `${pointerLine} ${staleLine}`, last_session_title: last?.title ?? null, freshness };
}
