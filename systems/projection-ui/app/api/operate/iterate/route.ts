import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/operate/iterate
// Body: {
//   activityId: string,
//   draft: {
//     functionPath?: string | null,
//     triggerEvent?: string | null,
//     schemas?: { in?: string; out?: string } | null,
//     adapters?: string[],
//     skills?: string[],          // slugs
//     description?: string | null,
//   }
// }
//
// Reads the current canon.sop_activities row for activityId (is_current=true),
// computes version+1, and INSERTS a new row carrying all fields from the
// source row PLUS the draft overrides. The new row lands as
// (version=current+1, is_current=false) -- it stays a draft until a future
// BUILD-mode publish step flips is_current.
//
// The partial unique index `sop_activities_current_uq` (activity_id WHERE
// is_current) keeps the previous current row unaffected: draft writes never
// collide because is_current=false. Multiple sequential iterations bump version
// (current+1, current+2, ...).

type DraftBody = {
  activityId?: string;
  draft?: {
    functionPath?: string | null;
    triggerEvent?: string | null;
    schemas?: { in?: string; out?: string } | null;
    adapters?: string[];
    skills?: string[];
    description?: string | null;
  };
};

export async function POST(req: Request) {
  let body: DraftBody;
  try {
    body = (await req.json()) as DraftBody;
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const activityId = body.activityId?.trim();
  if (!activityId) {
    return NextResponse.json({ error: "activityId required" }, { status: 400 });
  }
  const draft = body.draft ?? {};

  const db = canonDb();
  try {
    const { data: current, error: readErr } = await db
      .from("sop_activities")
      .select("*")
      .eq("activity_id", activityId)
      .eq("is_current", true)
      .maybeSingle();
    if (readErr) {
      return NextResponse.json(
        { error: { code: readErr.code, message: readErr.message } },
        { status: 500 },
      );
    }
    if (!current) {
      return NextResponse.json(
        { error: `activity_id not found (or no current row): ${activityId}` },
        { status: 404 },
      );
    }

    const nextVersion = ((current.version as number) ?? 1) + 1;

    // Build the new row: copy every column from the source, overlay draft
    // fields, force version + is_current. Strip server-managed timestamps so
    // they default fresh.
    const newRow: Record<string, unknown> = { ...current };
    delete newRow.created_at;
    delete newRow.updated_at;
    newRow.version = nextVersion;
    newRow.is_current = false;

    if ("functionPath" in draft) newRow.function_path = draft.functionPath ?? null;
    if ("triggerEvent" in draft) newRow.trigger_event = draft.triggerEvent ?? null;
    if ("schemas" in draft) newRow.schemas = draft.schemas ?? null;
    if ("adapters" in draft) newRow.adapters = draft.adapters ?? [];
    if ("skills" in draft) newRow.skills = draft.skills ?? [];
    if ("description" in draft) newRow.description = draft.description ?? null;

    const { data: inserted, error: insertErr } = await db
      .from("sop_activities")
      .insert(newRow)
      .select()
      .single();
    if (insertErr) {
      return NextResponse.json(
        {
          error: {
            code: insertErr.code,
            message: insertErr.message,
            details: insertErr.details,
            hint: insertErr.hint,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      activityId,
      version: nextVersion,
      isCurrent: false,
      row: inserted,
    });
  } catch (e) {
    const detail =
      e instanceof Error
        ? { message: e.message, stack: e.stack?.split("\n").slice(0, 4) }
        : { raw: String(e) };
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
