// generate-prep-plan.mjs — emits the prep-plan artifact (plan Step 6 output).
//
// Reads the classified staging batch and writes the approvable markdown review to the play's
// prep-plans/ folder, grouped by verdict, per the schema at
// practices/revops/skills/play-prep/schema.md. Aggregation runs here (rows stay in this process);
// only the file path + a short summary print. This is what the planner sub-agent emits and what
// the operator approves before the executor promotes.
//
// Usage: node generate-prep-plan.mjs <batch_id> [companies|contacts]

import fs from "fs";
import path from "path";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const batchId = process.argv[2] || "ngabs_2026_06_05";
const entity = process.argv[3] || "companies";
const stagingTbl = `staging.${entity}_${batchId}`;

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mgmt-api ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

const meta = (await sql(
  `select play_file_path, guidance_file_path, segment_name, playbook_name
     from staging_batch_meta where batch_id = '${batchId}' limit 1`))[0] || {};
const playDir = meta.play_file_path ? path.dirname(meta.play_file_path) : ".";
const outDir = path.join(playDir, "prep-plans");
const outPath = path.join(outDir, `${batchId}-${entity}-prep-plan.md`);

const rows = await sql(`
  select name, domain, prep_verdict, prep_confidence, prep_role, prep_verified,
         prep_needs_evidence, prep_rationale, prep_stage, prep_evidence, prep_criteria
  from ${stagingTbl} order by prep_verdict, name`);

const norm = (v) => (v == null ? "" : String(v));
const by = (verdict) => rows.filter((r) => norm(r.prep_verdict).toUpperCase() === verdict);
const verifiedCount = rows.filter((r) => r.prep_verified === true).length;
const needsEv = rows.filter((r) => r.prep_needs_evidence === true);
const byStage = rows.reduce((a, r) => { a[r.prep_stage] = (a[r.prep_stage] || 0) + 1; return a; }, {});

const failedCriteria = (r) => {
  let c = r.prep_criteria;
  if (typeof c === "string") { try { c = JSON.parse(c); } catch { return ""; } }
  if (!c || typeof c !== "object") return "";
  return Object.entries(c)
    .filter(([, v]) => v && (v.result === "pass" || v.result === "fail"))
    .map(([k, v]) => `${k}=${v.result}`)
    .join(", ");
};

const line = (r) => `- **${norm(r.name)}** — ${norm(r.prep_confidence) || "—"}${r.prep_verified ? " · ✓verified" : " · unverified"}${r.prep_needs_evidence ? " · needs-evidence" : ""}\n  ${norm(r.prep_rationale)}`;

const group = (title, verdict) => {
  const g = by(verdict);
  if (!g.length) return "";
  return `\n### ${title} (${g.length})\n${g.map(line).join("\n")}\n`;
};

const md = `# Prep Plan — ${batchId} (${entity})

batch_id: \`${batchId}\` · entity: ${entity} · rows: ${rows.length}
play: ${meta.segment_name || "?"}${meta.playbook_name ? ` (${meta.playbook_name})` : ""}
playbook: ${meta.play_file_path || "?"}
guidance: ${meta.guidance_file_path || "?"}
generated: ${new Date().toISOString()}

## Processing ledger
- by stage: ${Object.entries(byStage).map(([k, v]) => `${k}=${v}`).join(", ")}
- verdicts: IN=${by("IN").length} · NARROW=${by("NARROW").length} · OUT=${by("OUT").length} · NEEDS_REVIEW=${by("NEEDS_REVIEW").length}
- **verified for play: ${verifiedCount}/${rows.length}** · needs-evidence (research-lane queue): ${needsEv.length}

## Verdicts
${group("IN — promote", "IN")}${group("NARROW — keep, lower priority", "NARROW")}${group("OUT — exclude (flagged, not dropped)", "OUT")}${group("NEEDS_REVIEW — not verified, do not promote yet", "NEEDS_REVIEW")}

## Gap + enrichment plan (research lane — parked)
${needsEv.length ? needsEv.map((r) => `- **${norm(r.name)}**: ${norm(r.prep_evidence)} — ${norm(r.prep_rationale)}`).join("\n") : "- none flagged"}

## Dedup / hierarchy + acquired-routing
- pending: separate deterministic step (LSNE→PCI, FUJIFILM Diosynth→FUJIFILM, SK pharmteco↔KBI, etc.; Seagen→Pfizer contact routing). Not applied in this run.

## Execution operations (for the executor, on approval)
1. promote the IN set on-rails via promote_staging_batch (provenance-aware).
2. leave NARROW + OUT in staging, visibly flagged; do not drop.
3. hold NEEDS_REVIEW for the research lane.

## APPROVAL: <go | no-go> — Nick, <date>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, md);
console.log("wrote:", outPath);
console.log(`verdicts IN=${by("IN").length} NARROW=${by("NARROW").length} OUT=${by("OUT").length} NEEDS_REVIEW=${by("NEEDS_REVIEW").length} | verified ${verifiedCount}/${rows.length}`);
