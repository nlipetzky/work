"use client";

import type { AccentTokens, ModeFeatures } from "@/lib/operate/mode-features";
import type { ActivityEvalsSummary } from "@/lib/operate/composition-draft";
import { SectionHeading } from "@/components/operate/SectionHeading";

// Evals summary. canon.public.activity_evals lands in migration 021; until then
// the query returns null and we render the honest empty state. When authoring
// (ITERATE/BUILD), the "+ Add fixture" button is shown but inert this slice.

export function EvalsBlock({
  evals,
  features,
  accent,
  notify,
}: {
  evals: ActivityEvalsSummary | null;
  features: ModeFeatures;
  accent: AccentTokens;
  notify: (msg: string) => void;
}) {
  return (
    <div>
      <SectionHeading>Evals</SectionHeading>
      {!evals ? (
        <div className="flex flex-wrap items-center gap-3 rounded border border-dashed border-ink-700 bg-ink-800 p-3 text-[11px] text-muted">
          <span>No evals authored yet for this activity. Add a fixture to start scoring it.</span>
          {features.evals_authoring && (
            <button
              onClick={() => notify("Add eval fixture — authoring lands with migration 021")}
              className="rounded border px-2.5 py-1 text-[11px] font-semibold"
              style={{ borderColor: accent.border, background: accent.bg, color: accent.textSoft }}
            >
              + Add fixture
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded border border-ink-700 bg-ink-800 p-3">
          <span className="font-mono text-sm font-semibold text-white">
            {evals.passRatePct.toFixed(0)}%
            <span className="ml-1 text-[11px] font-normal text-muted">pass rate</span>
          </span>
          <div className="h-2 min-w-[150px] flex-1 overflow-hidden rounded-full border border-ink-700 bg-ink-900">
            <div
              className="h-full rounded-full"
              style={{ width: `${evals.passRatePct}%`, background: "#4fd093" }}
            />
          </div>
          <span className="text-[11px] text-muted">
            {evals.passedLastRun}/{evals.totalFixtures} fixtures
            {evals.staleCount > 0 && ` · ${evals.staleCount} stale`}
            {evals.lastRunAt && ` · last run ${evals.lastRunAt}`}
          </span>
          {features.evals_authoring && (
            <button
              onClick={() => notify("Add eval fixture — authoring lands with migration 021")}
              className="rounded border px-2.5 py-1 text-[11px] font-semibold"
              style={{ borderColor: accent.border, background: accent.bg, color: accent.textSoft }}
            >
              + Add fixture
            </button>
          )}
        </div>
      )}
    </div>
  );
}
