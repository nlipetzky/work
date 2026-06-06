import { NextResponse } from "next/server";
import { getStagingState } from "@/lib/queries/staging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getStagingState());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
