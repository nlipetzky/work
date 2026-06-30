#!/usr/bin/env node
// SessionStart hook for operating-sop: when the session was spawned by the
// /api/operate/open-claude endpoint, $OPERATE_MODE + $PERSONA_PATH + the focus
// envvars are set. Read the persona CLAUDE.md and inject persona + focus context
// via SessionStart additionalContext, so the operator does not have to manually
// nudge "read your persona spec at..."
//
// When OPERATE_MODE is absent (regular human-launched claude here), do nothing
// and let the normal CLAUDE.md walk-up happen.
//
// Failure mode: silent. Any throw exits 0 with no injection.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 8000;

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function buildFocusBlock() {
  const fields = [
    ["SOP", process.env.SOP_ID],
    ["SopRun", process.env.RUN_ID],
    ["Engagement", process.env.ENGAGEMENT_ID],
    ["Stage", process.env.STAGE_ID],
    ["Node", process.env.NODE_ID],
    ["Activity", process.env.ACTIVITY_ID],
    ["Spawn session", process.env.SPAWN_SESSION_ID],
  ].filter(([, v]) => Boolean(v));
  if (fields.length === 0) return null;
  return fields.map(([k, v]) => `- ${k}: \`${v}\``).join("\n");
}

function firstMoveByMode(mode) {
  if (mode === "run") {
    return [
      "Read this engagement's CLAUDE.md and relevant artifacts at",
      `\`accounts/ventures/${process.env.ENGAGEMENT_ID || "<engagement>"}/\`.`,
      "Then read the selected activity's current state.",
      "Recommend the next concrete move in /operate.",
    ].join(" ");
  }
  if (mode === "iterate") {
    return [
      `Read the activity's current row for \`${process.env.ACTIVITY_ID || "<activity>"}\``,
      "from canon.sop_activities + its run history from canon.activity_runs.",
      "Form ONE hypothesis. Propose ONE tightening.",
    ].join(" ");
  }
  if (mode === "build") {
    const act = process.env.ACTIVITY_ID;
    const lines = [
      "You author SOPs / workflows / activities and scaffold supporting code; every write is proposed through govern-artifacts (never a direct INSERT or freehand file).",
      "Your authoring skills are auto-loaded here ... invoke them via the Skill tool: sop-writer, workflow-composer, activity-binder, function-scaffolder, schema-author, adapter-author (canonical bodies at systems/operating-sop/skills/<name>/SKILL.md).",
    ];
    if (act) {
      lines.push(
        `Focus: complete the composition for activity \`${act}\`. Read its current row in canon.sop_activities ` +
          "(function_path is set; trigger_event / skills / schemas / adapters / provenance may be unset). " +
          "Use activity-binder (and schema-author for the in/out contracts) to author the missing pieces, " +
          "propose them via govern-artifacts, then the operator publishes from /operate (Publish v+1). " +
          "Do NOT invent values you cannot ground in the runner, the existing code, or Nick's confirmation.",
      );
    } else {
      lines.push(
        "Read the BUILD-mode references (vertical-system-pattern, system-folder-standard, three-layer-work-model) " +
          "and the current canon.systems registry, then ask what we are authoring or restructuring today.",
      );
    }
    return lines.join(" ");
  }
  return "Read your persona spec to understand your role.";
}

function build() {
  const mode = process.env.OPERATE_MODE;
  if (!mode || !["run", "iterate", "build"].includes(mode)) {
    return null; // not a spawned operate session; let normal walk-up happen
  }

  const personaPath = process.env.PERSONA_PATH;
  if (!personaPath) return null;

  const claudeMdPath = join(personaPath, "CLAUDE.md");
  const personaSpec = safeRead(claudeMdPath);
  if (!personaSpec) return null;

  const focusBlock = buildFocusBlock();

  const lines = [];
  lines.push(`# Operate session ... ${mode.toUpperCase()} mode`);
  lines.push("");
  lines.push(`Spawned by /operate. Your persona spec is loaded below. Honor it.`);
  lines.push("");
  if (focusBlock) {
    lines.push("## Focus");
    lines.push(focusBlock);
    lines.push("");
  }
  lines.push("## First move");
  lines.push(firstMoveByMode(mode));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`## Persona spec (\`${claudeMdPath}\`)`);
  lines.push("");
  lines.push(personaSpec.trim());

  let out = lines.join("\n");
  if (out.length > MAX_CHARS) {
    out = out.slice(0, MAX_CHARS - 80) + "\n\n...(truncated; read the full persona spec at the path above)";
  }
  return out;
}

try {
  const ctx = build();
  if (ctx) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: ctx,
        },
      }),
    );
  }
} catch {
  // Silent fail: hook must never break session bootstrap.
}
process.exit(0);
