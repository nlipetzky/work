import { NextRequest, NextResponse } from "next/server";
import { promoteBatch } from "@/lib/queries/staging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Real write into the working tables, on-rails via promote_staging_batch(). Triggered by an
// operator clicking Promote on a reviewed batch — the human-in-the-loop checkpoint.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, entity } = body ?? {};
    if (!batchId || (entity !== "contacts" && entity !== "companies")) {
      return NextResponse.json({ error: "need batchId and entity (contacts|companies)" }, { status: 400 });
    }
    const result = await promoteBatch(batchId, entity, "projection-ui");
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
