import { NextResponse } from "next/server";
import { setWeeklyIntent } from "@/lib/moves";
import type { SetWeeklyIntent } from "@/lib/moves/schemas";
import type { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Set the current/next week's intent via the enforced move (percentages must sum to ~100).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as z.input<typeof SetWeeklyIntent>;
    const result = await setWeeklyIntent(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
