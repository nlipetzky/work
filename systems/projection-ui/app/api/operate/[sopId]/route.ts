import { NextResponse } from "next/server";
import { detailById } from "@/lib/queries/operatingSop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ sopId: string }> }) {
  const { sopId } = await ctx.params;
  try {
    const d = await detailById(sopId);
    if (!d) {
      return NextResponse.json({ error: `sop not found: ${sopId}` }, { status: 404 });
    }
    return NextResponse.json(d);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
