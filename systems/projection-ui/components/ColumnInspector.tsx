"use client";

import type { ColumnInspectorResult } from "@/lib/types";

function Bar({ cov }: { cov: ColumnInspectorResult["coverage"] }) {
  const t = cov.total || 1;
  const pct = (n: number) => `${((n / t) * 100).toFixed(1)}%`;
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded bg-ink-800 text-[10px] leading-5">
        <div className="bg-ok text-center text-black" style={{ width: pct(cov.real) }} title={`real ${cov.real}`} />
        <div className="bg-warn text-center text-black" style={{ width: pct(cov.placeholder) }} title={`placeholder ${cov.placeholder}`} />
        <div className="bg-ink-600 text-center" style={{ width: pct(cov.empty) }} title={`empty ${cov.empty}`} />
      </div>
      <div className="mt-2 flex gap-4 text-xs">
        <span className="text-ok">real {cov.real} ({pct(cov.real)})</span>
        <span className="text-warn">placeholder {cov.placeholder} ({pct(cov.placeholder)})</span>
        <span className="text-muted">empty {cov.empty} ({pct(cov.empty)})</span>
      </div>
    </div>
  );
}

export default function ColumnInspector({
  data,
  loading,
  onClose,
}: {
  data: ColumnInspectorResult | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!loading && !data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
          <div className="text-sm font-semibold text-white">
            Column hood{data ? `: ${data.column}` : ""}
          </div>
          <button className="text-muted hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        {loading && <div className="p-6 text-sm text-muted">Sampling…</div>}
        {data && (
          <div className="space-y-5 p-5">
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Coverage (sample of {data.sampleSize})
              </h4>
              <Bar cov={data.coverage} />
            </section>

            <section>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Sources (where real values came from)
              </h4>
              {data.sources.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.sources.map((s) => (
                    <span key={s.source} className="rounded bg-ink-800 px-2 py-1 text-xs text-muted">
                      {s.source} · {s.count}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-ink-600">No provenance sources recorded for this column.</div>
              )}
            </section>

            <section>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                How it&apos;s produced
              </h4>
              <div className="text-xs text-muted">{data.recipeNote}</div>
              {data.recipeMeta && (
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-ink-850 p-3 text-[11px] text-muted">
                  {JSON.stringify(data.recipeMeta, null, 2)}
                </pre>
              )}
            </section>

            <section>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Validity rule (shared with the agent)
              </h4>
              <div className="text-xs text-muted">{data.validityRule}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
