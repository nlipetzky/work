// Build console — the interactive surface for the system-building system. Its own tab (NOT the
// /system anatomy page). Where the operator watches every system being built move through the four
// moves and acts on the one pending ask per build, on the surface, never in chat. Pure-canon read;
// the single mutation goes through app/api/build/resolve.

import { listSystemBuilds } from "@/lib/queries/builds";
import BuildSurface from "./BuildSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BuildPage() {
  try {
    const builds = await listSystemBuilds();
    return <BuildSurface builds={builds} />;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
