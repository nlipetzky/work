import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Produce a fundamental list-build artifact from the Targeting surface. Triggers the shared
// deterministic engine (govern-artifacts.mjs) scoped to ONE artifact for the engagement. The driver
// owns produce -> rules-gate -> judge -> propose; AI is a called function. If the hinge inputs are
// thin/unapproved it blocks and records what it needs (no fabrication).

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";
const ALLOWED = new Set(["segment-criteria", "icp-titles", "enrichment-spec", "list-qualification", "discovery-recipe"]);

function run(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => { child.kill("SIGKILL"); resolve(124); }, 180_000);
    child.on("error", () => { clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });
}

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; artifact_type?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id, artifact_type } = body;
  if (!engagement_type || !engagement_id || !artifact_type) return NextResponse.json({ ok: false, error: "engagement_type, engagement_id, artifact_type required" }, { status: 400 });
  if (!ALLOWED.has(artifact_type)) return NextResponse.json({ ok: false, error: "unknown targeting artifact" }, { status: 400 });

  // re-assemble first so the source folds in the latest doctrine + critique + expert notes (no API cost)
  await run("node", ["scripts/assemble-targeting-source.mjs"]);

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn(
      "node",
      ["scripts/govern-artifacts.mjs", "run", engagement_type, engagement_id, "--artifact", artifact_type, "--force"],
      { cwd: CANON_ENGINE_DIR, env: process.env },
    );
    const kill = setTimeout(() => child.kill("SIGKILL"), 180_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });

  const output = out.join("");
  return NextResponse.json({ ok: code === 0, code, output, needsKey: /Missing ANTHROPIC_API_KEY/.test(output), blocked: /⨂ blocked|needs recorded/.test(output) });
}
