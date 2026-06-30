import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { isAllowedPromptPath } from "@/lib/operate-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/operate/prompt?path=<absolute_path>
// Reads a prompt markdown file from disk and returns its text. The path must
// be under one of the allowlisted prefixes (systems/*, accounts/*, practices/*)
// — anything else is refused without revealing why.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams.get("path");
  if (!p) {
    return NextResponse.json({ error: "missing ?path" }, { status: 400 });
  }
  if (!isAllowedPromptPath(p)) {
    return NextResponse.json({ error: "path not allowed" }, { status: 403 });
  }
  try {
    const text = await readFile(p, "utf8");
    return NextResponse.json({ path: p, text });
  } catch (e) {
    return NextResponse.json({ error: `read failed: ${String(e)}` }, { status: 404 });
  }
}
