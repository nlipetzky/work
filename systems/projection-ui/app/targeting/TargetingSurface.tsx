"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactChip } from "@/app/system/[constellation]/[slug]/AssemblerActions";
import type { TargetingSystem, TargetingEngagement, TargetingArtifact, ArtifactState } from "@/lib/queries/targeting";

// The Targeting (signal-targeting) console — the INPUT side of list-building. Governs the fundamental
// artifacts that define + drive a list build: produce (shared engine) -> rules-gate -> judge ->
// read-before-approve -> SME sign-off. Output feeds the revops-engine; the records/runs/duplicates/
// gaps/staging tabs manage the result.

const SME_SLUG = "will-rosellini";
const EXPERT_NAME: Record<string, string> = { marketing: "Nick", legal: "Will" };
function mark(s: ArtifactState) { return s === "approved" ? "✓" : s === "draft" ? "○" : "·"; }
function tone(s: ArtifactState) { return s === "approved" ? "text-ok" : s === "draft" ? "text-warn" : "text-ink-600"; }

function ProduceArtifactButton({ et, eid, artifactType, blocked }: { et: string; eid: string; artifactType: string; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true); setMsg("producing… (produce → rules-gate → judge, up to a minute)");
    try {
      const j = await fetch("/api/targeting/produce", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid, artifact_type: artifactType }),
      }).then((r) => r.json());
      if (j.needsKey) setMsg("Needs ANTHROPIC_API_KEY to produce.");
      else if (j.blocked) setMsg("Blocked / needs input — see what it recorded below.");
      else if (j.ok) setMsg("Produced. Refreshing…");
      else setMsg(`Run: ${(j.output || j.error || "no output").slice(0, 200)}`);
      router.refresh();
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={run} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "producing…" : "▸ Produce / re-produce"}
      </button>
      {blocked && <span className="text-[11px] text-warn">input contract not fully approved</span>}
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

function CritiqueButton({ et, eid, artifactType, has }: { et: string; eid: string; artifactType: string; has: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true); setMsg("the deepline list-builder is reviewing for buildability…");
    try {
      const j = await fetch("/api/targeting/critique", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid, artifact_type: artifactType }),
      }).then((r) => r.json());
      if (j.needsKey) setMsg("Needs ANTHROPIC_API_KEY.");
      else if (j.ok) setMsg("Review done. Refreshing…");
      else setMsg(`Run: ${(j.output || j.error || "no output").slice(0, 160)}`);
      router.refresh();
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={run} disabled={busy}
        className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 text-[11px] text-muted hover:text-white disabled:opacity-50">
        {busy ? "reviewing…" : has ? "↻ Re-review (deepline)" : "▸ Expert review (deepline)"}
      </button>
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

function sevTone(s: string) { return s === "blocker" ? "border-bad/40 text-bad" : s === "major" ? "border-warn/40 text-warn" : "border-ink-600 text-muted"; }

function CritiquePanel({ critique }: { critique: NonNullable<TargetingArtifact["critique"]> }) {
  const [showDoctrine, setShowDoctrine] = useState(false);
  const vTone = critique.verdict === "buildable" ? "text-ok" : critique.verdict === "not-buildable" ? "text-bad" : "text-warn";
  return (
    <div className="rounded border border-ink-700 bg-ink-950 p-2.5">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-semibold uppercase tracking-wider text-accent">Deepline craft review</span>
        <span className={vTone}>● {critique.verdict}</span>
        <span className="text-ink-600">{critique.subscription_aware ? "deepline CLI present" : "knowledge-only"}</span>
      </div>
      {critique.summary && <p className="mb-2 text-[11px] text-[#cdd9e5]">{critique.summary}</p>}
      <ul className="space-y-1.5">
        {critique.pushback.map((p, i) => (
          <li key={i} className="text-[11px]">
            <span className={`rounded border px-1 py-0.5 text-[10px] ${sevTone(p.severity)}`}>{p.severity}</span>{" "}
            <span className="text-ink-600">({p.dimension})</span> <span className="text-[#cdd9e5]">{p.issue}</span>
            <div className="pl-3 text-[10px] text-ink-600">fix: {p.fix}{p.providers ? ` · providers: ${p.providers}` : ""}</div>
          </li>
        ))}
      </ul>
      {critique.doctrine_updates.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowDoctrine(!showDoctrine)} className="text-[10px] text-accent hover:underline">
            {showDoctrine ? "▾" : "▸"} {critique.doctrine_updates.length} proposed doctrine update(s)
          </button>
          {showDoctrine && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[10px] text-ink-600">
              {critique.doctrine_updates.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}
      <p className="mt-2 text-[10px] text-ink-600">The pushback is folded into the drafting source ... press Produce / re-produce to optimize against it.</p>
    </div>
  );
}

function RequestExpertButton({ artifactId }: { artifactId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function send() {
    setBusy(true); setErr(null);
    try {
      const j = await fetch("/api/outreach/request-expert-approval", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ artifact_id: artifactId, expert_slug: SME_SLUG }),
      }).then((r) => r.json());
      if (!j.ok) setErr(j.error || "failed"); else router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={send} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "routing…" : "▸ Send to Will for review (via Hermes)"}
      </button>
      {err && <span className="text-[11px] text-bad">{err}</span>}
    </span>
  );
}

