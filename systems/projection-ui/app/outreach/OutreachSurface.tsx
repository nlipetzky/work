"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactChip } from "@/app/system/[constellation]/[slug]/AssemblerActions";
import type { OutreachSystem, OutreachEngagement, ArtifactState, Sequence } from "@/lib/queries/outreach";

// The Outreach Producer (System M) console — this system's OWN surface. It develops the cold
// offer ladder, then the copy that hinges on it. The machine is visible: the input contract,
// the deterministic pipeline, Produce, and read-before-approve. Not Expert Liaison's surface.

const EXPERT: Record<string, string> = { marketing: "Nick", legal: "Will" };
const PIPELINE = ["load contract", "select", "produce (AI)", "rules-gate", "judge (AI)", "propose", "approve"];

function mark(state: ArtifactState) {
  return state === "approved" ? "✓" : state === "draft" ? "○" : "·";
}
function tone(state: ArtifactState) {
  return state === "approved" ? "text-ok" : state === "draft" ? "text-warn" : "text-ink-600";
}

function ProduceButton({ et, eid, blocked }: { et: string; eid: string; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true); setMsg("producing… the engine runs produce → rules-gate → judge (up to a minute)");
    try {
      const j = await fetch("/api/outreach/produce", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid }),
      }).then((r) => r.json());
      if (j.needsKey) setMsg("Reached the engine, but it needs ANTHROPIC_API_KEY to produce.");
      else if (j.ok) setMsg("Produced. Refreshing…");
      else setMsg(`Run: ${(j.output || j.error || "no output").slice(0, 200)}`);
      router.refresh();
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={run} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "producing…" : "▸ Produce offer ladder"}
      </button>
      {blocked && <span className="text-[11px] text-warn">contract not fully approved — engine will block + name the gap</span>}
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

