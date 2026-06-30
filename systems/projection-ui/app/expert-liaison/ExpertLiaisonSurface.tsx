"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GovernedArtifacts, GovernedEngagement, GovernedItem } from "@/lib/queries/governedArtifacts";
import type { SourceAssessmentLedger } from "@/lib/queries/sourceAssessments";
import type { Expert, Exchange, ExpertRequest, Motion } from "@/lib/queries/expertLiaison-shared";
import type { PacketView } from "@/lib/queries/packets";
import { RunButton, ArtifactChip } from "@/app/system/[constellation]/[slug]/AssemblerActions";
import InboundLane from "./InboundLane";
import MotionsBoard from "./MotionsBoard";

type Tab = "inbound" | "motions" | "asks" | "packets" | "ledger" | "experts";
const SELF_SLUG = "nick-lipetzky";

export default function ExpertLiaisonSurface({
  governed, ledger, experts, exchanges, packets, requests, motions,
}: {
  governed: GovernedArtifacts; ledger: SourceAssessmentLedger; experts: Expert[]; exchanges: Exchange[]; packets: PacketView[];
  requests: ExpertRequest[]; motions: Motion[];
}) {
  const [tab, setTab] = useState<Tab>("inbound");
  const totalGaps = governed.engagements.reduce((n, e) => n + e.items.filter((i) => i.state === "gap").length, 0);
  const packetsPending = packets.filter((p) => p.pending.length > 0 || p.packet).length;
  const overdueMotions = motions.filter((m) => m.overdue).length;

  return (
    <div className="h-full overflow-y-auto font-mono">
      <main className="mx-auto max-w-screen-lg px-8 pb-16 pt-8">
        <p className="mb-3 text-xs text-ink-600">expert liaison · canon · the curation console</p>
        <div className="mb-5 rounded-xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Expert Liaison</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#cdd9e5]">
            Curate domain-expert judgment into Canon. Answer what&apos;s yours, ask the expert for the rest, initiate to draft, approve — all here, not in a chat.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-ink-700 pt-3 text-xs text-muted">
            <span><span className="font-semibold text-white">{requests.length}</span> inbound</span>
            <span><span className="font-semibold text-white">{motions.length}</span> motions{overdueMotions > 0 ? <span className="text-warn"> ({overdueMotions} overdue)</span> : null}</span>
            <span><span className="font-semibold text-white">{totalGaps}</span> open gaps</span>
            <span><span className="font-semibold text-white">{exchanges.filter((x) => x.status !== "closed").length}</span> open asks</span>
            <span><span className="font-semibold text-white">{ledger.totalSources}</span> sources assessed</span>
            <span><span className="font-semibold text-white">{experts.length}</span> experts</span>
          </div>
        </div>

        <div className="mb-4 flex gap-1 border-b border-ink-800">
          {([["inbound", `Inbound (${requests.length})`], ["motions", `Motions (${overdueMotions} overdue)`], ["asks", `Asks & Needs (${totalGaps})`], ["packets", `Review packets (${packetsPending})`], ["ledger", "Curation ledger"], ["experts", `Experts (${experts.length})`]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-accent text-white" : "text-muted hover:text-white"}`}>{label}</button>
          ))}
        </div>

        {tab === "inbound" && <InboundLane requests={requests} experts={experts} motions={motions} />}
        {tab === "motions" && <MotionsBoard motions={motions} experts={experts} />}
        {tab === "asks" && <AsksAndNeeds governed={governed} experts={experts} exchanges={exchanges} />}
        {tab === "packets" && <ReviewPackets packets={packets} exchanges={exchanges} />}
        {tab === "ledger" && <Ledger ledger={ledger} />}
        {tab === "experts" && <Experts experts={experts} />}
      </main>
    </div>
  );
}

// generic POST helper -> any console endpoint, then refresh
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

