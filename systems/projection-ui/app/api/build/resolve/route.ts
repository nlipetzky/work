import { NextResponse } from "next/server";
import { resolveBuildAsk } from "@/lib/builds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST { slug } -> advances that build past its current move's ask. The /build console's only write.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { slug?: string };
    if (!body.slug) {
      return NextResponse.json({ ok: false, error: "missing slug" }, { status: 400 });
    }
    const result = await resolveBuildAsk(body.slug);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
