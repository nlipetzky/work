import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves a local artifact (the play/segment file) as raw markdown so it can open in a tab.
// Restricted to the work directory; localhost-only surface.
const ROOT = "/Users/nplmini/code/work/";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("path");
  if (!p || !p.startsWith(ROOT) || p.includes("..")) {
    return NextResponse.json({ error: `path must be under ${ROOT}` }, { status: 400 });
  }
  try {
    const text = await readFile(p, "utf8");
    return new NextResponse(text, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 });
  }
}
