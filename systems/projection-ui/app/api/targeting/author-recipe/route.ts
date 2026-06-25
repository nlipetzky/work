import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The recipe-authoring agent: given an intent, it discovers live deepline tools, composes a grounded
// discovery recipe (signal -> qualified-leads pipeline), checks for fabricated tools, and records it.
// AI is the composer inside a code-driven driver; the deepline tool universe is the live grounding.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "recipe"; }

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; name?: string; intent?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id, intent } = body;
  const name = slug(body.name || intent || "");
  if (!engagement_type || !engagement_id || !intent?.trim()) return NextResponse.json({ ok: false, error: "engagement_type, engagement_id, intent required" }, { status: 400 });

  const out: string[] = [];
  const code: number = await new Promise((resolve) => {
    const child = spawn("node", ["scripts/author-recipe.mjs", engagement_type, engagement_id, name, intent], { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => { child.kill("SIGKILL"); resolve(124); }, 240_000);
    child.stdout.on("data", (d) => out.push(d.toString()));
    child.stderr.on("data", (d) => out.push(d.toString()));
    child.on("error", (e) => { out.push(`spawn error: ${e.message}`); clearTimeout(kill); resolve(1); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c ?? 0); });
  });

  const output = out.join("");
  return NextResponse.json({ ok: code === 0, code, output, needsKey: /Missing ANTHROPIC_API_KEY/.test(output), insufficient: /could not ground/.test(output) });
}
