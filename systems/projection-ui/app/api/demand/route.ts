import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

// Write path for the Demand-Context console. Every mutation persists to public.dc_*
// via the service-role client. One dispatch endpoint keeps the surface small.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// next display ref per account, e.g. OB-07, PT-03
async function nextRef(table: string, accountId: string, prefix: string): Promise<string> {
  const { data } = await db.from(table).select("ref").eq("account_id", accountId);
  const max = (data ?? []).reduce((m: number, r: { ref: string | null }) => {
    const n = parseInt(String(r.ref ?? "").split("-")[1] ?? "0", 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const action = body.action as string;

  try {
    switch (action) {
      case "create_observation": {
        const { account_id, capture_id, grade, quote } = body as {
          account_id: string; capture_id: string; grade?: string; quote: string;
        };
        if (!quote || !quote.trim()) return NextResponse.json({ error: "empty quote" }, { status: 400 });
        const ref = await nextRef("dc_observations", account_id, "OB");
        const { error } = await db.from("dc_observations").insert({
          account_id, capture_id, grade: grade ?? "asserted", quote: quote.trim(), ref,
        });
        if (error) throw error;
        // a capture with observations is no longer "New"
        await db.from("dc_captures").update({ status: "Extracting" }).eq("id", capture_id).eq("status", "New");
        return NextResponse.json({ ok: true });
      }
      case "set_observation_grade": {
        const { id, grade } = body as { id: string; grade: string };
        const { error } = await db.from("dc_observations").update({ grade }).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "set_capture_status": {
        const { capture_id, status } = body as { capture_id: string; status: string };
        const { error } = await db.from("dc_captures").update({ status }).eq("id", capture_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "create_pattern": {
        const { account_id, name } = body as { account_id: string; name?: string };
        const ref = await nextRef("dc_patterns", account_id, "PT");
        const { error } = await db.from("dc_patterns").insert({ account_id, name: name?.trim() || "New pattern", ref });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "rename_pattern": {
        const { id, name } = body as { id: string; name: string };
        if (!name || !name.trim()) return NextResponse.json({ error: "empty name" }, { status: 400 });
        const { error } = await db.from("dc_patterns").update({ name: name.trim() }).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "toggle_pattern_observation": {
        const { pattern_id, observation_id, on } = body as { pattern_id: string; observation_id: string; on: boolean };
        if (on) {
          const { error } = await db
            .from("dc_pattern_observations")
            .upsert({ pattern_id, observation_id }, { onConflict: "pattern_id,observation_id", ignoreDuplicates: true });
          if (error) throw error;
        } else {
          const { error } = await db
            .from("dc_pattern_observations")
            .delete().eq("pattern_id", pattern_id).eq("observation_id", observation_id);
          if (error) throw error;
        }
        return NextResponse.json({ ok: true });
      }
      case "create_artifact": {
        const { account_id, title, type, step } = body as { account_id: string; title: string; type: string; step?: string };
        const ref = await nextRef("dc_artifacts", account_id, "AR");
        const { count } = await db.from("dc_artifacts").select("*", { count: "exact", head: true }).eq("account_id", account_id);
        const { error } = await db.from("dc_artifacts").insert({ account_id, title, type, step, ref, sort: count ?? 0 });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "add_artifact_row": {
        const { artifact_id, label, text, verdict, confidence } = body as {
          artifact_id: string; label?: string; text?: string; verdict?: string; confidence?: string;
        };
        const { count } = await db.from("dc_artifact_rows").select("*", { count: "exact", head: true }).eq("artifact_id", artifact_id);
        const { error } = await db.from("dc_artifact_rows").insert({
          artifact_id, label: label ?? null, text: text ?? "", verdict: verdict ?? null, confidence: confidence ?? null, sort: count ?? 0,
        });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "update_artifact_row": {
        const { id, patch } = body as { id: string; patch: Record<string, unknown> };
        const allowed = ["label", "text", "verdict", "confidence"];
        const clean: Record<string, unknown> = {};
        for (const k of allowed) if (k in patch) clean[k] = patch[k];
        const { error } = await db.from("dc_artifact_rows").update(clean).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "toggle_row_pattern": {
        const { row_id, pattern_id, on } = body as { row_id: string; pattern_id: string; on: boolean };
        if (on) {
          const { error } = await db
            .from("dc_artifact_row_patterns")
            .upsert({ row_id, pattern_id }, { onConflict: "row_id,pattern_id", ignoreDuplicates: true });
          if (error) throw error;
        } else {
          const { error } = await db
            .from("dc_artifact_row_patterns")
            .delete().eq("row_id", row_id).eq("pattern_id", pattern_id);
          if (error) throw error;
        }
        return NextResponse.json({ ok: true });
      }
      case "set_artifact_approved": {
        const { id, approved } = body as { id: string; approved: boolean };
        const { error } = await db.from("dc_artifacts").update({ approved }).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
