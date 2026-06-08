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

// ---- verification drawer ----------------------------------------------------
// The input fields the classifier actually reads to reach a verdict (self-description + SME gold).
const VERIFY_INPUTS = [
  "biotech_modality_types", "biotech_role", "company_focus", "explorium_company_focus",
  "explorium_business_description", "explorium_company_product_development",
  "classification_notes", "client_sme_note", "strategic_notes",
];
const CRITERIA_ORDER = [
  "C1_core", "C2_conjugate", "C3_fragment_only",
  "N1_fusion", "N2_peg_enzyme", "N3_car", "N4_aav", "F1_fill_finish",
];
function verdictTone(v: unknown) {
  const s = String(v ?? "").toUpperCase();
  if (s === "IN") return "text-ok";
  if (s === "OUT") return "text-bad";
  if (s === "NARROW") return "text-warn";
  return "text-muted"; // NEEDS_REVIEW / null
}
function resultTone(r: unknown) {
  const s = String(r ?? "").toLowerCase();
  if (s === "pass") return "text-ok";
  if (s === "fail") return "text-bad";
  return "text-ink-600"; // n/a
}
function parseCriteria(c: unknown): Record<string, { result?: string; evidence?: string }> | null {
  if (!c) return null;
  if (typeof c === "string") { try { return JSON.parse(c); } catch { return null; } }
  if (typeof c === "object") return c as Record<string, { result?: string; evidence?: string }>;
  return null;
}

