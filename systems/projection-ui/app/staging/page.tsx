"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import StatCards from "@/components/StatCards";
import { shortDate, toCell } from "@/lib/format";

interface StagingBatch {
  table_name: string;
  entity: string;
  batch_id: string;
  row_count: number;
  segment_name: string | null;
  playbook_name: string | null;
  play_file_path: string | null;
  guidance_file_path: string | null;
}
interface StagingState {
  batches: StagingBatch[];
  promotionEnabled: boolean;
  note: string;
  promotionLedger: Record<string, unknown>[];
}

const COL_ORDERS: Record<string, string[]> = {
  contacts: [
    "first_name", "last_name", "full_name", "email", "email_verified_status", "title",
    "role_segment", "company_name", "company_domain", "city", "state_region", "country",
    "employment_verification", "source", "linkedin_url",
  ],
  companies: [
    "name", "domain", "industry", "hq_state", "country", "employee_count",
    "biotech_modality_types", "biotech_role", "verification_verdict", "client_sme_note",
    "client_sme_segment_override", "aav_segment", "company_score", "fit_score",
    "playbook_fit_score", "lifecycle_state", "enrichment_status", "funding_stage",
    "revenue_range", "company_linkedin_url", "company_research",
  ],
};
function orderCols(keys: string[], entity: string) {
  const order = COL_ORDERS[entity] ?? [];
  const pri = order.filter((k) => keys.includes(k));
  return [...pri, ...keys.filter((k) => !pri.includes(k))];
}

