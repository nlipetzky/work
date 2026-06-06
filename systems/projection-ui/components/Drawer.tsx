"use client";

import { classifyValue } from "@/lib/validity";
import { toCell, shortDate, money } from "@/lib/format";
import type { RecordDetail } from "@/lib/types";

function FieldRow({ name, value, source }: { name: string; value: unknown; source?: string }) {
  const v = classifyValue(value);
  const tone = v === "empty" ? "text-ink-600" : v === "placeholder" ? "text-warn" : "text-[#e6edf3]";
  return (
    <div className="flex items-start gap-2 border-b border-ink-800 py-1 text-xs">
      <div className="w-44 shrink-0 text-muted">{name}</div>
      <div className={`flex-1 break-words ${tone}`}>
        {v === "empty" ? "—" : v === "placeholder" ? `⚠ ${toCell(value)}` : toCell(value)}
      </div>
      {source && <div className="w-28 shrink-0 text-right text-[10px] text-ink-600">{source}</div>}
    </div>
  );
}

export default function Drawer({
  detail,
  loading,
  onClose,
}: {
  detail: RecordDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const open = loading || !!detail;
  if (!open) return null;

  const provBy = new Map<string, string>();
  detail?.provenance.forEach((p) => provBy.set(p.field, p.source ?? p.action ?? ""));
  const rec = detail?.record ?? {};
  const title =
    detail?.entity === "contacts"
      ? `${toCell(rec.first_name)} ${toCell(rec.last_name)}`.trim()
      : toCell(rec.name);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="flex w-[640px] max-w-full flex-col overflow-y-auto border-l border-ink-700 bg-ink-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-700 bg-ink-850 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">{title || "Record"}</div>
            <div className="text-[10px] text-ink-600">{toCell(rec.id)}</div>
          </div>
          <button className="text-muted hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && <div className="p-6 text-sm text-muted">Loading…</div>}

        {detail && (
          <div className="space-y-5 p-4">
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Fields ({Object.keys(detail.record).length})
              </h3>
              <div>
                {Object.entries(detail.record)
                  .filter(([k]) => k !== "field_provenance")
                  .map(([k, v]) => (
                    <FieldRow key={k} name={k} value={v} source={provBy.get(k)} />
                  ))}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Provenance ({detail.provenance.length})
              </h3>
              {detail.provenance.length === 0 ? (
                <div className="text-xs text-ink-600">
                  No per-field provenance recorded. A value with no provenance is suspect.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-ink-600">
                      <th className="py-1">field</th>
                      <th>source</th>
                      <th>action</th>
                      <th>captured</th>
                      <th>conf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.provenance.map((p) => (
                      <tr key={p.field} className="border-t border-ink-800">
                        <td className="py-1 pr-2 text-muted">{p.field}</td>
                        <td className="pr-2">{p.source ?? "—"}</td>
                        <td className="pr-2">{p.action ?? "—"}</td>
                        <td className="pr-2">{shortDate(p.captured_at)}</td>
                        <td>{p.confidence ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Activity ({detail.activity.length})
              </h3>
              <div className="space-y-1">
                {detail.activity.slice(0, 60).map((a, i) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <span className="w-28 shrink-0 text-ink-600">{shortDate(a.created_at)}</span>
                    <span className="w-40 shrink-0 text-accent">{toCell(a.activity_type)}</span>
                    <span className="text-muted">
                      {toCell(a.outcome)} {a.provider ? `· ${toCell(a.provider)}` : ""}
                    </span>
                  </div>
                ))}
                {detail.activity.length === 0 && (
                  <div className="text-xs text-ink-600">No activity recorded.</div>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Enrichment jobs ({detail.jobs.length})
              </h3>
              <div className="space-y-1">
                {detail.jobs.map((j, i) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <span className="w-28 shrink-0 text-ink-600">{shortDate(j.created_at)}</span>
                    <span className="w-32 shrink-0">{toCell(j.provider)}</span>
                    <span className="w-24 shrink-0 text-muted">{toCell(j.status)}</span>
                    <span className="text-muted">{money(j.actual_cost)}</span>
                  </div>
                ))}
                {detail.jobs.length === 0 && (
                  <div className="text-xs text-ink-600">No enrichment jobs recorded.</div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
