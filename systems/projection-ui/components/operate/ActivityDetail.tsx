"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityLive, SopDetail } from "@/lib/operate/sop-types";
import type { Activity, ActivityStatus } from "@/lib/sops";
import { ACCENT_TOKENS, FEATURES, type OperateMode } from "@/lib/operate/mode-features";
import {
  draftsEqual,
  draftToPostBody,
  fromComposition,
  type AvailableSkill,
  type CompositionPayload,
  type Draft,
  type DraftMutators,
} from "@/lib/operate/composition-draft";
import { ActivityHeader } from "@/components/operate/ActivityHeader";
import { DescriptionBlock } from "@/components/operate/DescriptionBlock";
import { CompositionRows } from "@/components/operate/CompositionRows";
import { ProvenanceBlock } from "@/components/operate/ProvenanceBlock";
import { SystemViewEmbed } from "@/components/operate/SystemViewEmbed";
import { RunsHistory } from "@/components/operate/RunsHistory";
import { EvalsBlock } from "@/components/operate/EvalsBlock";
import { MoreExpander } from "@/components/operate/MoreExpander";
import { ActionBar } from "@/components/operate/ActionBar";
import { FolderDefaults } from "@/components/operate/FolderDefaults";

type RunState = {
  run_id: string;
  status: "pending" | "running" | "done" | "error";
  message: string | null;
};

const Divider = () => <div className="my-5 h-px bg-ink-700" />;

