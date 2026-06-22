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
  play_dir: string | null;
}

// Enumerates the play folder so the operator sees ALL context governing a batch
// (playbook, guidance, delivery contract, recipe, classifier bundle) — not just two links.
function PlayContext({ dir }: { dir: string | null }) {
  const [docs, setDocs] = useState<{ path: string; rel: string }[] | null>(null);
  const [show, setShow] = useState(false);
  if (!dir) return null;
  const rel = dir.replace(/^\/Users\/nplmini\/code\/work\/accounts\//, "");
  const toggle = async () => {
    setShow((s) => !s);
    if (!docs) {
      const r = await fetch(`/api/context/list?root=${encodeURIComponent(rel)}&exts=md,json,sql`);
      const j = await r.json();
      setDocs(j.items ?? []);
    }
  };
  return (
    <>
      {" · "}
      <button onClick={toggle} className="text-accent underline">
        {show ? "hide context" : "all context"}
      </button>
      {show && (
        <span className="ml-1">
          {(docs ?? []).map((d) => (
            <a
              key={d.path}
              className="ml-2 text-xs text-muted underline hover:text-white"
              href={`/api/playfile?path=${encodeURIComponent(d.path)}`}
              target="_blank"
              rel="noreferrer"
              title={d.rel}
            >
              {d.path.split("/").slice(-1)[0]}
            </a>
          ))}
          {docs && docs.length === 0 && <span className="ml-2 text-xs text-muted">no docs in play folder</span>}
          {!docs && <span className="ml-2 text-xs text-muted">loading…</span>}
        </span>
      )}
    </>
  );
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
    "prep_qualified", "prep_attention", "prep_flags",
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

// ---- flags (Flag-and-Resolve surface) ---------------------------------------
// prep_flags: jsonb array of work-item flags; prep_attention: scalar roll-up. See
// classifier/flags-v0.sql and practices/agentic-systems/HANDOFF-flag-resolve-system-2026-06-11.md.
interface Flag {
  code: string; type?: string; severity?: string; owner?: string;
  status?: string; rule_ref?: string; detail?: string; confidence?: unknown;
}
function parseFlags(v: unknown): Flag[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as Flag[];
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}
const ATTENTION_STYLE: Record<string, { label: string; cls: string }> = {
  open: { label: "needs you", cls: "bg-warn/15 text-warn" },
  escalated: { label: "decide ▸", cls: "bg-warn/25 text-warn font-semibold" },
  informational: { label: "fyi", cls: "bg-accent/15 text-accent" },
  dropped: { label: "dropped", cls: "bg-bad/10 text-bad/70 line-through" },
  clear: { label: "clear", cls: "bg-ink-800 text-ink-600" },
};
const NEEDS_YOU = new Set(["open", "escalated"]);
function AttentionChip({ value }: { value: unknown }) {
  const s = ATTENTION_STYLE[String(value ?? "")];
  if (!s) return <span className="text-ink-600">—</span>;
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
// resolved flags are de-emphasised (off the attention list); open blockers are loudest.
function flagChipCls(f: Flag) {
  if (f.status === "resolved_by_rule" || f.status === "sme_resolved") return "bg-ink-800 text-ink-500";
  if (f.severity === "blocker") return "bg-bad/15 text-bad";
  return "bg-warn/15 text-warn";
}
function FlagChips({ value }: { value: unknown }) {
  const flags = parseFlags(value);
  if (!flags.length) return <span className="text-ink-600">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((f, i) => (
        <span key={i} className={`rounded px-1.5 py-0.5 text-[11px] ${flagChipCls(f)}`}
          title={`${f.type ?? ""} · ${f.severity ?? ""} · ${f.status ?? ""}${f.rule_ref ? ` · ${f.rule_ref}` : ""}${f.detail ? ` — ${f.detail}` : ""}`}>
          {f.code}
        </span>
      ))}
    </span>
  );
}
const FLAG_TYPE_LABEL: Record<string, string> = { data: "Data", evidence: "Evidence", decision: "Decision" };
const FLAG_STATUS_LABEL: Record<string, string> = {
  open: "open", resolved_by_rule: "resolved by rule", escalated: "escalated to expert", sme_resolved: "resolved by expert",
};
// Drawer section: the row's flags as work items, with owner, status and the load-bearing rule_ref.
function FlagsSection({ row }: { row: Record<string, unknown> }) {
  const flags = parseFlags(row.prep_flags);
  if (!flags.length) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Flags</h4>
        <AttentionChip value={row.prep_attention} />
      </div>
      <div className="space-y-2">
        {flags.map((f, i) => (
          <div key={i} className="rounded border border-ink-700 bg-ink-800 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[11px] ${flagChipCls(f)}`}>{f.code}</span>
              <span className="text-[11px] text-muted">{FLAG_TYPE_LABEL[f.type ?? ""] ?? f.type} · {f.severity}</span>
              {f.owner ? <span className="text-[11px] text-muted">→ {f.owner}</span> : null}
              <span className="ml-auto text-[11px] text-muted">{FLAG_STATUS_LABEL[f.status ?? ""] ?? f.status}</span>
            </div>
            {f.detail ? <div className="mt-1 text-[11px] text-[#e6edf3]">{toCell(f.detail)}</div> : null}
            {f.rule_ref ? <div className="mt-0.5 text-[11px] text-ok">rule: {toCell(f.rule_ref)}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

// Drawer section: the resolver's decision packet (strict 4-section contract). What the operator
// ratifies — assumptions (with rule_refs), evidence, a tentative read + options, and the question.
function ResolutionPacket({ row }: { row: Record<string, unknown> }) {
  const res = row.prep_resolution as
    | { outcome?: string; ai_attempt?: { tentative?: string; confidence?: string; reasoning?: string };
        rule_refs?: string[]; escalation_packet?: { owner?: string; assumptions?: string[]; evidence?: string[]; tentative_read?: string; options?: string[]; question?: string } }
    | null;
  if (!res) return null;
  const p = res.escalation_packet;
  const List = ({ items }: { items?: string[] }) => (
    <ul className="ml-3 list-disc space-y-0.5 text-[11px] text-[#e6edf3]">{(items ?? []).map((x, i) => <li key={i}>{x}</li>)}</ul>
  );
  return (
    <section className="space-y-2 rounded border border-warn/40 bg-warn/5 p-2">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-warn">Decision packet</h4>
        <span className="rounded bg-warn/15 px-1.5 py-0.5 text-[11px] text-warn">{res.outcome}{p?.owner ? ` → ${p.owner}` : ""}</span>
      </div>
      {p?.question ? <div className="rounded border border-ink-700 bg-ink-800 p-2 text-xs font-medium text-white">{p.question}</div> : null}
      {p?.tentative_read ? <div className="text-[11px] text-muted"><span className="text-muted">Lean: </span><span className="text-[#e6edf3]">{p.tentative_read}</span></div> : null}
      {p?.options?.length ? <div><div className="text-[11px] font-semibold text-muted">Options</div><List items={p.options} /></div> : null}
      {p?.evidence?.length ? <div><div className="text-[11px] font-semibold text-muted">Evidence</div><List items={p.evidence} /></div> : null}
      {p?.assumptions?.length ? <div><div className="text-[11px] font-semibold text-muted">Assumptions</div><List items={p.assumptions} /></div> : null}
      {res.rule_refs?.length ? <div className="text-[11px] text-ok">rules: {res.rule_refs.join(" · ")}</div> : null}
      {res.ai_attempt?.reasoning ? <div className="text-[11px] text-muted"><span className="text-muted">Why escalated ({res.ai_attempt.confidence} confidence): </span>{res.ai_attempt.reasoning}</div> : null}
    </section>
  );
}

// ---- evidence verification (verify-runner output) ---------------------------
// prep_verify: jsonb {verdict, mrna_program_on_site, reasoning, sites[{siteType,city,state,country,evidenceUrl}]}
// prep_qualified: boolean — a real NA lab site is evidenced AND mRNA is not contradicted.
const SITE_TYPE_LABEL: Record<string, string> = {
  rnd_wetlab: "R&D wet lab", process_dev: "Process dev", gmp_mfg: "GMP mfg",
  qc_analytical: "QC / analytical", sales_admin: "Office (admin)", unclear: "Unclear",
};
const LAB_TYPES = new Set(["rnd_wetlab", "process_dev", "gmp_mfg"]);
interface VerifyData {
  verdict?: string;
  mrna_program_on_site?: { status?: string; evidence?: string; sourceUrl?: string };
  reasoning?: string;
  sites?: { address?: string; city?: string; state?: string; country?: string; siteType?: string; evidenceUrl?: string }[];
}
function QualifiedChip({ row }: { row: Record<string, unknown> }) {
  const v = row.prep_verify as VerifyData | null;
  if (row.prep_qualified === true) return <span className="rounded bg-ok/15 px-1.5 py-0.5 text-xs font-medium text-ok">qualified ✓</span>;
  if (v?.mrna_program_on_site?.status === "contradicted") return <span className="rounded bg-bad/15 px-1.5 py-0.5 text-xs text-bad">not mRNA</span>;
  if (v?.verdict === "unclear") return <span className="rounded bg-warn/15 px-1.5 py-0.5 text-xs text-warn">unverified</span>;
  if (v?.verdict === "no") return <span className="rounded bg-bad/10 px-1.5 py-0.5 text-xs text-bad/70">no NA lab</span>;
  return <span className="text-ink-600">—</span>;
}
// Drawer section: the evidence behind the qualified verdict — per-site, classified, with the URL each came from.
function VerificationSection({ row }: { row: Record<string, unknown> }) {
  const v = row.prep_verify as VerifyData | null;
  if (!v) return null;
  const prog = v.mrna_program_on_site || {};
  const sites = v.sites || [];
  const progCls = prog.status === "confirmed" ? "text-ok" : prog.status === "contradicted" ? "text-bad" : "text-muted";
  return (
    <section className="space-y-2 rounded border border-ink-700 bg-ink-800 p-2">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Verification — evidence</h4>
        <span className={`rounded px-1.5 py-0.5 text-[11px] ${row.prep_qualified ? "bg-ok/15 text-ok" : v.verdict === "unclear" ? "bg-warn/15 text-warn" : "bg-bad/10 text-bad/70"}`}>
          {row.prep_qualified ? "qualified" : v.verdict === "unclear" ? "unverified" : "not qualified"}
        </span>
      </div>
      <div className="text-[11px]">
        <span className="text-muted">mRNA program: </span>
        <span className={progCls}>{prog.status || "—"}</span>
        {prog.sourceUrl ? <> · <a className="text-accent underline" href={prog.sourceUrl} target="_blank" rel="noreferrer">source</a></> : null}
      </div>
      {v.reasoning ? <div className="text-[11px] text-muted">{v.reasoning}</div> : null}
      {sites.length ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-muted">North American sites</div>
          {sites.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className={`rounded px-1 py-0.5 ${LAB_TYPES.has(s.siteType ?? "") ? "bg-ok/15 text-ok" : "bg-ink-700 text-muted"}`}>{SITE_TYPE_LABEL[s.siteType ?? ""] ?? s.siteType}</span>
              <span className="text-[#e6edf3]">{[s.city, s.state].filter(Boolean).join(", ")}{s.country && !["United States", "Canada", "Mexico"].includes(s.country) ? ` · ${s.country}` : ""}</span>
              {s.evidenceUrl ? <a className="ml-auto shrink-0 text-accent underline" href={s.evidenceUrl} target="_blank" rel="noreferrer">evidence</a> : null}
            </div>
          ))}
        </div>
      ) : <div className="text-[11px] text-muted">No North American lab site evidenced.</div>}
    </section>
  );
}

// ---- verification drawer ----------------------------------------------------
// The input fields the classifier actually reads to reach a verdict (self-description + SME gold).
const VERIFY_INPUTS = [
  // mRNA/Apollo-era fields
  "description", "keywords", "industry",
  // ngAbs/Explorium-era fields
  "biotech_modality_types", "biotech_role", "company_focus", "explorium_company_focus",
  "explorium_business_description", "explorium_company_product_development",
  "classification_notes", "client_sme_note", "strategic_notes",
];
const CRITERIA_ORDER = [
  "C1_core", "C2_conjugate", "C3_fragment_only",
  "N1_fusion", "N2_peg_enzyme", "N3_car", "N4_aav", "F1_fill_finish",
];
const VERDICT_LABEL: Record<string, { label: string; pill: string }> = {
  IN: { label: "In scope — a fit", pill: "bg-ok/15 text-ok" },
  NARROW: { label: "Narrow fit (lower priority)", pill: "bg-warn/15 text-warn" },
  OUT: { label: "Not a fit", pill: "bg-bad/15 text-bad" },
  NEEDS_REVIEW: { label: "Needs a look", pill: "bg-warn/15 text-warn" },
};
const CRITERIA_LABELS: Record<string, string> = {
  C1_core: "Core modality (bispecific / multispecific / ADC)",
  C2_conjugate: "Conjugate subclass (AOC / RDC / immunocytokine)",
  C3_fragment_only: "Fragment-only (disqualifies)",
  N1_fusion: "Fusion protein only (disqualifies)",
  N2_peg_enzyme: "PEGylated enzyme (disqualifies)",
  N3_car: "CAR cell therapy (disqualifies)",
  N4_aav: "AAV gene therapy (disqualifies)",
  F1_fill_finish: "Fill-finish only (narrow fit)",
};
const VERIFY_FIELD_LABELS: Record<string, string> = {
  biotech_modality_types: "Modalities (claimed)", biotech_role: "Company role",
  company_focus: "Company focus", explorium_company_focus: "Company focus (alt source)",
  explorium_business_description: "Business description",
  explorium_company_product_development: "Product development",
  classification_notes: "Classification notes", client_sme_note: "Client expert note",
  strategic_notes: "Strategic notes",
  description: "Business description", keywords: "Keywords", industry: "Industry",
};
function resultYesNo(r: unknown) {
  const s = String(r ?? "").toLowerCase();
  if (s === "pass") return { txt: "yes", cls: "text-[#e6edf3]" };
  if (s === "fail") return { txt: "no", cls: "text-muted" };
  return { txt: "n/a", cls: "text-ink-600" };
}
function confidencePlain(c: unknown) {
  const s = String(c ?? "").toUpperCase();
  return s === "MED" ? "medium confidence" : s ? `${s.toLowerCase()} confidence` : "";
}
function parseCriteria(c: unknown): Record<string, { result?: string; evidence?: string }> | null {
  if (!c) return null;
  if (typeof c === "string") { try { return JSON.parse(c); } catch { return null; } }
  if (typeof c === "object") return c as Record<string, { result?: string; evidence?: string }>;
  return null;
}

// What was used to decide, and the outcome — plain English, not a repeat of the table.
function VerificationDrawer({ row }: { row: Record<string, unknown> }) {
  const criteria = parseCriteria(row.prep_criteria);
  const verified = row.prep_verified === true || row.prep_verified === "true";
  const v = VERDICT_LABEL[String(row.prep_verdict).toUpperCase()] ?? { label: toCell(row.prep_verdict) || "—", pill: "bg-ink-800 text-muted" };
  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-sm font-semibold ${v.pill}`}>{v.label}</span>
        {row.prep_confidence ? <span className="text-muted">{confidencePlain(row.prep_confidence)}</span> : null}
        {verified
          ? <span className="rounded bg-ink-800 px-1.5 py-0.5 text-muted">confirmed</span>
          : <span className="rounded bg-warn/15 px-1.5 py-0.5 text-warn">needs more evidence</span>}
      </div>

      {row.prep_rationale ? (
        <div className="rounded border border-ink-700 bg-ink-800 p-2 text-[#e6edf3]">{toCell(row.prep_rationale)}</div>
      ) : null}

      {criteria && (
        <section>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">How it was judged</h4>
          <div className="space-y-1">
            {/* ngAbs criteria keep their curated order; any other play (mRNA, …) renders its own keys
                with a humanised fallback label so the section is never empty for a new play. */}
            {[...CRITERIA_ORDER.filter((k) => criteria[k]), ...Object.keys(criteria).filter((k) => !CRITERIA_ORDER.includes(k))].map((k) => {
              const yn = resultYesNo(criteria[k]?.result);
              return (
                <div key={k} className="border-b border-ink-800 py-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`w-8 shrink-0 font-medium ${yn.cls}`}>{yn.txt}</span>
                    <span className="text-muted">{CRITERIA_LABELS[k] ?? k.replace(/_/g, " ")}</span>
                  </div>
                  {criteria[k]?.evidence ? <div className="pl-10 text-muted">{criteria[k]?.evidence}</div> : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">What we looked at</h4>
        <div>
          {VERIFY_INPUTS.filter((f) => row[f] != null && String(row[f]).trim() !== "" && String(row[f]).trim().toLowerCase() !== "none").map((f) => (
            <div key={f} className="flex items-start gap-2 border-b border-ink-800 py-1">
              <div className="w-40 shrink-0 text-muted">{VERIFY_FIELD_LABELS[f] ?? f}{f === "client_sme_note" ? <span className="ml-1 text-ok">★ gold</span> : null}</div>
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
// Plain-English presentation for the contact screen — no status codes or section refs.
// "eligible" = company fit + role fit ONLY. LinkedIn (§6.1) and CRM (§6.2) are still pending,
// so it is NOT "ready for outreach" — a good match is not a cleared lead. Cleared-for-outreach is
// reserved for when those gates also pass (not wired yet), so nothing reaches it today.
const CONTACT_STATUS: Record<string, { label: string; tone: string; pill: string }> = {
  eligible: { label: "Good match — not yet cleared", tone: "text-accent", pill: "bg-accent/15 text-accent" },
  needs_review: { label: "Needs a look", tone: "text-warn", pill: "bg-warn/15 text-warn" },
  disqualified_company: { label: "Skipped — company isn’t a fit", tone: "text-bad", pill: "bg-bad/15 text-bad" },
  out_of_scope_title: { label: "Skipped — not a role we target", tone: "text-bad", pill: "bg-bad/15 text-bad" },
};
function companyFitPlain(v: unknown) {
  const s = String(v ?? "").toUpperCase();
  if (s === "IN") return "a fit";
  if (s === "NARROW") return "a fit (lower priority)";
  if (s === "OUT") return "not a fit";
  if (s === "NEEDS_REVIEW") return "still under review";
  return "not in the reviewed set";
}
const CONTACT_FIELD_LABELS: Record<string, string> = {
  title: "Role / title", role_segment: "Role group", company_name: "Company",
  company_domain: "Company website", email: "Email", email_verified_status: "Email status",
  linkedin_url: "LinkedIn", employment_verification: "Employment check", country: "Country",
};

// What was used to decide, and the outcome — in plain English, not a repeat of the table.
function ContactVerificationDrawer({ row }: { row: Record<string, unknown> }) {
  const checks = String(row.prep_contact_checks ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  const st = CONTACT_STATUS[String(row.prep_contact_status)] ?? { label: toCell(row.prep_contact_status) || "—", tone: "text-muted", pill: "bg-ink-800 text-muted" };
  const route = String(row.prep_route_status ?? "");
  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-sm font-semibold ${st.pill}`}>{st.label}</span>
        {row.prep_contact_company_verdict ? <span className="text-muted">Company is {companyFitPlain(row.prep_contact_company_verdict)}</span> : null}
      </div>

      {row.prep_contact_reason ? (
        <div className="rounded border border-ink-700 bg-ink-800 p-2 text-[#e6edf3]">{toCell(row.prep_contact_reason)}</div>
      ) : null}

      {checks.length ? (
        <section>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Checks</h4>
          <div className="space-y-1">
            {checks.map((c, i) => {
              const pending = /not checked|not yet|pending/i.test(c);
              return <div key={i} className={pending ? "text-warn" : "text-[#e6edf3]"}>{c}{pending ? " (pending)" : ""}</div>;
            })}
          </div>
        </section>
      ) : null}

      {route ? (
        <section>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">Company match</h4>
          <div className={route === "review" ? "text-warn" : route === "matched" ? "text-ok" : "text-muted"}>
            {route === "review" ? "Needs review" : route === "matched" ? `Matched to ${toCell(row.prep_routed_company)}` : "Looks correct"}
          </div>
          {row.prep_route_note ? <div className="text-muted">{toCell(row.prep_route_note)}</div> : null}
        </section>
      ) : null}

      <section>
        <h4 className="mb-1 font-semibold uppercase tracking-wide text-muted">What we looked at</h4>
        <div>
          {CONTACT_INPUTS.filter((f) => row[f] != null && String(row[f]).trim() !== "").map((f) => (
            <div key={f} className="flex items-start gap-2 border-b border-ink-800 py-1">
              <div className="w-40 shrink-0 text-muted">{CONTACT_FIELD_LABELS[f] ?? f}</div>
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
  const [onlyAttention, setOnlyAttention] = useState(false);

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
    const r = await fetch(`/api/staging?preview=${encodeURIComponent(b.table_name)}&limit=5000`);
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
  const attnCount = (k: string) => rows.filter((r) => String(r.prep_attention ?? "") === k).length;
  const stats = open.entity === "companies"
    ? [
        { label: "Companies", value: rows.length },
        { label: "Needs you", value: attnCount("open") + attnCount("escalated"), tone: "warn" as const },
        { label: "FYI (ruled)", value: attnCount("informational"), tone: "default" as const },
        { label: "Clear", value: attnCount("clear"), tone: "ok" as const },
        { label: "Has domain", value: rows.filter((r) => r.domain).length, tone: "default" as const },
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
  const hasAttention = rows.some((r) => r.prep_attention != null);
  const needsYouCount = rows.filter((r) => NEEDS_YOU.has(String(r.prep_attention ?? ""))).length;
  const shownRows = onlyAttention ? rows.filter((r) => NEEDS_YOU.has(String(r.prep_attention ?? ""))) : rows;

  // chip renderers for the flag columns; everything else falls back to the default Cell
  const renderCell = (col: string, value: unknown, row: Record<string, unknown>) => {
    if (col === "prep_qualified") return <QualifiedChip row={row} />;
    if (col === "prep_attention") return <AttentionChip value={value} />;
    if (col === "prep_flags") return <FlagChips value={value} />;
    return undefined;
  };

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
          <PlayContext dir={open.play_dir} />
        </div>
        <button disabled={busy} onClick={() => promote(open)} className="ml-auto rounded bg-accent px-4 py-1.5 text-sm text-black hover:bg-accent/80 disabled:opacity-40">
          {busy ? "Promoting…" : "Promote"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-2 text-sm">
          {result.error ? <span className="text-bad">{toCell(result.error)}</span> :
            <span className="text-white">promoted {toCell(result.promoted)} · inserted {toCell(result.inserted)} · updated {toCell(result.updated)} · rejected {toCell(result.rejected)}{result.deduped != null ? <> · deduped {toCell(result.deduped)}</> : null}{result.skipped != null ? <> · skipped {toCell(result.skipped)}</> : null}</span>}
        </div>
      )}

      <StatCards stats={stats} />

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className={detail && detail.rows.length < open.row_count ? "text-warn" : ""}>
          Rows loaded: {detail?.rows.length ?? 0} of {open.row_count}{detail && detail.rows.length < open.row_count ? " — view truncated" : ""}
        </span>
        <span className="text-ink-600">·</span>
        <span>Columns: {visibleCols.length} of {allCols.length}</span>
        <button onClick={() => setShowAll((s) => !s)} className="rounded border border-ink-700 px-2 py-0.5 hover:text-white">
          {showAll ? "Hide empty" : "Show all"}
        </button>
        {!showAll && allCols.length > populatedCols.length && (
          <span className="text-ink-600">{allCols.length - populatedCols.length} empty columns hidden</span>
        )}
        {hasAttention && (
          <button
            onClick={() => setOnlyAttention((s) => !s)}
            className={`rounded border px-2 py-0.5 ${onlyAttention ? "border-warn bg-warn/15 text-warn" : "border-ink-700 hover:text-white"}`}
          >
            {onlyAttention ? "Showing needs-you" : `Only needs-you (${needsYouCount})`}
          </button>
        )}
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {loading ? <div className="text-sm text-muted">loading…</div> : detail && (
          <DataTable columns={visibleCols} rows={shownRows} renderCell={renderCell} showRowNumbers onRowClick={setDrawerRow} rowKey={(r) => toCell(r.id)} rowAccent={(r) => (String(r.prep_attention ?? "") === "open" ? "text-warn font-semibold" : r.prep_verified === true && (r.prep_verdict === "IN" || r.prep_verdict === "NARROW") ? "text-ok font-semibold" : r.prep_contact_status === "eligible" ? "text-accent font-semibold" : undefined)} />
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
            <div className="space-y-4">
              {drawerRow.prep_verify ? <VerificationSection row={drawerRow} /> : null}
              {drawerRow.prep_resolution ? <ResolutionPacket row={drawerRow} /> : null}
              {drawerRow.prep_flags ? <FlagsSection row={drawerRow} /> : null}
              {drawerRow.prep_verdict ? (
                <VerificationDrawer row={drawerRow} />
              ) : drawerRow.prep_contact_status ? (
                <ContactVerificationDrawer row={drawerRow} />
              ) : !drawerRow.prep_flags ? (
                <div>
                  {Object.entries(drawerRow).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2 border-b border-ink-800 py-1 text-xs">
                      <div className="w-40 shrink-0 text-muted">{k}</div>
                      <div className="flex-1 break-words text-[#e6edf3]">{v == null || v === "" ? <span className="text-ink-600">—</span> : toCell(v)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
