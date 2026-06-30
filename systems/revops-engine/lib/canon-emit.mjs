// lib/canon-emit.mjs — emit expert requests to (and read resolved verdicts from) canon-engine.
//
// canon-engine is a SEPARATE Supabase project from revops, so we reach it the same way route-runner
// reaches revops: the Management-API SQL endpoint with the account CLI token. The expert-liaison RPCs
// are SECURITY DEFINER + service-role-locked; the admin token executes them.
//
// This is the producer side of the membrane: revops hands an ambiguous routing decision to the
// expert-liaison-engine as a verdict request, and the motion drives it to resolution. The answer is
// bound back by apply-expert-verdicts.mjs (the consumer), NOT here.

import fs from "fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const CANON_REF = "mzzjvoiwughcnmmqzbxv";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

export async function canonSql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${CANON_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`canon mgmt-api ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}

const lit = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const jlit = (o) => `'${JSON.stringify(o ?? {}).replace(/'/g, "''")}'::jsonb`;

// Emit one expert request (idempotent on source_ref). Returns the request row (as a JS object).
export async function emitExpertRequest({
  requestType = "verdict",
  engagementType,
  engagementId,
  expertSlug,
  concerningSystem,
  subject,
  body,
  payload = {},
  sourceSystem,
  sourceRef,
  goalKey,
  createdBy = "revops-engine",
  sessionId = null,
}) {
  const q = `select to_jsonb(public.record_expert_request(
    ${lit(requestType)}, ${lit(engagementType)}, ${lit(engagementId)}, ${lit(expertSlug)},
    ${lit(concerningSystem)}, ${lit(subject)}, ${lit(body)}, ${jlit(payload)},
    ${lit(sourceSystem)}, ${lit(sourceRef)}, ${lit(goalKey)}, 'human_expert', ${lit(expertSlug)},
    ${lit(createdBy)}, ${lit(sessionId)})) as r`;
  const rows = await canonSql(q);
  return rows[0]?.r;
}