export default function StagingPage() {
  const [state, setState] = useState<StagingState | null>(null);
  const [open, setOpen] = useState<StagingBatch | null>(null);
  const [detail, setDetail] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [drawerRow, setDrawerRow] = useState<Record<string, unknown> | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/staging");
    setState(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  const openBatch = async (b: StagingBatch) => {
    setOpen(b);
    setDetail(null);
    setResult(null);
    setLoading(true);
    const r = await fetch(`/api/staging?preview=${encodeURIComponent(b.table_name)}&limit=500`);
    const j = await r.json();
    setLoading(false);
    if (r.ok) setDetail({ columns: orderCols(j.columns, b.entity), rows: j.rows });
  };

  const promote = async (b: StagingBatch) => {
    if (!confirm(`Promote ${b.row_count} ${b.entity} from "${b.batch_id}" into the working ${b.entity} table?\n\nOn-rails: provenance stamped, dedup by email/domain, idempotent.`)) return;
    setBusy(true);
    setResult(null);
    const r = await fetch("/api/staging/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: b.batch_id, entity: b.entity }),
    });
    const j = await r.json();
    setBusy(false);
    setResult(r.ok ? j.result : { error: j.error });
    load();
  };

  // ---------- list mode ----------
  if (!open) {
    return (
      <div className="flex h-full flex-col gap-3 overflow-auto p-4">
        <h1 className="text-lg font-semibold text-white">Staging Batches</h1>
        <div className="rounded-lg border border-ink-700 bg-ink-800 p-3 text-xs text-muted">{state?.note ?? "loading…"}</div>
        {state && state.batches.length > 0 ? (
          <div className="space-y-2">
            {state.batches.map((b) => (
              <div key={b.table_name} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800 p-3">
                <button className="text-left" onClick={() => openBatch(b)}>
                  <div className="text-white hover:text-accent">{b.batch_id}</div>
                  <div className="text-xs text-muted">
                    {b.segment_name ? <span className="rounded bg-ink-700 px-1.5 py-0.5 text-accent">{b.segment_name}</span> : null}{" "}
                    <code className="text-ink-600">staging.{b.table_name}</code> · {b.entity} · {b.row_count} rows
                  </div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => openBatch(b)} className="rounded border border-ink-600 px-3 py-1 text-xs text-muted hover:text-white">Open</button>
                  <button disabled={busy} onClick={() => promote(b)} className="rounded bg-accent px-3 py-1 text-xs text-black hover:bg-accent/80 disabled:opacity-40">Promote</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-6 text-sm text-muted">No staging batches.</div>
        )}
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Promotion ledger ({state?.promotionLedger.length ?? 0})</h3>
          {state && state.promotionLedger.length > 0 ? (
            <div className="space-y-1">
              {state.promotionLedger.slice(0, 50).map((p, i) => (
                <div key={i} className="text-[11px] text-muted">{toCell(p.batch_id)} · {toCell(p.source_record_type)} · {shortDate(p.promoted_at)} · {toCell(p.promoted_by)}</div>
              ))}
            </div>
          ) : <div className="text-xs text-ink-600">No promotions recorded yet.</div>}
        </section>
      </div>
    );
  }

  // ---------- detail mode ----------
  const rows = detail?.rows ?? [];
  const stats = open.entity === "companies"
    ? [
        { label: "Companies", value: rows.length },
        { label: "Has domain", value: rows.filter((r) => r.domain).length, tone: "ok" as const },
        { label: "Has modality", value: rows.filter((r) => r.biotech_modality_types).length, tone: "default" as const },
        { label: "ngAbs verdict", value: rows.filter((r) => String(r.verification_verdict ?? "").toLowerCase().includes("ngab")).length },
        { label: "Client SME note", value: rows.filter((r) => r.client_sme_note).length },
      ]
    : [
        { label: "Rows", value: rows.length },
        { label: "Missing email", value: rows.filter((r) => !r.email).length, tone: "warn" as const },
        { label: "Catch-all email", value: rows.filter((r) => r.email_verified_status === "catchall").length, tone: "warn" as const },
        { label: "Company-linked", value: rows.filter((r) => r.company_id).length, tone: "ok" as const },
        { label: "Distinct companies", value: new Set(rows.filter((r) => r.company_id).map((r) => r.company_id)).size },
      ];

  const allCols = detail?.columns ?? [];
  const populatedCols = allCols.filter((c) =>
    rows.some((r) => { const v = r[c]; return v !== null && v !== undefined && String(v).trim() !== ""; }),
  );
  const visibleCols = showAll ? allCols : populatedCols;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setOpen(null); setDetail(null); setDrawerRow(null); }} className="rounded border border-ink-700 px-2 py-1 text-sm text-muted hover:text-white">← Batches</button>
        <h1 className="text-lg font-semibold text-white">{open.batch_id}</h1>
        <div className="text-xs text-muted">
          {open.entity} · {open.row_count} rows
          {open.segment_name && (
            <>
              {" · play: "}
              {open.play_file_path ? (
                <a className="text-accent underline" href={`/api/playfile?path=${encodeURIComponent(open.play_file_path)}`} target="_blank" rel="noreferrer">{open.segment_name}</a>
              ) : <span className="text-accent">{open.segment_name}</span>}
              {open.playbook_name ? ` (${open.playbook_name})` : ""}
            </>
          )}
          {open.guidance_file_path && (
            <>
              {" · "}
              <a className="rounded bg-ok/15 px-1.5 py-0.5 text-ok underline" href={`/api/playfile?path=${encodeURIComponent(open.guidance_file_path)}`} target="_blank" rel="noreferrer">Client Guidance</a>
            </>
          )}
        </div>
        <button disabled={busy} onClick={() => promote(open)} className="ml-auto rounded bg-accent px-4 py-1.5 text-sm text-black hover:bg-accent/80 disabled:opacity-40">
          {busy ? "Promoting…" : "Promote"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-2 text-sm">
          {result.error ? <span className="text-bad">{toCell(result.error)}</span> :
            <span className="text-white">promoted {toCell(result.promoted)} · inserted {toCell(result.inserted)} · updated {toCell(result.updated)} · rejected {toCell(result.rejected)}</span>}
        </div>
      )}

      <StatCards stats={stats} />

      <div className="flex items-center gap-2 text-xs text-muted">
        <span>Columns: {visibleCols.length} of {allCols.length}</span>
        <button onClick={() => setShowAll((s) => !s)} className="rounded border border-ink-700 px-2 py-0.5 hover:text-white">
          {showAll ? "Hide empty" : "Show all"}
        </button>
        {!showAll && allCols.length > populatedCols.length && (
          <span className="text-ink-600">{allCols.length - populatedCols.length} empty columns hidden</span>
        )}
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {loading ? <div className="text-sm text-muted">loading…</div> : detail && (
          <DataTable columns={visibleCols} rows={detail.rows} showRowNumbers onRowClick={setDrawerRow} rowKey={(r) => toCell(r.id)} />
        )}
      </div>

      {drawerRow && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/50" onClick={() => setDrawerRow(null)} />
          <div className="w-[560px] max-w-full overflow-y-auto border-l border-ink-700 bg-ink-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{open.entity === "companies" ? toCell(drawerRow.name) : `${toCell(drawerRow.first_name)} ${toCell(drawerRow.last_name)}`}</div>
              <button className="text-muted hover:text-white" onClick={() => setDrawerRow(null)}>✕</button>
            </div>
            <div>
              {Object.entries(drawerRow).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 border-b border-ink-800 py-1 text-xs">
                  <div className="w-40 shrink-0 text-muted">{k}</div>
                  <div className="flex-1 break-words text-[#e6edf3]">{v == null || v === "" ? <span className="text-ink-600">—</span> : toCell(v)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
