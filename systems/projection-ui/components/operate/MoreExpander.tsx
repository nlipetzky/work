"use client";

import { useEffect, useState } from "react";
import type { Activity } from "@/lib/sops";
import type { OperateMode } from "@/lib/operate/mode-features";
import { SectionHeading } from "@/components/operate/SectionHeading";

// Tier-2 details. RUN: a collapsed expander with scripts / deps / concurrency /
// retry (mostly unset today → "—") PLUS the full AI prompt read inline (folded
// in from the old inspector, so that behavior isn't lost). BUILD: concurrency /
// retry inputs (inert stub). Hidden in ITERATE (parent gates).

export function MoreExpander({
  activity,
  mode,
}: {
  activity: Activity;
  mode: OperateMode;
}) {
  const [open, setOpen] = useState(false);

  // Prompt read (server-side allowlist), folded in from the old inspector.
  const [promptText, setPromptText] = useState<string | null>(null);
  const [promptErr, setPromptErr] = useState<string | null>(null);
  const promptPath = activity.ai?.prompt_path;
  useEffect(() => {
    setPromptText(null);
    setPromptErr(null);
    if (!promptPath) return;
    fetch(`/api/operate/prompt?path=${encodeURIComponent(promptPath)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
        return j as { path: string; text: string };
      })
      .then((j) => setPromptText(j.text))
      .catch((e) => setPromptErr(String(e)));
  }, [promptPath]);

  if (mode === "build") {
    return (
      <div>
        <SectionHeading>More · concurrency / retry</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-600">Concurrency</div>
            <input
              className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs font-mono text-white focus:outline-none"
              placeholder="scope · key · limit"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-600">Retry</div>
            <input
              className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs font-mono text-white focus:outline-none"
              placeholder="attempts · backoff"
            />
          </div>
        </div>
      </div>
    );
  }

  // RUN
  return (
    <div>
      <SectionHeading>More</SectionHeading>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded border border-ink-700 bg-ink-800 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-white">Tier-2 details</span>
          <span className="text-[11px] text-muted">scripts · deps · concurrency · retry · prompt</span>
        </span>
        <span className="text-[11px] text-muted">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <dl className="mx-0.5 mt-3">
          <Tier label="AI model">{activity.ai?.model ?? "—"}</Tier>
          <Tier label="Scripts">{activity.runner.path ?? "—"}</Tier>
          <Tier label="Runner args">
            {activity.runner.args && activity.runner.args.length > 0
              ? activity.runner.args.join(" ")
              : "—"}
          </Tier>
          <Tier label="Concurrency">—</Tier>
          <Tier label="Retry policy">—</Tier>

          {promptPath && (
            <div className="mt-3">
              <dt className="text-[10px] uppercase tracking-wide text-ink-600">Full prompt (inline)</dt>
              <dd className="mt-1.5 rounded border border-ink-700 bg-ink-850 p-3">
                {promptText === null && !promptErr && (
                  <div className="text-[11px] text-muted">loading…</div>
                )}
                {promptErr && <div className="text-[11px] text-bad">{promptErr}</div>}
                {promptText !== null && (
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted">
                    {promptText}
                  </pre>
                )}
              </dd>
            </div>
          )}
          {!promptPath && activity.ai?.prompt_path_note && (
            <div className="mt-2 text-[11px] text-warn">{activity.ai.prompt_path_note}</div>
          )}
        </dl>
      )}
    </div>
  );
}

function Tier({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5 first:mt-0">
      <dt className="text-[10px] uppercase tracking-wide text-ink-600">{label}</dt>
      <dd className="mt-1 break-all font-mono text-xs text-white">{children}</dd>
    </div>
  );
}
