import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-emit a revops/batch.promoted event for a past batch.
// Idempotent: Airtable upserts on "Supabase ID", so re-sending overwrites with current Postgres truth.
// Use to recover a missed sync or to catch up records where airtable_synced_at is null.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, entity } = body ?? {};
    if (!batchId || (entity !== "contacts" && entity !== "companies")) {
      return NextResponse.json(
        { error: "need batchId and entity (contacts|companies)" },
        { status: 400 },
      );
    }
    await inngest.send({
      name: "revops/batch.promoted",
      data: {
        batchId,
        entity,
        promotedBy: "resync",
        promotedAt: new Date().toISOString(),
        counts: {},
      },
    });
    return NextResponse.json({ ok: true, batchId, entity });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
