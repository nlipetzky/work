import { NextRequest, NextResponse } from "next/server";
import { listDuplicates } from "@/lib/queries/duplicates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listDuplicates({
      threshold: sp.get("threshold") ? Number(sp.get("threshold")) : 0.7,
      limit: sp.get("limit") ? Number(sp.get("limit")) : 50,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
