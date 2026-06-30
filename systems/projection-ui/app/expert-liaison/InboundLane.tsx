"use client";

// Inbound lane — the triage queue for expert_requests that systems drop in (status='open').
// Each row: open a fresh motion, attach to one of that expert's existing open motions, or
// dismiss. Mutations go through /api/expert-liaison/request, which calls the triage RPCs.
// Modeled on the work/triage queue-with-actions pattern; uses the surface's Tailwind tokens.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Expert, ExpertRequest, Motion, RequestType } from "@/lib/queries/expertLiaison-shared";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  async function run(url: string, payload: Record<string, unknown>, okMsg?: string) {
    setBusy(true); setErr(null); setOk(null);
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.ok) { setErr(j.error ?? "failed"); return false; }
      if (okMsg) setOk(okMsg);
      router.refresh();
      return true;
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); return false; }
    finally { setBusy(false); }
  }
  return { run, busy, err, ok };
}

const TYPE_TONE: Record<RequestType, string> = {
  verdict: "bg-accent/15 text-accent",
  approval: "bg-ok/15 text-ok",
  direction: "bg-warn/15 text-warn",
  learning: "bg-ink-800 text-muted",
  onboarding: "bg-ink-800 text-muted",
};

export default function InboundLane({ requests, experts, motions }: { requests: ExpertRequest[]; experts: Expert[]; motions: Motion[] }) {
  if (!requests.length)
    return <p className="text-sm text-muted">Inbound is empty. When a system needs an expert verdict, approval, or direction, it drops a request here for triage.</p>;
  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-ink-600">
        Open requests from systems, newest first. Triage each: <span className="text-[#cdd9e5]">Open motion</span> to start a fresh goal-bearing exchange, <span className="text-[#cdd9e5]">Attach</span> to fold it into an existing motion for the same expert, or <span className="text-[#cdd9e5]">Dismiss</span>.
      </p>
      <div className="space-y-3">
        {requests.map((r) => (
          <RequestRow key={r.id} r={r} expert={experts.find((e) => e.slug === r.expert_slug) ?? null}
            attachable={motions.filter((m) => m.expert_slug === r.expert_slug)} />
        ))}
      </div>
    </div>
  );
}

function RequestRow({ r, expert, attachable }: { r: ExpertRequest; expert: Expert | null; attachable: Motion[] }) {
  const { run, busy, err, ok } = useAction();
  const [attachTo, setAttachTo] = useState("");
  const U = "/api/expert-liaison/request";

  return (
    <section className="rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-4 py-2.5">
        <span className={`rounded px-2 py-0.5 text-[9px] uppercase tracking-wider ${TYPE_TONE[r.request_type] ?? "bg-ink-800 text-muted"}`}>{r.request_type}</span>
        <span className="text-[13px] text-[#cdd9e5]">{r.subject ?? "(no subject)"}</span>
        {(r.engagement_type || r.engagement_id) && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{r.engagement_type ?? "?"} · {r.engagement_id ?? "?"}</span>
        )}
        <span className="ml-auto text-[10px] text-ink-600">{expert ? expert.name : (r.expert_slug ?? "unassigned")}</span>
      </div>

      <div className="px-4 py-2.5">
        {r.body && <p className="mb-2 text-[11px] leading-relaxed text-muted whitespace-pre-wrap">{r.body}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-600">
          {r.source_system && <span>source: <span className="text-[#cdd9e5]">{r.source_system}{r.source_ref ? ` · ${r.source_ref}` : ""}</span></span>}
          {r.concerning_system && <span>concerns: <span className="text-[#cdd9e5]">{r.concerning_system}</span></span>}
          {r.target_type && <span>target: <span className="text-[#cdd9e5]">{r.target_type}{r.target_ref ? ` · ${r.target_ref}` : ""}</span></span>}
          {r.goal_key && <span>goal: <span className="text-[#cdd9e5]">{r.goal_key}</span></span>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3">
          <button disabled={busy} onClick={() => run(U, { action: "open_motion", request_id: r.id }, "motion opened — see Motions tab")}
            className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40">
            {busy ? "…" : "Open motion"}
          </button>

          {attachable.length > 0 && (
            <span className="flex items-center gap-1.5">
              <select value={attachTo} onChange={(e) => setAttachTo(e.target.value)}
                className="rounded border border-ink-700 bg-ink-850 px-2 py-1 text-[11px] text-[#cdd9e5] outline-none focus:border-accent">
                <option value="">(attach to motion…)</option>
                {attachable.map((m) => <option key={m.id} value={m.id}>{m.goal ?? m.goal_key ?? m.id.slice(0, 8)}</option>)}
              </select>
              <button disabled={busy || !attachTo} onClick={() => run(U, { action: "attach", request_id: r.id, attach_motion_id: attachTo }, "attached to motion")}
                className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-40">
                Attach
              </button>
            </span>
          )}

          <button disabled={busy} onClick={() => run(U, { action: "dismiss", request_id: r.id }, "dismissed")}
            className="rounded bg-ink-800 px-2.5 py-1 text-[11px] text-muted hover:text-white disabled:opacity-40">
            Dismiss
          </button>

          {ok && <span className="text-[10px] text-ok">{ok}</span>}
          {err && <span className="text-[10px] text-bad">{err}</span>}
        </div>
      </div>
    </section>
  );
}
