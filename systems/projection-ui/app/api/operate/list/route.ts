import { NextResponse } from "next/server";
import { SOPS, summarize } from "@/lib/queries/operatingSop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Slice 1: derives rollup from each activity's static_status (see operatingSop.ts).
// Phase D swaps the underlying activity status to live DB compute; this route is unchanged.

export async function GET() {
  try {
    const sops = await Promise.all(SOPS.map(summarize));
    return NextResponse.json({ count: sops.length, sops, errors: [] });
  } catch (e) {
    return NextResponse.json({ count: 0, sops: [], errors: [String(e)] }, { status: 500 });
  }
}
