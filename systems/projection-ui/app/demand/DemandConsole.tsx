"use client";

// Demand-Context console — faithful to the Claude Design export, wired to real
// public.dc_* data with a full write path. Five screens + account switcher.
// Extraction loop: highlight transcript → capture verbatim observation (graded) →
// cluster observations into patterns → draft/link/approve consuming artifacts.
// Every mutation persists through /api/demand, then router.refresh() re-pulls the
// server data. No fabricated content — empty layers stay empty until you fill them.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DemandData, DcObservation, TranscriptLine } from "@/lib/queries/demand";

const GRADE: Record<string, { label: string; short: string; color: string }> = {
  asserted: { label: "Asserted", short: "A", color: "#7d8590" },
  single: { label: "Single-prospect", short: "S", color: "#5b9dff" },
  multi: { label: "Multi-confirmed", short: "M", color: "#3fb950" },
};
const GRADE_ORDER = ["asserted", "single", "multi"] as const;
const STATUS: Record<string, { color: string; bg: string }> = {
  New: { color: "#7d8590", bg: "rgba(125,133,144,0.14)" },
  Extracting: { color: "#d29922", bg: "rgba(210,153,34,0.16)" },
  Extracted: { color: "#3fb950", bg: "rgba(63,185,80,0.14)" },
};
const ARTIFACT_TEMPLATES: { type: string; title: string; step: string }[] = [
  { type: "offer", title: "Offer", step: "Fit screening" },
  { type: "field", title: "Segment criteria", step: "Sourcing — company filters" },
  { type: "rule", title: "Hard disqualifiers", step: "Screening & suppression" },
  { type: "tag", title: "Sub-segment tags", step: "Slice & prioritize" },
  { type: "tier", title: "ICP titles / personas", step: "People-finding & enrichment" },
  { type: "classifier", title: "Classifier", step: "Screening — qualify vs reject" },
];

function statusStyle(status: string): React.CSSProperties {
  const s = STATUS[status] ?? STATUS.New;
  return {
    fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
    fontSize: 10, color: s.color, background: s.bg,
    border: `1px solid ${s.color}40`, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap",
  };
}
const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7d8590" };
const panel: React.CSSProperties = { border: "1px solid #1d2430", borderRadius: 12, background: "#10141c" };

