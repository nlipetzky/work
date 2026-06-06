import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Disabled by design in v1: no staging->canonical promotion function exists in the
// database yet. Faking a promotion would write a canonical record with no real lineage —
// exactly the kind of invented truth this whole surface exists to prevent.
export async function POST() {
  return NextResponse.json(
    {
      error: "promotion_disabled",
      message:
        "No staging->canonical promotion function exists in the database. Promote is " +
        "disabled until that RPC is added. This is intentional, not a UI bug.",
    },
    { status: 501 },
  );
}
