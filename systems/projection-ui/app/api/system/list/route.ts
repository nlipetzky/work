import { NextResponse } from "next/server";
import { listRegistrySystems } from "@/lib/queries/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The ecosystem map now reads from canon_engine (the canonical registry),
// not the filesystem registry/. One source of truth.
export async function GET() {
  try {
    const systems = await listRegistrySystems();
    return NextResponse.json({ count: systems.length, systems, errors: [] });
  } catch (e) {
    return NextResponse.json({ count: 0, systems: [], errors: [String(e)] });
  }
}
