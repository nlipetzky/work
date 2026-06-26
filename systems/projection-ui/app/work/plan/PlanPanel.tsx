"use client";

// Plan Intake panel: type intent → propose run/iterate/build moves against systems → review
// (grouped by mode, foundation first, per-move override) → commit via enforced moves.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanProposal, PlanMove, ProposedIntent, SpineArea, PlanDecision, PlanMode } from "@/lib/planning/types";

const AREAS: SpineArea[] = ["Client engagement", "Prospect engagement", "Infrastructure", "Finance", "Admin", "Personal"];
const card: React.CSSProperties = { border: "1px solid #1d2430", background: "#151a23", borderRadius: 12, padding: "16px 18px" };
const input: React.CSSProperties = { background: "#0f141d", border: "1px solid #1d2430", borderRadius: 6, color: "#e6edf3", padding: "6px 9px", fontSize: 12.5, fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c6470" };
const primaryBtn: React.CSSProperties = { ...input, cursor: "pointer", padding: "9px 16px", color: "#8fbcff", borderColor: "rgba(91,157,255,0.5)", background: "rgba(91,157,255,0.14)", fontWeight: 600 };
const MODE_COLOR: Record<PlanMode, string> = { build: "#3fb950", iterate: "#d29922", run: "#5b9dff" };
const MODE_LABEL: Record<PlanMode, string> = { build: "Build", iterate: "Iterate", run: "Run" };

const PCT_KEYS: (keyof ProposedIntent)[] = ["client_engagement_pct", "prospect_engagement_pct", "infrastructure_pct", "finance_pct", "admin_pct", "personal_pct"];
const PCT_LABEL: Record<string, string> = { client_engagement_pct: "Client", prospect_engagement_pct: "Prospect", infrastructure_pct: "Infra", finance_pct: "Finance", admin_pct: "Admin", personal_pct: "Personal" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={lbl}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 10, color: "#5c6470" }}>{hint}</span>}
    </label>
  );
}

interface Opt { id: string; title?: string; name?: string }
type Row = PlanMove & { approved: boolean };

