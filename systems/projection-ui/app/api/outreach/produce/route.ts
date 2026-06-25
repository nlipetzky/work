import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Outreach Producer — "Produce" from the surface. Triggers the shared deterministic engine
// (govern-artifacts.mjs) scoped to ONE artifact: the outreach-offer-ladder for this engagement.
// The UI does not reimplement the loop; the driver owns produce -> rules-gate -> judge -> propose,
// with AI as a called function. No fabrication: thin/unapproved source -> it says so honestly.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";
const ARTIFACT = "outreach-offer-ladder";

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id } = body;
  if (!engagement_type || !engagement_id) return NextResponse.json({ ok: false, error: "engagement_type and engagement_id required" }, { status: 400 });

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn(
      "node",
      ["scripts/govern-artifacts.mjs", "run", engagement_type, engagement_id, "--artifact", ARTIFACT, "--force"],
      { cwd: CANON_ENGINE_DIR, env: process.env },
    );
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
