import { NextRequest, NextResponse } from "next/server";
import { resolveDuplicate } from "@/lib/queries/duplicates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { record_a, record_b, record_type, resolution, notes } = body ?? {};
    if (!record_a || !record_b || !["merged", "not_duplicate", "deferred"].includes(resolution)) {
      return NextResponse.json({ error: "bad payload" }, { status: 400 });
    }
    await resolveDuplicate({ record_a, record_b, record_type: record_type ?? "company", resolution, notes });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
