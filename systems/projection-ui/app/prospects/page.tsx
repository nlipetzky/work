// Prospect spine console — the flywheel front. Signal-sourced companies moving signal -> qualified,
// filled by the free signal watch and advanced by the (credit-gated) enrichment step.

import { getProspects } from "@/lib/queries/prospects";
import ProspectsSurface from "./ProspectsSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  try {
    const system = await getProspects();
    return <ProspectsSurface system={system} />;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
