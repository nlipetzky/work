import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Run the signal watch: queries the FREE authoritative sources (ClinicalTrials.gov; USPTO PatentsView
// with a key) for fresh signals and lands the surfaced companies in the prospects spine. No credits.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; since_days?: number };
  try { body = await req.json(); } catch { body = {}; }
  const et = body.engagement_type || "venture";
  const eid = body.engagement_id || "konstellation-cipo";
  const since = String(body.since_days || 14);

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn("node", ["scripts/watch-signals.mjs", et, eid, "--since-days", since], { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => { child.kill("SIGKILL"); resolve(124); }, 120_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });
  return NextResponse.json({ ok: code === 0, output: out.join("") });
}
