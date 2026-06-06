import { NextRequest, NextResponse } from "next/server";
import { listRuns, getRunDetail } from "@/lib/queries/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (id) return NextResponse.json(await getRunDetail(id));
    return NextResponse.json({ rows: await listRuns() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
