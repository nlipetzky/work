"use client";

// The daily-protocol runner controls on the Focus view: Start my day → orient + computed
// next-action + ritual flags inline; Triage (N) → the resumable /work/triage route; Close out
// → mirror + log. Atlas proposes here; the writes happen behind the enforced API routes.

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProtocolRun } from "@/lib/protocol/types";

const card: React.CSSProperties = { border: "1px solid #1d2430", background: "#151a23", borderRadius: 12, padding: "16px 18px" };
const btn = (primary?: boolean): React.CSSProperties => ({
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  border: primary ? "1px solid rgba(91,157,255,0.5)" : "1px solid #1d2430",
  background: primary ? "rgba(91,157,255,0.14)" : "#0f141d",
  color: primary ? "#8fbcff" : "#cdd9e5",
});

export default function ProtocolBar() {
  const [run, setRun] = useState<ProtocolRun | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Restore an in-flight run on mount (e.g. after returning from /work/triage).
  useEffect(() => {
    fetch("/api/protocol/active")
      .then((r) => r.json())
      .then((j) => { if (j.ok && j.run) setRun(j.run); })
      .catch(() => {});
  }, []);

  async function start() {
    setBusy("Running the morning protocol…"); setErr(null);
    try {
      const r = await fetch("/api/protocol/run", { method: "POST" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setRun(j.run);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function close() {
    setBusy("Mirroring + logging…"); setErr(null);
    try {
      const r = await fetch("/api/protocol/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ run_id: run!.id }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setRun(j.run);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  const na = run?.next_action ?? null;
  const top = na?.rank?.top ?? null;
  const proposals = run?.triage_proposals ?? [];
  const openProposals = run?.status === "awaiting_triage" ? proposals.length : 0;

  return (
    <section style={{ marginBottom: 26, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* control row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={start} disabled={!!busy} style={btn(true)}>
          {run && run.status !== "done" ? "Re-run morning" : "Start my day"}
        </button>
        {openProposals > 0 && (
          <Link href={`/work/triage?run=${run!.id}`} style={{ ...btn(), textDecoration: "none", display: "inline-block" }}>
            Triage ({openProposals}) →
          </Link>
        )}
        {run?.status === "awaiting_close" && (
          <button onClick={close} disabled={!!busy} style={btn()}>Close out</button>
        )}
        <Link href="/work/plan" style={{ ...btn(), textDecoration: "none", display: "inline-block", marginLeft: "auto" }}>
          Plan your week →
        </Link>
        {busy && <span style={{ fontSize: 12.5, color: "#d29922" }}>{busy}</span>}
        {run?.status === "done" && <span style={{ fontSize: 12.5, color: "#3fb950" }}>logged · session saved</span>}
        {err && <span style={{ fontSize: 12.5, color: "#f85149" }}>{err}</span>}
      </div>

      {/* orient */}
      {run?.orient && (
        <div style={{ ...card, borderColor: "#222b38" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5c6470", marginBottom: 6 }}>Where we left off</div>
          <div style={{ fontSize: 13.5, color: "#cdd9e5", lineHeight: 1.5 }}>{run.orient.where_we_left_off}</div>
        </div>
      )}

      {/* computed next action */}
      {top && na && (
        <div style={{ ...card, border: "1px solid rgba(91,157,255,0.45)", background: "linear-gradient(180deg,#161d29 0%,#141a24 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#5b9dff", fontWeight: 700 }}>Computed next action</span>
            <span style={{ fontSize: 11, color: "#8fbcff" }}>
              score {top.score} · {top.leverage ?? "no-lev"}/{top.wealth_test ?? "?"}
            </span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{top.title}</div>
          <div style={{ fontSize: 13.5, color: "#cdd9e5", lineHeight: 1.55, marginBottom: 12 }}>{na.why_lever}</div>
          {na.rank.overrodeUrgent && (
            <div style={{ fontSize: 12, color: "#d29922", marginBottom: 12 }}>
              ↑ chosen over the more urgent &ldquo;{na.rank.overrodeUrgent.beatTitle}&rdquo; — leverage compounds.
            </div>
          )}
          {na.recent_activity_note && (
            <div style={{ fontSize: 12, color: "#3fb950", marginBottom: 12 }}>
              ✓ factored in: {na.recent_activity_note}
            </div>
          )}
          <div style={{ borderTop: "1px solid #1d2430", paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5c6470", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>First 5 minutes</span>
              {na.produced_by && <span style={{ color: "#8957e5", textTransform: "none", letterSpacing: 0 }}>produced by: {na.produced_by}</span>}
            </div>
            <div style={{ fontSize: 13.5, color: "#e6edf3", lineHeight: 1.55 }}>{na.first_5_minutes}</div>
          </div>
        </div>
      )}

      {/* ritual flags */}
      {run?.flags && run.flags.length > 0 && (
        <div style={{ ...card, borderColor: "rgba(210,153,34,0.3)", background: "rgba(210,153,34,0.04)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#d29922", marginBottom: 8 }}>Ritual flags</div>
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {run.flags.map((f, i) => (
              <li key={i} style={{ fontSize: 13, color: "#cdd9e5", lineHeight: 1.45 }}>{f.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* mirror (after close) */}
      {run?.mirror && (
        <div style={{ ...card }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5c6470", marginBottom: 6 }}>Today&apos;s mirror</div>
          <div style={{ fontSize: 13.5, color: "#cdd9e5", lineHeight: 1.55 }}>{run.mirror}</div>
        </div>
      )}
    </section>
  );
}