export default function DemandConsole({ data, error }: { data: DemandData | null; error: string | null }) {
  const router = useRouter();
  const accounts = data?.accounts ?? [];
  const [activeAccountId, setActiveAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [screen, setScreen] = useState<"dashboard" | "captures" | "workspace" | "patterns" | "artifacts">("dashboard");
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const [openTrace, setOpenTrace] = useState<string | null>(null);
  const [pendingQuote, setPendingQuote] = useState("");
  const [pendingGrade, setPendingGrade] = useState("asserted");
  const [managePatternId, setManagePatternId] = useState<string | null>(null);
  const [linkPickerRow, setLinkPickerRow] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      setBusy(true);
      try {
        const r = await fetch("/api/demand", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        router.refresh();
      } catch (e) {
        // surface write failures rather than failing silently
        alert("Write failed: " + (e instanceof Error ? e.message : String(e)));
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;
  const captures = (data?.captures ?? []).filter((c) => c.account_id === activeAccount?.id);
  const observations = (data?.observations ?? []).filter((o) => o.account_id === activeAccount?.id);
  const patterns = (data?.patterns ?? []).filter((p) => p.account_id === activeAccount?.id);
  const artifacts = (data?.artifacts ?? []).filter((a) => a.account_id === activeAccount?.id);
  const activeCapture = captures.find((c) => c.id === activeCaptureId) ?? captures[0] ?? null;

  const captureObservation = useCallback(() => {
    const q = pendingQuote.trim();
    if (!q || !activeAccount || !activeCapture) return;
    post({ action: "create_observation", account_id: activeAccount.id, capture_id: activeCapture.id, grade: pendingGrade, quote: q });
    try { window.getSelection()?.removeAllRanges(); } catch { /* noop */ }
    setPendingQuote("");
  }, [pendingQuote, pendingGrade, activeAccount, activeCapture, post]);

  // keyboard: Enter capture, 1/2/3 grade, Esc clear — only in the workspace with a pending quote
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (screen !== "workspace" || !pendingQuote) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea)$/i.test(t.tagName))) return;
      if (e.key === "Enter") { e.preventDefault(); captureObservation(); }
      else if (e.key === "1") setPendingGrade("asserted");
      else if (e.key === "2") setPendingGrade("single");
      else if (e.key === "3") setPendingGrade("multi");
      else if (e.key === "Escape") { setPendingQuote(""); try { window.getSelection()?.removeAllRanges(); } catch { /* noop */ } }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [screen, pendingQuote, captureObservation]);

  if (error || !data) {
    return (
      <div style={{ height: "100%", background: "#0b0e14", color: "#f85149", padding: 24, fontFamily: "ui-monospace,Menlo,monospace", fontSize: 13 }}>
        demand-context tables unavailable: {error ?? "no data"}
      </div>
    );
  }
  if (accounts.length === 0 || !activeAccount) {
    return (
      <div style={{ height: "100%", background: "#0b0e14", color: "#7d8590", padding: 28, fontFamily: "ui-sans-serif,system-ui", fontSize: 14 }}>
        No demand-context accounts yet. Ingest a transcript to create the first capture event.
      </div>
    );
  }

  const obsByCapture = (cid: string) => observations.filter((o) => o.capture_id === cid);
  const obsForPattern = (pid: string) =>
    data.patternObs.filter((x) => x.pattern_id === pid).map((x) => observations.find((o) => o.id === x.observation_id)).filter(Boolean) as DcObservation[];
  const obsInPattern = (pid: string, oid: string) => data.patternObs.some((x) => x.pattern_id === pid && x.observation_id === oid);
  const patternsForObs = (oid: string) => data.patternObs.filter((x) => x.observation_id === oid).map((x) => patterns.find((p) => p.id === x.pattern_id)).filter(Boolean);
  const captureOf = (cid: string) => captures.find((c) => c.id === cid) ?? null;
  const companyOf = (cid: string) => captureOf(cid)?.company ?? cid;

  function patternStrength(pid: string) {
    const obs = obsForPattern(pid);
    const n = new Set(obs.map((o) => o.capture_id)).size;
    if (n >= 2) return { label: "Multi-confirmed", color: "#3fb950", n };
    if (n === 1) return { label: "Single-prospect", color: "#5b9dff", n };
    return { label: "Unconfirmed", color: "#7d8590", n };
  }
  const rowsFor = (aid: string) => data.rows.filter((r) => r.artifact_id === aid);
  const patternsForRow = (rid: string) => data.rowPatterns.filter((x) => x.row_id === rid).map((x) => patterns.find((p) => p.id === x.pattern_id)).filter(Boolean);
  const rowHasPattern = (rid: string, pid: string) => data.rowPatterns.some((x) => x.row_id === rid && x.pattern_id === pid);
  const rowSupported = (rid: string) => patternsForRow(rid).some((p) => p && obsForPattern(p.id).length > 0);

  const allRows = artifacts.flatMap((a) => rowsFor(a.id));
  const supportedRows = allRows.filter((r) => rowSupported(r.id)).length;
  const tracePct = allRows.length === 0 ? null : Math.round((supportedRows / allRows.length) * 100);

  const headerByScreen: Record<string, { title: string; sub: string }> = {
    dashboard: { title: "Dashboard", sub: "signal → observation → pattern → artifact" },
    captures: { title: "Capture events", sub: `${captures.length} transcripts` },
    workspace: { title: activeCapture ? `${activeCapture.ref ?? ""} · ${activeCapture.company ?? ""}` : "Workspace", sub: "highlight to capture a verbatim observation" },
    patterns: { title: "Patterns", sub: `${patterns.length} clusters` },
    artifacts: { title: "Sourcing & enrichment inputs", sub: `${artifacts.length} artifacts` },
  };
  const head = headerByScreen[screen];
  const navItems: { key: typeof screen; label: string; count: number | null }[] = [
    { key: "dashboard", label: "Dashboard", count: null },
    { key: "captures", label: "Capture events", count: captures.length },
    { key: "patterns", label: "Patterns", count: patterns.length },
    { key: "artifacts", label: "Artifacts", count: artifacts.length },
  ];
  function openCapture(id: string) { setActiveCaptureId(id); setScreen("workspace"); setPendingQuote(""); }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", background: "#0b0e14", color: "#e6edf3", fontSize: 14, opacity: busy ? 0.85 : 1 }}>
      {/* sidebar */}
      <div style={{ width: 214, flex: "none", borderRight: "1px solid #1d2430", background: "#0b0e14", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 12px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 4px 11px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#9fb0c0" }}>DEMAND CONTEXT</span>
            <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 9, color: "#3a4556" }}>v0</span>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "#3a4556", padding: "0 4px 5px" }}>Account</div>
            <button onClick={() => setAccountMenuOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid #1d2430", borderRadius: 9, padding: "8px 10px", background: "#10141c" }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0b0e14", background: activeAccount.accent ?? "#5b9dff" }}>{activeAccount.name.charAt(0)}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeAccount.name}</span>
                <span style={{ display: "block", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 9.5, color: "#7d8590", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeAccount.industry}</span>
              </span>
              <span style={{ color: "#7d8590", fontSize: 8, flex: "none" }}>{accountMenuOpen ? "▲" : "▼"}</span>
            </button>
            {accountMenuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 60, border: "1px solid #2a3342", borderRadius: 11, background: "#10141c", boxShadow: "0 14px 36px rgba(0,0,0,0.55)", padding: 6 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "#3a4556", padding: "6px 9px 7px" }}>Switch account · {accounts.length}</div>
                {accounts.map((ac) => {
                  const on = ac.id === activeAccount.id;
                  return (
                    <button key={ac.id} onClick={() => { setActiveAccountId(ac.id); setAccountMenuOpen(false); setActiveCaptureId(null); setScreen("dashboard"); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer", border: "none", borderRadius: 8, padding: "8px 9px", background: on ? "#161d29" : "transparent" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0b0e14", background: ac.accent ?? "#5b9dff" }}>{ac.name.charAt(0)}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ac.name}</span>
                        <span style={{ display: "block", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 9.5, color: "#7d8590", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ac.industry}</span>
                      </span>
                      <span style={{ color: "#5b9dff", fontSize: 11, opacity: on ? 1 : 0 }}>✓</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 8px" }}>
          {navItems.map((it) => {
            const on = screen === it.key || (it.key === "captures" && screen === "workspace");
            return (
              <button key={it.key} onClick={() => setScreen(it.key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", cursor: "pointer", border: "none", borderRadius: 8, padding: "8px 11px", fontSize: 13, background: on ? "#161d29" : "transparent", color: on ? "#e6edf3" : "#9fb0c0" }}>
                <span>{it.label}</span>
                {it.count !== null && <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#5b9dff" }}>{it.count}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", padding: "14px 16px", borderTop: "1px solid #1d2430" }}>
          <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, lineHeight: 1.7, color: "#3a4556" }}>
            <div>signal → observation</div>
            <div>→ pattern → artifact</div>
          </div>
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: "none", height: 56, borderBottom: "1px solid #1d2430", display: "flex", alignItems: "center", gap: 14, padding: "0 24px", background: "#0b0e14" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>{head.title}</div>
          <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#7d8590" }}>{head.sub}</div>
          <div style={{ flex: 1 }} />
          {screen === "workspace" && activeCapture && (
            <>
              {obsByCapture(activeCapture.id).length > 0 && activeCapture.status !== "Extracted" && (
                <button onClick={() => post({ action: "set_capture_status", capture_id: activeCapture.id, status: "Extracted" })} style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#3fb950", background: "transparent", border: "1px solid #3fb95055", borderRadius: 6, padding: "6px 11px", cursor: "pointer" }}>mark extracted ✓</button>
              )}
              <button onClick={() => setScreen("captures")} style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#7d8590", background: "transparent", border: "1px solid #1d2430", borderRadius: 6, padding: "6px 11px", cursor: "pointer" }}>← capture events</button>
            </>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {screen === "dashboard" && renderDashboard()}
          {screen === "captures" && renderCaptures()}
          {screen === "workspace" && renderWorkspace()}
          {screen === "patterns" && renderPatterns()}
          {screen === "artifacts" && renderArtifacts()}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------- DASHBOARD
  function renderDashboard() {
    const recent = captures.slice(0, 5);
    const ranked = [...patterns].sort((a, b) => patternStrength(b.id).n - patternStrength(a.id).n).slice(0, 5);
    return (
      <div style={{ padding: "28px 28px 40px", maxWidth: 1080 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ ...panel, padding: "22px 24px" }}>
            <div style={eyebrow}>Artifact claims traceable to evidence</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 10 }}>
              <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1, color: tracePct === null ? "#3a4556" : tracePct === 100 ? "#3fb950" : "#d29922" }}>{tracePct === null ? "—" : `${tracePct}%`}</div>
              <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, color: "#7d8590" }}>{allRows.length === 0 ? "no artifact claims yet" : `${supportedRows}/${allRows.length} claims linked`}</div>
            </div>
            <div style={{ height: 7, borderRadius: 5, background: "#1d2430", marginTop: 16, overflow: "hidden" }}>
              <div style={{ width: `${tracePct ?? 0}%`, height: "100%", background: tracePct === 100 ? "#3fb950" : "#d29922" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "#7d8590" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: allRows.length === 0 ? "#3a4556" : tracePct === 100 ? "#3fb950" : "#d29922", flex: "none" }} />
              <span>{allRows.length === 0 ? "No artifacts built yet — extract observations, cluster patterns, then draft inputs." : tracePct === 100 ? "Every claim is evidenced." : "Some claims aren't yet traced to a verbatim quote."}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Capture events", value: captures.length, key: "captures" as const },
              { label: "Observations", value: observations.length, key: "workspace" as const },
              { label: "Patterns", value: patterns.length, key: "patterns" as const },
              { label: "Artifacts", value: artifacts.length, key: "artifacts" as const },
            ].map((s) => (
              <button key={s.label} onClick={() => setScreen(s.key)} style={{ textAlign: "left", ...panel, padding: "16px 16px 15px", cursor: "pointer" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7d8590" }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#e6edf3", marginTop: 6, lineHeight: 1 }}>{s.value}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ ...panel, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid #1d2430", ...eyebrow }}>Recent capture events</div>
            {recent.length === 0 ? <div style={{ padding: 18, fontSize: 12.5, color: "#7d8590" }}>No captures yet.</div> : recent.map((c) => (
              <button key={c.id} onClick={() => openCapture(c.id)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: "transparent", border: "none", borderBottom: "1px solid #151a23", cursor: "pointer" }}>
                <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#5b9dff", flex: "none" }}>{c.ref}</span>
                <span style={{ fontSize: 13, color: "#cdd9e5", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.company}</span>
                <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#7d8590" }}>{obsByCapture(c.id).length} obs</span>
                <span style={statusStyle(c.status)}>{c.status}</span>
              </button>
            ))}
          </div>
          <div style={{ ...panel, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid #1d2430", ...eyebrow }}>Strongest patterns</div>
            {ranked.length === 0 ? <div style={{ padding: 18, fontSize: 12.5, color: "#7d8590", lineHeight: 1.6 }}>No patterns yet. Capture observations in the workspace, then cluster them.</div> : ranked.map((p) => {
              const st = patternStrength(p.id);
              return (
                <button key={p.id} onClick={() => setScreen("patterns")} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: "transparent", border: "none", borderBottom: "1px solid #151a23", cursor: "pointer" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color, flex: "none" }} />
                  <span style={{ fontSize: 13, color: "#cdd9e5", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                  <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#7d8590", whiteSpace: "nowrap" }}>{st.label} · {obsForPattern(p.id).length}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------- CAPTURES
  function renderCaptures() {
    return (
      <div style={{ padding: "24px 28px 40px" }}>
        <div style={{ ...panel, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "78px 1fr 150px 96px 64px 108px 28px", padding: "11px 18px", borderBottom: "1px solid #1d2430", background: "#0e121a", fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: "#7d8590", whiteSpace: "nowrap" }}>
            <div>ID</div><div>Prospect / role</div><div>Source</div><div>Date</div><div style={{ textAlign: "right" }}>Obs</div><div>Status</div><div />
          </div>
          {captures.length === 0 ? <div style={{ padding: 20, fontSize: 13, color: "#7d8590" }}>No capture events for this account.</div> : captures.map((c) => (
            <button key={c.id} onClick={() => openCapture(c.id)} style={{ width: "100%", textAlign: "left", display: "grid", gridTemplateColumns: "78px 1fr 150px 96px 64px 108px 28px", alignItems: "center", padding: "14px 18px", background: "transparent", border: "none", borderBottom: "1px solid #151a23", cursor: "pointer" }}>
              <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#5b9dff" }}>{c.ref}</div>
              <div style={{ minWidth: 0, paddingRight: 14 }}>
                <div style={{ fontSize: 13.5, color: "#e6edf3", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.company}</div>
                <div style={{ fontSize: 11, color: "#7d8590", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.contact_role}</div>
              </div>
              <div style={{ fontSize: 12, color: "#9fb0c0" }}>{c.source}</div>
              <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#7d8590" }}>{c.event_date}</div>
              <div style={{ textAlign: "right", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, color: "#cdd9e5" }}>{obsByCapture(c.id).length}</div>
              <div><span style={statusStyle(c.status)}>{c.status}</span></div>
              <div style={{ textAlign: "right", color: "#3a4556", fontSize: 14 }}>→</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------- WORKSPACE
  function gradePill(g: string, active: boolean, onClick: () => void) {
    const gr = GRADE[g];
    return (
      <button key={g} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer", borderRadius: 6, padding: "5px 9px", border: `1px solid ${active ? gr.color : "#1d2430"}`, background: active ? `${gr.color}1a` : "transparent", color: active ? "#e6edf3" : "#7d8590" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: gr.color }} />{gr.label}
      </button>
    );
  }
  function renderWorkspace() {
    const cap = activeCapture;
    if (!cap) return <div style={{ padding: 28, color: "#7d8590" }}>No capture selected.</div>;
    const obs = obsByCapture(cap.id);
    const lines: TranscriptLine[] = Array.isArray(cap.transcript) ? cap.transcript : [];
    return (
      <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #1d2430" }}>
          <div style={{ flex: "none", padding: "16px 26px 12px", borderBottom: "1px solid #151a23" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#5b9dff" }}>{cap.ref}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>{cap.company}</span>
              <span style={statusStyle(cap.status)}>{cap.status}</span>
            </div>
            <div style={{ fontSize: 11, color: "#7d8590", marginTop: 4 }}>{cap.source} · {cap.event_date} · {cap.contact_role}</div>
          </div>
          <div onMouseUp={() => { const t = window.getSelection()?.toString().trim().replace(/\s+/g, " ") ?? ""; if (t.length > 1) setPendingQuote(t); }} style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "18px 26px 28px" }}>
            {lines.map((l, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: l.is_prospect ? "#9fb0c0" : "#5b9dff", marginBottom: 3 }}>{l.who}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.62, color: l.is_prospect ? "#e6edf3" : "#9fb0c0", maxWidth: "64ch" }}>{l.text}</div>
              </div>
            ))}
          </div>
          {/* pending capture bar */}
          <div style={{ flex: "none", padding: "12px 26px", borderTop: "1px solid #1d2430", background: "#0c1017" }}>
            {pendingQuote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5b9dff" }}>Pending observation</span>
                  <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#7d8590" }}>verbatim · preserved exactly</span>
                </div>
                <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12.5, lineHeight: 1.55, color: "#e6edf3", borderLeft: "2px solid #5b9dff", padding: "2px 0 2px 12px", maxHeight: 74, overflow: "auto" }}>“{pendingQuote}”</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#7d8590" }}>Grade</span>
                  {GRADE_ORDER.map((g) => gradePill(g, pendingGrade === g, () => setPendingGrade(g)))}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => { setPendingQuote(""); try { window.getSelection()?.removeAllRanges(); } catch { /* noop */ } }} style={{ fontSize: 11, color: "#7d8590", background: "transparent", border: "none", cursor: "pointer", padding: "7px 9px" }}>Clear</button>
                  <button onClick={captureObservation} style={{ fontSize: 12, fontWeight: 600, color: "#0b0e14", background: "#5b9dff", border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>Capture <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, opacity: 0.7 }}>⏎</span></button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#7d8590", fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2a3342", flex: "none" }} />
                Select any text in the transcript to capture it as a verbatim observation. <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#3a4556" }}>1/2/3 grade · ⏎ capture · esc clear</span>
              </div>
            )}
          </div>
        </div>

        {/* observations */}
        <div style={{ width: 430, flex: "none", display: "flex", flexDirection: "column", background: "#0c1017" }}>
          <div style={{ flex: "none", padding: "15px 20px 12px", borderBottom: "1px solid #1d2430", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#cdd9e5" }}>Observations</span>
            <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#5b9dff" }}>{obs.length}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "14px 18px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
            {obs.length === 0 ? (
              <div style={{ border: "1px dashed #1d2430", borderRadius: 10, padding: "26px 18px", textAlign: "center", color: "#7d8590", fontSize: 12.5, lineHeight: 1.6 }}>
                No observations yet.<br />Highlight a quote on the left to capture your first one.
              </div>
            ) : obs.map((o) => {
              const g = GRADE[o.grade] ?? GRADE.asserted;
              const chips = patternsForObs(o.id);
              return (
                <div key={o.id} style={{ border: "1px solid #1d2430", borderRadius: 10, background: "#10141c", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10.5, color: "#7d8590" }}>{o.ref}</span>
                    <div style={{ flex: 1 }} />
                    {GRADE_ORDER.map((gk) => (
                      <button key={gk} title={GRADE[gk].label} onClick={() => post({ action: "set_observation_grade", id: o.id, grade: gk })} style={{ width: 20, height: 20, borderRadius: 5, cursor: "pointer", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: o.grade === gk ? "#0b0e14" : GRADE[gk].color, background: o.grade === gk ? GRADE[gk].color : "transparent", border: `1px solid ${GRADE[gk].color}${o.grade === gk ? "" : "55"}` }}>{GRADE[gk].short}</button>
                    ))}
                  </div>
                  <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12.5, lineHeight: 1.55, color: "#e6edf3", borderLeft: `2px solid ${g.color}`, paddingLeft: 11 }}>“{o.quote}”</div>
                  {chips.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {chips.map((p) => p && <span key={p.id} style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 9.5, color: "#9fb0c0", background: "#161d29", border: "1px solid #1d2430", borderRadius: 4, padding: "2px 6px" }}>{p.ref ?? p.name}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ flex: "none", padding: "10px 18px", borderTop: "1px solid #1d2430", fontSize: 10.5, color: "#3a4556", lineHeight: 1.5 }}>
            Rule: verbatim is preserved exactly. Low-confidence quotes are graded down, never deleted.
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------- PATTERNS
  function renderPatterns() {
    return (
      <div style={{ padding: "24px 28px 50px", maxWidth: 1080 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#7d8590" }}>{observations.length} observations across {captures.length} captures · cluster the ones that say the same thing.</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => post({ action: "create_pattern", account_id: activeAccount.id, name: "New pattern" })} style={{ fontSize: 12, fontWeight: 600, color: "#cdd9e5", background: "#161d29", border: "1px solid #1d2430", borderRadius: 7, padding: "8px 13px", cursor: "pointer" }}>+ New pattern</button>
        </div>
        {patterns.length === 0 ? (
          <div style={{ ...panel, padding: "30px 24px", color: "#7d8590", fontSize: 13, lineHeight: 1.6, textAlign: "center" }}>
            No patterns yet.<br />Capture some observations, then add a pattern and toggle the quotes that belong to it.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {patterns.map((p) => {
              const st = patternStrength(p.id);
              const inObs = obsForPattern(p.id);
              const manage = managePatternId === p.id;
              return (
                <div key={p.id} style={{ ...panel, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", borderBottom: "1px solid #151a23" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: st.color, flex: "none" }} />
                    <span contentEditable suppressContentEditableWarning onBlur={(e) => { const v = e.currentTarget.textContent ?? ""; if (v.trim() && v.trim() !== p.name) post({ action: "rename_pattern", id: p.id, name: v.trim() }); }} style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3", flex: 1, minWidth: 0, outline: "none" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: st.color, border: `1px solid ${st.color}55`, borderRadius: 999, padding: "2px 9px" }}>{st.label}</span>
                    <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#7d8590" }}>{inObs.length} obs · {st.n} prospect{st.n === 1 ? "" : "s"}</span>
                    <button onClick={() => setManagePatternId(manage ? null : p.id)} style={{ fontSize: 11, color: "#5b9dff", background: "transparent", border: "1px solid #1d2430", borderRadius: 6, padding: "6px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>{manage ? "Done" : "Manage"}</button>
                  </div>
                  <div style={{ padding: "6px 18px 10px" }}>
                    {inObs.length === 0 ? <div style={{ padding: "14px 0", color: "#7d8590", fontSize: 12 }}>No observations yet — use Manage to add some.</div> : inObs.map((o) => (
                      <div key={o.id} style={{ display: "flex", gap: 11, padding: "10px 0", borderBottom: "1px solid #131922" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: (GRADE[o.grade] ?? GRADE.asserted).color, flex: "none", marginTop: 6 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, lineHeight: 1.5, color: "#cdd9e5" }}>“{o.quote}”</div>
                          <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#7d8590", marginTop: 3 }}>{o.ref} · {companyOf(o.capture_id)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {manage && (
                    <div style={{ padding: "12px 18px 16px", borderTop: "1px solid #1d2430", background: "#0c1017" }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7d8590", marginBottom: 9 }}>Toggle observations in this pattern</div>
                      {observations.length === 0 ? <div style={{ color: "#7d8590", fontSize: 12 }}>No observations captured yet.</div> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {observations.map((o) => {
                            const on = obsInPattern(p.id, o.id);
                            return (
                              <button key={o.id} onClick={() => post({ action: "toggle_pattern_observation", pattern_id: p.id, observation_id: o.id, on: !on })} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${on ? "#2a3342" : "#1d2430"}`, borderRadius: 7, padding: "7px 10px", background: on ? "#161d29" : "transparent" }}>
                                <span style={{ width: 15, flex: "none", color: on ? "#3fb950" : "#3a4556", fontFamily: "ui-monospace,Menlo,monospace" }}>{on ? "✓" : "+"}</span>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: (GRADE[o.grade] ?? GRADE.asserted).color, flex: "none" }} />
                                <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "#cdd9e5", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>“{o.quote}”</span>
                                <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 9.5, color: "#7d8590", whiteSpace: "nowrap" }}>{companyOf(o.capture_id)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------- ARTIFACTS
  function renderArtifacts() {
    const existingTypes = new Set(artifacts.map((a) => a.type));
    const addable = ARTIFACT_TEMPLATES.filter((t) => !existingTypes.has(t.type));
    return (
      <div style={{ padding: "24px 28px 50px", maxWidth: 880 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.07em", textTransform: "uppercase", color: "#cdd9e5", fontWeight: 600 }}>Sourcing &amp; enrichment inputs</div>
          <div style={{ fontSize: 12, color: "#7d8590", marginTop: 7, maxWidth: "66ch", lineHeight: 1.55 }}>The consuming artifacts the downstream engine reads. Every line links back to the patterns and verbatim quotes behind it — edit inline, link a pattern, then approve.</div>
          {addable.length > 0 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 13 }}>
              {addable.map((t) => (
                <button key={t.type} onClick={() => post({ action: "create_artifact", account_id: activeAccount.id, title: t.title, type: t.type, step: t.step })} style={{ fontSize: 11.5, color: "#5b9dff", background: "#161d29", border: "1px dashed #2a3342", borderRadius: 7, padding: "6px 11px", cursor: "pointer" }}>+ {t.title}</button>
              ))}
            </div>
          )}
        </div>
        {artifacts.length === 0 ? (
          <div style={{ ...panel, padding: "30px 24px", color: "#7d8590", fontSize: 13, lineHeight: 1.6, textAlign: "center" }}>No artifacts yet. Add one above, then write claims and link them to patterns.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {artifacts.map((a) => {
              const rows = rowsFor(a.id);
              const isClassifier = a.type === "classifier";
              return (
                <div key={a.id} style={{ ...panel, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderBottom: "1px solid #1d2430" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>{a.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5b9dff", flex: "none" }} />
                        <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, letterSpacing: "0.03em", color: "#7d8590" }}>engine step · {a.step}</span>
                      </div>
                    </div>
                    <button onClick={() => post({ action: "set_artifact_approved", id: a.id, approved: !a.approved })} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer", color: a.approved ? "#3fb950" : "#7d8590", border: `1px solid ${a.approved ? "#3fb95055" : "#1d2430"}`, borderRadius: 999, padding: "5px 11px", background: a.approved ? "rgba(63,185,80,0.08)" : "transparent" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.approved ? "#3fb950" : "#3a4556" }} />{a.approved ? "approved" : "approve"}
                    </button>
                  </div>
                  <div style={{ padding: "6px 20px 14px" }}>
                    {rows.map((c) => {
                      const pats = patternsForRow(c.id);
                      const supported = rowSupported(c.id);
                      const picking = linkPickerRow === c.id;
                      return (
                        <div key={c.id} style={{ padding: "14px 0", borderBottom: "1px solid #151a23" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                            {isClassifier && (
                              <>
                                <select value={c.verdict ?? "Review"} onChange={(e) => post({ action: "update_artifact_row", id: c.id, patch: { verdict: e.target.value } })} style={{ fontSize: 10.5, color: "#cdd9e5", background: "#161d29", border: "1px solid #1d2430", borderRadius: 5, padding: "3px 6px" }}>
                                  {["Qualify", "Review", "Reject"].map((v) => <option key={v}>{v}</option>)}
                                </select>
                                <select value={c.confidence ?? "Low"} onChange={(e) => post({ action: "update_artifact_row", id: c.id, patch: { confidence: e.target.value } })} style={{ fontSize: 10.5, color: "#7d8590", background: "#161d29", border: "1px solid #1d2430", borderRadius: 5, padding: "3px 6px" }}>
                                  {["High", "Medium", "Low"].map((v) => <option key={v}>{v}</option>)}
                                </select>
                              </>
                            )}
                            {!isClassifier && (
                              <span contentEditable suppressContentEditableWarning onBlur={(e) => { const v = e.currentTarget.textContent ?? ""; if (v.trim() !== (c.label ?? "")) post({ action: "update_artifact_row", id: c.id, patch: { label: v.trim() } }); }} style={{ fontSize: 10.5, color: "#9fb0c0", background: "#161d29", border: "1px solid #1d2430", borderRadius: 5, padding: "2px 8px", outline: "none", minWidth: 40, display: "inline-block" }}>{c.label}</span>
                            )}
                          </div>
                          <div contentEditable suppressContentEditableWarning onBlur={(e) => { const v = e.currentTarget.textContent ?? ""; if (v.trim() !== c.text) post({ action: "update_artifact_row", id: c.id, patch: { text: v.trim() } }); }} style={{ fontSize: 14, lineHeight: 1.6, color: "#e6edf3", outline: "none" }}>{c.text}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                            {pats.map((p) => p && (
                              <button key={p.id} onClick={() => setOpenTrace(openTrace === c.id ? null : c.id)} style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#9fb0c0", background: "#161d29", border: "1px solid #1d2430", borderRadius: 5, padding: "3px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: patternStrength(p.id).color }} />{p.ref ?? p.name}
                              </button>
                            ))}
                            {!supported && <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#f85149", background: "rgba(248,81,73,0.10)", border: "1px solid rgba(248,81,73,0.35)", borderRadius: 5, padding: "3px 8px" }}>⚠ unsupported — link an observation</span>}
                            <button onClick={() => setLinkPickerRow(picking ? null : c.id)} style={{ fontSize: 10.5, color: "#5b9dff", background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px" }}>{picking ? "done" : "+ link pattern"}</button>
                          </div>
                          {picking && (
                            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5, borderLeft: "2px solid #1d2430", paddingLeft: 12 }}>
                              {patterns.length === 0 ? <div style={{ fontSize: 11, color: "#7d8590" }}>No patterns yet — create one in the Patterns tab.</div> : patterns.map((p) => {
                                const on = rowHasPattern(c.id, p.id);
                                return (
                                  <button key={p.id} onClick={() => post({ action: "toggle_row_pattern", row_id: c.id, pattern_id: p.id, on: !on })} style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: "3px 0" }}>
                                    <span style={{ width: 14, color: on ? "#3fb950" : "#3a4556", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11 }}>{on ? "✓" : "+"}</span>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: patternStrength(p.id).color }} />
                                    <span style={{ fontSize: 12, color: "#cdd9e5" }}>{p.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {openTrace === c.id && pats.length > 0 && (
                            <div style={{ marginTop: 12, borderLeft: "2px solid #1d2430", paddingLeft: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                              {pats.map((p) => p && (
                                <div key={p.id}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: patternStrength(p.id).color }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#cdd9e5" }}>{p.name}</span>
                                  </div>
                                  {obsForPattern(p.id).map((o) => (
                                    <div key={o.id} style={{ display: "flex", gap: 9, padding: "5px 0" }}>
                                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: (GRADE[o.grade] ?? GRADE.asserted).color, flex: "none", marginTop: 6 }} />
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11.5, lineHeight: 1.5, color: "#9fb0c0" }}>“{o.quote}”</div>
                                        <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 9.5, color: "#7d8590", marginTop: 2 }}>{o.ref} · {companyOf(o.capture_id)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={() => post(isClassifier ? { action: "add_artifact_row", artifact_id: a.id, text: "", verdict: "Review", confidence: "Low" } : { action: "add_artifact_row", artifact_id: a.id, label: "Label", text: "" })} style={{ marginTop: 10, fontSize: 11.5, color: "#7d8590", background: "transparent", border: "1px dashed #1d2430", borderRadius: 7, padding: "7px 12px", cursor: "pointer", width: "100%" }}>+ add line</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
