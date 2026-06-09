// route-runner.mjs — acquired-company contact routing (client-guidance.md §3), on-rails/staging only.
//
// Routes each contact by the email domain ACTUALLY IN USE. SME-confirmed routes (routing-rules.json)
// are applied deterministically; every other email-vs-company domain mismatch is FLAGGED for review
// with the live domain — never auto-resolved. Writes prep_route_* columns only.
//
// Usage: node route-runner.mjs <batch_id> contacts <path-to-routing-rules.json>

import fs from "fs";
import { markDone } from "./lib/run-status.mjs";

const runId = (() => { const i = process.argv.indexOf("--run-id"); return i >= 0 ? process.argv[i + 1] : null; })();
const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const batchId = process.argv[2];
const entity = process.argv[3] || "contacts";
const cfgPath = process.argv[4];
const tbl = `staging.${entity}_${batchId}`;
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`mgmt-api ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
const esc = (s) => String(s).replace(/'/g, "''");
const dom = (email) => String(email || "").toLowerCase().split("@")[1] || "";

await sql(`alter table ${tbl} add column if not exists prep_route_status text;
           alter table ${tbl} add column if not exists prep_routed_company text;
           alter table ${tbl} add column if not exists prep_routed_domain text;
           alter table ${tbl} add column if not exists prep_route_note text;`);

const rows = await sql(`select id, email, company_name, company_domain from ${tbl} where email like '%@%'`);
let ok = 0, matched = 0, review = 0;

for (const r of rows) {
  const ed = dom(r.email);
  const cd = String(r.company_domain || "").toLowerCase();
  let status, company = null, note = null;

  if (!ed || ed === cd) {
    status = "ok"; ok++;
  } else {
    // SME-confirmed route?
    const route = (cfg.routes || []).find((x) =>
      (x.acquirer_domain && ed === String(x.acquirer_domain).toLowerCase()) ||
      (x.acquired_company_match && new RegExp(x.acquired_company_match, "i").test(r.company_name || "")));
    if (route && route.acquirer_domain && ed === String(route.acquirer_domain).toLowerCase()) {
      status = "matched"; company = route.acquirer; note = route.cite; matched++;
    } else {
      status = "review"; note = `This contact's email uses @${ed}, but the company is listed under ${cd || "an unknown domain"}. Confirm whether the company was acquired or renamed.`; review++;
    }
  }
  const sets = [`prep_route_status='${esc(status)}'`, `prep_routed_domain='${esc(ed)}'`];
  if (company) sets.push(`prep_routed_company='${esc(company)}'`);
  if (note) sets.push(`prep_route_note='${esc(note)}'`);
  await sql(`update ${tbl} set ${sets.join(", ")} where id='${r.id}'`);
}

console.log(`routing labels written to ${tbl}: ok=${ok}, matched=${matched}, review=${review}`);
const groups = await sql(`select company_name, prep_routed_domain, count(*) n from ${tbl}
  where prep_route_status='review' group by 1,2 order by 1`);
if (groups.length) { console.log("review (operator decides acquirer vs alt-domain):"); for (const g of groups) console.log(`  - ${g.company_name}: contacts use @${g.prep_routed_domain} (${g.n})`); }

if (runId) await markDone(runId, "route", { ok, matched, review });
