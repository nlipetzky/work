"use client";

// Motions board — the open/active goal-bearing exchanges with each expert, grouped by expert
// and sorted by next-action due (overdue flagged warn). Per card: compose an exchange into the
// motion (lands in the asks/packets tabs), follow up, resolve, or escalate. Mutations go through
// /api/expert-liaison/motion -> compose_motion_exchange / advance_motion. Modeled on the
// OperateCockpit card-with-status-and-actions pattern; uses the surface's Tailwind tokens.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Expert, Motion, MotionSatisfaction, MotionStatus } from "@/lib/queries/expertLiaison-shared";
import { matchExpert } from "@/lib/queries/expertLiaison-shared";

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

const SAT_TONE: Record<MotionSatisfaction, string> = {
  none: "bg-ink-800 text-ink-600",
  partial: "bg-warn/15 text-warn",
  full: "bg-ok/15 text-ok",
};
const STATUS_TONE: Record<MotionStatus, string> = {
  open: "bg-warn/15 text-warn",
  active: "bg-accent/15 text-accent",
  parked: "bg-ink-800 text-muted",
  achieved: "bg-ok/15 text-ok",
  abandoned: "bg-ink-800 text-ink-600",
};

function dueLabel(iso: string | null): string {
  if (!iso) return "no clock";
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  const days = Math.round(diffMs / 86_400_000);
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return "due today";
  return `due in ${days}d`;
}

export default function MotionsBoard({ motions, experts }: { motions: Motion[]; experts: Expert[] }) {
  if (!motions.length)
    return <p className="text-sm text-muted">No open motions. Triage an inbound request to open one.</p>;

  // group by expert_slug, preserving the next-action-due sort within each group
  const bySlug = new Map<string, Motion[]>();
  for (const m of motions) {
    const k = m.expert_slug ?? "__unassigned";
    (bySlug.get(k) ?? bySlug.set(k, []).get(k)!).push(m);
  }

  function nameFor(slug: string): string {
    if (slug === "__unassigned") return "Unassigned";
    const direct = experts.find((e) => e.slug === slug);
    if (direct) return direct.name;
    const matched = matchExpert(experts, [slug]);
    return matched?.name ?? slug;
  }

  return (
    <div className="space-y-6">
      <p className="text-[11px] leading-relaxed text-ink-600">
        Open + active motions, grouped by expert, sorted by next-action due. <span className="text-warn">Overdue</span> motions surface first. The ball badge shows who owes the next move.
      </p>
      {[...bySlug.entries()].map(([slug, list]) => (
        <section key={slug}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-white">{nameFor(slug)}</span>
            <span className="text-[10px] text-ink-600">{list.length} motion{list.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-3">
            {list.map((m) => <MotionCard key={m.id} m={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function MotionCard({ m }: { m: Motion }) {
  const { run, busy, err, ok } = useAction();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [lineItemId, setLineItemId] = useState("");
  const U = "/api/expert-liaison/motion";
  const lineItems = m.goal_predicate.line_items ?? [];

  return (
    <section className={`rounded-lg border bg-ink-900 ${m.overdue ? "border-warn/50" : "border-ink-700"}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-4 py-2.5">
        <span className="text-[13px] text-[#cdd9e5]">{m.goal ?? m.goal_key ?? "(untitled motion)"}</span>
        {(m.engagement_type || m.engagement_id) && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{m.engagement_type ?? "?"} · {m.engagement_id ?? "?"}</span>
        )}
        <span className={`rounded px-2 py-0.5 text-[10px] ${STATUS_TONE[m.status] ?? "bg-ink-800 text-muted"}`}>{m.status}</span>
        <span className={`rounded px-2 py-0.5 text-[10px] ${SAT_TONE[m.satisfaction] ?? "bg-ink-800 text-muted"}`}>{m.satisfaction}</span>
        {m.ball_in_court && (
          <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${m.ball_in_court === "expert" ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn"}`}>ball: {m.ball_in_court}</span>
        )}
        <span className={`ml-auto text-[10px] ${m.overdue ? "text-warn" : "text-ink-600"}`}>
          {dueLabel(m.next_action_due)}{m.next_action_kind ? ` · ${m.next_action_kind}` : ""}
        </span>
      </div>

      <div className="px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-600">
          {m.concerning_system && <span>concerns: <span className="text-[#cdd9e5]">{m.concerning_system}</span></span>}
          {m.target_type && <span>target: <span className="text-[#cdd9e5]">{m.target_type}{m.target_ref ? ` · ${m.target_ref}` : ""}</span></span>}
          {m.goal_predicate.rule && <span>rule: <span className="text-[#cdd9e5]">{m.goal_predicate.rule}</span></span>}
        </div>

        {lineItems.length > 0 && (
          <div className="mt-2 space-y-1">
            {lineItems.map((li) => (
              <div key={li.id} className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted">{li.state}</span>
                <span className="text-[#cdd9e5]">{li.ask_label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3">
          <button disabled={busy} onClick={() => setOpen(!open)}
            className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40">
            {open ? "Close compose" : "Compose"}
          </button>
          <button disabled={busy} onClick={() => run(U, { action: "advance", motion_id: m.id }, "followed up — clock advanced")}
            className="rounded bg-ink-800 px-2.5 py-1 text-[11px] text-muted hover:text-white disabled:opacity-40">Follow up</button>
          <button disabled={busy} onClick={() => run(U, { action: "resolve", motion_id: m.id }, "resolved")}
            className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-40">Resolve</button>
          <button disabled={busy} onClick={() => run(U, { action: "escalate", motion_id: m.id }, "escalated")}
            className="rounded border border-warn/40 bg-warn/10 px-2.5 py-1 text-[11px] text-warn hover:bg-warn/20 disabled:opacity-40">Escalate</button>
          {ok && <span className="text-[10px] text-ok">{ok}</span>}
          {err && <span className="text-[10px] text-bad">{err}</span>}
        </div>

        {open && (
          <div className="mt-3 space-y-2 border-t border-ink-800 pt-3">
            {lineItems.length > 0 && (
              <select value={lineItemId} onChange={(e) => setLineItemId(e.target.value)}
                className="w-full rounded border border-ink-700 bg-ink-850 px-2 py-1 text-[11px] text-[#cdd9e5] outline-none focus:border-accent">
                <option value="">(no line item)</option>
                {lineItems.map((li) => <option key={li.id} value={li.id}>{li.ask_label}</option>)}
              </select>
            )}
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="subject…"
              className="w-full rounded border border-ink-700 bg-ink-850 px-2 py-1 text-[12px] text-[#cdd9e5] outline-none focus:border-accent" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="the ask to the expert…"
              className="w-full rounded border border-ink-700 bg-ink-850 p-2 text-[11px] leading-relaxed text-[#cdd9e5] outline-none focus:border-accent" />
            <button disabled={busy || (!subject.trim() && !body.trim())}
              onClick={() => run(U, { action: "compose", motion_id: m.id, subject, body, line_item_id: lineItemId || null }, "exchange drafted — see Asks / Review packets")}
              className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40">
              {busy ? "…" : "Draft exchange"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
