// Resumable triage session: /work/triage?run=<id>. Server-loads the run's pre-computed
// proposals + the goal/project options, hands them to the client panel for batch approve.

import { getRun } from "@/lib/protocol/runs";
import { listGoals } from "@/lib/queries/goals";
import { listProjects } from "@/lib/queries/projects";
import TriagePanel from "./TriagePanel";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TriageRoute({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run: runId } = await searchParams;
  const wrap = { maxWidth: 1040, margin: "0 auto", padding: "36px 40px 64px" } as const;
  const shell = (inner: React.ReactNode) => (
    <div style={{ height: "100%", overflowY: "auto", background: "#0b0e14", color: "#e6edf3", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14 }}>
      <div style={wrap}>
        <Link href="/work" style={{ fontSize: 12.5, color: "#7d8590", textDecoration: "none" }}>← Focus</Link>
        {inner}
      </div>
    </div>
  );

  if (!runId) return shell(<p style={{ color: "#f85149", marginTop: 20 }}>No run id. Start a run from Focus.</p>);

  const [run, goals, projects] = await Promise.all([getRun(runId), listGoals(), listProjects()]);
  if (!run) return shell(<p style={{ color: "#f85149", marginTop: 20 }}>Run not found.</p>);

  return shell(
    <TriagePanel
      runId={run.id}
      status={run.status}
      proposals={run.triage_proposals ?? []}
      goals={goals.map((g) => ({ id: g.id, title: g.title }))}
      projects={projects.filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name }))}
    />,
  );
}
