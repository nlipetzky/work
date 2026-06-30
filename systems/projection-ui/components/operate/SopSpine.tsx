"use client";

import type { StageStatus } from "@/lib/sops";
import type { AccentTokens, ModeFeatures, OperateMode } from "@/lib/operate/mode-features";
import { fillFor } from "@/lib/operate/status-tokens";

// Left rail: the vertical SOP spine. One row per stage (index + name + status
// dot). BUILD adds drag handles + per-row menu + "+ Add stage" as inert stubs.

export type SpineStage = {
  stage_id: string;
  order: number;
  name: string;
  status: StageStatus;
  hasWorkflow: boolean;
};

function Dot({ status, selected, accent }: { status: StageStatus; selected: boolean; accent: AccentTokens }) {
  if (selected) {
    return (
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: accent.text, boxShadow: `0 0 0 3px ${accent.bg}` }}
      />
    );
  }
  if (status === "done") return <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fillFor("done") }} />;
  if (status === "blocked")
    return <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ background: fillFor("blocked") }} />;
  if (status === "in_progress" || status === "deviated")
    return <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fillFor(status) }} />;
  return <span className="h-2 w-2 shrink-0 rounded-full border border-ink-600" />;
}

export function SopSpine({
  stages,
  activeStageId,
  mode,
  features,
  accent,
  onSelectStage,
  notify,
}: {
  stages: SpineStage[];
  activeStageId: string;
  mode: OperateMode;
  features: ModeFeatures;
  accent: AccentTokens;
  onSelectStage: (stageId: string) => void;
  notify: (msg: string) => void;
}) {
  const rightText = mode === "run" ? `${stages.length} stages` : mode === "iterate" ? "structure locked" : "draft";

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800 p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
      <div className="mb-2 flex items-center justify-between border-b border-ink-700 px-1.5 pb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">SOP spine</span>
        <span
          className="rounded border px-2 py-0.5 text-[10px]"
          style={
            mode === "build"
              ? { borderColor: accent.border, background: accent.bg, color: accent.textSoft }
              : { borderColor: "#1d2430", color: "#7d8590" }
          }
        >
          {rightText}
        </span>
      </div>

      <ul>
        {stages.map((s) => {
          const selected = s.stage_id === activeStageId;
          return (
            <li key={s.stage_id}>
              <button
                onClick={() => onSelectStage(s.stage_id)}
                className="mb-0.5 flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left"
                style={selected ? { background: accent.bg, borderColor: accent.border } : undefined}
              >
                {features.spine_reorderable && (
                  <span
                    className="shrink-0 cursor-grab text-xs text-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      notify("Reorder stages — drag wiring lands with the publish flow");
                    }}
                  >
                    ⠿
                  </span>
                )}
                <span
                  className="w-4 shrink-0 text-right font-mono text-xs tabular-nums"
                  style={{ color: selected ? accent.text : "#7d8590" }}
                >
                  {s.order}
                </span>
                <span
                  className="flex-1 text-[13px]"
                  style={{
                    color: selected
                      ? accent.textSoft
                      : s.status === "blocked"
                        ? fillFor("blocked")
                        : s.status === "done"
                          ? "#7d8590"
                          : "#e6edf3",
                    fontWeight: selected || s.status === "blocked" ? 600 : 400,
                  }}
                >
                  {s.name}
                </span>
                {features.spine_add_stage && (
                  <span
                    className="shrink-0 cursor-pointer px-1 text-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      notify("Stage menu · rename / insert / delete (lands with the publish flow)");
                    }}
                  >
                    ···
                  </span>
                )}
                <Dot status={s.status} selected={selected} accent={accent} />
              </button>
            </li>
          );
        })}
      </ul>

      {features.spine_add_stage && (
        <button
          onClick={() => notify("Add stage — scaffolds a new stage (lands with the publish flow)")}
          className="mt-2 w-full rounded-lg border border-dashed px-3 py-2.5 text-xs"
          style={{ borderColor: accent.border, color: accent.textSoft }}
        >
          + Add stage
        </button>
      )}

      <div className="mt-2 flex flex-wrap gap-3 border-t border-ink-700 px-1.5 pt-2.5 text-[11px] text-muted">
        <Legend color={fillFor("done")} label="done" />
        <Legend color={fillFor("blocked")} label="blocked" />
        <span className="flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full border border-ink-600" />
          pending
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
