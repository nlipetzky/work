// Server-side helpers for the /operate Run + Open-Folder + Prompt endpoints.
//
// Allowlists, ledger writes, and runner-spawn live here so the route files stay
// thin. Slice 1: ledger is the existing public.prep_run_status table (handoff
// open item #1 — generalize to operating-sop's own run_ledger in slice 2+).

import "server-only";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { db } from "@/lib/supabase";
import { canonDb } from "@/lib/canon";
import { SOPS } from "@/lib/sops";
import type { Activity, SopRun } from "@/lib/sops";

// Canon dual-write (best-effort). prep_run_status (revops) stays the live tail
// the UI polls; canon.activity_runs is the durable cross-engagement history the
// /operate Runs panel reads. Failures here never break the primary ledger write.
async function canonRunInsert(runId: string, activityId: string, mode: "plan" | "execute") {
  try {
    await canonDb().from("activity_runs").insert({
      run_id: runId,
      activity_id: activityId,
      mode,
      status: "running",
      started_at: new Date().toISOString(),
    });
  } catch {
    /* best-effort */
  }
}
async function canonRunFinish(runId: string, status: "done" | "error", message: string) {
  try {
    await canonDb()
      .from("activity_runs")
      .update({ status, message: message.slice(0, 1000), finished_at: new Date().toISOString() })
      .eq("run_id", runId);
  } catch {
    /* best-effort */
  }
}

const WORK_ROOT = "/Users/nplmini/code/work";

// ─── Allowlist guards ──────────────────────────────────────────────────────

const PROMPT_ALLOWED_PREFIXES = [
  `${WORK_ROOT}/systems/`,
  `${WORK_ROOT}/accounts/ventures/`,
  `${WORK_ROOT}/accounts/clients/`,
  `${WORK_ROOT}/practices/`,
];

const FOLDER_ALLOWED_PREFIX = `${WORK_ROOT}/systems/`;

export function isAllowedPromptPath(p: string): boolean {
  if (!p) return false;
  const resolved = path.resolve(p);
  return PROMPT_ALLOWED_PREFIXES.some((pre) => resolved.startsWith(pre));
}

export function isAllowedFolder(p: string): boolean {
  if (!p) return false;
  const resolved = path.resolve(p);
  return resolved.startsWith(FOLDER_ALLOWED_PREFIX);
}

// ─── Activity lookup ──────────────────────────────────────────────────────

export function findActivity(
  activityId: string,
): { activity: Activity; run: SopRun | null } | null {
  for (const b of SOPS) {
    const a = b.activities.find((x) => x.activity_id === activityId);
    if (a) return { activity: a, run: b.runs[0] ?? null };
  }
  return null;
}

// Slice 1 placeholder substitution. The activity carries `runner.args` with
// `<engagement>` placeholders; the active SopRun supplies the value. Any
// placeholder we don't know how to substitute is left as-is so the runner
// errors honestly (rather than silently running with a literal `<placeholder>`).
function substitutePlaceholders(args: string[], run: SopRun | null): string[] {
  const vars: Record<string, string> = run
    ? { engagement: run.target_engagement }
    : {};
  return args.map((a) => a.replace(/<([^>]+)>/g, (_, key) => vars[key] ?? `<${key}>`));
}

// ─── Run-ledger writes ────────────────────────────────────────────────────
// We namespace operating-sop rows in prep_run_status by encoding the activity
// + mode into the `stage` column ("op-sop:<activity_id>:<mode>"). The unique
// constraint is (run_id, stage), so concurrent runs of the same activity each
// get their own run_id and don't collide.

const OP_SOP_PREFIX = "op-sop";

function stageStr(activityId: string, mode: "plan" | "execute") {
  return `${OP_SOP_PREFIX}:${activityId}:${mode}`;
}

export async function seedRun(
  runId: string,
  activityId: string,
  mode: "plan" | "execute",
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from("prep_run_status").insert({
    run_id: runId,
    batch_id: `op-sop:${activityId}`,
    entity: activityId,
    stage: stageStr(activityId, mode),
    stage_order: 0,
    status: "running",
    started_at: now,
    updated_at: now,
    counts: {},
    message: `mode=${mode}, queued`,
  });
  if (error) throw new Error(`seed run ledger failed: ${error.message}`);
  await canonRunInsert(runId, activityId, mode);
}

export async function setMessage(runId: string, message: string): Promise<void> {
  await db
    .from("prep_run_status")
    .update({ message: message.slice(0, 1000), updated_at: new Date().toISOString() })
    .eq("run_id", runId);
}

export async function markDone(runId: string, message: string): Promise<void> {
  await db
    .from("prep_run_status")
    .update({ status: "done", message: message.slice(0, 1000), updated_at: new Date().toISOString() })
    .eq("run_id", runId);
  await canonRunFinish(runId, "done", message);
}

export async function markError(runId: string, message: string): Promise<void> {
  await db
    .from("prep_run_status")
    .update({ status: "error", message: message.slice(0, 1000), updated_at: new Date().toISOString() })
    .eq("run_id", runId);
  await canonRunFinish(runId, "error", message);
}

