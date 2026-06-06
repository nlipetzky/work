import { NextRequest, NextResponse } from "next/server";
import { getRecordDetail } from "@/lib/queries/records";
import type { Entity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entity = (sp.get("entity") as Entity) || "companies";
  const id = sp.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    return NextResponse.json(await getRecordDetail(entity, id));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
