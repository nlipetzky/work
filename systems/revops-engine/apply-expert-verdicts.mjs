// apply-expert-verdicts.mjs — the consume side of the membrane.
//
// Reads resolved expert verdicts from canon-engine (expert_binding_for_system('revops-engine')) and
// applies them to revops staging: an 'approved' ruling flips the flagged rows from 'review' to
// 'matched', which is what unblocks promote_staging_batch. Then marks the motion consumed in canon so
// it is applied exactly once. This is the outbox-consumer pattern (canon emits, revops consumes),
// because the two live in separate Supabase projects.
//
// Usage: node apply-expert-verdicts.mjs

import fs from "fs";
import { canonSql } from "./lib/canon-emit.mjs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const REVOPS_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

async function revopsSql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REVOPS_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`revops mgmt-api ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
const lit = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);

const bindings = await canonSql(`select * from public.expert_binding_for_system('revops-engine')`);
let applied = 0, skipped = 0;

for (const b of bindings) {
  if ((b.binding_status || "emitted") !== "emitted") { continue; } // already consumed
  const verdicts = Array.isArray(b.verdicts) ? b.verdicts : [];
  const approved = verdicts.some((v) => v.verdict === "approved");
  if (!approved) { skipped++; continue; } // declined / still-flagged rulings are not auto-applied

  // The originating request carries the staging coordinates (batch + company + observed domain).
  const reqs = await canonSql(
    `select payload from public.expert_requests where motion_id = ${lit(b.motion_id)} order by created_at limit 1`
  );
  const payload = reqs[0]?.payload || {};
  const batchId = payload.batch_id, company = payload.company_name, domain = payload.observed_domain;
  const entity = payload.entity || "contacts";
  if (!batchId || !company || !domain) { console.error(`motion ${b.motion_id}: incomplete payload, skipping`); skipped++; continue; }

  const tbl = `staging.${entity}_${batchId}`;
  await revopsSql(
    `update ${tbl} set prep_route_status='matched', prep_routed_company=${lit(company)},
       prep_route_note=${lit(`Expert verdict (${b.expert_slug}): confirmed @${domain}`)}
     where company_name=${lit(company)} and prep_routed_domain=${lit(domain)} and prep_route_status='review'`
  );
  await canonSql(`select public.mark_motion_consumed(${lit(b.motion_id)}, ${lit(`applied to ${tbl}`)})`);
  console.log(`bound: ${company} @${domain} -> matched (${tbl})`);
  applied++;
}

console.log(`apply-expert-verdicts: applied=${applied}, skipped=${skipped}`);
