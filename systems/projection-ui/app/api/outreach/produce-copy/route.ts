import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Produce a channel copy sequence from the surface. Triggers the copy driver
// (produce-sequence.mjs) for one channel. The driver hinges on the APPROVED offer ladder,
// blocks + names the gap if it isn't approved, gates on the channel doctrine, and records
// the input lineage. AI is a called function inside the driver; no fabrication.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; channel?: string; offer?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id, channel, offer } = body;
  if (!engagement_type || !engagement_id || !channel) return NextResponse.json({ ok: false, error: "engagement_type, engagement_id, channel required" }, { status: 400 });
  if (channel !== "linkedin" && channel !== "email") return NextResponse.json({ ok: false, error: "channel must be linkedin or email" }, { status: 400 });

  const args = ["scripts/produce-sequence.mjs", "run", engagement_type, engagement_id, channel];
  if (offer) args.push("--offer", offer);

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn("node", args, { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => child.kill("SIGKILL"), 180_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });

  const output = out.join("");
  const needsKey = /Missing ANTHROPIC_API_KEY/.test(output);
  const blocked = /⨂ blocked/.test(output);
  return NextResponse.json({ ok: code === 0, code, output, needsKey, blocked });
}
