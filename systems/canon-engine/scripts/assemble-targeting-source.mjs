#!/usr/bin/env node
/**
 * One-off (re-runnable): assemble the drafting source for the CIPO list-build targeting artifacts.
 *
 * Same pattern as assemble-offer-ladder-source.mjs: the govern-artifacts driver reads ONE context
 * file per artifact as its source. Each targeting artifact must hinge on the approved marketing canon
 * (+ any already-approved targeting artifacts, so later ones build on earlier ones) + the targeting
 * doctrine. Pulls APPROVED content from canon so the artifacts hinge on certified context.
 *
 * Run from canon-engine/: node scripts/assemble-targeting-source.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const ET = "venture", EID = "konstellation-cipo";
const DOCTRINE = "practices/revops/reference/targeting-enrichment-doctrine.md";

// the approved marketing canon every targeting artifact hinges on
const MARKETING = [
  ["icp-and-disqualifiers", "ICP + DISQUALIFIERS (who we serve + hard exclusions)"],
  ["customer-problem-model", "CUSTOMER PROBLEM (the pain)"],
  ["mechanism-of-action", "MECHANISM (the differentiator / what fit looks like)"],
  ["offer-architecture-and-pricing", "OFFER (what we sell)"],
  ["outreach-offer-ladder", "OFFER LADDER (the front-end offer the list will receive)"],
];
// the targeting artifacts that feed each other (later ones hinge on earlier approved ones)
const TARGETING = [
  ["segment-criteria", "SEGMENT CRITERIA (account-level targeting)"],
  ["icp-titles", "ICP TITLES (contact-level personas)"],
  ["enrichment-spec", "ENRICHMENT SPEC (data points to collect + qualify-gates)"],
  ["list-qualification", "LIST QUALIFICATION (the qualified/edge/not gate)"],
];
const TASK = {
  "segment-criteria": "Produce the account-level segment criteria for CIPO's cold-outreach list (source-agnostic: no provider/column names).",
  "icp-titles": "Produce the contact-level ICP titles / persona tiers for CIPO (function signals, not literal titles; tiered).",
  "enrichment-spec": "Produce the enrichment spec: which data points to collect per account/contact and which are qualify-gates vs enrich-only.",
  "list-qualification": "Produce the list-qualification gate: the deterministic qualified/edge/not verdict composed from the segment criteria + enrichment qualify-gates.",
};

async function approved(type) {
  const { data, error } = await db.from("canon_artifacts")
    .select("content_md, version").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).eq("status", "approved").order("version", { ascending: false }).limit(1);
  if (error) throw new Error(`${type}: ${error.message}`);
  return data?.[0] || null;
}
// operator / expert notes injected via the /targeting expert-input channel (the human seed)
async function operatorNotes(type) {
  const { data, error } = await db.from("artifact_operator_notes")
    .select("note, author, created_at").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

const doctrine = await readFile(path.join(WORK_ROOT, DOCTRINE), "utf8");

for (const [target, _label] of TARGETING) {
  let out = `# Drafting source — ${target} (CIPO)\n\n` +
    `Assembled from APPROVED canon + the targeting doctrine. This is the producer's raw input; the\n` +
    `governed ${target} artifact is distilled FROM this. Do not treat this file as the deliverable.\n\n` +
    `TASK: ${TASK[target]}\n\n---\n\n## STANDARD: Targeting & Enrichment Doctrine\n\n${doctrine}\n`;

  for (const [type, role] of MARKETING) {
    const a = await approved(type);
    if (a) out += `\n---\n\n## ${role}\nsource: canon ${type} (approved v${a.version})\n\n${a.content_md.trim()}\n`;
  }
  // include already-approved sibling targeting artifacts (so later ones build on earlier ones)
  for (const [type, role] of TARGETING) {
    if (type === target) continue;
    const a = await approved(type);
    if (a) out += `\n---\n\n## ${role}\nsource: canon ${type} (approved v${a.version})\n\n${a.content_md.trim()}\n`;
  }

  // operator / expert notes — the human seed; the producer must incorporate these
  const notes = await operatorNotes(target);
  if (notes.length) {
    out += `\n---\n\n## OPERATOR / EXPERT NOTES (incorporate these ... they are domain knowledge the AI lacks)\n`;
    for (const n of notes) out += `\n- (${n.author}) ${n.note.trim()}\n`;
  }

  const dest = path.join(WORK_ROOT, "accounts/ventures", EID, "context/revops", `${target}.md`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, out, "utf8");
  console.log(`wrote ${target}.md (${out.length} chars)`);
}