export function ActivityDetail({
  activity,
  status,
  live,
  mode,
  nodeIndex,
  nodeCount,
  notify,
  onView,
  expertLiaison,
  engagementId,
}: {
  activity: Activity;
  status: ActivityStatus;
  live: ActivityLive | undefined;
  mode: OperateMode;
  nodeIndex: number;
  nodeCount: number;
  notify: (msg: string) => void;
  onView: () => void;
  expertLiaison?: SopDetail["expert_liaison_summary"];
  engagementId?: string | null;
}) {
  const features = FEATURES[mode];
  const accent = ACCENT_TOKENS[features.accent];
  const activityId = activity.activity_id;

  // ── Composition fetch ──────────────────────────────────────────────────
  const [payload, setPayload] = useState<CompositionPayload | null>(null);
  const [compErr, setCompErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [baseline, setBaseline] = useState<Draft | null>(null);

  // ── Skill candidates (lazy) ────────────────────────────────────────────
  const [available, setAvailable] = useState<AvailableSkill[] | null>(null);
  const [availableErr, setAvailableErr] = useState<string | null>(null);
  const [wantAvailable, setWantAvailable] = useState(false);
  const requestAvailable = useCallback(() => setWantAvailable(true), []);

  // ── Save / run state ───────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [runErr, setRunErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  // Reset everything when the activity changes.
  useEffect(() => {
    setPayload(null);
    setCompErr(null);
    setDraft(null);
    setBaseline(null);
    setSaveState("idle");
    setSaveMsg(null);
    setRun(null);
    setRunErr(null);
    setConfirming(false);
    setPublishing(false);
    setPublishMsg(null);
    fetch(`/api/operate/composition/${encodeURIComponent(activityId)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : `HTTP ${r.status}`);
        return j as CompositionPayload;
      })
      .then((p) => {
        setPayload(p);
        const d = fromComposition(p.composition);
        setDraft(d);
        setBaseline(d);
      })
      .catch((e) => setCompErr(String(e)));
  }, [activityId]);

  // Lazy-load skill candidates once any swap/add panel asks.
  useEffect(() => {
    if (!features.skill_swap_enabled || !wantAvailable) return;
    if (available != null || availableErr != null) return;
    fetch("/api/operate/available-skills")
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : `HTTP ${r.status}`);
        return j as { skills: AvailableSkill[] };
      })
      .then((p) => setAvailable(p.skills))
      .catch((e) => setAvailableErr(String(e)));
  }, [wantAvailable, features.skill_swap_enabled, available, availableErr]);

  // Poll the run ledger while a run is active.
  useEffect(() => {
    if (!run || run.status === "done" || run.status === "error") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/operate/run/${run.run_id}`);
        if (!r.ok) {
          if (r.status === 404) return;
          throw new Error(`HTTP ${r.status}`);
        }
        const row = await r.json();
        setRun({ run_id: row.run_id, status: row.status, message: row.message });
      } catch (e) {
        setRunErr(String(e));
      }
    }, 1500);
    return () => clearInterval(t);
  }, [run]);

  const dirty = useMemo(
    () => (draft && baseline ? !draftsEqual(draft, baseline) : false),
    [draft, baseline],
  );

  // ── Mutators ───────────────────────────────────────────────────────────
  const mutators: DraftMutators = useMemo(
    () => ({
      setField: (k, v) => setDraft((d) => (d ? { ...d, [k]: v } : d)),
      swapSkill: (oldSlug, newSlug) =>
        setDraft((d) => {
          if (!d) return d;
          const idx = d.skills.indexOf(oldSlug);
          if (idx < 0) return d;
          if (d.skills.includes(newSlug) && newSlug !== oldSlug) {
            return { ...d, skills: d.skills.filter((s) => s !== oldSlug) };
          }
          const next = [...d.skills];
          next[idx] = newSlug;
          return { ...d, skills: next };
        }),
      addSkill: (slug) =>
        setDraft((d) => (d && !d.skills.includes(slug) ? { ...d, skills: [...d.skills, slug] } : d)),
      removeSkill: (slug) =>
        setDraft((d) => (d ? { ...d, skills: d.skills.filter((s) => s !== slug) } : d)),
      addAdapter: (name) =>
        setDraft((d) =>
          d && !d.adapters.includes(name) ? { ...d, adapters: [...d.adapters, name] } : d,
        ),
      removeAdapter: (name) =>
        setDraft((d) => (d ? { ...d, adapters: d.adapters.filter((x) => x !== name) } : d)),
    }),
    [],
  );

  // ── Save / discard ─────────────────────────────────────────────────────
  const onSave = useCallback(async () => {
    if (!draft) return;
    setSaveState("saving");
    setSaveMsg(null);
    try {
      const r = await fetch("/api/operate/iterate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId, draft: draftToPostBody(draft) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error?.message ?? j?.error ?? `HTTP ${r.status}`);
      setSaveState("saved");
      setSaveMsg(`saved as v${j.version} draft (is_current=false)`);
      setBaseline(draft);
      notify(`Iteration saved as v${j.version} draft`);
    } catch (e) {
      setSaveState("error");
      setSaveMsg(String(e));
    }
  }, [activityId, draft, notify]);

  const onDiscard = useCallback(() => {
    if (baseline) setDraft(baseline);
    setSaveState("idle");
    setSaveMsg("changes discarded");
  }, [baseline]);

  // ── Publish (BUILD): promote the latest activity draft to current ────────
  const onPublish = useCallback(async () => {
    setPublishing(true);
    setPublishMsg(null);
    try {
      const r = await fetch("/api/operate/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error?.message ?? j?.error ?? `HTTP ${r.status}`);
      setPublishMsg(
        j.noop ? j.message : `published v${j.version} — now current`,
      );
      notify(j.noop ? j.message : `Published v${j.version} — now current`);
    } catch (e) {
      setPublishMsg(`publish failed: ${String(e)}`);
    } finally {
      setPublishing(false);
    }
  }, [activityId, notify]);

  // ── Run ────────────────────────────────────────────────────────────────
  const onRun = useCallback(
    async (m: "plan" | "execute") => {
      setRun(null);
      setRunErr(null);
      try {
        const r = await fetch("/api/operate/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ activity_id: activityId, mode: m }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
        setRun({ run_id: j.run_id, status: "running", message: "started" });
      } catch (e) {
        setRunErr(String(e));
      }
    },
    [activityId],
  );

  const isBlocked = status === "blocked";
  const planDisabledReason = isBlocked
    ? activity.block_reason ?? "blocked"
    : activity.credit_spender
      ? "credit-spender — PLAN unsafe; EXECUTE wiring not in this slice"
      : null;

  // ── Render ─────────────────────────────────────────────────────────────
  if (compErr) {
    return (
      <div className="rounded-xl border border-ink-700 bg-ink-800 p-5 text-xs text-bad">
        composition: {compErr}
      </div>
    );
  }
  if (!payload || !draft) {
    return (
      <div className="rounded-xl border border-ink-700 bg-ink-800 p-5 text-xs text-muted">
        loading activity…
      </div>
    );
  }

  const { composition, runs, evals, judgment } = payload;

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
      {/* SOP-writer banner (BUILD) */}
      {features.sopwriter_banner_visible && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-lg border px-4 py-3"
          style={{ borderColor: accent.border, background: accent.bg }}
        >
          <span className="text-base leading-none">✎</span>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: accent.textSoft }}>
              SOP-writer · structural edit mode
            </div>
            <div className="mt-0.5 text-[11px] text-muted">
              Edits here change the SOP definition (draft). Nothing runs until you publish.
            </div>
          </div>
        </div>
      )}

      <ActivityHeader
        name={activity.name}
        ownerSystemSlug={composition.ownerSystemSlug || activity.owning_system}
        status={status}
        mode={mode}
        accent={accent}
        nodeIndex={nodeIndex}
        nodeCount={nodeCount}
        dirty={dirty}
      />

      {isBlocked && activity.block_reason && (
        <div className="mt-3 rounded border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
          <span className="font-semibold">Blocked:</span> {activity.block_reason}
        </div>
      )}

      <Divider />
      <DescriptionBlock
        what={activity.what}
        value={draft.description}
        editable={features.composition_editable}
        accent={accent}
        onChange={(v) => mutators.setField("description", v)}
      />

      <Divider />
      <div>
        <CompositionHeading version={composition.version} dirty={dirty} editable={features.composition_editable} accentText={accent.text} accentBorder={accent.border} accentBg={accent.bg} />
        <CompositionRows
          composition={composition}
          draft={draft}
          mode={mode}
          features={features}
          accent={accent}
          mutators={mutators}
          available={available}
          availableErr={availableErr}
          requestAvailable={requestAvailable}
          onView={onView}
        />
      </div>

      <Divider />
      <FolderDefaults judgment={judgment} />

      <Divider />
      <ProvenanceBlock
        composition={composition}
        mode={mode}
        features={features}
        accent={accent}
        notify={notify}
      />

      {features.embedded_system_view_visible && (
        <>
          <Divider />
          <SystemViewEmbed
            ownerSystemSlug={composition.ownerSystemSlug || activity.owning_system}
            live={live}
            expertLiaison={expertLiaison}
            engagementId={engagementId}
          />
        </>
      )}

      {features.runs_history_visible && (
        <>
          <Divider />
          <RunsHistory runs={runs} mode={mode} />
        </>
      )}

      <Divider />
      <EvalsBlock evals={evals} features={features} accent={accent} notify={notify} />

      {mode !== "iterate" && (
        <>
          <Divider />
          <MoreExpander activity={activity} mode={mode} />
        </>
      )}

      <Divider />
      <ActionBar
        mode={mode}
        features={features}
        accent={accent}
        onRunPlan={() => onRun("plan")}
        planDisabledReason={planDisabledReason}
        creditSpender={Boolean(activity.credit_spender)}
        onRunExecuteClick={() => setConfirming(true)}
        dirty={dirty}
        saving={saveState === "saving"}
        onSave={onSave}
        onDiscard={onDiscard}
        onPublish={onPublish}
        publishing={publishing}
        notify={notify}
      />

      {/* Supporting panels */}
      {saveMsg && (
        <div className={`mt-2 text-[11px] ${saveState === "error" ? "text-bad" : "text-muted"}`}>
          {saveMsg}
        </div>
      )}
      {publishMsg && (
        <div
          className={`mt-2 text-[11px] ${publishMsg.startsWith("publish failed") ? "text-bad" : "text-muted"}`}
        >
          {publishMsg}
        </div>
      )}

      {confirming && (
        <div className="mt-3 rounded border border-warn/40 bg-warn/10 p-3 text-xs">
          <div className="mb-2 text-warn">
            <span className="font-semibold">EXECUTE confirm.</span> {activity.name} is a
            credit-spender. The runner writes to canonical data when invoked. EXECUTE
            wiring is a later slice — confirming hits the API but it refuses with 501.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setConfirming(false);
                onRun("execute");
              }}
              className="rounded border border-warn/40 bg-warn/20 px-3 py-1 text-warn"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded border border-ink-700 px-3 py-1 text-muted hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {run && (
        <div className="mt-3 rounded border border-ink-700 bg-ink-800 p-3 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-ink-600">run</span>
            <span className="font-mono text-[11px] text-white">{run.status}</span>
            <span className="font-mono text-[10px] text-ink-600">{run.run_id}</span>
          </div>
          {run.message && (
            <div className="break-all font-mono text-[11px] text-muted">{run.message}</div>
          )}
        </div>
      )}
      {runErr && <div className="mt-2 text-[11px] text-bad">{runErr}</div>}
    </div>
  );
}

function CompositionHeading({
  version,
  dirty,
  editable,
  accentText,
  accentBorder,
  accentBg,
}: {
  version: number;
  dirty: boolean;
  editable: boolean;
  accentText: string;
  accentBorder: string;
  accentBg: string;
}) {
  const tag = dirty ? `v${version + 1} draft` : `v${version}`;
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">
        Composition <span className="font-normal" style={{ color: accentText }}>· canon {tag}</span>
      </h3>
      {editable && (
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
          style={{ borderColor: accentBorder, color: accentText, background: accentBg }}
        >
          {dirty ? "unsaved" : "editable"}
        </span>
      )}
    </div>
  );
}
