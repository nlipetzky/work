import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Run the Deepline GTM list-builder as a craft critic over a targeting artifact (buildability axis).
// Knowledge-based by default (no paid provider calls). Stores the critique + injects the pushback into
// the artifact's drafting source so a re-Produce optimizes against it.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";
const ALLOWED = new Set(["segment-criteria", "icp-titles", "enrichment-spec", "list-qualification", "discovery-recipe"]);

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; artifact_type?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id, artifact_type } = body;
  if (!engagement_type || !engagement_id || !artifact_type) return NextResponse.json({ ok: false, error: "engagement_type, engagement_id, artifact_type required" }, { status: 400 });
  if (!ALLOWED.has(artifact_type)) return NextResponse.json({ ok: false, error: "unknown targeting artifact" }, { status: 400 });

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn("node", ["scripts/critique-targeting.mjs", engagement_type, engagement_id, artifact_type], { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => child.kill("SIGKILL"), 180_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });

  const output = out.join("");
  return NextResponse.json({ ok: code === 0, code, output, needsKey: /Missing ANTHROPIC_API_KEY/.test(output) });
}
