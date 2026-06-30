"use client";

import { useState } from "react";
import type { AccentTokens, ModeFeatures, OperateMode } from "@/lib/operate/mode-features";
import { SectionHeading } from "@/components/operate/SectionHeading";

// The action row. Pure buttons driven by feature flags + injected callbacks.
// Supporting panels (EXECUTE-confirm, run-status, save message) render in
// ActivityDetail below this. RUN fires real runs; ITERATE saves real drafts;
// BUILD actions are visible-but-inert stubs (toast) this slice.

const base =
  "rounded border px-3 py-1.5 text-xs font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

export function ActionBar({
  mode,
  features,
  accent,
  // RUN
  onRunPlan,
  planDisabledReason,
  creditSpender,
  onRunExecuteClick,
  // ITERATE
  dirty,
  saving,
  onSave,
  onDiscard,
  // BUILD
  onPublish,
  publishing,
  // stubs
  notify,
}: {
  mode: OperateMode;
  features: ModeFeatures;
  accent: AccentTokens;
  onRunPlan: () => void;
  planDisabledReason: string | null;
  creditSpender: boolean;
  onRunExecuteClick: () => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onPublish: () => void;
  publishing: boolean;
  notify: (msg: string) => void;
}) {
  const a = features.actions;
  const [validated, setValidated] = useState(false);

  const primaryStyle: React.CSSProperties = {
    background: accent.bg,
    borderColor: accent.border,
    color: accent.textSoft,
  };

  return (
    <div>
      <SectionHeading>Actions</SectionHeading>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* ── RUN ─────────────────────────────────────────────── */}
        {a.run_plan && (
          <button
            onClick={onRunPlan}
            disabled={Boolean(planDisabledReason)}
            title={planDisabledReason ?? "spawn runner in PLAN mode; tail prep_run_status"}
            className={base}
            style={planDisabledReason ? undefined : primaryStyle}
          >
            Run (PLAN)
          </button>
        )}
        {a.run_execute && creditSpender && (
          <button
            onClick={onRunExecuteClick}
            title="opens confirm panel; EXECUTE wiring lands in a later slice"
            className={`${base} border-warn/40 bg-warn/10 text-warn hover:bg-warn/20`}
          >
            Run (EXECUTE)
          </button>
        )}

        {/* ── ITERATE ─────────────────────────────────────────── */}
        {a.save_iteration && (
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            title="Insert sop_activities row at version+1 with is_current=false. Publish lands in a later slice."
            className={base}
            style={dirty && !saving ? primaryStyle : undefined}
          >
            {saving ? "saving…" : "Save iteration"}
          </button>
        )}
        {a.run_after_save && (
          <button
            disabled
            title="Run-after-save fires the activity against the new draft. Wiring lands in a later slice."
            className={`${base} border-ink-700 text-muted`}
          >
            Run after save (PLAN)
          </button>
        )}
        {a.discard_iteration && (
          <button
            onClick={onDiscard}
            disabled={!dirty}
            className={`${base} border-ink-700 text-muted hover:text-white`}
          >
            Discard
          </button>
        )}

        {/* ── BUILD (stubs) ───────────────────────────────────── */}
        {a.validate && (
          <button
            onClick={() => {
              setValidated(true);
              notify("Validation passed ✓ (RULES-GATE wiring lands with the artifact migrations)");
            }}
            className={base}
            style={primaryStyle}
          >
            Validate
          </button>
        )}
        {a.save_draft && (
          <button
            onClick={() => notify("Draft saved — publish flow lands with publish_sop_version (migration 023)")}
            className={`${base} border-ink-700 text-white hover:bg-ink-800`}
          >
            Save draft
          </button>
        )}
        {a.publish && (
          <button
            onClick={() => {
              if (!validated) return notify("Run Validate before publishing");
              onPublish();
            }}
            disabled={!validated || publishing}
            title="Promotes the latest activity draft to current via publish_activity_version"
            className={base}
            style={validated && !publishing ? primaryStyle : undefined}
          >
            {publishing ? "publishing…" : "Publish v+1"}
          </button>
        )}
        {a.discard_draft && (
          <button
            onClick={() => notify("Draft discarded (stub)")}
            className={`${base} border-bad/40 bg-transparent text-bad hover:bg-bad/10`}
          >
            Discard draft
          </button>
        )}
      </div>

      {/* per-mode note */}
      {mode === "run" && creditSpender && (
        <div className="mt-2 text-[11px] text-muted">EXECUTE not yet wired (501).</div>
      )}
      {mode === "build" && (
        <div className="mt-2 text-[11px] text-muted">
          {validated ? "validated — ready to publish" : "publish gated until validate passes"}
        </div>
      )}
    </div>
  );
}
