"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SopDetail } from "@/lib/operate/sop-types";
import type { Activity, Workflow, WorkflowNode } from "@/lib/sops";
import { ACCENT_TOKENS, FEATURES, parseMode } from "@/lib/operate/mode-features";
import { ModeToggle } from "@/components/operate/ModeToggle";
import { CockpitHeader } from "@/components/operate/CockpitHeader";
import { SopSpine, type SpineStage } from "@/components/operate/SopSpine";
import { WorkflowCard } from "@/components/operate/WorkflowCard";
import { ActivityDetail } from "@/components/operate/ActivityDetail";

// Top-level /operate cockpit. Server page fetches SopDetail and renders this
// client island; it owns URL state (?mode/stage/node), selection, and the
// bottom toast. Per-mode behavior is read from FEATURES[mode] throughout.

export function OperateCockpit({ data, sopId }: { data: SopDetail; sopId: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const { bundle, active_run, activity_status, activity_live, stage_status } = data;

  const mode = parseMode(sp.get("mode"));
  const features = FEATURES[mode];
  const accent = ACCENT_TOKENS[features.accent];

  // ── Toast ──────────────────────────────────────────────────────────────
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((msg: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = setTimeout(() => setNotice(null), 2800);
  }, []);

  // ── Selection (mirrors slice-1 defaults) ───────────────────────────────
  const defaultStage =
    bundle.sop.stages.find((s) => s.workflow_ids.length > 0) ?? bundle.sop.stages[0];
  const stageId = sp.get("stage") ?? defaultStage.stage_id;
  const stage = bundle.sop.stages.find((s) => s.stage_id === stageId) ?? defaultStage;
  const workflows = stage.workflow_ids
    .map((id) => bundle.workflows.find((w) => w.workflow_id === id))
    .filter((w): w is Workflow => Boolean(w));
  const workflow = workflows[0];

  const defaultNode: WorkflowNode | undefined = (() => {
    if (!workflow) return undefined;
    return workflow.nodes.find((n) => activity_status[n.activity_id] === "blocked") ?? workflow.nodes[0];
  })();
  const nodeId = sp.get("node") ?? defaultNode?.node_id ?? null;

  const nodeIndex = workflow ? workflow.nodes.findIndex((n) => n.node_id === nodeId) : -1;
  const nodeCount = workflow ? workflow.nodes.length : 0;
  const selectedActivity: Activity | undefined = (() => {
    if (!nodeId || !workflow) return undefined;
    const n = workflow.nodes.find((x) => x.node_id === nodeId);
    return n ? bundle.activities.find((a) => a.activity_id === n.activity_id) : undefined;
  })();

  const setQs = useCallback(
    (next: { stage?: string; node?: string | null }) => {
      const params = new URLSearchParams(sp.toString());
      if (next.stage !== undefined) params.set("stage", next.stage);
      if (next.node !== undefined) {
        if (next.node === null) params.delete("node");
        else params.set("node", next.node);
      }
      router.replace(`/operate/${sopId}?${params.toString()}`, { scroll: false });
    },
    [router, sopId, sp],
  );

  // ── Spine summaries + rollup ────────────────────────────────────────────
  const stageSummaries: SpineStage[] = useMemo(
    () =>
      bundle.sop.stages
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          stage_id: s.stage_id,
          order: s.order,
          name: s.name,
          status: stage_status[s.stage_id] ?? "pending",
          hasWorkflow: s.workflow_ids.length > 0,
        })),
    [bundle.sop.stages, stage_status],
  );
  const doneCount = stageSummaries.filter((s) => s.status === "done").length;
  const blockedCount = stageSummaries.filter((s) => s.status === "blocked").length;

  const cockpit = {
    mode,
    sopId,
    runId: active_run?.run_id,
    stageId,
    nodeId: nodeId ?? undefined,
    engagementId: active_run?.target_engagement,
  };

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-[1360px] space-y-5 px-6 pb-24 pt-5">
        <CockpitHeader
          sopName={bundle.sop.name}
          sopDescription={bundle.sop.description}
          activeRun={active_run}
          mode={mode}
          accent={accent}
          doneCount={doneCount}
          totalCount={stageSummaries.length}
          blockedCount={blockedCount}
          cockpit={cockpit}
          selectedActivityId={selectedActivity?.activity_id ?? null}
          notify={notify}
        />

        <ModeToggle basePath={`/operate/${sopId}`} mode={mode} />

        <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-5">
          <div className="mb-5 lg:mb-0">
            <SopSpine
              stages={stageSummaries}
              activeStageId={stageId}
              mode={mode}
              features={features}
              accent={accent}
              onSelectStage={(id) => setQs({ stage: id, node: null })}
              notify={notify}
            />
            {/* selected-stage end-state line */}
            <div className="mt-3 px-1 text-xs">
              <span className="text-muted">Stage {stage.order}:</span>{" "}
              <span className="text-white">{stage.name}</span>
              <div className="mt-1 text-muted">{stage.required_end_state}</div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            {workflow ? (
              <WorkflowCard
                workflow={workflow}
                activities={bundle.activities}
                statusMap={activity_status}
                selectedNodeId={nodeId}
                stageOrder={stage.order}
                stageCount={stageSummaries.length}
                mode={mode}
                features={features}
                accent={accent}
                onSelectNode={(id) => setQs({ node: id })}
                notify={notify}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-ink-700 p-4 text-xs text-muted">
                This stage has no L2 workflow expanded yet. Author one in{" "}
                <code>systems/operating-sop/sops/</code> to surface its nodes here.
              </div>
            )}

            {selectedActivity ? (
              <ActivityDetail
                key={selectedActivity.activity_id}
                activity={selectedActivity}
                status={activity_status[selectedActivity.activity_id] ?? "unset"}
                live={activity_live[selectedActivity.activity_id]}
                mode={mode}
                nodeIndex={nodeIndex}
                nodeCount={nodeCount}
                notify={notify}
                onView={() => notify("Opening in source viewer (editor wiring is a later slice)")}
                expertLiaison={data.expert_liaison_summary}
                engagementId={active_run?.target_engagement ?? null}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-ink-700 p-4 text-xs text-muted">
                Select an activity above to inspect.
              </div>
            )}
          </div>
        </div>
      </main>

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-ink-800 px-4 py-2.5 text-[13px] text-white shadow-xl"
          style={{ borderColor: accent.border }}
        >
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: accent.text }} />
          {notice}
        </div>
      )}
    </div>
  );
}
