"use client";

import type { Activity, ActivityStatus, Workflow } from "@/lib/sops";
import type { AccentTokens, ModeFeatures, OperateMode } from "@/lib/operate/mode-features";
import { fillFor, labelFor, strokeFor } from "@/lib/operate/status-tokens";

// Right-top: the workflow as a node-card grid (replaces the SVG DAG). One card
// per node: padded index, activity name, owner (mono), status. Skill chips are
// intentionally omitted until canon.sop_activities.skills is populated — no
// fabricated chips. BUILD adds card menus + "+ Add activity" as inert stubs.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function WorkflowCard({
  workflow,
  activities,
  statusMap,
  selectedNodeId,
  stageOrder,
  stageCount,
  mode,
  features,
  accent,
  onSelectNode,
  notify,
}: {
  workflow: Workflow;
  activities: Activity[];
  statusMap: Record<string, ActivityStatus>;
  selectedNodeId: string | null;
  stageOrder: number;
  stageCount: number;
  mode: OperateMode;
  features: ModeFeatures;
  accent: AccentTokens;
  onSelectNode: (nodeId: string) => void;
  notify: (msg: string) => void;
}) {
  const byId = new Map(activities.map((a) => [a.activity_id, a]));
  const meta =
    mode === "run"
      ? `workflow · ${workflow.nodes.length} activities · stage ${pad(stageOrder)} / ${stageCount}`
      : mode === "iterate"
        ? `workflow · ${workflow.nodes.length} activities · structure locked`
        : `workflow · ${workflow.nodes.length} activities · editable`;

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white">{workflow.name}</h2>
        <div className="text-xs text-muted">{meta}</div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
        {workflow.nodes.map((n, i) => {
          const a = byId.get(n.activity_id);
          const status = statusMap[n.activity_id] ?? "unset";
          const selected = n.node_id === selectedNodeId;
          const exec =
            a?.executor_class === "agent-loop"
              ? "AI"
              : a?.executor_class === "automated-tool"
                ? "tool"
                : "human";
          return (
            <button
              key={n.node_id}
              onClick={() => onSelectNode(n.node_id)}
              className="relative flex flex-col gap-1.5 rounded-xl border p-3 text-left"
              style={
                selected
                  ? { background: accent.bg, borderColor: accent.border }
                  : { background: "#10141c", borderColor: "#1d2430" }
              }
            >
              {features.workflow_add_activity && (
                <span
                  className="absolute right-2 top-2 cursor-pointer text-xs text-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    notify("Activity menu · rename / move / delete (lands with the publish flow)");
                  }}
                >
                  ···
                </span>
              )}
              <span
                className="text-[11px] tracking-wide"
                style={{ color: selected ? accent.text : "#7d8590" }}
              >
                {pad(i + 1)}
              </span>
              <span
                className="pr-3.5 text-[13px] font-semibold leading-tight"
                style={{ color: selected ? accent.textSoft : "#e6edf3" }}
              >
                {n.label}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {a?.owning_system ?? "—"}
              </span>
              <div className="flex items-center gap-1.5 border-t border-ink-700 pt-1.5 text-[10px]">
                <span style={{ color: strokeFor(status) }}>
                  {exec} · {labelFor(status)}
                </span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: fillFor(status) }} />
              </div>
            </button>
          );
        })}

        {features.workflow_add_activity && (
          <button
            onClick={() => notify("Add activity · inserts a node into this stage (lands with the publish flow)")}
            className="flex min-h-[118px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs"
            style={{ borderColor: accent.border, color: accent.textSoft }}
          >
            <span className="text-xl leading-none">+</span>
            Add activity
          </button>
        )}
      </div>
    </div>
  );
}
