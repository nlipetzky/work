// Plan Intake surface: /work/plan. Declare intent in plain language → system proposes spine
// changes → confirm per-item → enforced writes. The descent-side mirror of /work/triage.

import { listGoals } from "@/lib/queries/goals";
import PlanPanel from "./PlanPanel";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlanRoute() {
  const goals = await listGoals();
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#0b0e14", color: "#e6edf3", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14 }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 40px 64px" }}>
        <Link href="/work" style={{ fontSize: 12.5, color: "#7d8590", textDecoration: "none" }}>← Focus</Link>
        <PlanPanel goals={goals.map((g) => ({ id: g.id, title: g.title }))} />
      </div>
    </div>
  );
}
