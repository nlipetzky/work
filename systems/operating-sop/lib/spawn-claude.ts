// Spawn dispatcher for /operate's "Open in Claude Code" button.
// Per vertical-by-system: the system that owns the mode concept (operating-sop)
// owns the spawn logic. projection-ui imports planSpawn + executeSpawn from here.
//
// Slice 2A scope: mode passthrough + persona manifest read + ENV composition + osascript spawn.
// Context loaders (engagement-context, historical-runs, authoring-context) land in slice 2B/2C.

import { readFileSync, existsSync, symlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawn as childSpawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const WORK_ROOT = "/Users/nplmini/code/work";
const OPERATING_SOP_ROOT = join(WORK_ROOT, "systems/operating-sop");
const RUNTIME_ROOT = join(OPERATING_SOP_ROOT, "runtime");

export type SpawnMode = "run" | "iterate" | "build";

export type SpawnInput = {
  mode: SpawnMode;
  sopId?: string;
  runId?: string;          // RUN required
  stageId?: string;
  nodeId?: string;
  engagementId?: string;   // RUN required
  activityId?: string;     // ITERATE required
};

export type SpawnPlan = {
  cwd: string;
  env: Record<string, string>;
  initialPrompt: string;
  personaPath: string;
  skillsRoot: string;
  sessionId: string;
};

type PersonaManifest = {
  mode: SpawnMode;
  description: string;
  skills_loaded: string[];
  references_loaded: string[];
  env_required: string[];
  env_optional: string[];
};

function readManifest(mode: SpawnMode): PersonaManifest {
  const path = join(OPERATING_SOP_ROOT, `personas/${mode}/manifest.json`);
  if (!existsSync(path)) {
    throw new Error(`persona manifest missing: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as PersonaManifest;
}

function ensureRequiredEnv(input: SpawnInput, manifest: PersonaManifest): void {
  const have: Record<string, string | undefined> = {
    OPERATE_MODE: input.mode,
    SOP_ID: input.sopId,
    RUN_ID: input.runId,
    STAGE_ID: input.stageId,
    NODE_ID: input.nodeId,
    ENGAGEMENT_ID: input.engagementId,
    ACTIVITY_ID: input.activityId,
  };
  const missing = manifest.env_required.filter((k) => !have[k]);
  if (missing.length) {
    throw new Error(
      `spawn input missing required ENV for mode=${manifest.mode}: ${missing.join(", ")}`,
    );
  }
}

// Compose a temp symlink farm for this session so the spawned Claude Code
// finds only the persona's skill bundle first. Returns absolute path to the
// runtime skills root.
function buildSkillsRoot(mode: SpawnMode, sessionId: string, manifest: PersonaManifest): string {
  const root = join(RUNTIME_ROOT, "personas", mode, sessionId, "skills");
  mkdirSync(root, { recursive: true });
  for (const rel of manifest.skills_loaded) {
    const absSource = join(WORK_ROOT, rel);
    if (!existsSync(absSource)) {
      // Skill doesn't exist yet; skip with a note. Slice 2A may run before all skills are authored.
      continue;
    }
    // Symlink the SKILL.md's parent directory under the runtime root, named by the skill slug.
    const skillDir = dirname(absSource);
    const slug = skillDir.split("/").pop()!;
    const target = join(root, slug);
    if (!existsSync(target)) {
      try {
        symlinkSync(skillDir, target, "dir");
      } catch {
        // Best-effort; do not block the spawn on a symlink failure.
      }
    }
  }
  return root;
}

function composeInitialPrompt(input: SpawnInput, manifest: PersonaManifest): string {
  const lines: string[] = [];
  lines.push(`# Session start: operating-sop ${input.mode.toUpperCase()} mode`);
  lines.push("");
  lines.push(`Persona: ${manifest.description}`);
  lines.push(`Persona spec: ${join(OPERATING_SOP_ROOT, `personas/${input.mode}/CLAUDE.md`)}`);
  lines.push("");
  lines.push("## Focus");
  if (input.sopId) lines.push(`- SOP: \`${input.sopId}\``);
  if (input.runId) lines.push(`- SopRun: \`${input.runId}\``);
  if (input.engagementId) lines.push(`- Engagement: \`${input.engagementId}\``);
  if (input.stageId) lines.push(`- Stage: \`${input.stageId}\``);
  if (input.nodeId) lines.push(`- Node: \`${input.nodeId}\``);
  if (input.activityId) lines.push(`- Activity: \`${input.activityId}\``);
  lines.push("");
  lines.push("## Context");
  lines.push("Context is delivered via the operating-sop SessionStart hook (persona spec + focus +");
  lines.push("first move). Your persona CLAUDE.md lists the references + canon reads to assemble the");
  lines.push("rest. Your mode's skills are symlinked under SKILLS_ROOT and live canonically at");
  lines.push("systems/operating-sop/skills/<name>/SKILL.md.");
  lines.push("");
  lines.push(`## First move`);
  if (input.mode === "run") {
    lines.push("Read the persona CLAUDE.md. Then read the engagement folder under");
    lines.push(`accounts/ventures/${input.engagementId}/. Then read the active SopRun + selected`);
    lines.push("activity from canon. Recommend the next concrete move in /operate.");
  } else if (input.mode === "iterate") {
    lines.push("Read the persona CLAUDE.md. Then read the target activity's row in");
    lines.push(`canon.sop_activities (activity_id=${input.activityId}). Then read its run history`);
    lines.push("via canon.activity_runs. Form a hypothesis. Propose ONE tightening.");
  } else {
    lines.push("Read the persona CLAUDE.md + the authoring references it lists, then canon.systems.");
    if (input.activityId) {
      lines.push(
        `Focus: complete the composition for activity \`${input.activityId}\` (its trigger/skills/` +
          "schemas/adapters/provenance may be unset). Use activity-binder + schema-author, propose via",
      );
      lines.push("govern-artifacts; the operator publishes from /operate. Ground every value; invent nothing.");
    } else {
      lines.push("What are we authoring or restructuring today?");
    }
  }
  return lines.join("\n");
}

export async function planSpawn(input: SpawnInput): Promise<SpawnPlan> {
  const manifest = readManifest(input.mode);
  ensureRequiredEnv(input, manifest);

  const sessionId = randomUUID();
  const skillsRoot = buildSkillsRoot(input.mode, sessionId, manifest);

  const env: Record<string, string> = {
    OPERATE_MODE: input.mode,
    PERSONA_PATH: join(OPERATING_SOP_ROOT, `personas/${input.mode}/`),
    SKILLS_ROOT: skillsRoot,
    SPAWN_SESSION_ID: sessionId,
  };
  if (input.sopId) env.SOP_ID = input.sopId;
  if (input.runId) env.RUN_ID = input.runId;
  if (input.stageId) env.STAGE_ID = input.stageId;
  if (input.nodeId) env.NODE_ID = input.nodeId;
  if (input.engagementId) env.ENGAGEMENT_ID = input.engagementId;
  if (input.activityId) env.ACTIVITY_ID = input.activityId;

  return {
    cwd: OPERATING_SOP_ROOT,
    env,
    initialPrompt: composeInitialPrompt(input, manifest),
    personaPath: join(OPERATING_SOP_ROOT, `personas/${input.mode}/`),
    skillsRoot,
    sessionId,
  };
}

// Open Terminal at the planned cwd with ENV vars exported, then launch `claude`.
// Mirrors the working pattern in app/api/operate/open-folder/route.ts:
//   - inner shell uses single quotes (no shell-escape on the values)
//   - outer AppleScript `do script` uses double quotes (escape inner `"`)
// Captures stderr so AppleScript errors are surfaced instead of silent.
function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

export async function executeSpawn(
  plan: SpawnPlan,
): Promise<{ ok: boolean; pid?: number; stderr?: string; script?: string }> {
  const cdPart = `cd ${shellQuote(plan.cwd)}`;
  const exportPart = Object.entries(plan.env)
    .map(([k, v]) => `export ${k}=${shellQuote(v)}`)
    .join(" && ");
  const inner = `${cdPart} && ${exportPart} && claude`;
  const script = [
    `tell application "Terminal" to do script "${inner.replace(/"/g, '\\"')}"`,
    `tell application "Terminal" to activate`,
  ].join("\n");

  return new Promise((resolve) => {
    const proc = childSpawn("osascript", ["-e", script], {
      stdio: ["ignore", "ignore", "pipe"],
      detached: true,
    });
    let stderr = "";
    proc.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", (e) => {
      resolve({ ok: false, stderr: `spawn error: ${String(e)}`, script });
    });
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve({ ok: true, pid: proc.pid });
      } else {
        resolve({
          ok: false,
          pid: proc.pid,
          stderr: stderr.trim() || `osascript exited with code ${code}`,
          script,
        });
      }
    });
    proc.unref();
  });
}
