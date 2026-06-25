import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The expert-input channel: record an operator/expert note on a targeting artifact, then re-assemble the
// drafting sources so the note is folded in and the next Produce incorporates it. This is how a domain
// expert injects knowledge the AI lacks (e.g. "watch USPTO PatentsView for patent signals") without a chat.

const CANON_ENGINE_DIR = "/Users/nplmini/code/work/systems/canon-engine";
const ALLOWED = new Set(["segment-criteria", "icp-titles", "enrichment-spec", "list-qualification", "discovery-recipe"]);

export async function POST(req: Request) {
  let body: { engagement_type?: string; engagement_id?: string; artifact_type?: string; note?: string; author?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id, artifact_type, note, author } = body;
  if (!engagement_type || !engagement_id || !artifact_type || !note?.trim()) return NextResponse.json({ ok: false, error: "engagement_type, engagement_id, artifact_type, note required" }, { status: 400 });
  if (!ALLOWED.has(artifact_type)) return NextResponse.json({ ok: false, error: "unknown targeting artifact" }, { status: 400 });

  const { data, error } = await canonDb().rpc("record_operator_note", {
    p_engagement_type: engagement_type, p_engagement_id: engagement_id,
    p_artifact_type: artifact_type, p_note: note.trim(), p_author: author || "Nick",
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // re-assemble the drafting sources so the note is folded in (no API cost; deterministic)
  const reassembled: boolean = await new Promise((resolve) => {
    const child = spawn("node", ["scripts/assemble-targeting-source.mjs"], { cwd: CANON_ENGINE_DIR, env: process.env });
    const kill = setTimeout(() => { child.kill("SIGKILL"); resolve(false); }, 30_000);
    child.on("error", () => { clearTimeout(kill); resolve(false); });
    child.on("close", (c) => { clearTimeout(kill); resolve(c === 0); });
  });

  return NextResponse.json({ ok: true, note: Array.isArray(data) ? data[0] : data, reassembled });
}
