"use client";

import type { OperateMode } from "@/lib/operate/mode-features";
import type { ActivityRunRow } from "@/lib/operate/composition-draft";
import { SectionHeading } from "@/components/operate/SectionHeading";

// Runs history. canon.public.activity_runs lands in migration 020; until then
// the query returns [] and we render the honest empty state — never the mock's
// fabricated run rows.

export function RunsHistory({ runs, mode }: { runs: ActivityRunRow[]; mode: OperateMode }) {
  return (
    <div>
      <SectionHeading>Runs history{mode === "iterate" ? " · learn from past" : ""}</SectionHeading>
      {runs.length === 0 ? (
        <div className="rounded border border-dashed border-ink-700 bg-ink-800 p-3 text-[11px] text-muted">
          No runs recorded yet — fire this activity (Run PLAN) to start collecting
          history in canon.public.activity_runs.
        </div>
      ) : (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-ink-700 text-left text-ink-600">
              <th className="py-1.5 font-normal uppercase tracking-wide">when</th>
              <th className="py-1.5 font-normal uppercase tracking-wide">status</th>
              <th className="py-1.5 font-normal uppercase tracking-wide">duration</th>
              <th className="py-1.5 font-normal uppercase tracking-wide">cost</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.runId} className="border-b border-ink-800 last:border-b-0">
                <td className="py-1.5 font-mono text-muted">{r.startedAt}</td>
                <td className="py-1.5 text-white">{r.status}</td>
                <td className="py-1.5 font-mono text-muted">
                  {r.durationMs != null ? `${r.durationMs}ms` : "—"}
                </td>
                <td className="py-1.5 font-mono text-muted">${r.costUsd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
