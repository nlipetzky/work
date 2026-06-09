// contacts-screen-runner.mjs — deterministic contact screen (playbook §4.2/§6/§7), staging only.
//
// Per contact: inherit the company verdict (join by domain), run the approved-title check
// (approved terms OVERRIDE exclusion terms; role_segment is a hint, never trusted as truth so a
// null segment still gets its title checked), and defer LinkedIn/CRM (data not in staging).
// Writes prep_contact_* labels. No canonical writes.
//
// Pipeline order (§7, short-circuit): company gate -> title -> [LinkedIn -> CRM: deferred].
//
// Usage: node contacts-screen-runner.mjs <batch_id> contacts <path-to-contacts-screen-rules.json>

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
const coTbl = `staging.companies_${batchId}`;
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
const rx = (term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
const approvedRes = cfg.approved_terms.map(rx);
const exclusionRes = cfg.exclusion_terms.map(rx);

function titleCheck(title, segment) {
  const t = String(title || "");
  const approved = (segment && cfg.approved_segments.includes(segment)) || approvedRes.some((re) => re.test(t));
  if (approved) return "approved";                          // approved overrides exclusion
  if (exclusionRes.some((re) => re.test(t))) return "excluded";
  return "review";                                          // neither -> ambiguous, flag
}

await sql(`alter table ${tbl} add column if not exists prep_contact_status text;
           alter table ${tbl} add column if not exists prep_contact_reason text;
           alter table ${tbl} add column if not exists prep_contact_checks text;
           alter table ${tbl} add column if not exists prep_contact_company_verdict text;`);

const rows = await sql(`
  select c.id, c.title, c.role_segment, c.company_name, c.company_domain, c.linkedin_url,
         co.prep_verdict as company_verdict
  from ${tbl} c
  left join ${coTbl} co on lower(co.domain) = lower(c.company_domain)`);

const tally = {};
const tuples = [];
for (const r of rows) {
  const cv = r.company_verdict; // IN|NARROW|OUT|NEEDS_REVIEW|null(no match in batch)
  const tc = titleCheck(r.title, r.role_segment);
  let status, reason;

  const coName = r.company_name || "this contact's company";
  if (cv === "OUT") { status = "disqualified_company"; reason = `${coName} isn't a fit for this play, so this contact is skipped.`; }
  else if (cv == null) { status = "needs_review"; reason = `${coName} isn't in the reviewed company set yet, so we can't confirm fit.`; }
  else if (cv === "NEEDS_REVIEW") { status = "needs_review"; reason = `${coName} still needs review, so this contact isn't confirmed yet.`; }
  else if (tc === "excluded") { status = "out_of_scope_title"; reason = `This role isn't one we target for this play: ${r.title}`; }
  else if (tc === "review") { status = "needs_review"; reason = `This role isn't clearly one we target — worth a quick look: ${r.title}`; }
  else { status = "eligible"; reason = "The company is a fit and this role is one we target."; }

  const titlePlain = tc === "approved" ? "one we target" : tc === "excluded" ? "not one we target" : "unclear — worth a look";
  const coPlain = cv === "IN" ? "a fit" : cv === "NARROW" ? "a fit (lower priority)" : cv === "OUT" ? "not a fit"
    : cv === "NEEDS_REVIEW" ? "still under review" : "not in the reviewed set";
  const checks = `Company: ${coPlain}; Role: ${titlePlain}; LinkedIn: ${r.linkedin_url ? "profile on file, not yet verified" : "none on file"}; Recent contact in CRM: not checked yet (no CRM data)`;
  tuples.push(`('${esc(r.id)}','${esc(status)}','${esc(reason)}','${esc(checks)}','${esc(cv ?? "")}')`);
  tally[status] = (tally[status] || 0) + 1;
}

// Single batched write. The per-row UPDATE loop tripped the Management-API rate limit (429)
// and left the batch half-classified; one set-based UPDATE is atomic and avoids the throttle.
if (tuples.length) {
  await sql(`update ${tbl} t set
      prep_contact_status = v.status,
      prep_contact_reason = v.reason,
      prep_contact_checks = v.checks,
      prep_contact_company_verdict = v.cv
    from (values ${tuples.join(",\n")}) as v(id, status, reason, checks, cv)
    where t.id = v.id::uuid`);
}

console.log(`contact screen written to ${tbl} (${rows.length} contacts):`);
for (const [k, v] of Object.entries(tally).sort()) console.log(`  ${k}: ${v}`);
console.log("note: 'eligible' = passed company + title; LinkedIn (§6.1) and CRM 6-mo suppression (§6.2) are DEFERRED — data not in staging.");

if (runId) await markDone(runId, "contacts_screen", { total: rows.length, ...tally });