export type RunRow = {
  run_id: string;
  batch_id: string;
  entity: string;
  stage: string;
  status: "pending" | "running" | "done" | "error";
  started_at: string | null;
  updated_at: string;
  message: string | null;
  counts: Record<string, number> | null;
};

export async function getRun(runId: string): Promise<RunRow | null> {
  const { data, error } = await db
    .from("prep_run_status")
    .select("run_id, batch_id, entity, stage, status, started_at, updated_at, message, counts")
    .eq("run_id", runId)
    .single();
  if (error || !data) return null;
  return data as RunRow;
}

// ─── PLAN-mode gate (slice-1 policy) ──────────────────────────────────────
// Only safe / idempotent runners may be invoked in PLAN mode in slice 1.
// Credit-spenders need the EXECUTE confirm flow (slice-2 build).

export type PlanGate = { ok: true } | { ok: false; reason: string };

export function canPlanRun(activity: Activity): PlanGate {
  if (activity.static_status === "blocked") {
    return { ok: false, reason: activity.block_reason ?? "activity is blocked" };
  }
  if (activity.credit_spender) {
    return {
      ok: false,
      reason: "credit-spender: PLAN mode unsafe (runner writes unconditionally); EXECUTE confirm flow is a slice-2 build",
    };
  }
  if (activity.runner.type !== "node-script" && activity.runner.type !== "sql-rpc") {
    return { ok: false, reason: `runner type '${activity.runner.type}' not supported in slice 1` };
  }
  if (activity.runner.type === "node-script" && !activity.runner.path) {
    return { ok: false, reason: "runner has no path" };
  }
  return { ok: true };
}

// ─── Runner spawn (background, async) ─────────────────────────────────────
// Called after the API route has returned its run_id — the route does NOT
// await this. The child writes to the ledger as it progresses.

export function executeRun(
  runId: string,
  activity: Activity,
  mode: "plan" | "execute",
  run: SopRun | null,
): void {
  if (mode === "execute") {
    void markError(
      runId,
      "EXECUTE not wired in slice 1 — credit-spender confirm flow is a slice-2 build",
    );
    return;
  }

  if (activity.runner.type === "sql-rpc") {
    void runSqlRpc(runId, activity, run);
    return;
  }
  if (activity.runner.type === "node-script" && activity.runner.path) {
    runNodeScript(runId, activity, run);
    return;
  }
  void markError(runId, `unsupported runner type: ${activity.runner.type}`);
}

function runNodeScript(runId: string, activity: Activity, run: SopRun | null): void {
  const cwd = activity.runner.cwd ?? process.cwd();
  const resolvedArgs = substitutePlaceholders(activity.runner.args ?? [], run);
  const args = [activity.runner.path!, ...resolvedArgs];

  let lastLine = "spawned";
  void setMessage(runId, `spawn: node ${args[0]} ${args.slice(1).join(" ")}`);

  let child;
  try {
    child = spawn("node", args, { cwd, env: process.env });
  } catch (e) {
    void markError(runId, `spawn failed: ${String(e)}`);
    return;
  }

  child.stdout.on("data", (buf: Buffer) => {
    const line = buf.toString().trim().split("\n").pop();
    if (line) {
      lastLine = line;
      void setMessage(runId, line);
    }
  });
  child.stderr.on("data", (buf: Buffer) => {
    const line = buf.toString().trim().split("\n").pop();
    if (line) lastLine = `stderr: ${line}`;
  });
  child.on("error", (err) => {
    void markError(runId, `child error: ${err.message}`);
  });
  child.on("exit", (code) => {
    if (code === 0) void markDone(runId, lastLine);
    else void markError(runId, `exit ${code}: ${lastLine}`);
  });
}

async function runSqlRpc(runId: string, activity: Activity, run: SopRun | null): Promise<void> {
  const name = activity.runner.path;
  if (!name) {
    await markError(runId, "sql-rpc has no RPC name");
    return;
  }
  const args = substitutePlaceholders(activity.runner.args ?? [], run);
  // If any placeholders remain unsubstituted (e.g. `<batch>` — there's no
  // selected-batch state in slice 1), refuse with a clear message.
  if (args.some((a) => /^<.+>$/.test(a))) {
    await markError(
      runId,
      `cannot invoke RPC '${name}' with unresolved placeholder args ${JSON.stringify(args)} — slice 2: bind <batch> from a selected batch`,
    );
    return;
  }
  try {
    await setMessage(runId, `calling rpc ${name}`);
    const { data, error } = await db.rpc(
      name,
      Object.fromEntries(args.map((a, i) => [`arg${i}`, a])),
    );
    if (error) throw error;
    await markDone(runId, `rpc ${name} ok: ${JSON.stringify(data).slice(0, 200)}`);
  } catch (e) {
    await markError(runId, `rpc ${name} failed: ${String(e)}`);
  }
}

export { randomUUID };