function ExpertReviewState({ review }: { review: NonNullable<TargetingArtifact["expert_review"]> }) {
  const label: Record<string, string> = {
    drafted: "Queued for Will in Expert Liaison ... Hermes packages the batch before it sends",
    sent: "Sent to Will ... awaiting reply",
    answered: "Will replied ... review the answer in Expert Liaison",
    closed: "Closed",
  };
  const t = review.status === "answered" ? "text-ok" : review.status === "sent" ? "text-warn" : "text-ink-600";
  return (
    <span className="text-[11px]">
      <span className={t}>● {label[review.status] ?? review.status}</span>{" "}
      <a href="/expert-liaison" className="text-accent underline hover:opacity-80">open Expert Liaison →</a>
    </span>
  );
}

function NoteBox({ et, eid, artifactType, notes }: { et: string; eid: string; artifactType: string; notes: TargetingArtifact["notes"] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  async function add() {
    if (!text.trim()) return;
    setBusy(true); setMsg("saving + folding into the source…");
    try {
      const j = await fetch("/api/targeting/note", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid, artifact_type: artifactType, note: text }),
      }).then((r) => r.json());
      if (!j.ok) setMsg(j.error || "failed");
      else { setText(""); setMsg("saved + folded in. Press Produce / re-produce to incorporate it."); router.refresh(); }
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <div className="rounded border border-ink-700 bg-ink-900/40 p-2.5">
      <button onClick={() => setOpen(!open)} className="text-[10px] font-semibold uppercase tracking-wider text-muted hover:text-white">
        {open ? "▾" : "▸"} Expert input{notes.length ? ` · ${notes.length} note(s)` : ""} <span className="font-normal normal-case text-ink-600">— context the AI lacks; folds into the next produce</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {notes.length > 0 && (
            <ul className="space-y-1">
              {notes.map((n, i) => (
                <li key={i} className="text-[11px] text-[#cdd9e5]"><span className="text-ink-600">({n.author})</span> {n.note}</li>
              ))}
            </ul>
          )}
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
            placeholder='e.g. "Patents aren&apos;t a blocker — watch USPTO PatentsView for filings in our tech classes, resolve assignee → company, then enrich."'
            className="w-full rounded border border-ink-700 bg-ink-950 p-2 text-[11px] text-[#cdd9e5] placeholder:text-ink-600" />
          <div className="flex items-center gap-2">
            <button onClick={add} disabled={busy || !text.trim()}
              className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
              {busy ? "saving…" : "Add note"}
            </button>
            {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ArtifactRow({ et, eid, art, contractMet }: { et: string; eid: string; art: TargetingArtifact; contractMet: boolean }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-900/40 p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className={`text-[11px] ${tone(art.state)}`}>{mark(art.state)}</span>
        <span className="text-[12px] font-semibold text-[#e6edf3]">{art.artifact_type}</span>
        <span className="text-[11px] text-ink-600">{art.state}{art.version ? ` v${art.version}` : ""}</span>
        {art.required_expertise.length > 0 && (
          <span className="ml-auto flex gap-1">
            {art.required_expertise.map((x) => (
              <span key={x} className="rounded border border-ink-700 px-1.5 py-0.5 text-[10px] text-muted">certifies: {x}{EXPERT_NAME[x] ? ` · ${EXPERT_NAME[x]}` : ""}</span>
            ))}
          </span>
        )}
      </div>
      <p className="mb-2 text-[11px] text-ink-600">{art.role}</p>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <ProduceArtifactButton et={et} eid={eid} artifactType={art.artifact_type} blocked={!contractMet} />
          {art.state !== "gap" && <CritiqueButton et={et} eid={eid} artifactType={art.artifact_type} has={!!art.critique} />}
        </div>
        {art.critique && <CritiquePanel critique={art.critique} />}
        <NoteBox et={et} eid={eid} artifactType={art.artifact_type} notes={art.notes} />
        {art.state === "gap" && art.needs && (
          <div className="rounded border border-warn/30 bg-warn/10 p-2 text-[10px] text-warn">
            <div className="font-semibold">needs input: {art.needs.summary}</div>
            <ul className="mt-1 list-disc pl-4">{art.needs.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
          </div>
        )}
        {art.artifact_id && art.state !== "gap" && (
          <ArtifactChip artifactId={art.artifact_id} label={art.artifact_type} version={art.version} state={art.state as "draft" | "approved"} />
        )}
        {art.artifact_id && art.state !== "gap" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-ink-600">Will</span>
            {art.expert_review ? <ExpertReviewState review={art.expert_review} /> : <RequestExpertButton artifactId={art.artifact_id} />}
          </div>
        )}
      </div>
    </div>
  );
}

function EngagementBlock({ eng }: { eng: TargetingEngagement }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e6edf3]">
        {eng.engagement_id} <span className="text-ink-600">({eng.engagement_type})</span>
        <span className="ml-auto text-[11px] text-muted">{eng.approved}/{eng.total} approved</span>
      </div>

      {/* input contract: the approved marketing canon these hinge on */}
      <div className="mb-3 rounded border border-ink-700 bg-ink-900/40 p-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Input contract {eng.contractMet ? <span className="text-ok">· met</span> : <span className="text-warn">· blocked, needs {eng.missing.join(", ")}</span>}
        </div>
        <ul className="space-y-0.5">
          {eng.contract.map((c) => (
            <li key={c.type} className="flex items-baseline gap-2 text-[11px]">
              <span className={tone(c.state)}>{mark(c.state)}</span>
              <span className="text-[#cdd9e5]">{c.type}</span>
              <span className="text-ink-600">— {c.role}</span>
            </li>
          ))}
          <li className="flex items-baseline gap-2 text-[11px]">
            <span className="text-ok">✓</span>
            <span className="text-[#cdd9e5]">targeting-enrichment-doctrine</span>
            <span className="text-ink-600">— the standard the producers are graded against</span>
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        {eng.artifacts.map((a) => <ArtifactRow key={a.artifact_type} et={eng.engagement_type} eid={eng.engagement_id} art={a} contractMet={eng.contractMet} />)}
      </div>
    </section>
  );
}

export default function TargetingSurface({ system }: { system: TargetingSystem }) {
  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-5">
          <h1 className="text-lg font-semibold text-[#e6edf3]">Targeting <span className="text-ink-600">· signal-targeting</span></h1>
          <p className="mt-1 text-sm text-muted">
            The input side of list-building. Produces the fundamental artifacts that define + drive a list build
            (segment, titles, enrichment spec, the qualify gate), via the same governed machine, hinging on the
            approved marketing canon. Approve here, then the revops-engine builds + enriches; records / runs /
            duplicates / gaps / staging manage the result.
          </p>
          <p className="mt-1 text-[11px] text-ink-600">
            {system.doctrinePresent ? "✓ targeting doctrine loaded" : "· targeting doctrine missing"} ·{" "}
            {system.keyReady ? "✓ engine key ready" : "· engine needs ANTHROPIC_API_KEY"}
          </p>
        </header>
        {system.engagements.length === 0 && <p className="text-sm text-muted">No engagement has the targeting artifacts wired yet.</p>}
        {system.engagements.map((eng) => <EngagementBlock key={`${eng.engagement_type}:${eng.engagement_id}`} eng={eng} />)}
      </div>
    </main>
  );
}
