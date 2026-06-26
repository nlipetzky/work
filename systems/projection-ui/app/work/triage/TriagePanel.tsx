"use client";

// The interactive triage core. Atlas pre-computed a verdict + ladder + dedupe per open item;
// Nick approves or overrides per item (default approved), then commits. Writes go through the
// enforced moves behind /api/protocol/triage/commit. Inbox ends empty.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TriageProposal, TriageDecision, PromoteShape, RunStatus, SpineArea } from "@/lib/protocol/types";

const AREAS: SpineArea[] = ["Client engagement", "Prospect engagement", "Infrastructure", "Finance", "Admin", "Personal"];
const card: React.CSSProperties = { border: "1px solid #1d2430", background: "#151a23", borderRadius: 12, padding: "16px 18px" };
const input: React.CSSProperties = { background: "#0f141d", border: "1px solid #1d2430", borderRadius: 6, color: "#e6edf3", padding: "6px 9px", fontSize: 12.5, fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c6470" };

interface Opt { id: string; title?: string; name?: string }

type Row = { approved: boolean; shape: PromoteShape; draft: TriageProposal["draft"] };

export default function TriagePanel({
  runId, status, proposals, goals, projects,
}: { runId: string; status: RunStatus; proposals: TriageProposal[]; goals: Opt[]; projects: Opt[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(proposals.map((p) => [p.item_id, { approved: true, shape: p.shape, draft: { ...p.draft } }])),
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ committed: number; remaining: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function patch(id: string, r: Partial<Row>) { setRows((s) => ({ ...s, [id]: { ...s[id], ...r } })); }
  function patchDraft(id: string, d: Partial<Row["draft"]>) { setRows((s) => ({ ...s, [id]: { ...s[id], draft: { ...s[id].draft, ...d } } })); }

  async function commit() {
    setBusy(true); setErr(null);
    const decisions: TriageDecision[] = Object.entries(rows)
      .filter(([, r]) => r.approved)
      .map(([item_id, r]) => ({ item_id, shape: r.shape, draft: r.draft }));
    try {
      const res = await fetch("/api/protocol/triage/commit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: runId, decisions }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      setResult({ committed: j.committed.length, remaining: j.open_remaining });
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  if (status !== "awaiting_triage" || proposals.length === 0) {
    return (
      <div style={{ marginTop: 20 }}>
        <h1 style={{ fontSize: 24, color: "#fff" }}>Triage</h1>
        <p style={{ color: "#7d8590" }}>Inbox is empty — nothing to triage. {status === "awaiting_close" ? "Close out from Focus." : ""}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ marginTop: 20 }}>
        <h1 style={{ fontSize: 24, color: "#fff" }}>Triage committed</h1>
        <p style={{ color: "#cdd9e5" }}>{result.committed} item(s) processed. Inbox now holds {result.remaining} open item(s).</p>
        <button onClick={() => router.push("/work")} style={{ ...input, cursor: "pointer", padding: "9px 16px", color: "#8fbcff", borderColor: "rgba(91,157,255,0.5)", background: "rgba(91,157,255,0.14)", marginTop: 10 }}>
          ← Back to Focus
        </button>
      </div>
    );
  }

  const approvedCount = Object.values(rows).filter((r) => r.approved).length;

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h1 style={{ fontSize: 24, color: "#fff", margin: 0 }}>Triage inbox · {proposals.length}</h1>
        <button onClick={commit} disabled={busy} style={{ ...input, cursor: "pointer", padding: "9px 16px", color: "#8fbcff", borderColor: "rgba(91,157,255,0.5)", background: "rgba(91,157,255,0.14)", fontWeight: 600 }}>
          {busy ? "Committing…" : `Commit ${approvedCount} →`}
        </button>
      </div>
      {err && <div style={{ color: "#f85149", fontSize: 13 }}>{err}</div>}

      {proposals.map((p) => {
        const r = rows[p.item_id];
        return (
          <div key={p.item_id} style={{ ...card, opacity: r.approved ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "#fff" }}>{p.title}</div>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#7d8590", flexShrink: 0, cursor: "pointer" }}>
                <input type="checkbox" checked={r.approved} onChange={(e) => patch(p.item_id, { approved: e.target.checked })} />
                approve
              </label>
            </div>
            <div style={{ fontSize: 12, color: "#7d8590", marginBottom: 4 }}>
              {p.item_type} · from {p.source}{p.created_by ? ` (${p.created_by})` : ""} · Atlas: <span style={{ color: "#8fbcff" }}>{p.verdict}</span>
              {p.ladder_goal_title ? ` → ${p.ladder_goal_title}` : " → no goal"}
            </div>
            <div style={{ fontSize: 12.5, color: "#cdd9e5", marginBottom: p.dedupe_note ? 4 : 10, lineHeight: 1.45 }}>{p.rationale}</div>
            {p.dedupe_note && <div style={{ fontSize: 12, color: "#d29922", marginBottom: 10 }}>dedupe: {p.dedupe_note}</div>}

            {/* shape + per-shape overrides */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label style={lbl}>shape</label>
              <select value={r.shape} onChange={(e) => patch(p.item_id, { shape: e.target.value as PromoteShape })} style={input}>
                <option value="task">task</option>
                <option value="project">project</option>
                <option value="consider">consider</option>
                <option value="close">close</option>
              </select>

              {r.shape === "task" && (
                <>
                  <select value={r.draft.project_id ?? ""} onChange={(e) => patchDraft(p.item_id, { project_id: e.target.value || null })} style={input}>
                    <option value="">(orphan, no project)</option>
                    {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                  </select>
                  <select value={r.draft.importance ?? "not_important"} onChange={(e) => patchDraft(p.item_id, { importance: e.target.value as Row["draft"]["importance"] })} style={input}>
                    <option value="important">important</option><option value="not_important">not important</option>
                  </select>
                  <select value={r.draft.urgency ?? "not_urgent"} onChange={(e) => patchDraft(p.item_id, { urgency: e.target.value as Row["draft"]["urgency"] })} style={input}>
                    <option value="urgent">urgent</option><option value="not_urgent">not urgent</option>
                  </select>
                </>
              )}
              {r.shape === "project" && (
                <>
                  <select value={r.draft.goal_id ?? ""} onChange={(e) => patchDraft(p.item_id, { goal_id: e.target.value || null })} style={input}>
                    <option value="">(pick a goal)</option>
                    {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                  <select value={r.draft.area ?? ""} onChange={(e) => patchDraft(p.item_id, { area: e.target.value as SpineArea })} style={input}>
                    <option value="">(pick an area)</option>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </>
              )}
              {r.shape === "close" && (
                <select value={r.draft.close_status ?? "deferred"} onChange={(e) => patchDraft(p.item_id, { close_status: e.target.value as Row["draft"]["close_status"] })} style={input}>
                  <option value="deferred">deferred</option><option value="resolved">resolved</option><option value="dismissed">dismissed</option>
                </select>
              )}
            </div>

            {/* the one free-text field that matters per shape */}
            {r.shape === "task" && (
              <textarea value={r.draft.first_5_minutes ?? ""} onChange={(e) => patchDraft(p.item_id, { first_5_minutes: e.target.value })} placeholder="first 5 minutes" rows={2} style={{ ...input, width: "100%", marginTop: 8, resize: "vertical" }} />
            )}
            {(r.shape === "close" || r.shape === "consider") && (
              <textarea value={r.draft.close_note ?? ""} onChange={(e) => patchDraft(p.item_id, { close_note: e.target.value })} placeholder="note / reason" rows={2} style={{ ...input, width: "100%", marginTop: 8, resize: "vertical" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
