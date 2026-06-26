import { NextResponse } from "next/server";
import { proposePlan } from "@/lib/planning/propose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Plan Intake — propose spine changes from plain-language intent. READ-ONLY (no writes).
export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text: string };
    if (!text || !text.trim()) return NextResponse.json({ ok: false, error: "text required" }, { status: 400 });
    const proposal = await proposePlan(text);
    return NextResponse.json({ ok: true, proposal });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
