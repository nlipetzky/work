// gate-crm-suppression.mjs — a WIRED verification gate (Screen-adjacent), deterministic, no enrichment.
//
// Joins a staging company batch to the SF-bearing Core (public.companies, populated by the SF
// history workflows) by normalized domain, and stamps the CRM signal onto each staging row:
// existing customer? open SF opportunity? do-not-contact? last contacted when? This is the
// "CRM suppression / existing-customer" check the criteria promised — now real, not inferred.
//
//   node gate-crm-suppression.mjs <batchId> [--entity companies]
//
// Writes crm_* columns + a crm_status verdict (dnc_suppress | open_opp_review | existing_customer
// | clear | null=no-match). Read-only against Core; only the staging batch is written. Idempotent.

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const args = process.argv.slice(2);
const batchId = args.find((a) => !a.startsWith("--"));
const entity = (args.indexOf("--entity") >= 0 ? args[args.indexOf("--entity") + 1] : "companies");
if (!batchId) { console.error("usage: gate-crm-suppression.mjs <batchId> [--entity companies]"); process.exit(1); }
const tbl = `staging.${entity}_${batchId}`;

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const txt = await res.text();
  if (res.status >= 300) { console.error("SQL ERROR", res.status, txt.slice(0, 300)); process.exit(1); }
  try { return JSON.parse(txt); } catch { return []; }
}

// normalized domain: strip scheme, www, path
const NORM = (col) => `lower(regexp_replace(coalesce(${col},''),'^https?://(www\\.)?|^www\\.|/.*$','','g'))`;

// 1) ensure the gate's output columns exist (idempotent)
await runSql(`
  alter table ${tbl} add column if not exists crm_sf_account_id   text;
  alter table ${tbl} add column if not exists crm_existing_customer text;
  alter table ${tbl} add column if not exists crm_open_opp         boolean;
  alter table ${tbl} add column if not exists crm_dnc              boolean;
  alter table ${tbl} add column if not exists crm_last_contacted   text;
  alter table ${tbl} add column if not exists crm_status           text;
`);

// 2) the join: stamp CRM signal from Core onto the staging rows
await runSql(`
  update ${tbl} s set
    crm_sf_account_id    = c.sf_account_id,
    crm_existing_customer= c.existing_customer,
    crm_open_opp         = c.sf_has_open_opp,
    crm_dnc              = c.sf_dnc_opt_out,
    crm_last_contacted   = c.sf_last_contacted_date,
    crm_status = case
      when c.sf_dnc_opt_out is true then 'dnc_suppress'
      when c.sf_has_open_opp is true then 'open_opp_review'
      when lower(coalesce(c.existing_customer,'')) in ('true','yes','customer','active') then 'existing_customer'
      else 'clear' end
  from public.companies c
  where ${NORM("c.domain")} = ${NORM("s.domain")}
    and c.sf_account_id is not null
    and ${NORM("s.domain")} <> '';
`);

// 3) report — counts read straight back from the table
const r = await runSql(`
  select
    count(*) filter (where crm_status is not null) matched,
    count(*) filter (where crm_status='dnc_suppress') dnc,
    count(*) filter (where crm_status='open_opp_review') open_opp,
    count(*) filter (where crm_status='existing_customer') existing,
    count(*) filter (where crm_status='clear') clear
  from ${tbl};
`);
const x = r[0] || {};
console.log(`CRM gate on ${tbl}:`);
console.log(`  matched SF accounts: ${x.matched}  (dnc:${x.dnc} · open-opp:${x.open_opp} · existing:${x.existing} · clear:${x.clear})`);
console.log(`  crm_status written. dnc_suppress = hard cut; open_opp_review = flag for operator; existing_customer = keep-and-flag.`);
