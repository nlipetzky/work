import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Advance prospects through enrichment toward qualified leads. Default = PLAN (free, mutates nothing).
// { execute: true } runs the deepline provider pipeline and SPENDS Deepline credits (needs an active
// subscription). The UI labels the execute path clearly; nothing spends without it.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; limit?: number; execute?: boolean };
  try { body = await req.json(); } catch { body = {}; }
  const et = body.engagement_type || "venture";
  const eid = body.engagement_id || "konstellation-cipo";
  const args = ["scripts/enrich-prospects.mjs", et, eid, "--limit", String(body.limit || 10)];
  if (body.execute) args.push("--execute");

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn("node", args, { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => { child.kill("SIGKILL"); resolve(124); }, 180_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });
  return NextResponse.json({ ok: code === 0 || code === 2, output: out.join(""), gated: !body.execute });
}
