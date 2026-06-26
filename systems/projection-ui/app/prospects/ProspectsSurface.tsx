"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProspectsSystem, ProspectEngagement, Prospect } from "@/lib/queries/prospects";

// The Prospect spine — the flywheel front. Signal-sourced companies (free authoritative sources) move
// signal -> qualified. Run the signal watch (free); plan/execute enrichment (deepline, credit-gated).

const STAGE_TONE: Record<string, string> = {
  signal: "text-warn", resolved: "text-accent", screened: "text-accent",
  enriched: "text-accent", qualified: "text-ok", disqualified: "text-ink-600",
};

function WatchButton({ et, eid }: { et: string; eid: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true); setMsg("querying ClinicalTrials.gov / PatentsView for fresh signals…");
    try {
      const j = await fetch("/api/prospects/watch", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid, since_days: 14 }),
      }).then((r) => r.json());
      setMsg(j.ok ? (j.output.match(/prospects spine now holds[^\n]*/)?.[0] || "Done.") : `Run: ${(j.output || "").slice(0, 160)}`);
      router.refresh();
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={run} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "watching…" : "▸ Run signal watch (free)"}
      </button>
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

function EnrichButtons({ et, eid }: { et: string; eid: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run(execute: boolean) {
    setBusy(true); setMsg(execute ? "executing the deepline pipeline…" : "planning…");
    try {
      const j = await fetch("/api/prospects/enrich", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid, execute }),
      }).then((r) => r.json());
      setMsg((j.output || "").split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 220));
      router.refresh();
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={() => run(false)} disabled={busy}
        className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 text-[11px] text-muted hover:text-white disabled:opacity-50">
        {busy ? "…" : "▸ Plan enrichment (free)"}
      </button>
      <button onClick={() => run(true)} disabled={busy}
        className="rounded border border-bad/40 bg-bad/10 px-2 py-0.5 text-[11px] text-bad hover:bg-bad/20 disabled:opacity-50">
        Execute (Deepline · spends credits)
      </button>
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

function signalSummary(p: Prospect): string {
  const s = p.signal || {};
  if (s.type === "clinical-trial") return `trial${s.phase ? ` ${s.phase}` : ""}${s.status ? ` · ${s.status}` : ""}${s.title ? ` · ${s.title}` : ""}`;
  if (s.type === "patent") return `patent${s.date ? ` ${s.date}` : ""}${s.title ? ` · ${s.title}` : ""}`;
  return p.source;
}

function EngagementBlock({ eng }: { eng: ProspectEngagement }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e6edf3]">
        {eng.engagement_id} <span className="text-ink-600">({eng.engagement_type})</span>
        <span className="ml-auto text-[11px] text-muted">{eng.total} prospects</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded border border-ink-700 bg-ink-900/40 p-3">
        <WatchButton et={eng.engagement_type} eid={eng.engagement_id} />
        <EnrichButtons et={eng.engagement_type} eid={eng.engagement_id} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        {Object.entries(eng.byStage).filter(([, n]) => n > 0).map(([s, n]) => (
          <span key={s} className="rounded border border-ink-700 px-2 py-0.5">
            <span className={STAGE_TONE[s] ?? "text-muted"}>{s}</span> <span className="text-ink-600">{n}</span>
          </span>
        ))}
        <span className="text-ink-600">·</span>
        {Object.entries(eng.bySource).map(([s, n]) => (
          <span key={s} className="rounded border border-ink-800 px-2 py-0.5 text-ink-600">{s} {n}</span>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-ink-700">
        <table className="w-full text-[11px]">
          <thead className="bg-ink-900/60 text-ink-600">
            <tr><th className="px-2 py-1 text-left">company</th><th className="px-2 py-1 text-left">stage</th><th className="px-2 py-1 text-left">signal</th></tr>
          </thead>
          <tbody>
            {eng.prospects.map((p) => (
              <tr key={p.id} className="border-t border-ink-800">
                <td className="px-2 py-1 align-top text-[#e6edf3]">{p.company_name}{p.domain ? <span className="text-ink-600"> · {p.domain}</span> : ""}</td>
                <td className="px-2 py-1 align-top"><span className={STAGE_TONE[p.stage] ?? "text-muted"}>{p.stage}</span>{p.verdict ? <span className="text-ink-600"> · {p.verdict}</span> : ""}</td>
                <td className="px-2 py-1 align-top text-ink-600">{signalSummary(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {eng.total > eng.prospects.length && <p className="mt-1 text-[10px] text-ink-600">showing {eng.prospects.length} of {eng.total}</p>}
    </section>
  );
}

export default function ProspectsSurface({ system }: { system: ProspectsSystem }) {
  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-5">
          <h1 className="text-lg font-semibold text-[#e6edf3]">Prospect spine <span className="text-ink-600">· the flywheel front</span></h1>
          <p className="mt-1 text-sm text-muted">
            Signal-sourced companies moving signal → qualified. The signal watch fills this for FREE from
            authoritative sources (ClinicalTrials.gov now; USPTO PatentsView with a free key). Enrichment
            (deepline) advances them toward qualified leads ... that step spends Deepline credits and is gated.
          </p>
        </header>
        {system.engagements.length === 0 && <p className="text-sm text-muted">No prospects yet. Run the signal watch.</p>}
        {system.engagements.map((e) => <EngagementBlock key={`${e.engagement_type}:${e.engagement_id}`} eng={e} />)}
      </div>
    </main>
  );
}
