import { NextRequest, NextResponse } from "next/server";
import { listRecords, listPlays } from "@/lib/queries/records";
import type { Entity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entity = (sp.get("entity") as Entity) || "companies";
  if (entity !== "companies" && entity !== "contacts") {
    return NextResponse.json({ error: "bad entity" }, { status: 400 });
  }
  try {
    if (sp.get("plays")) {
      return NextResponse.json({ plays: await listPlays(entity) });
    }
    const result = await listRecords(entity, {
      search: sp.get("search") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : 0,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 50,
      sort: sp.get("sort") ?? undefined,
      desc: sp.get("desc") ? sp.get("desc") === "true" : true,
      play: sp.get("play") ?? undefined,
      fit: sp.get("fit") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
