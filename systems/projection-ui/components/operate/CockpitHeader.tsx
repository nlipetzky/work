"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SopRun } from "@/lib/sops";
import type { AccentTokens, OperateMode } from "@/lib/operate/mode-features";

// Cockpit header: breadcrumb, title + mode tag, sublabel, done counter,
// blocked pill, and the header buttons. Owns the mode-aware Open-in-Claude
// spawn (POST /api/operate/open-claude) and the BUILD "+ Open SOP-writer" stub.

type Cockpit = {
  mode: OperateMode;
  sopId: string;
  runId?: string;
  stageId?: string;
  nodeId?: string;
  engagementId?: string;
};

export function CockpitHeader({
  sopName,
  sopDescription,
  activeRun,
  mode,
  accent,
  doneCount,
  totalCount,
  blockedCount,
  cockpit,
  selectedActivityId,
  notify,
}: {
  sopName: string;
  sopDescription: string;
  activeRun: SopRun | null;
  mode: OperateMode;
  accent: AccentTokens;
  doneCount: number;
  totalCount: number;
  blockedCount: number;
  cockpit: Cockpit;
  selectedActivityId: string | null;
  notify: (msg: string) => void;
}) {
  const [openMsg, setOpenMsg] = useState<string | null>(null);
  useEffect(() => setOpenMsg(null), [selectedActivityId, mode]);

  async function onOpenClaude() {
    if (!selectedActivityId) {
      notify("Select an activity first, then Open in Claude Code.");
      return;
    }
    setOpenMsg(`opening Terminal (${mode.toUpperCase()})…`);
    try {
      const r = await fetch("/api/operate/open-claude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          sopId: cockpit.sopId,
          runId: cockpit.runId,
          stageId: cockpit.stageId,
          nodeId: cockpit.nodeId,
          engagementId: cockpit.engagementId,
          activityId: selectedActivityId,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setOpenMsg(`opened (${mode.toUpperCase()}) · session ${j.sessionId?.slice(0, 8) ?? "?"}`);
    } catch (e) {
      setOpenMsg(`failed: ${String(e)}`);
    }
  }

  const accentBtn: React.CSSProperties = {
    background: accent.bg,
    borderColor: accent.border,
    color: accent.textSoft,
  };

  const modeTag = mode === "iterate" ? "ITERATING" : mode === "build" ? "BUILDING TEMPLATE" : null;

  return (
    <div>
      {/* breadcrumb */}
      <div className="mb-3 text-xs">
        <Link href="/operate" className="text-muted hover:text-white">
          ⧉ control surface
        </Link>
        <span className="mx-2 text-ink-600">/</span>
        <span className="text-white">{sopName}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[23px] font-semibold leading-tight tracking-tight text-white">
              {sopName}
            </h1>
            {modeTag && (
              <span
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={accentBtn}
              >
                {modeTag}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{mode === "build" ? "Editing SOP definition" : "SopRun"}</span>
            <code className="rounded border border-ink-700 bg-ink-800 px-1.5 py-0.5 font-mono text-[11px] text-white">
              {mode === "build"
                ? "draft"
                : activeRun?.target_engagement ?? activeRun?.run_id ?? "no active run"}
            </code>
            {mode !== "build" && (
              <span className="rounded-full border border-ink-700 bg-ink-800 px-2.5 py-1 text-[11px]">
                <strong className="font-semibold text-white">
                  {doneCount} / {totalCount}
                </strong>{" "}
                done
              </span>
            )}
            {mode !== "build" && blockedCount > 0 && (
              <span className="rounded-full border border-bad/30 bg-bad/10 px-2.5 py-1 text-[11px] text-bad">
                {blockedCount} blocked
              </span>
            )}
          </div>
          <p className="mt-2 max-w-3xl text-[13px] text-muted">{sopDescription}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {mode === "build" && (
              <button
                onClick={() => notify("SOP-writer · authoring assistant (lands with the BUILD persona)")}
                className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                style={accentBtn}
              >
                + Open SOP-writer
              </button>
            )}
            <button
              onClick={onOpenClaude}
              title={`spawn Terminal → /api/operate/open-claude (mode=${mode}); persona auto-loads via SessionStart hook`}
              className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
              style={accentBtn}
            >
              Open in Claude Code ({mode.toUpperCase()})
            </button>
          </div>
          {openMsg && <div className="break-all text-[11px] text-muted">{openMsg}</div>}
        </div>
      </div>
    </div>
  );
}
