"use client";

import type { ActivityLive } from "@/lib/operate/sop-types";
import { SectionHeading } from "@/components/operate/SectionHeading";

// The embedded system-view slot. The full per-system view registry is a later
// slice; for now this honestly surfaces whatever LIVE read we already compute
// for the activity (count + query + reason from operatingSop), framed as the
// owning system's own surface. When there's no live reader, we say so plainly —
// no fabricated table rows.

export function SystemViewEmbed({
  ownerSystemSlug,
  live,
}: {
  ownerSystemSlug: string;
  live: ActivityLive | undefined;
}) {
  const tag = ownerSystemSlug ? `systems/${ownerSystemSlug}` : "owning system";
  const hasLive = live && live.source !== "static" && typeof live.count === "number";

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
