// Outreach Producer (System M) console — this system's own tab. Where the cold offer ladder is
// produced + approved, and (next slice) the copy that hinges on it. Distinct from Expert Liaison:
// EL handles expert interaction/curation; this surface is where offers + copy get made.
// Pure-canon reads; mutations go through the shared governed routes (produce / confirm).

import { getOutreachSystem } from "@/lib/queries/outreach";
import OutreachSurface from "./OutreachSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  try {
    const system = await getOutreachSystem();
    return <OutreachSurface system={system} />;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
