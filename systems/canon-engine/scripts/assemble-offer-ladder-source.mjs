#!/usr/bin/env node
/**
 * One-off: assemble the drafting source for the CIPO outreach-offer-ladder artifact.
 *
 * The govern-artifacts driver reads a SINGLE context file as the producer's source. For an artifact
 * that must HINGE on already-approved canon (the core offer, the ICP, the mechanism, the
 * faithfulness constraints) plus the offer doctrine, we assemble those certified inputs into that
 * one source file here. Pulls the APPROVED versions from canon (not the raw drafting files), so the
 * offer ladder hinges on certified content. Re-runnable.
 *
 * Run from canon-engine/: node scripts/assemble-offer-ladder-source.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";

// load /Users/nplmini/code/work/.env (driver-style: only set if unset)
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const ET = "venture", EID = "konstellation-cipo";
// the certified hinge inputs, in the role each plays for the offer ladder
const HINGE = [
  ["offer-architecture-and-pricing", "CORE OFFER (the retainer the front-end offer must ladder UP to)"],
  ["icp-and-disqualifiers", "ICP + DISQUALIFIERS (the segment + hard exclusions; medical-device / biotech)"],
  ["mechanism-of-action", "MECHANISM (the differentiator the offer is built on)"],
  ["customer-problem-model", "CUSTOMER PROBLEM (the pain the front-end offer solves a slice of)"],
  ["faithfulness-constraints", "FAITHFULNESS CONSTRAINTS (hard rules: no pricing in public copy, no attorney claim)"],
];

async function approved(type) {
  const { data, error } = await db.from("canon_artifacts")
    .select("content_md, version").eq("engagement_type", ET).eq("engagement_id", EID)
    .eq("artifact_type", type).eq("status", "approved").order("version", { ascending: false }).limit(1);
  if (error) throw new Error(`${type}: ${error.message}`);
  return data?.[0] || null;
}

const doctrine = await readFile(path.join(WORK_ROOT, "practices/revops/reference/outreach-offer-doctrine.md"), "utf8");

let out = `# Drafting source — outreach-offer-ladder (CIPO)\n\n` +
  `Assembled from APPROVED canon + the offer doctrine. This is the producer's raw input; the\n` +
  `governed offer-ladder artifact is distilled FROM this. Do not treat this file as the deliverable.\n\n` +
  `The task: propose 2-3 front-end COLD offers (loss-leader / trojan-horse / reverse-lead-magnet),\n` +
  `each distinct from the core retainer below and laddering UP to it, per the offer doctrine. No\n` +
  `public pricing figures. No "attorney/lawyer/counsel" claim about Will. Aim at a raised hand.\n\n` +
  `---\n\n## METHOD: Outreach Offer-Construction Doctrine (the standard)\n\n${doctrine}\n`;

for (const [type, role] of HINGE) {
  const a = await approved(type);
  if (!a) { out += `\n---\n\n## ${role}\n[MISSING from canon: ${type}]\n`; console.error(`! missing approved ${type}`); continue; }
  out += `\n---\n\n## ${role}\nsource: canon ${type} (approved v${a.version})\n\n${a.content_md.trim()}\n`;
  console.log(`+ ${type} v${a.version} (${a.content_md.length} chars)`);
}

const dest = path.join(WORK_ROOT, "accounts/ventures", EID, "context/revops/outreach-offer-ladder.md");
await mkdir(path.dirname(dest), { recursive: true });
await writeFile(dest, out, "utf8");
console.log(`\nwrote ${dest} (${out.length} chars)`);
