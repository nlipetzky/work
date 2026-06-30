import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { isAllowedFolder } from "@/lib/operate-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/operate/open-folder
// Body: { folder: "<absolute path under systems/>" }
// Launches Terminal.app via osascript, navigating to the folder and starting `claude`.
// Local-only: refuses if the request Host header isn't a loopback address.

const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "localhost:4180",
  "127.0.0.1:4180",
  "[::1]:4180",
]);

export async function POST(req: Request) {
  const host = req.headers.get("host") ?? "";
  if (!LOOPBACK_HOSTS.has(host)) {
    return NextResponse.json({ error: `host '${host}' not allowed (local only)` }, { status: 403 });
  }

  let folder: string | undefined;
  try {
    const body = (await req.json()) as { folder?: string };
    folder = body.folder;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!folder) {
    return NextResponse.json({ error: "missing folder" }, { status: 400 });
  }
  if (!isAllowedFolder(folder)) {
    return NextResponse.json({ error: "folder not allowed" }, { status: 403 });
  }

  // Quote the folder safely for the shell line that osascript will pass to bash.
  // Single-quoting wraps the path; any embedded single quote is escaped as '\''.
  const safeFolder = `'${folder.replace(/'/g, "'\\''")}'`;
  const inner = `cd ${safeFolder} && claude`;
  const script = `tell application "Terminal" to do script "${inner.replace(/"/g, '\\"')}"\ntell application "Terminal" to activate`;

  try {
    const child = spawn("osascript", ["-e", script], { stdio: "ignore", detached: true });
    child.unref();
    return NextResponse.json({ ok: true, folder, command: inner });
  } catch (e) {
    return NextResponse.json(
      { error: `osascript spawn failed: ${String(e)}`, fallback: inner },
      { status: 500 },
    );
  }
}
