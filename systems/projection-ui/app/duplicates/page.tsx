"use client";

import { useCallback, useEffect, useState } from "react";
import StatCards from "@/components/StatCards";
import type { DupPair } from "@/lib/queries/duplicates";

export default function DuplicatesPage() {
  const [threshold, setThreshold] = useState(0.7);
  const [applied, setApplied] = useState(0.7);
  const [pairs, setPairs] = useState<DupPair[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/duplicates?threshold=${applied}&limit=50`);
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      setPairs(json.pairs);
      setQueueTotal(json.queueTotal);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (p: DupPair, resolution: "merged" | "not_duplicate" | "deferred") => {
    const key = `${p.record_a}|${p.record_b}`;
    setBusy(key);
    const res = await fetch("/api/duplicates/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        record_a: p.record_a,
        record_b: p.record_b,
        record_type: p.record_type,
        resolution,
      }),
    });
    setBusy(null);
    if (res.ok) setPairs((cur) => cur.filter((x) => `${x.record_a}|${x.record_b}` !== key));
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="text-lg font-semibold text-white">Duplicates</h1>
      <StatCards
        stats={[
          { label: `Pairs ≥ ${applied.toFixed(2)}`, value: queueTotal },
          { label: "Shown (undecided)", value: pairs.length },
        ]}
      />

      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">threshold {threshold.toFixed(2)}</span>
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-64"
        />
        <button
          onClick={() => setApplied(threshold)}
          className="rounded bg-accent px-3 py-1 text-black"
        >
          Apply
        </button>
        {loading && <span className="text-xs text-muted">loading…</span>}
      </div>

      <div className="space-y-2">
        {pairs.map((p) => {
          const key = `${p.record_a}|${p.record_b}`;
          return (
            <div key={key} className="rounded-lg border border-ink-700 bg-ink-800 p-3">
              <div className="flex items-center justify-between">
                <div className="grid flex-1 grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white">{p.name_a ?? "(unknown)"}</div>
                    <div className="text-xs text-muted">{p.domain_a ?? "—"}</div>
                    <div className="text-[10px] text-ink-600">{p.record_a}</div>
                  </div>
                  <div>
                    <div className="text-white">{p.name_b ?? "(unknown)"}</div>
                    <div className="text-xs text-muted">{p.domain_b ?? "—"}</div>
                    <div className="text-[10px] text-ink-600">{p.record_b}</div>
                  </div>
                </div>
                <div className="px-4 text-right text-xs text-muted">
                  <div className="text-lg font-semibold text-accent">{p.combined_score.toFixed(2)}</div>
                  <div>name {p.name_score?.toFixed(2)} · dom {p.domain_score?.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy === key}
                  onClick={() => resolve(p, "merged")}
                  className="rounded bg-bad/20 px-3 py-1 text-xs text-bad hover:bg-bad/30 disabled:opacity-40"
                >
                  Merge
                </button>
                <button
                  disabled={busy === key}
                  onClick={() => resolve(p, "not_duplicate")}
                  className="rounded bg-ok/20 px-3 py-1 text-xs text-ok hover:bg-ok/30 disabled:opacity-40"
                >
                  Not a duplicate
                </button>
                <button
                  disabled={busy === key}
                  onClick={() => resolve(p, "deferred")}
                  className="rounded bg-ink-700 px-3 py-1 text-xs text-muted hover:text-white disabled:opacity-40"
                >
                  Defer
                </button>
              </div>
            </div>
          );
        })}
        {!loading && pairs.length === 0 && (
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-6 text-sm text-muted">
            No undecided pairs at this threshold.
          </div>
        )}
      </div>
    </div>
  );
}
