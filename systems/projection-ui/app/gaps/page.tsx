"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";

interface Gap {
  key: string;
  label: string;
  blurb: string;
  view: string;
  count: number;
  error?: string;
}

export default function GapsPage() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [active, setActive] = useState<Gap | null>(null);
  const [records, setRecords] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/gaps")
      .then((r) => r.json())
      .then((j) => setGaps(j.gaps ?? []));
  }, []);

  const openGap = async (g: Gap) => {
    setActive(g);
    setLoading(true);
    setRecords(null);
    const res = await fetch(`/api/gaps?view=${g.key}`);
    const json = await res.json();
    setLoading(false);
    if (res.ok) setRecords(json);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="text-lg font-semibold text-white">Gaps</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {gaps.map((g) => (
          <button
            key={g.key}
            onClick={() => openGap(g)}
            className={`rounded-lg border p-4 text-left ${
              active?.key === g.key ? "border-accent bg-ink-800" : "border-ink-700 bg-ink-800 hover:border-ink-600"
            }`}
          >
            <div className="text-2xl font-semibold text-white">
              {g.error ? "—" : g.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted">{g.label}</div>
            <div className="mt-1 text-[11px] text-ink-600">{g.error ? g.error : g.blurb}</div>
          </button>
        ))}
      </div>

      {active && (
        <div className="min-h-0 flex-1">
          <div className="mb-2 text-sm text-muted">
            {active.label} · <code className="text-accent">{active.view}</code>{" "}
            {loading && <span>loading…</span>}
          </div>
          {records && (
            <div className="max-h-[60vh] overflow-auto">
              <DataTable columns={records.columns} rows={records.rows} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
