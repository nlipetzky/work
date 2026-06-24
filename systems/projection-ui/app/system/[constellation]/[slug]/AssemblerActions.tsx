"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Operate-from-the-UI controls for the Artifact Assembler.
// Run triggers the deterministic driver. ArtifactChip lets you READ a draft/approved
// artifact, then (for drafts) approve it deliberately — never a blind one-click approve.

export function RunButton({ engagementType, engagementId }: { engagementType: string; engagementId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true); setMsg("running the Assembler… (this can take a minute)");
    try {
      const res = await fetch("/api/system/artifact/run", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagement_type: engagementType, engagement_id: engagementId }),
      });
      const j = await res.json();
      if (j.needsKey) setMsg("Run reached the Assembler, but it needs ANTHROPIC_API_KEY to produce.");
      else if (j.ok) setMsg("Run complete. Refreshing…");
      else setMsg(`Run: ${(j.output || j.error || "no output").slice(0, 200)}`);
      router.refresh();
    } catch (e) { setMsg(`Run failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={run} disabled={busy}
        className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-50">
        {busy ? "running…" : "▸ Run"}
      </button>
      {msg && <span className="text-[11px] text-ink-600">{msg}</span>}
    </span>
  );
}

type Loaded = { content_md: string; status: string; version: number; approver: string | null; confirmed_by: string | null };

export function ArtifactChip({ artifactId, label, version, state }: { artifactId: string; label: string; version: number | null; state: "draft" | "approved" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    const next = !open; setOpen(next);
    if (next && !data) {
      setLoading(true); setErr(null);
      try {
        const j = await fetch(`/api/system/artifact/${artifactId}`).then((r) => r.json());
        if (!j.ok) setErr(j.error || "could not load"); else setData(j.artifact);
      } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
      finally { setLoading(false); }
    }
  }

  async function approve() {
    setBusy(true); setErr(null);
    try {
      const j = await fetch("/api/system/artifact/confirm", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ artifact_id: artifactId, confirmed_by: "Nick" }),
      }).then((r) => r.json());
      if (!j.ok) setErr(j.error || "approve failed"); else router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const chipTone = state === "approved" ? "border-ok/30 bg-ok/15 text-ok" : "border-warn/30 bg-warn/15 text-warn";
  const mark = state === "approved" ? "✓" : "○";

  return (
    <span className={open ? "w-full" : ""}>
      <button onClick={toggle} className={`rounded border px-2 py-0.5 text-[11px] ${chipTone} hover:opacity-80`}>
        {mark} {label}{version ? ` v${version}` : ""} {open ? "▾" : "▸ read"}
      </button>
      {open && (
        <div className="mt-1.5 w-full rounded border border-ink-700 bg-ink-950 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-ink-600">
            <span className="uppercase tracking-wider">{label}</span>
            <span className={state === "approved" ? "text-ok" : "text-warn"}>{state}{data ? ` v${data.version}` : ""}</span>
            {data?.approver && <span>· drafted by {data.approver}</span>}
            {data?.confirmed_by && <span>· approved by {data.confirmed_by}</span>}
          </div>
          {loading && <div className="text-[11px] text-muted">loading…</div>}
          {err && <div className="text-[11px] text-bad">{err}</div>}
          {data && (
            <>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-ink-900 p-3 text-[11px] leading-relaxed text-[#cdd9e5]">{data.content_md}</pre>
              {state === "draft" && (
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={approve} disabled={busy}
                    className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-50">
                    {busy ? "approving…" : "Approve ✓ (you've read it)"}
                  </button>
                  <span className="text-[11px] text-ink-600">read above, then approve</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </span>
  );
}
