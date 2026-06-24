import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Operate-from-the-UI: triggers the Artifact Assembler's deterministic driver for an
// engagement. The UI does NOT reimplement the loop — it invokes the one driver
// (systems/canon-engine/scripts/govern-artifacts.mjs), which owns produce -> rules-gate
// -> review -> propose. AI is a called function inside that driver. If the driver is
// missing ANTHROPIC_API_KEY or the source is thin, it says so honestly (no fabrication).

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id } = body;
  if (!engagement_type || !engagement_id) return NextResponse.json({ ok: false, error: "engagement_type and engagement_id required" }, { status: 400 });

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn("node", ["scripts/govern-artifacts.mjs", "run", engagement_type, engagement_id], {
      cwd: CANON_ENGINE_DIR,
      env: process.env, // carries CANON_SUPABASE_*; ANTHROPIC_API_KEY if configured
    });
    const kill = setTimeout(() => child.kill("SIGKILL"), 180_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });

  const output = out.join("");
  const needsKey = /Missing ANTHROPIC_API_KEY/.test(output);
  return NextResponse.json({ ok: code === 0, code, output, needsKey });
}
