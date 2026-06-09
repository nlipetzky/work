"use client";

import { useEffect, useRef, useState } from "react";
import type { PrepRunStep, PrepRunStatus, PrepStageStatus } from "@/lib/queries/prepRunStatus";

// Live run-progress strip for the play-prep funnel. Tails /api/runs/status (the prep_run_status
// table) every 2.5s and renders the posted plan flipping pending -> running -> done/error, with
// counts, a live sub-step message, and an elapsed timer on the running stage. Borrows the
// claude-deepline-statusline pattern: spinner + elapsed while active, fall back to the last
// completed run when idle.

const STAGE_LABELS: Record<string, string> = {
  stage1: "Stage-1 classify",
  classify: "Semantic classifier",
  dedup: "Dedup / hierarchy",
  route: "Contact routing",
  contacts_screen: "Contact screen",
};

const PILL: Record<PrepStageStatus, string> = {
  pending: "bg-ink-700 text-muted",
  running: "bg-warn/15 text-warn",
  done: "bg-ok/15 text-ok",
  error: "bg-bad/15 text-bad",
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const prettyStage = (s: string) => STAGE_LABELS[s] ?? s;

function countsSummary(counts: Record<string, number> | null): string {
  if (!counts) return "";
  const entries = Object.entries(counts).filter(([, v]) => typeof v === "number");
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
}

function elapsed(startedAt: string | null, now: number): string {
  if (!startedAt) return "";
  const secs = Math.max(0, (now - new Date(startedAt).getTime()) / 1000);
  return `${secs.toFixed(1)}s`;
}

export default function PrepRunStrip() {
  const [data, setData] = useState<PrepRunStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const mounted = useRef(true);

  // Poll status every 2.5s.
  useEffect(() => {
    mounted.current = true;
    const load = () =>
      fetch("/api/runs/status")
        .then((r) => r.json())
        .then((j) => {
          if (!mounted.current) return;
          if (j.error) setErr(j.error);
          else { setErr(null); setData(j as PrepRunStatus); }
        })
        .catch((e) => mounted.current && setErr(String(e)));
    load();
    const id = setInterval(load, 2500);
    return () => { mounted.current = false; clearInterval(id); };
  }, []);

  // Tick every 1s so the spinner animates and the running-stage timer counts up.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (err) return <div className="text-xs text-bad">prep-run status: {err}</div>;
  if (!data || !data.runId || data.steps.length === 0) {
    return (
      <div className="rounded-lg border border-ink-700 bg-ink-800 p-3 text-sm text-muted">
        No prep run yet. Kick one with <code className="text-accent">node run-prep.mjs &lt;batch_id&gt;</code> and
        watch it move here.
      </div>
    );
  }

  const steps: PrepRunStep[] = data.steps;
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const active = steps.some((s) => s.status === "running");
  const errored = steps.some((s) => s.status === "error");
  const spin = SPINNER[Math.floor(now / 100) % SPINNER.length];

  const headerTone = errored ? "text-bad" : active ? "text-warn" : "text-ok";
  const headerLabel = errored ? "error" : active ? "running" : "last run";

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">
          Prep run <span className="font-mono text-xs text-muted">{data.batchId}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={headerTone}>{active && <span className="mr-1">{spin}</span>}{headerLabel}</span>
          <span className="text-muted">{doneCount}/{total} done</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {steps.map((s) => {
          const summary = countsSummary(s.counts);
          return (
            <div
              key={s.stage}
              className="flex items-center justify-between rounded border border-ink-700 bg-ink-900 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 text-center text-warn">
                  {s.status === "running" ? spin : ""}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-white">{prettyStage(s.stage)}</div>
                  {(s.message || summary) && (
                    <div className="truncate text-[11px] text-muted">
                      {s.status === "done" && summary ? summary : s.message || summary}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.status === "running" && (
                  <span className="font-mono text-[11px] text-muted">{elapsed(s.started_at, now)}</span>
                )}
                <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${PILL[s.status]}`}>
                  {s.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
