// Expert Liaison console — the interactive surface for the expert-liaison system. Its own tab
// (not the /system anatomy page). Where Nick sees + acts: the gap artifacts and their recorded
// questions, the asks to experts (durable, never lost in chat), the curation ledger, and the
// experts registry. Pure-canon reads; mutations go through app/api/expert-liaison/exchange.

import { getGovernedArtifacts } from "@/lib/queries/governedArtifacts";
import { getSourceAssessments } from "@/lib/queries/sourceAssessments";
import { getExperts, getExchanges, getOpenRequests, getMotions } from "@/lib/queries/expertLiaison";
import { getReviewPackets } from "@/lib/queries/packets";
import ExpertLiaisonSurface from "./ExpertLiaisonSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExpertLiaisonPage() {
  try {
    const [governed, ledger, experts, exchanges, requests, motions] = await Promise.all([
      getGovernedArtifacts(),
      getSourceAssessments(),
      getExperts(),
      getExchanges(),
      getOpenRequests(),
      getMotions(),
    ]);
    const packets = await getReviewPackets(experts, exchanges);
    return <ExpertLiaisonSurface governed={governed} ledger={ledger} experts={experts} exchanges={exchanges} packets={packets} requests={requests} motions={motions} />;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
