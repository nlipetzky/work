// Expert Liaison console — the interactive surface for the expert-liaison system. Its own tab
// (not the /system anatomy page). Where Nick sees + acts: the gap artifacts and their recorded
// questions, the asks to experts (durable, never lost in chat), the curation ledger, and the
// experts registry. Pure-canon reads; mutations go through app/api/expert-liaison/exchange.

import { getGovernedArtifacts } from "@/lib/queries/governedArtifacts";
import { getSourceAssessments } from "@/lib/queries/sourceAssessments";
import { getExperts, getExchanges } from "@/lib/queries/expertLiaison";
import ExpertLiaisonSurface from "./ExpertLiaisonSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExpertLiaisonPage() {
  try {
    const [governed, ledger, experts, exchanges] = await Promise.all([
      getGovernedArtifacts(),
      getSourceAssessments(),
      getExperts(),
      getExchanges(),
    ]);
    return <ExpertLiaisonSurface governed={governed} ledger={ledger} experts={experts} exchanges={exchanges} />;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
