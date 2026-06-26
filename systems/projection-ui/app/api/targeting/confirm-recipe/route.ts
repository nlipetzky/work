import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Human approval for an authored recipe (draft -> approved), via the service-role-locked RPC.

export async function POST(req: Request) {
  let body: { recipe_id?: string; confirmed_by?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (!body.recipe_id) return NextResponse.json({ ok: false, error: "recipe_id required" }, { status: 400 });
  try {
    const { data, error } = await canonDb().rpc("confirm_discovery_recipe", { p_recipe_id: body.recipe_id, p_confirmed_by: body.confirmed_by || "Nick" });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, recipe: Array.isArray(data) ? data[0] : data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
