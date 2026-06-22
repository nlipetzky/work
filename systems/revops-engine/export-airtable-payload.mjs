// export-airtable-payload.mjs — project the contract-passing set into a transport-agnostic
// Airtable-ready JSON payload (one blob per row). Reads STAGING (which holds Full Name + source;
// canonical strips them). Enforces the delivery contract at GENERATION time, so any downstream
// transport (script / n8n / Inngest) can be dumb: read the file, upsert by `merge_on`.
//
// Writes nothing to Airtable. Output only.
// Usage: node export-airtable-payload.mjs <batch_id>

import fs from "fs";
const env = fs.readFileSync("/Users/nplmini/code/work/.env", "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const PROJECT = "mrmnyscurmkfppicqqhk";
const batchId = process.argv[2] || "ngabs_2026_06_05";
const SRC_TAG = "agent_ngabs";
const OUTDIR = "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/output";

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`,
    { method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
  if (!r.ok) throw new Error("mgmt " + r.status + " " + (await r.text()).slice(0, 200));
  return r.json();
}
const num = v => { const n = parseInt(String(v ?? "").replace(/[^0-9]/g, ""), 10); return isNaN(n) ? undefined : n; };
const clean = o => { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === null || o[k] === "") delete o[k]; return o; };

fs.mkdirSync(OUTDIR, { recursive: true });

// ---- COMPANIES: IN/NARROW, dedup losers excluded (matches the promote gate) ----
const coRows = await sql(`select name,domain,industry,hq_state,country,employee_count,company_linkedin_url,
  biotech_modality_types,company_research,prep_verdict,prep_dedup_kind,prep_dedup_target
  from staging.companies_${batchId}
  where prep_verdict in ('IN','NARROW')
    and not (coalesce(prep_dedup_kind,'') in ('exact_dup','acquired','alias') and coalesce(prep_dedup_target,'')<>'')`);
const coRecords = coRows.map(r => ({ fields: clean({
  "Company Name": r.name, "Domain": r.domain, "Industry": r.industry, "HQ State": r.hq_state,
  "HQ Country": r.country, "Employee Count": num(r.employee_count), "Company LinkedIn URL": r.company_linkedin_url,
  "Biotech Modality Types": (r.biotech_modality_types || "").split(",").map(s => s.trim()).filter(Boolean),
  "Company Research": r.company_research, "Promote Verdict": r.prep_verdict, "Discovery Sources": [SRC_TAG],
}) }));

// ---- CONTACTS: eligible AND all §8 required fields present (the field contract) ----
const ctRows = await sql(`select full_name,first_name,last_name,title,company_name,email,linkedin_url
  from staging.contacts_${batchId}
  where prep_contact_status='eligible'
    and coalesce(full_name,'')<>'' and coalesce(first_name,'')<>'' and coalesce(last_name,'')<>''
    and coalesce(title,'')<>'' and coalesce(company_name,'')<>'' and coalesce(email,'')<>''`);
const ctRecords = ctRows.map(r => ({ fields: clean({
  "Full Name": r.full_name, "First Name": r.first_name, "Last Name": r.last_name, "Title": r.title,
  "Company Name": r.company_name, "Email": r.email, "LinkedIn URL": r.linkedin_url, "Discovery Sources": [SRC_TAG],
}) }));

const stamp = new Date().toISOString();
function emit(entity, mergeOn, records) {
  const payload = { meta: {
    batch_id: batchId, entity, generated_at: stamp, source: "staging (contract-gated)",
    contract: "delivery-contract.md", discovery_source_tag: SRC_TAG, merge_on: mergeOn, count: records.length,
  }, records };
  const path = `${OUTDIR}/airtable-${entity}-${batchId}.json`;
  fs.writeFileSync(path, JSON.stringify(payload, null, 2));
  console.log(`${entity}: ${records.length} blobs -> ${path} (merge_on ${mergeOn})`);
}
emit("companies", "Domain", coRecords);
emit("contacts", "Email", ctRecords);