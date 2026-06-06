"use client";

import { useEffect, useState } from "react";
import { shortDate, toCell } from "@/lib/format";

interface StagingState {
  batches: { name: string; rowCount: number; createdAt?: string }[];
  promotionEnabled: boolean;
  note: string;
  promotionLedger: Record<string, unknown>[];
}

export default function StagingPage() {
  const [state, setState] = useState<StagingState | null>(null);

  useEffect(() => {
    fetch("/api/staging")
      .then((r) => r.json())
      .then(setState);
  }, []);

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="text-lg font-semibold text-white">Staging Batches</h1>

      <div className="rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
        {state?.note ?? "loading…"}
      </div>

      {state && state.batches.length > 0 ? (
        <div className="space-y-2">
          {state.batches.map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800 p-3">
              <div>
                <div className="text-white">{b.name}</div>
                <div className="text-xs text-muted">{b.rowCount} rows · {shortDate(b.createdAt)}</div>
              </div>
              <div className="flex gap-2">
                <button disabled className="cursor-not-allowed rounded bg-ink-700 px-3 py-1 text-xs text-ink-600">
                  Promote (disabled)
                </button>
                <button disabled className="cursor-not-allowed rounded bg-ink-700 px-3 py-1 text-xs text-ink-600">
                  Discard (disabled)
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-ink-700 bg-ink-800 p-6 text-sm text-muted">
          No staging batches. They appear here as <code className="text-accent">staging.&lt;entity&gt;_&lt;batch_id&gt;</code> tables
          when enrichment lands in-flight data.
        </div>
      )}

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Promotion ledger ({state?.promotionLedger.length ?? 0})
        </h3>
        {state && state.promotionLedger.length > 0 ? (
          <div className="space-y-1">
            {state.promotionLedger.map((p, i) => (
              <div key={i} className="text-[11px] text-muted">
                {toCell(p.batch_id)} · {toCell(p.source_record_type)} · {shortDate(p.promoted_at)} · {toCell(p.promoted_by)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-ink-600">No promotions recorded yet.</div>
        )}
      </section>
    </div>
  );
}
