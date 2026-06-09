import { NextResponse } from "next/server";
import { getActivePrepRun } from "@/lib/queries/prepRunStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live prep-run status for the Runs page strip. Polled ~every 2.5s by the client.
export async function GET() {
  try {
    return NextResponse.json(await getActivePrepRun());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