function ownerFor(experts: Expert[], required: string[]): Expert | null {
  if (!required.length) return null;
  return experts.find((e) => e.expertise.some((x) => required.includes(x))) ?? null;
}

// Gmail compose deep-link: opens a prefilled compose window in Gmail web (no OS mail handler
// needed, unlike mailto). Nick reviews and sends from there. For very long bodies (the
// self-contained review email) the server-side draft route is used instead.
function gmailComposeUrl(email: string, subject: string, body: string): string {
  const q = new URLSearchParams({ view: "cm", fs: "1", to: email, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

// textarea that auto-grows to fit its content, so the full text is always readable (no clipping).
function AutoTextarea({ value, onChange, className, placeholder, rows = 1 }: {
  value: string; onChange: (v: string) => void; className: string; placeholder?: string; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }, [value]);
  return (
    <textarea ref={ref} value={value} rows={rows} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} className={`resize-none overflow-hidden ${className}`} />
  );
}

// ---------------------------------------------------------------- Asks & Needs
function AsksAndNeeds({ governed, experts, exchanges }: { governed: GovernedArtifacts; experts: Expert[]; exchanges: Exchange[] }) {
  const active = governed.engagements.filter((e) => e.items.some((i) => i.state === "gap" || i.state === "draft"));
  if (!active.length) return <p className="text-sm text-muted">Nothing open. Every required artifact is approved.</p>;
  return (
    <div className="space-y-6">
      {active.map((e) => (
        <EngagementBlock key={`${e.engagement_type}:${e.engagement_id}`} eng={e} experts={experts}
          exchanges={exchanges.filter((x) => x.engagement_type === e.engagement_type && x.engagement_id === e.engagement_id)} />
      ))}
    </div>
  );
}

function EngagementBlock({ eng, experts, exchanges }: { eng: GovernedEngagement; experts: Expert[]; exchanges: Exchange[] }) {
  const gaps = eng.items.filter((i) => i.state === "gap");
  const drafts = eng.items.filter((i) => i.state === "draft");
  return (
    <section className="rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{eng.engagement_type} · {eng.engagement_id}</span>
        <span className="text-[11px] text-warn">{gaps.length} gap{gaps.length === 1 ? "" : "s"}</span>
        {drafts.length > 0 && <span className="text-[11px] text-accent">{drafts.length} draft{drafts.length === 1 ? "" : "s"} to review</span>}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-ink-600">Initiate = run the Assembler over current source →</span>
          <RunButton engagementType={eng.engagement_type} engagementId={eng.engagement_id} />
        </span>
      </div>
      <div className="px-4 py-2 text-[10px] text-ink-600 border-b border-ink-800">
        How it works: <span className="text-[#cdd9e5]">Answer what&apos;s yours</span> · <span className="text-[#cdd9e5]">Ask the expert for the rest</span> · <span className="text-[#cdd9e5]">Initiate</span> to draft · <span className="text-[#cdd9e5]">Approve</span>
      </div>
      <div className="space-y-3 p-4">
        {drafts.length > 0 && (
          <div className="rounded border border-accent/30 bg-accent/5 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">Drafts — read, then approve</div>
            <div className="flex flex-col gap-1.5">
              {drafts.map((d) => d.artifact_id && (
                <ArtifactChip key={d.artifact_type} artifactId={d.artifact_id} label={d.artifact_type} version={d.version} state="draft" />
              ))}
            </div>
          </div>
        )}
        {gaps.map((g) => <GapEditor key={g.artifact_type} g={g} eng={eng} experts={experts} />)}
        {exchanges.length > 0 && (
          <div className="mt-2 border-t border-ink-800 pt-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Asks sent to experts ({exchanges.length})</div>
            <div className="space-y-2">{exchanges.map((x) => {
              const owner = experts.find((e) => e.slug === x.expert_slug);
              return <ExchangeRow key={x.id} x={x} email={(owner?.contact as { email?: string } | undefined)?.email} />;
            })}</div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---- the inline answer / guide editor (per gap) ----
function GapEditor({ g, eng, experts }: { g: GovernedItem; eng: GovernedEngagement; experts: Expert[] }) {
  const { run, busy, err, ok } = useAction();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<string[]>(g.needs?.questions?.length ? g.needs.questions : [""]);
  const [answers, setAnswers] = useState<string[]>((g.needs?.questions ?? [""]).map(() => ""));
  const [notes, setNotes] = useState("");

  const owner = ownerFor(experts, g.required_expertise);
  const isSelf = !owner || owner.slug === SELF_SLUG;
  const ownerEmail = (owner?.contact as { email?: string } | undefined)?.email;

  function setQ(i: number, v: string) { setQuestions((qs) => qs.map((q, j) => (j === i ? v : q))); }
  function setA(i: number, v: string) { setAnswers((as) => { const n = [...as]; n[i] = v; return n; }); }
  function addQ() { setQuestions((qs) => [...qs, ""]); setAnswers((as) => [...as, ""]); }

  function saveAnswer() {
    run("/api/expert-liaison/answer", {
      engagement_type: eng.engagement_type, engagement_id: eng.engagement_id, artifact_type: g.artifact_type,
      layer: g.layer, questions, answers, notes, needs_summary: g.needs?.summary ?? "",
    }, "saved as source — Initiate to draft");
  }

  function askOwner() {
    if (!owner) return;
    const first = owner.name.split(" ")[0];
    const subject = `Input needed — ${g.artifact_type} (${eng.engagement_id})`;
    const body = [
      `Hi ${first},`, "",
      `To move ${g.artifact_type} forward I need your input:`, "",
      ...questions.filter((q) => q.trim()).map((q, i) => `${i + 1}. ${q}`), "",
      "Short answers are fine.", "", "Thanks,", "Nick",
    ].join("\n");
    run("/api/expert-liaison/exchange", {
      action: "create", expert_slug: owner.slug, engagement_type: eng.engagement_type, engagement_id: eng.engagement_id,
      subject, ask_body: body, artifact_types: [g.artifact_type],
    }, "ask drafted — see 'Asks sent to experts' below");
  }

  return (
    <div className="rounded border border-ink-800 bg-ink-850">
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-2 px-3 py-2.5 text-left">
        <span className="text-warn">·</span>
        <span className="text-[#cdd9e5]">{g.artifact_type}</span>
        <span className={`rounded px-1 text-[9px] uppercase tracking-wider ${isSelf ? "bg-ok/10 text-ok" : "bg-accent/10 text-accent"}`}>
          {isSelf ? "yours to answer" : `${owner?.name.split(" ")[0]} — ${g.required_expertise.join("/")}`}
        </span>
        {!g.source_present && <span className="text-[10px] text-warn">needs source</span>}
        <span className="ml-auto text-[11px] text-ink-600">{open ? "▾" : "▸ answer / guide"}</span>
      </button>
      {open && (
        <div className="border-t border-ink-800 p-3">
          {g.done_when && <div className="mb-1 text-[11px] text-ink-600">done when: {g.done_when}</div>}
          {g.needs?.summary && <div className="mb-2 text-[11px] text-warn">Assembler needs: {g.needs.summary}</div>}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-ink-600">Q{i + 1} (edit to guide)</span>
                </div>
                <AutoTextarea value={q} onChange={(v) => setQ(i, v)}
                  className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-[11px] leading-relaxed text-[#cdd9e5] outline-none focus:border-accent" />
                <AutoTextarea value={answers[i] ?? ""} onChange={(v) => setA(i, v)} rows={2} placeholder="your answer…"
                  className="mt-1 w-full rounded border border-ink-800 bg-ink-900 p-2 text-[11px] leading-relaxed text-[#cdd9e5] outline-none focus:border-accent" />
              </div>
            ))}
            <button onClick={addQ} className="text-[10px] text-accent hover:underline">+ add a question</button>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="extra guidance / notes (optional)…"
              className="w-full rounded border border-ink-800 bg-ink-900 p-2 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button onClick={saveAnswer} disabled={busy}
              className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-40">
              {busy ? "…" : "Save as source"}
            </button>
            {!isSelf && owner && (
              <button onClick={askOwner} disabled={busy}
                className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40"
                title={ownerEmail ? `compose an ask to ${owner.name}` : `set ${owner.name}'s email in Experts to enable the mail link`}>
                Ask {owner.name.split(" ")[0]}
              </button>
            )}
            <span className="font-mono text-[10px] text-ink-600">{g.source_path}</span>
            {ok && <span className="text-[10px] text-ok">{ok}</span>}
            {err && <span className="text-[10px] text-bad">{err}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ExchangeRow({ x, email }: { x: Exchange; email?: string }) {
  const { run, busy, err } = useAction();
  const [body, setBody] = useState(x.body ?? "");
  const [response, setResponse] = useState(x.response ?? "");
  const mailto = email ? gmailComposeUrl(email, x.subject ?? "", body) : null;
  const toneCls = x.status === "answered" ? "bg-ok/15 text-ok" : x.status === "sent" ? "bg-accent/15 text-accent" : x.status === "closed" ? "bg-ink-800 text-ink-600" : "bg-warn/15 text-warn";
  const U = "/api/expert-liaison/exchange";
  return (
    <div className="rounded border border-ink-700 bg-ink-900 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] ${toneCls}`}>{x.status}</span>
        <span className="text-[12px] text-[#cdd9e5]">{x.subject}</span>
        {x.artifact_types.length > 0 && <span className="text-[10px] text-ink-600">covers: {x.artifact_types.join(", ")}</span>}
        <span className="ml-auto flex items-center gap-1.5">
          {mailto && <a href={mailto} target="_blank" rel="noopener noreferrer" className="rounded bg-accent/15 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/25">Open Gmail draft ↗</a>}
          {x.status === "drafted" && <button disabled={busy} onClick={() => run(U, { action: "update", id: x.id, status: "sent" })} className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-muted hover:text-white disabled:opacity-40">Mark sent</button>}
          {x.status === "sent" && <button disabled={busy} onClick={() => run(U, { action: "update", id: x.id, status: "answered", response })} className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-muted hover:text-white disabled:opacity-40">Mark answered</button>}
        </span>
      </div>
      {!email && <p className="mt-1 text-[10px] text-warn">No expert email set — add it in the Experts tab to enable the mail link.</p>}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6}
        className="mt-2 w-full rounded border border-ink-700 bg-ink-850 p-2 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
      <div className="mt-1 flex items-center gap-2">
        <button disabled={busy || body === x.body} onClick={() => run(U, { action: "update", id: x.id, ask_body: body })}
          className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-muted hover:text-white disabled:opacity-30">Save edits</button>
        {err && <span className="text-[10px] text-bad">{err}</span>}
      </div>
      {(x.status === "sent" || x.status === "answered") && (
        <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} placeholder="paste the expert's answer here…"
          className="mt-2 w-full rounded border border-ink-800 bg-ink-850 p-2 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Review packets
function kindLabel(kind: string | null): string {
  if (kind === "outreach-copy-approval") return "outreach copy";
  if (kind === "artifact-expert-review") return "artifact cert";
  if (kind === "artifact-gap-ask") return "gap fill";
  return kind ?? "ask";
}

function ReviewPackets({ packets, exchanges }: { packets: PacketView[]; exchanges: Exchange[] }) {
  if (!packets.length)
    return <p className="text-sm text-muted">No pending asks to package. When you mark items for an expert they collect here, grouped into one communication.</p>;
  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-ink-600">
        One coherent communication per expert ... not N separate &ldquo;read this and reply&rdquo; emails. Package the batch (Hermes composes + self-reviews against the packaging doctrine), read + edit, send, then distribute the reply back so each item&apos;s sign-off lands on /outreach.
      </p>
      <div className="space-y-5">{packets.map((p) => <PacketCard key={p.key} p={p} exchanges={exchanges} />)}</div>
    </div>
  );
}

function PacketCard({ p, exchanges }: { p: PacketView; exchanges: Exchange[] }) {
  const { run, busy, err, ok } = useAction();
  const exById = new Map(exchanges.map((x) => [x.id, x]));
  const packet = p.packet;
  const isDraft = packet?.status === "drafted";
  const isSent = packet?.status === "sent";
  const isAnswered = packet?.status === "answered";

  // editable composed draft (carried into the mail client on send)
  const [subject, setSubject] = useState(packet?.composed_subject ?? "");
  const [pbody, setPbody] = useState(packet?.composed_body ?? "");
  // answer-distribution state
  const [response, setResponse] = useState(packet?.response ?? "");
  const [verdicts, setVerdicts] = useState<Record<string, string>>({});

  // copy-to-clipboard: Nick pastes the plain-text email straight into Gmail by hand.
  const [copied, setCopied] = useState(false);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${pbody}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked; user can select the textarea manually */ }
  }
  const memberIds = packet ? packet.member_exchange_ids : p.pending.map((m) => m.id);
  const judge = (packet?.judge_notes as { final?: { pass?: boolean }; iterations?: number } | undefined);

  return (
    <section className="rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-4 py-2.5">
        <span className="text-sm font-semibold text-white">{p.pending.length || memberIds.length} item{(p.pending.length || memberIds.length) === 1 ? "" : "s"} for {p.expert_name}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{p.engagement_type} · {p.engagement_id}</span>
        {packet && <span className={`rounded px-2 py-0.5 text-[11px] ${isAnswered ? "bg-ok/15 text-ok" : isSent ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn"}`}>{packet.status}</span>}
        <span className="ml-auto flex items-center gap-2">
          {p.pending.length > 0 && (
            <button onClick={() => run("/api/expert-liaison/packet", { action: "package", expert_slug: p.expert_slug, engagement_type: p.engagement_type, engagement_id: p.engagement_id }, "packaged — read + edit below, then send")}
              disabled={busy}
              className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40"
              title={packet ? "re-compose from the current pending asks" : "compose one communication from these asks"}>
              {busy ? "packaging…" : packet ? "Re-package" : "Package"}
            </button>
          )}
        </span>
      </div>

      {/* the pending asks being bundled */}
      <div className="space-y-1.5 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">{packet && !p.pending.length ? "Bundled asks" : "Pending asks to bundle"}</div>
        {(p.pending.length ? p.pending.map((m) => ({ id: m.id, subject: m.subject, kind: m.kind, verdict: m.verdict }))
          : memberIds.map((id) => { const x = exById.get(id); return { id, subject: x?.subject ?? id, kind: (x?.metadata?.kind as string) ?? null, verdict: (x?.metadata?.verdict as string) ?? null }; })
        ).map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted">{kindLabel(m.kind)}</span>
            <span className="text-[#cdd9e5]">{m.subject}</span>
            {m.verdict && <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${m.verdict === "approved" ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>{m.verdict}</span>}
          </div>
        ))}
        {!p.expert_email && <p className="text-[10px] text-warn">No email set for {p.expert_name} — add it in the Experts tab before sending.</p>}
      </div>

      {/* the composed communication (drafted) */}
      {packet && (isDraft || isSent || isAnswered) && (
        <div className="border-t border-ink-800 px-4 py-3">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">The communication</span>
            {packet.doctrine_version && <span className="text-[9px] text-ink-600">doctrine {packet.doctrine_version}</span>}
            {judge?.final && <span className={`text-[9px] ${judge.final.pass ? "text-ok" : "text-warn"}`}>judge {judge.final.pass ? "passed" : "best-effort"} · {judge.iterations} rev</span>}
          </div>
          {isDraft ? (
            <>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded border border-ink-700 bg-ink-850 px-2 py-1 text-[12px] text-[#cdd9e5] outline-none focus:border-accent" />
              <AutoTextarea value={pbody} onChange={setPbody} rows={10}
                className="mt-1 w-full rounded border border-ink-700 bg-ink-850 p-2 text-[11px] leading-relaxed text-[#cdd9e5] outline-none focus:border-accent" />
              <p className="mt-1 text-[10px] text-ink-600">Plain text, paste-ready. Copy it, send from your own mail to {p.expert_email ?? "the expert"}, then Mark sent.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={copyEmail}
                  className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20">
                  {copied ? "copied ✓" : "Copy email"}
                </button>
                <span className="mx-1 text-ink-700">·</span>
                <button disabled={busy} onClick={() => run("/api/expert-liaison/packet", { action: "send", id: packet.id }, "marked sent — all bundled asks advanced")}
                  className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-40"
                  title="after you've sent the email, mark it sent here to advance all bundled asks">Mark sent (advances all {memberIds.length})</button>
                {ok && <span className="text-[10px] text-ok">{ok}</span>}
                {err && <span className="text-[10px] text-bad">{err}</span>}
              </div>
            </>
          ) : (
            <div className="rounded border border-ink-800 bg-ink-850 p-2 text-[11px] leading-relaxed text-[#9fb0c0] whitespace-pre-wrap">{packet.composed_subject}{"\n\n"}{packet.composed_body}</div>
          )}
        </div>
      )}

      {/* distribute the reply back (sent -> answered) */}
      {packet && isSent && (
        <div className="border-t border-ink-800 px-4 py-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">The reply — distribute each item&apos;s outcome</div>
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} placeholder="paste the expert's full reply here…"
            className="w-full rounded border border-ink-800 bg-ink-850 p-2 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
          <div className="mt-2 space-y-1.5">
            {memberIds.map((id) => {
              const x = exById.get(id);
              const v = verdicts[id];
              return (
                <div key={id} className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="min-w-0 flex-1 truncate text-[#cdd9e5]">{x?.subject ?? id}</span>
                  {(["approved", "flagged"] as const).map((opt) => (
                    <button key={opt} onClick={() => setVerdicts((prev) => ({ ...prev, [id]: prev[id] === opt ? "" : opt }))}
                      className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${v === opt ? (opt === "approved" ? "bg-ok/20 text-ok" : "bg-warn/20 text-warn") : "bg-ink-800 text-ink-600 hover:text-white"}`}>{opt}</button>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button disabled={busy} onClick={() => run("/api/expert-liaison/packet", { action: "answer", id: packet.id, response, member_verdicts: Object.fromEntries(Object.entries(verdicts).filter(([, val]) => val)) }, "reply distributed — sign-off lanes updated on /outreach")}
              className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-40">Record reply</button>
            {ok && <span className="text-[10px] text-ok">{ok}</span>}
            {err && <span className="text-[10px] text-bad">{err}</span>}
          </div>
        </div>
      )}

      {packet && isAnswered && packet.response && (
        <div className="border-t border-ink-800 px-4 py-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Reply on record</div>
          <p className="text-[11px] leading-relaxed text-muted whitespace-pre-wrap">{packet.response}</p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Curation ledger
function Ledger({ ledger }: { ledger: SourceAssessmentLedger }) {
  if (!ledger.engagements.length) return <p className="text-sm text-muted">Nothing assessed yet.</p>;
  return (
    <div className="space-y-5">
      <div className="text-[11px] text-ink-600">{ledger.totalSources} sources · {ledger.totalValuable} valuable · {ledger.totalFed} fed to Assembler</div>
      {ledger.engagements.map((e) => (
        <div key={`${e.engagement_type}:${e.engagement_id}`}>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{e.engagement_type} · {e.engagement_id}</span>
            <span className="text-[11px] text-ink-600">{e.sourcesAssessed} assessed · {e.valuable} valuable · {e.fed} fed · {e.artifactsTouched} artifact{e.artifactsTouched === 1 ? "" : "s"}</span>
          </div>
          <div className="rounded border border-ink-700 bg-ink-850">
            {e.rows.map((r, i) => {
              const tone = r.outcome === "valuable" ? "bg-ok/15 text-ok" : r.outcome === "insufficient" || r.outcome === "unclear" ? "bg-warn/15 text-warn" : "bg-ink-800 text-ink-600";
              const fedTo = r.artifact_name ? `${r.artifact_type}${r.artifact_version ? ` v${r.artifact_version}` : ""}` : r.artifact_type;
              return (
                <div key={i} className={`px-3.5 py-2.5 ${i > 0 ? "border-t border-ink-800" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-muted">{r.source_type}</span>
                        <span className="truncate text-[12px] text-[#cdd9e5]" title={r.source_locator ?? r.source_id}>{r.source_locator ?? r.source_id}</span>
                      </div>
                      {r.reasoning && <div className="mt-1 text-[11px] text-ink-600">{r.reasoning}</div>}
                      {fedTo && <div className="mt-1 text-[11px]"><span className="text-ink-600">→ fed </span><span className="text-accent">{fedTo}</span>{r.fed_to_assembler && <span className="ml-1.5 text-[10px] text-ok">✓</span>}</div>}
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] ${tone}`}>{r.outcome}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Experts
function Experts({ experts }: { experts: Expert[] }) {
  if (!experts.length) return <p className="text-sm text-muted">No experts registered.</p>;
  return <div className="space-y-4">{experts.map((e) => <ExpertCard key={e.slug} e={e} />)}</div>;
}

function ExpertCard({ e }: { e: Expert }) {
  const { run, busy, err } = useAction();
  const currentEmail = (e.contact as { email?: string } | undefined)?.email ?? "";
  const [email, setEmail] = useState(currentEmail);
  return (
    <section className="rounded-lg border border-ink-700 bg-ink-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-white">{e.name}</span>
        {e.slug === SELF_SLUG && <span className="rounded bg-ok/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ok">you</span>}
        {e.expertise.map((x) => <span key={x} className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">{x}</span>)}
      </div>
      {e.core_title && <p className="mt-1 text-[12px] text-[#cdd9e5]">{e.core_title}</p>}
      {e.summary && <p className="mt-2 text-[11px] leading-relaxed text-muted">{e.summary}</p>}
      {e.authority_vectors.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {e.authority_vectors.map((v, i) => (
            <div key={i} className="rounded border border-ink-800 bg-ink-850 p-2.5">
              <div className="text-[11px] font-semibold text-[#cdd9e5]">{v.title}</div>
              <ul className="mt-1 space-y-0.5">{v.points.map((p, j) => <li key={j} className="text-[10px] text-ink-600">· {p}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {e.linguistic_dna && <p className="mt-2 text-[10px] italic text-ink-600">voice: {e.linguistic_dna}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3">
        <span className="text-[10px] uppercase tracking-wider text-ink-600">email</span>
        <input value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="expert@example.com" type="email"
          className="rounded border border-ink-700 bg-ink-850 px-2 py-1 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
        <button disabled={busy || email === currentEmail} onClick={() => run("/api/expert-liaison/exchange", { action: "set_contact", slug: e.slug, email })}
          className="rounded bg-accent/15 px-2 py-1 text-[11px] text-accent hover:bg-accent/25 disabled:opacity-30">{busy ? "…" : "Save"}</button>
        <span className="text-[10px] text-ink-600">{e.source_files.length} source file{e.source_files.length === 1 ? "" : "s"}</span>
        {err && <span className="text-[10px] text-bad">{err}</span>}
      </div>
    </section>
  );
}
