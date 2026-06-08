// classify-runner.mjs — the semantic classifier (plan Step 4).
//
// Looks at EVERY residual row (one the deterministic Stage-1 SQL could not safely decide) and
// classifies it against the play's criteria, honoring the verification mandate: "filled" is never
// "trusted." Per row it reads the self-describing fields + the SME gold note (+ research evidence
// when present), calls the Anthropic API in an ISOLATED one-row inference, and writes a
// per-criterion verdict back to staging. Row data lives in THIS process and that single API call —
// it never enters a Claude Code conversation. Only aggregate counts print.
//
// On-rails: writes prep_* working columns in STAGING only (never canonical). Promotion stays the
// only canonical write path.
//
// Usage:
//   node classify-runner.mjs <batch_id> [companies|contacts] [--play <classifier_dir>]
//                            [--model <id>] [--limit N] [--concurrency K]
//
// Env: SupaBase_CLI_access_token (work/.env) for the Management API; ANTHROPIC_API_KEY (env or
// work/.env) for the per-row inference.

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const envGet = (k) =>
  (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const TOKEN = envGet("SupaBase_CLI_access_token");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || envGet("ANTHROPIC_API_KEY");

// --- args ---
const argv = process.argv.slice(2);
const batchId = argv[0] || "ngabs_2026_06_05";
const entity = (argv[1] && !argv[1].startsWith("--")) ? argv[1] : "companies";
const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const PLAY_DIR = flag("--play",
  "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/classifier");
const MODEL = flag("--model", "claude-sonnet-4-6");
const LIMIT = parseInt(flag("--limit", "0"), 10);
const CONCURRENCY = parseInt(flag("--concurrency", "4"), 10);
const stagingTbl = `staging.${entity}_${batchId}`;

if (!TOKEN) { console.error("missing SupaBase_CLI_access_token"); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error("missing ANTHROPIC_API_KEY (set in env or work/.env)"); process.exit(1); }

const SYSTEM_PROMPT = fs.readFileSync(`${PLAY_DIR}/classifier-prompt.md`, "utf8");

// fields the classifier reads (self-describing + SME gold). Kept narrow on purpose.
const READ_FIELDS = [
  "id", "name", "biotech_modality_types", "biotech_role", "company_focus",
  "explorium_company_focus", "explorium_business_description",
  "explorium_company_product_development", "classification_notes",
  "client_sme_note", "strategic_notes",
];

const sqlEsc = (s) => String(s).replace(/'/g, "''");

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mgmt-api ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function classifyRow(row) {
  // build the per-company user message from non-empty fields only
  const lines = [];
  for (const f of READ_FIELDS) {
    if (f === "id") continue;
    const v = row[f];
    if (v != null && String(v).trim() !== "" && String(v).trim().toLowerCase() !== "none")
      lines.push(`${f}: ${String(v).slice(0, 900)}`);
  }
  const userMsg =
    `Classify this company against the ngAbs play. Return ONLY the JSON object.\n\n${lines.join("\n")}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL, max_tokens: 1024, system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${JSON.stringify(j).slice(0, 200)}`);
  let txt = (j.content?.[0]?.text || "").trim();
  txt = txt.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(txt);
}

async function persist(row, v) {
  const cites = []
    .concat(v.source ? [`source:${v.source}`] : [])
    .concat(v.evidence_wanted ? [`wants:${v.evidence_wanted}`] : [])
    .join("; ");
  const q = `update ${stagingTbl} set
    prep_verdict = '${sqlEsc(v.verdict || "NEEDS_REVIEW")}',
    prep_confidence = '${sqlEsc(v.confidence || "LOW")}',
    prep_criteria = '${sqlEsc(JSON.stringify(v.criteria || {}))}'::jsonb,
    prep_rationale = '${sqlEsc(v.rationale || "")}',
    prep_evidence = '${sqlEsc(cites)}',
    prep_role = '${sqlEsc(v.role || "unknown")}',
    prep_needs_evidence = ${v.needs_evidence ? "true" : "false"},
    prep_stage = 'semantic'
    where id = '${row.id}'`;
  await sql(q);
}

async function pool(items, k, fn) {
  const results = []; let i = 0;
  const workers = Array.from({ length: Math.min(k, items.length) }, async () => {
    while (i < items.length) { const idx = i++; results[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return results;
}

// --- run ---
await sql(`alter table ${stagingTbl} add column if not exists prep_role text;
           alter table ${stagingTbl} add column if not exists prep_needs_evidence boolean;`);

const limitClause = LIMIT > 0 ? `limit ${LIMIT}` : "";
const rows = await sql(
  `select ${READ_FIELDS.join(", ")} from ${stagingTbl} where prep_stage = 'residual' ${limitClause}`);
console.log(`residual rows to classify: ${rows.length}  (model=${MODEL}, conc=${CONCURRENCY})`);

let ok = 0, err = 0;
const tally = {}; let needs = 0;
await pool(rows, CONCURRENCY, async (row) => {
  try {
    const v = await classifyRow(row);
    await persist(row, v);
    tally[v.verdict] = (tally[v.verdict] || 0) + 1;
    if (v.needs_evidence) needs++;
    ok++;
    if (ok % 10 === 0) console.log(`  ...${ok}/${rows.length}`);
  } catch (e) {
    err++;
    await sql(`update ${stagingTbl} set prep_stage='semantic_error',
               prep_rationale='${sqlEsc(String(e.message).slice(0, 200))}' where id='${row.id}'`);
  }
});

console.log(`\nclassified ok: ${ok}, errors: ${err}`);
console.log("verdict distribution:", JSON.stringify(tally));
console.log(`needs_evidence (research-lane candidates): ${needs}`);
