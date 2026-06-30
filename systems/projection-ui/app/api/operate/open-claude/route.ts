// Mode-aware spawn endpoint for /operate's "Open in Claude Code" button.
// Replaces the legacy /api/operate/open-folder which only took { folder }.
//
// Request:
//   POST /api/operate/open-claude
//   { mode, sopId?, runId?, stageId?, nodeId?, engagementId?, activityId?, dryRun? }
//
// Behavior:
//   - Reads systems/operating-sop/personas/<mode>/manifest.json
//   - Composes ENV vars + symlink-farm skills root
//   - If dryRun=true: returns the SpawnPlan (no Terminal opens). Useful for tests + UI debugging.
//   - Else: spawns Terminal via osascript at the operating-sop cwd with ENV exported.
//
// Loopback-only: rejects requests whose Host header isn't 127.0.0.1 / localhost.

import { NextRequest, NextResponse } from "next/server";
import { planSpawn, executeSpawn, type SpawnMode } from "../../../../../operating-sop/lib/spawn-claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLoopback(req: NextRequest): boolean {
  const host = req.headers.get("host") ?? "";
  // Allow "localhost" or "127.0.0.1" with any port. Reject everything else.
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

const VALID_MODES = new Set<SpawnMode>(["run", "iterate", "build"]);

export async function POST(req: NextRequest) {
  if (!isLoopback(req)) {
    return NextResponse.json(
      { error: "open-claude is loopback-only" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const mode = body.mode as string | undefined;
  if (!mode || !VALID_MODES.has(mode as SpawnMode)) {
    return NextResponse.json(
      { error: `mode must be one of run|iterate|build (got: ${mode})` },
      { status: 400 },
    );
  }

  const dryRun = body.dryRun === true;

  const input = {
    mode: mode as SpawnMode,
    sopId: typeof body.sopId === "string" ? body.sopId : undefined,
    runId: typeof body.runId === "string" ? body.runId : undefined,
    stageId: typeof body.stageId === "string" ? body.stageId : undefined,
    nodeId: typeof body.nodeId === "string" ? body.nodeId : undefined,
    engagementId: typeof body.engagementId === "string" ? body.engagementId : undefined,
    activityId: typeof body.activityId === "string" ? body.activityId : undefined,
  };

  try {
    const plan = await planSpawn(input);
    if (dryRun) {
      return NextResponse.json({ dryRun: true, plan });
    }
    const result = await executeSpawn(plan);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          sessionId: plan.sessionId,
          error: result.stderr ?? "osascript spawn failed",
          script: result.script,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      pid: result.pid ?? null,
      sessionId: plan.sessionId,
      personaPath: plan.personaPath,
      skillsRoot: plan.skillsRoot,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
