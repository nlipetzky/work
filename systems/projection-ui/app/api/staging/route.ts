import { NextRequest, NextResponse } from "next/server";
import { getStagingState, getStagingPreview } from "@/lib/queries/staging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const preview = req.nextUrl.searchParams.get("preview");
  const limit = req.nextUrl.searchParams.get("limit");
  try {
    if (preview) return NextResponse.json(await getStagingPreview(preview, limit ? Number(limit) : 50));
    return NextResponse.json(await getStagingState());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
