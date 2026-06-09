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

const isCo = entity === "companies";
const rows = isCo
  ? await sql(`select name, domain, prep_verdict v, prep_confidence, prep_role, prep_verified,
        prep_needs_evidence, prep_rationale rationale, prep_stage, prep_criteria
      from ${stagingTbl} order by prep_verdict, name`)
  : await sql(`select coalesce(full_name, first_name || ' ' || last_name) name, title, company_name, email,
        prep_contact_status v, prep_contact_reason rationale, prep_route_status route
      from ${stagingTbl} order by prep_contact_status, company_name`);

// dedup (companies) / acquired-routing (contacts) actions, rendered from the staging labels
let actionsSection = "## Dedup / hierarchy + acquired-routing\n";
try {
  if (entity === "companies") {
    const d = await sql(`select name, prep_dedup_kind, coalesce(prep_dedup_target, prep_hierarchy_parent) target, prep_dedup_note
      from ${stagingTbl} where prep_dedup_kind is not null order by prep_dedup_kind, name`);
    actionsSection += d.length
      ? d.map((r) => `- **${r.name}** [${r.prep_dedup_kind}] → ${r.target} — ${r.prep_dedup_note || ""}`).join("\n")
      : "- none";
  } else {
    const m = await sql(`select prep_routed_company, prep_routed_domain, count(*) n from ${stagingTbl} where prep_route_status='matched' group by 1,2`);
    const rv = await sql(`select company_name, prep_routed_domain, count(*) n from ${stagingTbl} where prep_route_status='review' group by 1,2 order by 1`);
    actionsSection += "**Routed (SME-confirmed):**\n" + (m.length ? m.map((r) => `- → ${r.prep_routed_company} via @${r.prep_routed_domain} (${r.n})`).join("\n") : "- none") +
      "\n\n**Review (operator decides acquirer vs alt-domain):**\n" + (rv.length ? rv.map((r) => `- ${r.company_name}: contacts use @${r.prep_routed_domain} (${r.n})`).join("\n") : "- none");
  }
} catch { actionsSection += "- (labels not yet applied — run dedup-runner / route-runner)"; }

const norm = (v) => (v == null ? "" : String(v));
const by = (val) => rows.filter((r) => norm(r.v) === val);
const verifiedCount = isCo ? rows.filter((r) => r.prep_verified === true).length : by("eligible").length;
const needsEv = isCo ? rows.filter((r) => r.prep_needs_evidence === true) : [];
const byStage = isCo ? rows.reduce((a, r) => { a[r.prep_stage] = (a[r.prep_stage] || 0) + 1; return a; }, {}) : {};

const coLine = (r) => `- **${norm(r.name)}** — ${norm(r.prep_confidence) || "—"}${r.prep_verified ? " · ✓verified" : " · unverified"}${r.prep_needs_evidence ? " · needs-evidence" : ""}\n  ${norm(r.rationale)}`;
const ctLine = (r) => `- **${norm(r.name)}** — ${norm(r.title)} @ ${norm(r.company_name)}${r.route === "review" ? " · route:review" : ""}\n  ${norm(r.rationale)}`;
const lineFn = isCo ? coLine : ctLine;
const group = (title, val) => { const g = by(val); return g.length ? `\n### ${title} (${g.length})\n${g.map(lineFn).join("\n")}\n` : ""; };

const ledger = isCo
  ? `- by stage: ${Object.entries(byStage).map(([k, v]) => `${k}=${v}`).join(", ")}
- verdicts: IN=${by("IN").length} · NARROW=${by("NARROW").length} · OUT=${by("OUT").length} · NEEDS_REVIEW=${by("NEEDS_REVIEW").length}
- **verified for play: ${verifiedCount}/${rows.length}** · needs-evidence (research-lane queue): ${needsEv.length}`
  : `- statuses: eligible=${by("eligible").length} · needs_review=${by("needs_review").length} · disqualified_company=${by("disqualified_company").length} · out_of_scope_title=${by("out_of_scope_title").length}
- **eligible (company + title pass): ${verifiedCount}/${rows.length}** · LinkedIn (§6.1) + CRM suppression (§6.2) DEFERRED — data not in staging`;

const verdictsBlock = isCo
  ? `${group("IN — promote", "IN")}${group("NARROW — keep, lower priority", "NARROW")}${group("OUT — exclude (flagged, not dropped)", "OUT")}${group("NEEDS_REVIEW — not verified, do not promote yet", "NEEDS_REVIEW")}`
  : `${group("ELIGIBLE — company + approved title (LinkedIn/CRM deferred)", "eligible")}${group("NEEDS_REVIEW — company unresolved / title ambiguous", "needs_review")}${group("DISQUALIFIED — company verdict OUT", "disqualified_company")}${group("OUT OF SCOPE TITLE", "out_of_scope_title")}`;

const gapBlock = isCo
  ? `## Gap + enrichment plan (research lane — parked)\n${needsEv.length ? needsEv.map((r) => `- **${norm(r.name)}**: ${norm(r.rationale)}`).join("\n") : "- none flagged"}`
  : `## Deferred checks (playbook §6)\n- LinkedIn current-role verification (§6.1) and CRM 6-month suppression (§6.2) are NOT applied — those sources aren't in staging. ELIGIBLE contacts are pending these.`;

const opsBlock = isCo
  ? `1. promote the IN set on-rails via promote_staging_batch (provenance-aware).
2. leave NARROW + OUT in staging, visibly flagged; do not drop.
3. hold NEEDS_REVIEW for the research lane.`
  : `1. promote the ELIGIBLE contacts on-rails (after LinkedIn/CRM checks if/when wired).
2. resolve the acquired-routing review set (operator decides acquirer vs alt-domain).
3. hold needs_review (company unresolved) until the company is classified.`;

const md = `# Prep Plan — ${batchId} (${entity})

batch_id: \`${batchId}\` · entity: ${entity} · rows: ${rows.length}
play: ${meta.segment_name || "?"}${meta.playbook_name ? ` (${meta.playbook_name})` : ""}
playbook: ${meta.play_file_path || "?"}
guidance: ${meta.guidance_file_path || "?"}
generated: ${new Date().toISOString()}

## Processing ledger
${ledger}

## ${isCo ? "Verdicts" : "Contact screen"}
${verdictsBlock}

${gapBlock}

${actionsSection}

## Execution operations (for the executor, on approval)
${opsBlock}

## APPROVAL: <go | no-go> — Nick, <date>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, md);
console.log("wrote:", outPath);
console.log(isCo
  ? `verdicts IN=${by("IN").length} NARROW=${by("NARROW").length} OUT=${by("OUT").length} NEEDS_REVIEW=${by("NEEDS_REVIEW").length} | verified ${verifiedCount}/${rows.length}`
  : `eligible=${by("eligible").length} needs_review=${by("needs_review").length} disqualified=${by("disqualified_company").length} oos_title=${by("out_of_scope_title").length}`);