export default function PlanPanel({ goals }: { goals: Opt[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [intent, setIntent] = useState<ProposedIntent | null>(null);
  const [intentApproved, setIntentApproved] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ committed: number; intent_set: boolean; skipped: string[] } | null>(null);

  async function propose() {
    setBusy("Atlas is resolving this to systems…"); setErr(null); setDone(null);
    try {
      const r = await fetch("/api/plan/propose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      const p = j.proposal as PlanProposal;
      setRows(p.moves.map((m) => ({ ...m, approved: true })));
      setIntent(p.weekly_intent);
      setIntentApproved(!!p.weekly_intent);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function commit() {
    setBusy("Writing to the spine…"); setErr(null);
    const decision: PlanDecision = {
      weekly_intent: intentApproved ? intent : null,
      moves: rows.filter((r) => r.approved).map(({ approved, ...m }) => m),
    };
    try {
      const r = await fetch("/api/plan/commit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(decision) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setDone({ committed: j.committed.length, intent_set: j.intent_set, skipped: j.skipped ?? [] });
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  function patchRow(idx: number, p: Partial<Row>) { setRows((s) => s.map((r, i) => (i === idx ? { ...r, ...p } : r))); }
  function patchIntent(p: Partial<ProposedIntent>) { setIntent((s) => (s ? { ...s, ...p } : s)); }

  if (done) {
    return (
      <div style={{ marginTop: 20 }}>
        <h1 style={{ fontSize: 24, color: "#fff" }}>Plan committed</h1>
        <p style={{ color: "#cdd9e5" }}>
          {done.committed} move(s) written{done.intent_set ? ", weekly intent set" : ""}. Re-run <b>Start my day</b> on Focus to see the new ranking.
        </p>
        {done.skipped.length > 0 && <p style={{ color: "#d29922", fontSize: 13 }}>Skipped: {done.skipped.join("; ")}</p>}
        <button onClick={() => router.push("/work")} style={{ ...primaryBtn, marginTop: 10 }}>← Back to Focus</button>
      </div>
    );
  }

  const sum = intent ? PCT_KEYS.reduce((a, k) => a + (Number(intent[k]) || 0), 0) : 0;
  const approvedCount = rows.filter((r) => r.approved).length + (intentApproved && intent ? 1 : 0);

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ fontSize: 24, color: "#fff", margin: 0 }}>Plan your week</h1>
      <p style={{ color: "#7d8590", fontSize: 13.5, margin: 0 }}>
        Say what you want to happen, in plain language. Atlas resolves it to systems to <b style={{ color: MODE_COLOR.run }}>run</b>, <b style={{ color: MODE_COLOR.iterate }}>iterate</b>, or <b style={{ color: MODE_COLOR.build }}>build</b> — foundation first. You approve what&apos;s right.
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="e.g. Launch CIPO outreach this week — above Upwork and Teknova."
        style={{ ...input, width: "100%", resize: "vertical", fontSize: 14 }} />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={propose} disabled={!!busy || !text.trim()} style={primaryBtn}>{rows.length ? "Re-propose" : "Propose plan"}</button>
        {rows.length > 0 && <button onClick={commit} disabled={!!busy} style={primaryBtn}>Commit {approvedCount} →</button>}
        {busy && <span style={{ fontSize: 12.5, color: "#d29922" }}>{busy}</span>}
        {err && <span style={{ fontSize: 12.5, color: "#f85149" }}>{err}</span>}
      </div>

      {intent && (
        <div style={{ ...card, opacity: intentApproved ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5b9dff", fontWeight: 700 }}>Weekly intent</span>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#7d8590", cursor: "pointer" }}>
              <input type="checkbox" checked={intentApproved} onChange={(e) => setIntentApproved(e.target.checked)} /> set this
            </label>
          </div>
          <div style={{ fontSize: 11.5, color: "#7d8590", marginBottom: 8 }}>% of your attention across the six areas this week (should total ~100):</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {PCT_KEYS.map((k) => (
              <label key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={lbl}>{PCT_LABEL[k]}</span>
                <input type="number" value={Number(intent[k]) || 0} onChange={(e) => patchIntent({ [k]: Number(e.target.value) } as Partial<ProposedIntent>)} style={{ ...input, width: 64 }} />
              </label>
            ))}
            <span style={{ fontSize: 12, color: sum >= 95 && sum <= 105 ? "#3fb950" : "#f85149", alignSelf: "flex-end", paddingBottom: 8 }}>total {sum}</span>
          </div>
          <Field label="Theme (the week's headline)">
            <input value={intent.theme} onChange={(e) => patchIntent({ theme: e.target.value })} placeholder="e.g. Launch CIPO outreach" style={{ ...input, width: "100%" }} />
          </Field>
          <div style={{ fontSize: 12, color: "#7d8590", marginTop: 6 }}>{intent.rationale}</div>
        </div>
      )}

      {(["build", "iterate", "run"] as PlanMode[]).map((mode) => {
        const idxs = rows.map((r, i) => ({ r, i })).filter((x) => x.r.mode === mode);
        if (!idxs.length) return null;
        return (
          <div key={mode} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: MODE_COLOR[mode], fontWeight: 700, marginTop: 6 }}>
              {MODE_LABEL[mode]} {mode === "build" ? "(new systems)" : mode === "iterate" ? "(existing systems)" : "(operate live)"}
            </div>
            {idxs.map(({ r, i }) => (
              <div key={i} style={{ ...card, opacity: r.approved ? 1 : 0.5, borderColor: r.foundational ? "rgba(91,157,255,0.45)" : "#1d2430" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#fff" }}>
                    <span style={{ fontSize: 10, color: MODE_COLOR[mode], marginRight: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>{MODE_LABEL[mode]}</span>
                    {r.system_name}
                    {r.foundational && <span style={{ fontSize: 10, color: "#8fbcff", marginLeft: 8 }}>· foundation</span>}
                    {r.system_status && <span style={{ fontSize: 10, color: "#5c6470", marginLeft: 8 }}>[{r.system_status}]</span>}
                  </div>
                  <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#7d8590", flexShrink: 0, cursor: "pointer" }}>
                    <input type="checkbox" checked={r.approved} onChange={(e) => patchRow(i, { approved: e.target.checked })} /> approve
                  </label>
                </div>
                {r.what_it_does && <div style={{ fontSize: 12.5, color: "#cdd9e5", marginBottom: 4 }}>does: {r.what_it_does}</div>}
                <div style={{ fontSize: 12.5, color: "#cdd9e5", marginBottom: r.dedupe_note ? 4 : 10, lineHeight: 1.45 }}>{r.rationale}</div>
                {r.dedupe_note && <div style={{ fontSize: 12, color: "#d29922", marginBottom: 10 }}>dedupe: {r.dedupe_note}</div>}

                {mode !== "run" && (
                  <>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 8 }}>
                      <Field label="Goal it rolls up to">
                        <select value={r.ladder_goal_id ?? ""} onChange={(e) => patchRow(i, { ladder_goal_id: e.target.value || null })} style={input}>
                          <option value="">(no goal)</option>
                          {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                        </select>
                      </Field>
                      <Field label="Area">
                        <select value={r.area ?? ""} onChange={(e) => patchRow(i, { area: e.target.value as SpineArea })} style={input}>
                          <option value="">(pick area)</option>
                          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Build steps (each becomes a task)">
                      <textarea value={r.steps.join("\n")} onChange={(e) => patchRow(i, { steps: e.target.value.split("\n") })} rows={Math.max(2, r.steps.length)} placeholder="one step per line" style={{ ...input, width: "100%", resize: "vertical" }} />
                    </Field>
                  </>
                )}
                {mode === "run" && (
                  <div style={{ fontSize: 12, color: "#7d8590" }}>operate at: {r.surface ?? "its surface"}</div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
