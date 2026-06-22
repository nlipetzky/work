import { NextResponse } from "next/server";
import { listInventory } from "@/lib/queries/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inventory reads from canon_engine (the canonical registry), not the filesystem.
export async function GET() {
  try {
    return NextResponse.json(await listInventory());
  } catch (e) {
    return NextResponse.json({ count: 0, systems: [], errors: [String(e)] });
  }
}
