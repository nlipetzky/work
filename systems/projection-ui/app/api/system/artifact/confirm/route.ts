import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Human oversight from the UI: confirm a draft artifact -> approved. Goes through the
// governed-write RPC (confirm_artifact), never a direct UPDATE. This is the human
// confirmation step in the AI-proposes / human-confirms model.

export async function POST(req: Request) {
  let body: { artifact_id?: string; confirmed_by?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { artifact_id, confirmed_by } = body;
  if (!artifact_id || !confirmed_by) return NextResponse.json({ ok: false, error: "artifact_id and confirmed_by required" }, { status: 400 });

  const { data, error } = await canonDb().rpc("confirm_artifact", { p_artifact_id: artifact_id, p_confirmed_by: confirmed_by });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ ok: true, artifact: row });
}
