import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { parseSystemMd, validateRecord } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORK = "/Users/nplmini/code/work";
const ROOT = path.join(WORK, "registry");
const run = promisify(execFile);

export async function GET(req: NextRequest) {
  const constellation = req.nextUrl.searchParams.get("constellation") || "";
  const slug = req.nextUrl.searchParams.get("slug") || "";
  if (!/^[a-z0-9-]+$/.test(constellation) || !/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  const dir = path.join(ROOT, constellation, slug);
  const file = path.join(dir, "system.md");
  if (!file.startsWith(ROOT) || !existsSync(file))
    return NextResponse.json({ error: "not found" }, { status: 404 });

  let record, warnings;
  try {
    record = parseSystemMd(readFileSync(file, "utf8"), file);
    warnings = validateRecord(record);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }

  let history: { hash: string; date: string; subject: string }[] = [];
  try {
    const { stdout } = await run(
      "git", ["log", "-15", "--pretty=format:%h|%ad|%s", "--date=format:%Y-%m-%d %H:%M", "--", dir],
      { cwd: WORK }
    );
    history = stdout.split("\n").filter(Boolean).map((l) => {
      const [hash, date, ...s] = l.split("|");
      return { hash, date, subject: s.join("|") };
    });
  } catch { /* git unavailable: history stays empty */ }

  return NextResponse.json({ record, warnings, history });
}