// Shows what was USED to verify and what came OUT — not a repeat of the table columns.
function VerificationDrawer({ row }: { row: Record<string, unknown> }) {
  const criteria = parseCriteria(row.prep_criteria);
  const verified = row.prep_verified === true || row.prep_verified === "true";
  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm font-semibold ${verdictTone(row.prep_verdict)}`}>{toCell(row.prep_verdict) || "—"}</span>
        {row.prep_confidence ? <span className="rounded bg-ink-800 px-1.5 py-0.5 text-muted">{toCell(row.prep_confidence)}</span> : null}
        {row.prep_role ? <span className="rounded bg-ink-800 px-1.5 py-0.5 text-muted">{toCell(row.prep_role)}</span> : null}
        {verified
          ? <span className="rounded bg-ok/15 px-1.5 py-0.5 font-medium text-ok">✓ verified for play</span>
          : <span className="rounded bg-warn/15 px-1.5 py-0.5 text-warn">unverified{row.prep_needs_evidence ? " · needs evidence" : ""}</span>}
      </div>

      {row.prep_rationale ? (
        <div className="rounded border border-ink-700 bg-ink-800 p-2 text-[#e6edf3]">{toCell(row.prep_rationale)}</div>
      ) : null}

      {criteria && (
        <section>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Verification — per criterion</h4>
          <div className="space-y-1">
            {CRITERIA_ORDER.filter((k) => criteria[k]).map((k) => (
              <div key={k} className="border-b border-ink-800 py-1">
                <div className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-ink-600">{k}</span>
                  <span className={`font-medium ${resultTone(criteria[k]?.result)}`}>{criteria[k]?.result ?? "—"}</span>
                </div>
                {criteria[k]?.evidence ? <div className="ml-32 pl-2 text-muted">{criteria[k]?.evidence}</div> : null}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Records used to verify</h4>
        <div>
          {VERIFY_INPUTS.filter((f) => row[f] != null && String(row[f]).trim() !== "" && String(row[f]).trim().toLowerCase() !== "none").map((f) => (
            <div key={f} className="flex items-start gap-2 border-b border-ink-800 py-1">
              <div className="w-40 shrink-0 text-muted">{f}{f === "client_sme_note" ? <span className="ml-1 text-ok">★</span> : null}</div>
              <div className="flex-1 break-words text-[#e6edf3]">{toCell(row[f])}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---- contact verification drawer -------------------------------------------
const CONTACT_INPUTS = [
  "title", "role_segment", "company_name", "company_domain", "email",
  "email_verified_status", "linkedin_url", "employment_verification", "country",
];
function contactTone(s: unknown) {
  const v = String(s ?? "").toLowerCase();
  if (v === "eligible") return "text-ok";
  if (v === "needs_review") return "text-warn";
  if (v === "disqualified_company" || v === "out_of_scope_title") return "text-bad";
  return "text-muted";
}
function routeTone(s: unknown) {
  const v = String(s ?? "").toLowerCase();
  if (v === "matched") return "text-ok";
  if (v === "review") return "text-warn";
  return "text-muted";
}

// Contact screen view (playbook §4.2/§6/§7): company inheritance + title check + routing,
// the input fields used, and which gates are deferred. Not a repeat of the table columns.
function ContactVerificationDrawer({ row }: { row: Record<string, unknown> }) {
  const checks = String(row.prep_contact_checks ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  const eligible = row.prep_contact_status === "eligible";
  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm font-semibold ${contactTone(row.prep_contact_status)}`}>{toCell(row.prep_contact_status) || "—"}</span>
        {row.prep_contact_company_verdict ? <span className="rounded bg-ink-800 px-1.5 py-0.5 text-muted">company: {toCell(row.prep_contact_company_verdict)}</span> : null}
        {eligible
          ? <span className="rounded bg-ok/15 px-1.5 py-0.5 font-medium text-ok">✓ eligible</span>
          : <span className="rounded bg-warn/15 px-1.5 py-0.5 text-warn">not eligible</span>}
      </div>

      {row.prep_contact_reason ? (
        <div className="rounded border border-ink-700 bg-ink-800 p-2 text-[#e6edf3]">{toCell(row.prep_contact_reason)}</div>
      ) : null}

      {checks.length ? (
        <section>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Screen checks (§4.2/§6/§7)</h4>
          <div className="space-y-1">
            {checks.map((c, i) => {
              const deferred = /defer|database_only/i.test(c);
              return <div key={i} className={deferred ? "text-warn" : "text-[#e6edf3]"}>{c}{deferred ? " ⏳ deferred" : ""}</div>;
            })}
          </div>
        </section>
      ) : null}

      {row.prep_route_status ? (
        <section>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Acquired-routing (§3)</h4>
          <div className={routeTone(row.prep_route_status)}>
            {toCell(row.prep_route_status)}
            {row.prep_routed_company ? ` → ${toCell(row.prep_routed_company)}` : ""}
            {row.prep_routed_domain ? ` (@${toCell(row.prep_routed_domain)})` : ""}
          </div>
          {row.prep_route_note ? <div className="text-muted">{toCell(row.prep_route_note)}</div> : null}
        </section>
      ) : null}

      <section>
        <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Records used to screen</h4>
        <div>
          {CONTACT_INPUTS.filter((f) => row[f] != null && String(row[f]).trim() !== "").map((f) => (
            <div key={f} className="flex items-start gap-2 border-b border-ink-800 py-1">
              <div className="w-40 shrink-0 text-muted">{f}</div>
              <div className="flex-1 break-words text-[#e6edf3]">{toCell(row[f])}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
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
          <DataTable columns={visibleCols} rows={detail.rows} showRowNumbers onRowClick={setDrawerRow} rowKey={(r) => toCell(r.id)} rowAccent={(r) => (r.prep_verified === true || r.prep_contact_status === "eligible" ? "text-ok font-semibold" : undefined)} />
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
            {drawerRow.prep_verdict ? (
              <VerificationDrawer row={drawerRow} />
            ) : drawerRow.prep_contact_status ? (
              <ContactVerificationDrawer row={drawerRow} />
            ) : (
              <div>
                {Object.entries(drawerRow).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 border-b border-ink-800 py-1 text-xs">
                    <div className="w-40 shrink-0 text-muted">{k}</div>
                    <div className="flex-1 break-words text-[#e6edf3]">{v == null || v === "" ? <span className="text-ink-600">—</span> : toCell(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
