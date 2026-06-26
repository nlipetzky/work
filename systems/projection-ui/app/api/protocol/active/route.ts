import { NextResponse } from "next/server";
import { latestActiveRun } from "@/lib/protocol/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Latest in-flight run, so the Focus surface can restore protocol state after navigation.
export async function GET() {
  try {
    const run = await latestActiveRun();
    return NextResponse.json({ ok: true, run });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
