"use client";

import type { ActivityLive, SopDetail } from "@/lib/operate/sop-types";
import { SectionHeading } from "@/components/operate/SectionHeading";

// The embedded system-view slot. The full per-system view registry is a later
// slice; for now this honestly surfaces whatever LIVE read we already compute
// for the activity (count + query + reason from operatingSop), framed as the
// owning system's own surface. When there's no live reader, we say so plainly —
// no fabricated table rows.
//
// Special case: when the owning system is expert-liaison-engine, render a compact
// engagement-scoped motions panel from the SopDetail's expert_liaison_summary
// (Part B) instead of the generic count. This composes alongside FolderDefaults;
// it does not replace it.

export function SystemViewEmbed({
  ownerSystemSlug,
  live,
  expertLiaison,
  engagementId,
}: {
  ownerSystemSlug: string;
  live: ActivityLive | undefined;
  expertLiaison?: SopDetail["expert_liaison_summary"];
  engagementId?: string | null;
}) {
  const tag = ownerSystemSlug ? `systems/${ownerSystemSlug}` : "owning system";
  const hasLive = live && live.source !== "static" && typeof live.count === "number";

  if (ownerSystemSlug === "expert-liaison-engine") {
    return (
      <ExpertLiaisonEmbed tag={tag} summary={expertLiaison} engagementId={engagementId} />
    );
  }

  return (
    <div>
      <SectionHeading>System view</SectionHeading>
      <div
        className="overflow-hidden rounded-lg border border-l-[3px] bg-ink-850 px-4 py-3.5"
        style={{ borderColor: "rgba(102,217,227,0.30)", borderLeftColor: "#6fe0ea" }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black"
              style={{ background: "#6fe0ea" }}
            >
              embedded
            </span>
            <span className="text-[13px] font-semibold text-white">
              {ownerSystemSlug || "system"} · live surface
            </span>
          </div>
          <span
            className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
            style={{ borderColor: "rgba(102,217,227,0.35)", background: "rgba(102,217,227,0.12)", color: "#6fe0ea" }}
          >
            ◬ {tag}
          </span>
        </div>

        {hasLive ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-semibold text-white">
                {live!.count!.toLocaleString()}
              </span>
              {live!.count_label && <span className="text-xs text-muted">{live!.count_label}</span>}
            </div>
            {live!.count_query && (
              <div className="font-mono text-[11px] text-ink-600">{live!.count_query}</div>
            )}
            {live!.reason && <div className="text-[11px] text-warn">{live!.reason}</div>}
          </div>
        ) : live && live.source === "error" ? (
          <div className="text-xs text-bad">⚠ live read failed{live.reason ? ` — ${live.reason}` : ""}</div>
        ) : (
          <div className="py-2 text-xs italic text-muted">
            No live surface exposed by {tag} for this activity. The per-system view
            registry lands in a later slice.
          </div>
        )}

        <div className="mt-3 text-[11px] italic" style={{ color: "#7f8a99" }}>
          This is {tag}&rsquo;s own surface, composed into operate.
        </div>
      </div>
    </div>
  );
}

// ── Expert Liaison compact panel ───────────────────────────────────────────
// Narrow-column-friendly. One row per blocking motion (goal, expert, status,
// ball-in-court, next-action-due with overdue flagged) plus a deep link into
// the Expert Liaison console scoped to this engagement.

function statusTone(status: string): string {
  if (status === "achieved") return "bg-ok/15 text-ok";
  if (status === "active") return "bg-accent/15 text-accent";
  if (status === "abandoned") return "bg-ink-800 text-ink-600";
  return "bg-warn/15 text-warn"; // open / parked
}

function ballTone(ball: string | null): string {
  return ball === "operator" ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn";
}

function ExpertLiaisonEmbed({
  tag,
  summary,
  engagementId,
}: {
  tag: string;
  summary?: SopDetail["expert_liaison_summary"];
  engagementId?: string | null;
}) {
  const openHref = `/expert-liaison${engagementId ? `?engagement=${encodeURIComponent(engagementId)}` : ""}`;
  const motions = summary?.blocking_motions ?? [];

  return (
    <div>
      <SectionHeading>System view</SectionHeading>
      <div
        className="overflow-hidden rounded-lg border border-l-[3px] bg-ink-850 px-4 py-3.5"
        style={{ borderColor: "rgba(102,217,227,0.30)", borderLeftColor: "#6fe0ea" }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black"
              style={{ background: "#6fe0ea" }}
            >
              embedded
            </span>
            <span className="text-[13px] font-semibold text-white">expert-liaison-engine · live surface</span>
          </div>
          <span
            className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
            style={{ borderColor: "rgba(102,217,227,0.35)", background: "rgba(102,217,227,0.12)", color: "#6fe0ea" }}
          >
            ◬ {tag}
          </span>
        </div>

        {summary ? (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
              <span><span className="font-semibold text-white">{summary.open_count}</span> open</span>
              <span><span className="font-semibold text-white">{summary.active_count}</span> active</span>
              <span><span className="font-semibold text-white">{summary.achieved_count}</span> achieved</span>
            </div>

            {motions.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {motions.map((m) => (
                  <div key={m.motion_id} className="rounded border border-ink-700 bg-ink-900 px-2.5 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 text-[12px] leading-snug text-[#cdd9e5]">
                        {m.goal ?? <span className="italic text-ink-600">(no goal set)</span>}
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${statusTone(m.status)}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {m.expert_slug && (
                        <span className="rounded bg-ink-800 px-1.5 py-0.5 text-ink-600">{m.expert_slug}</span>
                      )}
                      {m.ball_in_court && (
                        <span className={`rounded px-1.5 py-0.5 uppercase tracking-wider ${ballTone(m.ball_in_court)}`}>
                          {m.ball_in_court}&rsquo;s move
                        </span>
                      )}
                      {m.next_action_due && (
                        <span className={m.overdue ? "text-bad" : "text-ink-600"}>
                          {m.overdue ? "⚠ overdue " : "due "}
                          {new Date(m.next_action_due).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-1 text-[11px] italic text-muted">
                No open or active motions for this engagement — nothing blocking the expert loop.
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-xs italic text-muted">
            No engagement-scoped Expert Liaison read available (no active run, or the canon read soft-failed).
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] italic" style={{ color: "#7f8a99" }}>
            This is {tag}&rsquo;s own surface, composed into operate.
          </span>
          <a
            href={openHref}
            className="shrink-0 rounded px-2 py-0.5 text-[11px] font-medium hover:underline"
            style={{ color: "#6fe0ea" }}
          >
            Open in Expert Liaison →
          </a>
        </div>
      </div>
    </div>
  );
}
