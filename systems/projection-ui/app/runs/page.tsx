"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import StatCards from "@/components/StatCards";
import { toCell, shortDate, money } from "@/lib/format";

const COLS = [
  "status", "scope_filter", "contact_count", "contacts_enriched", "contacts_failed",
  "total_cost", "top_blocker", "triggered_by", "started_at", "completed_at", "created_at",
];

export default function RunsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [detail, setDetail] = useState<{ run: Record<string, unknown>; contacts: Record<string, unknown>[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setRows(j.rows)))
      .catch((e) => setErr(String(e)));
  }, []);

  const open = async (row: Record<string, unknown>) => {
    const res = await fetch(`/api/runs?id=${row.id}`);
    const json = await res.json();
    if (res.ok) setDetail(json);
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold text-white">Runs</h1>
      <StatCards
        stats={[
          { label: "Enrichment runs", value: rows.length },
          {
            label: "Status",
            value: rows.length ? "live" : "empty — writes as enrichment flows",
            tone: rows.length ? "ok" : "warn",
          },
        ]}
      />
      {err && <div className="text-xs text-bad">{err}</div>}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-ink-700 bg-ink-800 p-6 text-sm text-muted">
          No enrichment runs yet. <code className="text-accent">enrichment_runs</code> is live but empty;
          this page fills in as the engine writes runs on-rails. Expected, not an error.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <DataTable columns={COLS} rows={rows} onRowClick={open} />
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/50" onClick={() => setDetail(null)} />
          <div className="w-[560px] max-w-full overflow-y-auto border-l border-ink-700 bg-ink-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Run {toCell(detail.run.id).slice(0, 8)}</div>
              <button className="text-muted hover:text-white" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="space-y-1 text-xs">
              <div>status: <span className="text-white">{toCell(detail.run.status)}</span></div>
              <div>cost: {money(detail.run.total_cost)}</div>
              <div>started: {shortDate(detail.run.started_at)}</div>
              <div>completed: {shortDate(detail.run.completed_at)}</div>
              <div>reason: {toCell(detail.run.reason)}</div>
            </div>
            <h4 className="mb-1 mt-4 text-xs font-semibold uppercase text-muted">
              Contacts touched ({detail.contacts.length})
            </h4>
            <div className="space-y-1">
              {detail.contacts.map((c) => (
                <div key={toCell(c.id)} className="text-[11px] text-muted">
                  {toCell(c.first_name)} {toCell(c.last_name)} · {toCell(c.email)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