function OfferStage({ eng }: { eng: OutreachEngagement }) {
  const o = eng.offer;
  return (
    <div className="rounded border border-ink-700 bg-ink-900/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Stage 1 · Offer ladder</span>
        <span className={`text-[11px] ${tone(o.state)}`}>{mark(o.state)} {o.state}{o.version ? ` v${o.version}` : ""}</span>
        {o.required_expertise.length > 0 && (
          <span className="ml-auto flex gap-1">
            {o.required_expertise.map((x) => (
              <span key={x} className="rounded border border-ink-700 px-1.5 py-0.5 text-[10px] text-muted">
                certifies: {x}{EXPERT[x] ? ` · ${EXPERT[x]}` : ""}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* the deterministic pipeline, made visible */}
      <div className="mb-3 flex flex-wrap items-center gap-1 text-[10px] text-ink-600">
        {PIPELINE.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            <span className="rounded bg-ink-800 px-1.5 py-0.5">{s}</span>
            {i < PIPELINE.length - 1 && <span>→</span>}
          </span>
        ))}
      </div>

      {/* input contract */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Input contract {o.contractMet
            ? <span className="text-ok">· met</span>
            : <span className="text-warn">· blocked, needs {o.missing.join(", ")}</span>}
        </div>
        <ul className="space-y-0.5">
          {o.contract.map((c) => (
            <li key={c.type} className="flex items-baseline gap-2 text-[11px]">
              <span className={tone(c.state)}>{mark(c.state)}</span>
              <span className="text-[#cdd9e5]">{c.type}</span>
              <span className="text-ink-600">— {c.role}</span>
            </li>
          ))}
          <li className="flex items-baseline gap-2 text-[11px]">
            <span className="text-ok">✓</span>
            <span className="text-[#cdd9e5]">outreach-offer-doctrine</span>
            <span className="text-ink-600">— the standard the producer is graded against</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <ProduceButton et={eng.engagement_type} eid={eng.engagement_id} blocked={!o.contractMet} />
        {o.state === "gap" && (
          <p className="text-[11px] text-muted">Not produced yet. Press Produce to run the engine.</p>
        )}
        {o.artifact_id && o.state !== "gap" && (
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {o.state === "draft" ? "Draft — read, then approve (the choice is Will/Nick's)" : "Approved — the certified hinge"}
            </div>
            <ArtifactChip artifactId={o.artifact_id} label="outreach-offer-ladder" version={o.version} state={o.state as "draft" | "approved"} />
          </div>
        )}
        {o.artifact_id && o.state !== "gap" && (
          <div className="rounded border border-ink-700 bg-ink-900/40 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Expert sign-off</div>
            <p className="mb-2 text-[11px] text-ink-600">
              The front-end-offer choice and pricing are Will&apos;s call, and the copy commits this in his name. Send it for his review.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-ink-600">Will</span>
              {o.expert_review
                ? <ExpertReviewState review={o.expert_review} expert="Will" />
                : <RequestExpertApprovalButton payload={{ artifact_id: o.artifact_id, expert_slug: "will-rosellini" }} expert="Will" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProduceCopyButton({ et, eid, channel }: { et: string; eid: string; channel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true); setMsg("producing… (produce → rules-gate → judge, up to a minute)");
    try {
      const j = await fetch("/api/outreach/produce-copy", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: et, engagement_id: eid, channel }),
      }).then((r) => r.json());
      if (j.needsKey) setMsg("Needs ANTHROPIC_API_KEY to produce.");
      else if (j.blocked) setMsg("Blocked: the offer ladder must be approved first.");
      else if (j.ok) setMsg("Produced. Refreshing…");
      else setMsg(`Run: ${(j.output || j.error || "no output").slice(0, 200)}`);
      router.refresh();
    } catch (e) { setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={run} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "producing…" : "▸ Produce / re-produce"}
      </button>
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

function ApproveSequenceButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function approve() {
    setBusy(true); setErr(null);
    try {
      const j = await fetch("/api/outreach/confirm-sequence", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sequence_id: id, confirmed_by: "Nick" }),
      }).then((r) => r.json());
      if (!j.ok) setErr(j.error || "approve failed"); else router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={approve} disabled={busy}
        className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-50">
        {busy ? "approving…" : "Approve ✓ (you've read it)"}
      </button>
      {err && <span className="text-[11px] text-bad">{err}</span>}
    </span>
  );
}

function expertName(slug: string | null) {
  if (!slug) return "the expert";
  const first = slug.split("-")[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function RequestExpertApprovalButton({ payload, expert }: { payload: Record<string, unknown>; expert: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function send() {
    setBusy(true); setErr(null);
    try {
      const j = await fetch("/api/outreach/request-expert-approval", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());
      if (!j.ok) setErr(j.error || "failed"); else router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={send} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "routing…" : `▸ Send to ${expert} for review (via Hermes)`}
      </button>
      {err && <span className="text-[11px] text-bad">{err}</span>}
    </span>
  );
}

function ExpertReviewState({ review, expert }: { review: NonNullable<Sequence["expert_review"]>; expert: string }) {
  // When the reply is distributed back from a review packet, the per-item verdict supersedes the
  // bare "answered" label: approved => expert-certified (the binding sign-off); flagged => revise.
  const certified = review.status === "answered" && review.verdict === "approved";
  const flagged = review.status === "answered" && review.verdict === "flagged";
  const label: Record<string, string> = {
    drafted: `Queued for ${expert} in Expert Liaison ... Hermes packages the batch before it sends`,
    sent: `Sent to ${expert} ... awaiting reply`,
    answered: `${expert} replied ... review the answer in Expert Liaison`,
    closed: "Closed",
  };
  const text = certified
    ? `✓ Expert-certified by ${expert}`
    : flagged
      ? `${expert} flagged this ... needs revision`
      : (label[review.status] ?? review.status);
  const tone = certified ? "text-ok" : flagged ? "text-warn" : review.status === "answered" ? "text-ok" : review.status === "sent" ? "text-warn" : "text-ink-600";
  return (
    <div className="text-[11px]">
      <span className={tone}>● {text}</span>{" "}
      <a href="/expert-liaison" className="text-accent underline hover:opacity-80">open Expert Liaison →</a>
      {review.response && <p className="mt-1 rounded border border-ink-700 bg-ink-900/50 p-2 text-[11px] text-[#cdd9e5]">{review.response}</p>}
    </div>
  );
}

function SequenceView({ seq }: { seq: Sequence }) {
  const passed = seq.rules_passed.filter((r) => r.ok).length;
  const expert = expertName(seq.sender_expert_slug);
  return (
    <div className="mt-2 rounded border border-ink-700 bg-ink-950 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={seq.state === "approved" ? "text-ok" : "text-warn"}>
          {seq.state === "approved" ? "✓" : "○"} {seq.state} v{seq.version}
        </span>
        {seq.front_end_offer && <span className="text-ink-600">leads with: {seq.front_end_offer}</span>}
        {seq.sender_expert_slug && <span className="text-ink-600">· sender: {seq.sender_expert_slug}</span>}
      </div>

      {/* the steps + per-line source map (the trail) */}
      <ol className="space-y-2">
        {seq.steps.slice().sort((a, b) => a.order - b.order).map((s) => (
          <li key={s.order} className="rounded border border-ink-800 bg-ink-900/50 p-2">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-ink-600">
              <span className="rounded bg-ink-800 px-1.5 py-0.5 uppercase tracking-wider text-accent">{s.action_type}</span>
              {s.delay_hours > 0 && <span>+{s.delay_hours}h</span>}
              {s.subject && <span className="text-[#cdd9e5]">subj: {s.subject}</span>}
            </div>
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#cdd9e5]">{s.copy}</p>
            {s.source_map?.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 border-l border-ink-800 pl-2">
                {s.source_map.map((m, i) => (
                  <li key={i} className="text-[10px] text-ink-600">
                    <span className="text-muted">“{m.line}”</span> ← {m.source}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {seq.note_variants?.noted && (
        <div className="mt-2 text-[11px] text-ink-600">
          connect-note variants: noted (above){seq.note_variants.noteless ? " + noteless A/B" : ""}
        </div>
      )}

      {/* doctrine-compliance checklist */}
      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Doctrine checklist · {passed}/{seq.rules_passed.length} passed
        </div>
        <div className="flex flex-wrap gap-1">
          {seq.rules_passed.map((r) => (
            <span key={r.name} className={`rounded border px-1.5 py-0.5 text-[10px] ${r.ok ? "border-ok/30 text-ok" : "border-bad/30 text-bad"}`}>
              {r.ok ? "✓" : "✗"} {r.name}
            </span>
          ))}
        </div>
      </div>

      {/* input lineage — the provenance trail: what context produced this */}
      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Produced from (input lineage)</div>
        <ul className="space-y-0.5">
          {seq.inputs.map((inp, i) => (
            <li key={i} className="flex items-baseline gap-2 text-[10px]">
              <span className="w-20 shrink-0 uppercase tracking-wider text-accent">{inp.role}</span>
              <span className={inp.missing ? "text-bad" : "text-[#cdd9e5]"}>
                {inp.artifact_type ? `${inp.artifact_type}${inp.version ? ` v${inp.version}` : ""}` : inp.file}
                {inp.missing ? " (missing)" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {seq.flags.length > 0 && (
        <div className="mt-2 rounded border border-warn/30 bg-warn/10 p-2 text-[10px] text-warn">
          flags: {seq.flags.join("; ")}
        </div>
      )}

      {/* approval: operator + the SME, whose name the copy goes out under */}
      <div className="mt-3 rounded border border-ink-700 bg-ink-900/40 p-2.5">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Approval</div>
        <p className="mb-2 text-[11px] text-ink-600">
          This copy goes out in {expert}&apos;s name, so {expert} must approve it before it can send. Hermes routes it.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-ink-600">operator</span>
            {seq.state === "approved"
              ? <span className="text-[11px] text-ok">✓ approved by you</span>
              : <ApproveSequenceButton id={seq.id} />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-ink-600">{expert}</span>
            {seq.expert_review
              ? <ExpertReviewState review={seq.expert_review} expert={expert} />
              : <RequestExpertApprovalButton payload={{ sequence_id: seq.id }} expert={expert} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelPanel({ et, eid, channel, seq }: { et: string; eid: string; channel: "linkedin" | "email"; seq: Sequence | null }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-900/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e6edf3]">{channel}</span>
        <ProduceCopyButton et={et} eid={eid} channel={channel} />
      </div>
      {seq ? <SequenceView seq={seq} /> : <p className="text-[11px] text-muted">Not produced yet. Press Produce.</p>}
    </div>
  );
}

function CopyStage({ eng }: { eng: OutreachEngagement }) {
  const gated = eng.copyGated;
  return (
    <div className={`rounded border p-3 ${gated ? "border-ink-800 bg-ink-900/20" : "border-accent/30 bg-accent/5"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Stage 2 · Copy</span>
        <span className={`text-[11px] ${gated ? "text-ink-600" : "text-warn"}`}>{gated ? "🔒 locked" : "unlocked"}</span>
      </div>
      {gated ? (
        <p className="text-[11px] text-muted">
          Locked until the offer ladder is approved. Copy must hinge on the <em>approved</em> offer ... it does not
          get produced against an unapproved hinge. Approve Stage 1 to unlock.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-muted">
            Two channels, same machine: each sequence hinges on the approved offer, is gated on its channel doctrine,
            and records its input lineage. Read it, then approve. Nothing sends from here.
          </p>
          <ChannelPanel et={eng.engagement_type} eid={eng.engagement_id} channel="linkedin" seq={eng.sequences.linkedin} />
          <ChannelPanel et={eng.engagement_type} eid={eng.engagement_id} channel="email" seq={eng.sequences.email} />
        </div>
      )}
    </div>
  );
}

export default function OutreachSurface({ system }: { system: OutreachSystem }) {
  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl p-6">
      <header className="mb-5">
        <h1 className="text-lg font-semibold text-[#e6edf3]">Outreach Producer <span className="text-ink-600">· System M</span></h1>
        <p className="mt-1 text-sm text-muted">
          Develops the cold-outreach <strong>offer ladder</strong>, then the <strong>copy</strong> that hinges on it.
          A deterministic engine: code owns the loop, the AI is a called function at produce + judge only, the
          offer doctrine is the gate. Human approves. Nothing is freestyled in chat.
        </p>
        <p className="mt-1 text-[11px] text-ink-600">
          {system.doctrinePresent ? "✓ offer doctrine loaded" : "· offer doctrine missing"} ·{" "}
          {system.keyReady ? "✓ engine key ready" : "· engine needs ANTHROPIC_API_KEY"}
        </p>
      </header>

      {system.engagements.length === 0 && (
        <p className="text-sm text-muted">No engagement has the offer producer wired yet.</p>
      )}

      {system.engagements.map((eng) => (
        <section key={`${eng.engagement_type}:${eng.engagement_id}`} className="mb-6">
          <div className="mb-2 text-sm font-semibold text-[#e6edf3]">
            {eng.engagement_id} <span className="text-ink-600">({eng.engagement_type})</span>
          </div>
          <div className="space-y-3">
            <OfferStage eng={eng} />
            <CopyStage eng={eng} />
          </div>
        </section>
      ))}
      </div>
    </main>
  );
}
