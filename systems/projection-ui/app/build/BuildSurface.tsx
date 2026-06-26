"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type SystemBuild,
  type Move,
  MOVES,
  MOVE_LABELS,
  STAGE_HINTS,
  ASK_VERB,
} from "@/lib/builds/shared";

function MoveStepper({ current, done }: { current: Move; done: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {MOVES.map((m) => {
        const state = done || m < current ? "past" : m === current ? "now" : "future";
        const cls =
          state === "now"
            ? "bg-accent text-ink-900"
            : state === "past"
              ? "bg-ink-600 text-muted"
              : "bg-ink-850 text-ink-600";
        return (
          <span
            key={m}
            className={`rounded px-1.5 py-0.5 text-[10px] ${cls}`}
            title={`Move ${m}: ${MOVE_LABELS[m]}`}
          >
            {m} {MOVE_LABELS[m]}
          </span>
        );
      })}
    </div>
  );
}

export default function BuildSurface({ builds }: { builds: SystemBuild[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch("/api/build/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "resolve failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const active = builds.filter((b) => b.status !== "done");

  return (
    <main className="min-h-full p-6 font-mono text-sm text-[#e6edf3]">
      <header className="mb-5">
        <h1 className="text-base font-semibold">Build</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          Every system being built, and the one thing each one needs from you right now. Nothing
          waits in a chat. {active.length} in flight.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          <span className="text-ink-600">Stages:</span>
          {MOVES.map((m, i) => (
            <span key={m} className="flex items-center gap-1">
              <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[#cdd9e5]">
                {m} {MOVE_LABELS[m]}
              </span>
              <span>{STAGE_HINTS[m]}</span>
              {i < MOVES.length - 1 && <span className="text-ink-600">→</span>}
            </span>
          ))}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-bad">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-ink-700">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-ink-800 text-[11px] uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">System</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Needs from you</th>
              <th className="px-3 py-2 font-medium">Artifacts</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {builds.map((b) => (
              <tr
                key={b.slug}
                className={`border-t border-ink-700 align-top ${b.status === "done" ? "opacity-50" : ""}`}
              >
                <td className="px-3 py-3">
                  <div className="font-semibold">{b.name}</div>
                  {b.notes && (
                    <div className="mt-0.5 max-w-md text-[11px] leading-snug text-muted">{b.notes}</div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <MoveStepper current={b.current_move} done={b.status === "done"} />
                </td>
                <td className="px-3 py-3 max-w-sm">
                  {b.status === "done" ? (
                    <span className="text-ok">done</span>
                  ) : b.status === "blocked" ? (
                    <span className="text-warn">blocked: {b.pending_ask_text}</span>
                  ) : (
                    <span className="text-[#cdd9e5]">{b.pending_ask_text}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-[11px]">
                  <div className="flex flex-col gap-0.5">
                    <span className={b.brief_path ? "text-accent" : "text-ink-600"} title={b.brief_path ?? ""}>
                      {b.brief_path ? "brief" : "no brief"}
                    </span>
                    <span className={b.sketch_path ? "text-accent" : "text-ink-600"} title={b.sketch_path ?? ""}>
                      {b.sketch_path ? "sketch" : "no sketch"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  {b.status !== "done" && b.pending_ask_type && (
                    <button
                      type="button"
                      onClick={() => resolve(b.slug)}
                      disabled={busy === b.slug}
                      title="Approves this stage and moves the build to the next one."
                      className="rounded bg-accent px-2.5 py-1 text-[11px] font-medium text-ink-900 hover:bg-accent-dim disabled:opacity-50"
                    >
                      {busy === b.slug ? "..." : ASK_VERB[b.pending_ask_type]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-[11px] text-muted">
        The button approves a build's current stage and moves it forward. A box to start a new build
        and a finished-builds view come next. (Live data: canon public.system_builds.)
      </p>
    </main>
  );
}
