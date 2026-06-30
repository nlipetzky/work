import { NextResponse } from "next/server";
import { listAvailableSkills } from "@/lib/queries/availableSkills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/operate/available-skills
// Returns active + draft skills from canon.public.skills. Used by the
// CompositionRows skill swap/add panels in ITERATE/BUILD mode.

export async function GET() {
  try {
    const skills = await listAvailableSkills();
    return NextResponse.json({ skills });
  } catch (e) {
    const detail =
      e instanceof Error
        ? { message: e.message, stack: e.stack?.split("\n").slice(0, 4) }
        : typeof e === "object" && e !== null
          ? Object.fromEntries(
              ["code", "message", "details", "hint"]
                .map((k) => [k, (e as Record<string, unknown>)[k]])
                .filter(([, v]) => v !== undefined),
            )
          : { raw: String(e) };
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
