// Targeting (signal-targeting) console — the input side of list-building. Where the fundamental
// list-build artifacts (segment, titles, enrichment spec, qualify gate) are produced + approved,
// feeding the revops-engine. Pure-canon reads; mutations go through the shared governed routes.

import { getTargetingSystem } from "@/lib/queries/targeting";
import TargetingSurface from "./TargetingSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TargetingPage() {
  try {
    const system = await getTargetingSystem();
    return <TargetingSurface system={system} />;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
