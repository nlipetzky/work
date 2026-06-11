import { NextRequest, NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lists every markdown file under accounts/ (clients + ventures + prospects) so the Context
// reader can browse the strategic docs for any engagement. Localhost-only surface; reads are
// restricted to this ROOT with a path-traversal guard, same posture as /api/playfile.
const ROOT = "/Users/nplmini/code/work/accounts/";

async function walk(dir: string, acc: string[], exts: string[]) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc, exts);
    else if (e.isFile() && exts.some((x) => e.name.toLowerCase().endsWith("." + x))) acc.push(full);
  }
}

export async function GET(req: NextRequest) {
  const exts = (req.nextUrl.searchParams.get("exts") || "md").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const sub = req.nextUrl.searchParams.get("root") || "";
  const base = path.normalize(path.join(ROOT, sub));
  if (!base.startsWith(ROOT) || base.includes("..")) {
    return NextResponse.json({ error: `root must be under ${ROOT}` }, { status: 400 });
  }
  const files: string[] = [];
  await walk(base, files, exts);
  files.sort();
  const items = files.map((f) => ({ path: f, rel: path.relative(ROOT, f) }));
  return NextResponse.json({ root: ROOT, count: items.length, items });
}
