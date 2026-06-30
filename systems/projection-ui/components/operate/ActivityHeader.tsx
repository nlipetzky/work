"use client";

import type { ActivityStatus } from "@/lib/sops";
import type { AccentTokens, OperateMode } from "@/lib/operate/mode-features";
import { labelFor, strokeFor, fillFor } from "@/lib/operate/status-tokens";

// Activity name + a row of meta pills. The pills rotate per mode:
//   RUN     owner · status · node X/Y
//   ITERATE owner · status · "unsaved iteration" (accent) when dirty
//   BUILD   owner · "draft · structural" (accent)
//
// Cost is intentionally NOT shown — there is no real per-run cost source yet
// (activity_runs lands in migration 020). We don't fabricate one.

function Pill({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="rounded-full border border-ink-700 bg-ink-800 px-2.5 py-0.5 text-[11px] text-muted"
      style={style}
    >
      {children}
    </span>
  );
}

export function ActivityHeader({
  name,
  ownerSystemSlug,
  status,
  mode,
  accent,
  nodeIndex,
  nodeCount,
  dirty,
}: {
  name: string;
  ownerSystemSlug: string;
  status: ActivityStatus;
  mode: OperateMode;
  accent: AccentTokens;
  nodeIndex: number; // 0-based
  nodeCount: number;
  dirty: boolean;
}) {
  const accentPill: React.CSSProperties = {
    background: accent.bg,
    borderColor: accent.border,
    color: accent.textSoft,
  };
  const statusPill: React.CSSProperties = {
    background: `${fillFor(status)}22`,
    borderColor: strokeFor(status),
    color: strokeFor(status),
  };

  return (
    <div>
      <h2 className="mb-2.5 text-lg font-semibold tracking-tight text-white">{name}</h2>
      <div className="flex flex-wrap items-center gap-1.5">
        {ownerSystemSlug && <Pill>owner · {ownerSystemSlug}</Pill>}
        {mode !== "build" && <Pill style={statusPill}>{labelFor(status)}</Pill>}
        {mode === "run" && nodeCount > 0 && (
          <Pill>
            node · {nodeIndex + 1} / {nodeCount}
          </Pill>
        )}
        {mode === "iterate" && (
          <Pill style={accentPill}>{dirty ? "unsaved iteration" : "iteration"}</Pill>
        )}
        {mode === "build" && <Pill style={accentPill}>draft · structural</Pill>}
      </div>
    </div>
  );
}
