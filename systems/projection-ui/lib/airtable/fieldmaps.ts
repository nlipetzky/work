import "server-only";

type FieldType =
  | "singleLineText"
  | "multilineText"
  | "email"
  | "url"
  | "number"
  | "currency"
  | "percent"
  | "checkbox"
  | "date"
  | "dateTime"
  | "singleSelect"
  | "multipleSelects";

interface FieldDef {
  at: string;
  type: FieldType;
}

// Ported verbatim from revops-engine/n8n/promote-airtable-sync.json → Map node → MAPS
const MAPS: Record<string, Record<string, FieldDef>> = {
  companies: {
    id:                   { at: "Supabase ID",            type: "singleLineText" },
    name:                 { at: "Company Name",           type: "singleLineText" },
    domain:               { at: "Domain",                 type: "url" },
    industry:             { at: "Industry",               type: "singleLineText" },
    country:              { at: "HQ Country",             type: "singleLineText" },
    employee_count:       { at: "Employee Count",         type: "number" },
    funding_stage:        { at: "Funding Stage",          type: "singleLineText" },
    revenue_range:        { at: "Revenue Range",          type: "singleLineText" },
    company_research:     { at: "Company Research",       type: "multilineText" },
    last_funding_date:    { at: "Last Funding Date",      type: "date" },
    fit_score:            { at: "Fit Score",              type: "number" },
    naics_code:           { at: "NAICS Code",             type: "singleLineText" },
    company_score:        { at: "Company Score",          type: "number" },
    sf_account_id:        { at: "SF Account ID",          type: "singleLineText" },
    sf_has_open_opp:      { at: "SF Has Open Opp",        type: "checkbox" },
    sf_has_closed_won:    { at: "SF Has Closed Won",      type: "checkbox" },
    classification_notes: { at: "Classification Notes",   type: "multilineText" },
    playbook_fit_score:   { at: "Playbook Fit Score",     type: "number" },
    hq_state:             { at: "HQ State",               type: "singleLineText" },
    enrichment_status:    { at: "Enrichment Status",      type: "singleSelect" },
    company_linkedin_url: { at: "Company LinkedIn URL",   type: "singleLineText" },
  },
  contacts: {
    id:                      { at: "Supabase ID",             type: "singleLineText" },
    first_name:              { at: "First Name",              type: "singleLineText" },
    last_name:               { at: "Last Name",               type: "singleLineText" },
    email:                   { at: "Email",                   type: "email" },
    linkedin_url:            { at: "LinkedIn URL",            type: "singleLineText" },
    title:                   { at: "Title",                   type: "singleLineText" },
    country:                 { at: "Country",                 type: "singleLineText" },
    state_region:            { at: "State/Region",            type: "singleLineText" },
    city:                    { at: "City",                    type: "singleLineText" },
    email_confidence:        { at: "Email Confidence",        type: "number" },
    dmu_tier:                { at: "DMU Tier",                type: "singleLineText" },
    seniority_level:         { at: "Seniority Level",         type: "singleLineText" },
    icp_score:               { at: "ICP Score",               type: "number" },
    email_verified_status:   { at: "Email Verified Status",   type: "singleSelect" },
    linkedin_headline:       { at: "LinkedIn Headline",       type: "singleLineText" },
    mobile_phone:            { at: "Mobile Phone",            type: "singleLineText" },
    last_enriched_at:        { at: "Last Enriched At",        type: "dateTime" },
    gate_level:              { at: "Gate Level",              type: "singleLineText" },
    known_status:            { at: "Known Status",            type: "singleLineText" },
    delivery_path:           { at: "Delivery Path",           type: "singleLineText" },
    linkedin_about:          { at: "LinkedIn About",          type: "multilineText" },
    sf_contact_id:           { at: "SF Contact ID",           type: "singleLineText" },
    sf_entity_type:          { at: "SF Entity Type",          type: "singleLineText" },
    linkedin_education:      { at: "LinkedIn Education",      type: "multilineText" },
    linkedin_certifications: { at: "LinkedIn Certifications", type: "multilineText" },
    linkedin_languages:      { at: "LinkedIn Languages",      type: "multilineText" },
    fit_score:               { at: "Fit Score",               type: "number" },
    signal_score:            { at: "Signal Score",            type: "number" },
    seniority:               { at: "Seniority",               type: "singleLineText" },
    enrichment_status:       { at: "Enrichment Status",       type: "singleSelect" },
    contact_score:           { at: "Contact Score",           type: "number" },
  },
};

function coerce(v: unknown, type: FieldType): unknown {
  if (v == null || v === "") return undefined;
  if (type === "multipleSelects")
    return String(v).split(",").map((s) => s.trim()).filter(Boolean);
  if (type === "checkbox")
    return v === true || v === "true" || v === "t";
  if (type === "number" || type === "currency" || type === "percent") {
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }
  return v;
}

const RAW_LIMIT = 90_000;

export function buildFields(
  entity: "companies" | "contacts",
  row: Record<string, unknown>,
  verdict: string | null,
  playName: string | null,
): Record<string, unknown> {
  const map = MAPS[entity];
  const fields: Record<string, unknown> = {};

  for (const [col, def] of Object.entries(map)) {
    const val = coerce(row[col], def.type);
    if (val !== undefined && !(Array.isArray(val) && val.length === 0)) {
      fields[def.at] = val;
    }
  }

  if (verdict) fields["Promote Verdict"] = verdict;
  if (playName) fields["Promote Play"] = playName;

  const raw = JSON.stringify(row);
  fields["Supabase Raw"] = raw.length > RAW_LIMIT ? raw.slice(0, RAW_LIMIT) : raw;
  fields["Supabase ID"] = row.id;

  if (entity === "contacts" && row.company_name) {
    fields["Company"] = [row.company_name];
  }

  return fields;
}
