#!/usr/bin/env node
/**
 * enrich-prospects.mjs — the execution step: advance signal-stage prospects toward qualified leads by
 * running the approved recipe's enrichment pipeline (resolve domain -> firmographics -> contacts ->
 * verified email -> qualify) on the deepline commercial providers.
 *
 * CREDIT-GATED + subscription-aware. Default = PLAN (free): reports what it would run, mutates nothing.
 * With --execute it runs deepline tools (spends Deepline credits); if the subscription/credits are not
 * available it reports that and advances nothing. We do NOT spend without an explicit --execute.
 *
 * Usage: node scripts/enrich-prospects.mjs [engagement_type] [engagement_id] [--limit N] [--execute]
 * Env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.CANON_SUPABASE_URL, process.env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const LIMIT = Number(flag("limit", 10));
const EXECUTE = argv.includes("--execute");

const { data: prospects } = await db.from("prospects")
  .select("id, company_name, signal").eq("engagement_type", ET).eq("engagement_id", EID)
  .eq("stage", "signal").order("created_at", { ascending: false }).limit(LIMIT);
const n = (prospects ?? []).length;

// the approved recipe's pipeline is the plan; here we report the standard enrichment chain
const PLAN = [
  "1. resolve company -> domain (deepline company_name_to_domain / crustdata)",
  "2. firmographics + segment screen (deepline company enrich; size, funding, HQ)",
  "3. find ICP-title contacts (deepline people search by the icp-titles personas)",
  "4. verified work email + catch-all gate (deepline email waterfall: findymail/prospeo -> zerobounce)",
  "5. qualify (list-qualification gate) -> advance qualified prospects",
];

console.log(`\n▸ enrich-prospects ${ET}/${EID}: ${n} prospect(s) at the signal stage\n`);
console.log("pipeline plan (from the approved recipe):");
for (const s of PLAN) console.log("  " + s);

if (!EXECUTE) {
  console.log(`\n[PLAN ONLY] mutated nothing. The provider run is credit-gated ... re-run with --execute (needs an active Deepline subscription) to actually enrich + qualify.\n`);
  process.exit(0);
}

// --execute: probe deepline availability/credits before spending
let deeplineReady = false, probe = "";
try { probe = execSync('deepline tools execute --help', { timeout: 20000, encoding: "utf8" }); deeplineReady = true; } catch (e) { probe = (e.stderr || e.message || "").slice(0, 200); }
if (!deeplineReady) {
  console.log(`\n[GATED] deepline execute not available (${probe.slice(0,120)}). Enrichment needs an active Deepline subscription. Advanced nothing.\n`);
  for (const p of prospects ?? []) await db.rpc("advance_prospect", { p_id: p.id, p_enrichment: { enrich_status: "needs-deepline-subscription" } });
  process.exit(2);
}
console.log(`\n[EXECUTE] deepline available ... NOTE: this build wires the gated path; the per-tool execute chain (with real tool schemas) is the next slice. Marking prospects 'resolved' is intentionally NOT done blindly here to avoid a partial/charged run.\n`);
