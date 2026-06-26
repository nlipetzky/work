import { NextResponse } from "next/server";
import { proposeTask } from "@/lib/moves";
import type { ProposeTask } from "@/lib/moves/schemas";
import type { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// HTTP surface for the propose_task semantic move (Atlas decomposing a goal/project into tasks).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as z.input<typeof ProposeTask>;
    const result = await proposeTask(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
