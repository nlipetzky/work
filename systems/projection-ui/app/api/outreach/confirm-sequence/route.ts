import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Human approval for a System M copy sequence (draft -> approved). Goes through the
// service-role-locked confirm_outreach_sequence RPC (the sanctioned write path).

export async function POST(req: Request) {
  let body: { sequence_id?: string; confirmed_by?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  const { sequence_id, confirmed_by } = body;
  if (!sequence_id) return NextResponse.json({ ok: false, error: "sequence_id required" }, { status: 400 });
  try {
    const { data, error } = await canonDb().rpc("confirm_outreach_sequence", {
      p_sequence_id: sequence_id, p_confirmed_by: confirmed_by || "Nick",
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, sequence: row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
