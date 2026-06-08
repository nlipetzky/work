// run-stage1.mjs — apply a play's deterministic Stage-1 classification SQL to a staging batch.
//
// Generic runner: reads the play's stage1 SQL (which uses the {{STAGING_TABLE}} placeholder),
// substitutes the batch's staging table, and executes it via the Management API. The keyword
// rules are play-specific and live in the play folder; this runner is play-agnostic.
//
// Usage: node run-stage1.mjs <batch_id> <companies|contacts> <path-to-stage1.sql>

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const batchId = process.argv[2];
const entity = process.argv[3] || "companies";
const sqlPath = process.argv[4];
if (!batchId || !sqlPath) {
  console.error("usage: node run-stage1.mjs <batch_id> <entity> <stage1.sql>");
  process.exit(1);
}
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

const playSql = fs.readFileSync(sqlPath, "utf8").replaceAll("{{STAGING_TABLE}}", stagingTbl);
await sql(playSql);
const dist = await sql(
  `select coalesce(prep_verdict,'(residual)') as verdict, count(*) as n
     from ${stagingTbl} group by 1 order by 1`);
console.log(`stage-1 applied to ${stagingTbl}`);
for (const r of dist) console.log(`  ${r.verdict}: ${r.n}`);
