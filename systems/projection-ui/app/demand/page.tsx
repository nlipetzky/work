// Demand-Context console — surface over public.dc_* in revops-engine.
// Server fetches the (small) bundle and hands it to the client console.

import { getDemandData, type DemandData } from "@/lib/queries/demand";
import DemandConsole from "./DemandConsole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DemandPage() {
  let data: DemandData | null = null;
  let error: string | null = null;
  try {
    data = await getDemandData();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return <DemandConsole data={data} error={error} />;
}
