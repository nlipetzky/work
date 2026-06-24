import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read one artifact's content so it can be reviewed BEFORE approval. Read-only.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await canonDb()
    .from("canon_artifacts")
    .select("id, artifact_type, version, status, content_md, approver, approval_channel, confirmed_by, confirmed_at, updated_at, path")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  return NextResponse.json({ ok: true, artifact: data });
}
