import { NextRequest, NextResponse } from "next/server";
import { getColumnInspector } from "@/lib/queries/records";
import type { Entity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entity = (sp.get("entity") as Entity) || "companies";
  const column = sp.get("column");
  if (!column) return NextResponse.json({ error: "missing column" }, { status: 400 });
  try {
    return NextResponse.json(await getColumnInspector(entity, column));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
