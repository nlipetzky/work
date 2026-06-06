import { NextRequest, NextResponse } from "next/server";
import { getGapCounts, getGapRecords } from "@/lib/queries/gaps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  try {
    if (view) return NextResponse.json(await getGapRecords(view));
    return NextResponse.json({ gaps: await getGapCounts() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
