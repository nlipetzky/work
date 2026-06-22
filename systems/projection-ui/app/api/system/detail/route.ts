import { NextRequest, NextResponse } from "next/server";
import { getSystemDetail } from "@/lib/queries/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Detail reads from canon_engine (the canonical registry), not the filesystem.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  try {
    const detail = await getSystemDetail(slug);
    if (!detail) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
