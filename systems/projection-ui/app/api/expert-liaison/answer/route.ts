import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { canonDb } from "@/lib/canon";
import { sourcePathFor } from "@/lib/queries/governedArtifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The human-input path for the Expert Liaison console: an operator answers/guides an artifact's
// open questions. Two effects, both feeding the Assembler's existing inputs (no new source model):
//   1. The answers are composed into the artifact's SOURCE file (sourcePathFor) — what the
//      Assembler reads on Initiate. So answering turns a gap into source-ready.
//   2. The (possibly edited) questions are persisted to canon_artifact_manifest.needs via the
//      set_artifact_needs RPC — so the operator's guidance/course-correction sticks for next time
//      (incl. future autonomous asks).
// Path is resolved server-side via sourcePathFor (trusted), never from a client-supplied path.

interface Body {
  engagement_type?: string;
  engagement_id?: string;
  artifact_type?: string;
  layer?: string | null;
  questions?: string[];        // possibly edited by the operator
  answers?: string[];          // parallel to questions
  notes?: string;
  needs_summary?: string;
  answered_by?: string;
}

export async function POST(req: Request) {
  let b: Body;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { engagement_type, engagement_id, artifact_type } = b;
  if (!engagement_type || !engagement_id || !artifact_type) {
    return NextResponse.json({ ok: false, error: "engagement_type, engagement_id, artifact_type required" }, { status: 400 });
  }
  const questions = b.questions ?? [];
  const answers = b.answers ?? [];
  const answeredBy = b.answered_by || "Nick Lipetzky (marketing)";

  // 1. compose the source doc from the Q&A the operator provided
  const lines: string[] = [
    `# Source input — ${artifact_type}`,
    `Provided by ${answeredBy} via the Expert Liaison console.`,
    "",
  ];
  questions.forEach((q, i) => {
    const a = (answers[i] ?? "").trim();
    if (!q.trim() && !a) return;
    lines.push(`## ${q.trim() || `Question ${i + 1}`}`);
    lines.push(a || "_(no answer yet)_");
    lines.push("");
  });
  if (b.notes && b.notes.trim()) { lines.push("## Notes", b.notes.trim(), ""); }
  const content = lines.join("\n");

  // 2. write it to the artifact's source path (resolved server-side)
  const abs = sourcePathFor(engagement_type, engagement_id, b.layer ?? null, artifact_type);
  try {
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content, "utf8");
  } catch (e) {
    return NextResponse.json({ ok: false, error: `write source failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // 3. persist the (possibly edited) questions back to the manifest needs
  const { error } = await canonDb().rpc("set_artifact_needs", {
    p_engagement_type: engagement_type,
    p_engagement_id: engagement_id,
    p_artifact_type: artifact_type,
    p_needs: { summary: b.needs_summary ?? "", questions: questions.filter((q) => q.trim()) },
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, source_path: abs.replace("/Users/nplmini/code/work/", ""), bytes: content.length });
}
