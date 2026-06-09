// dedup-runner.mjs — company dedup/hierarchy labeling (on-rails, staging only).
//
// Reads a play's dedup-rules.json and labels the staging companies: exact duplicates collapse to a
// primary, SME-cited acquired/alias mappings point at a canonical, parent/child pairs record a
// hierarchy (both kept). Writes prep_dedup_* columns only — nothing is deleted, everything carries
// a source-cite, all of it shows in the surface for operator review before Promote.
//
// Usage: node dedup-runner.mjs <batch_id> companies <path-to-dedup-rules.json>

import fs from "fs";
import { markDone } from "./lib/run-status.mjs";

const runId = (() => { const i = process.argv.indexOf("--run-id"); return i >= 0 ? process.argv[i + 1] : null; })();
const ENV_PATH = "/Users/nplmini/code/work/.env";
const PROJECT_REF = "mrmnyscurmkfppicqqhk";
const env = fs.readFileSync(ENV_PATH, "utf8");
const TOKEN = (env.match(/^SupaBase_CLI_access_token=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");

const batchId = process.argv[2];
const entity = process.argv[3] || "companies";
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
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

await sql(`alter table ${tbl} add column if not exists prep_dedup_target text;
           alter table ${tbl} add column if not exists prep_dedup_kind text;
           alter table ${tbl} add column if not exists prep_dedup_note text;
           alter table ${tbl} add column if not exists prep_hierarchy_parent text;`);

const rows = await sql(`select id, name, domain from ${tbl}`);
const updates = []; // {id, target, kind, note, parent}

// 1. exact duplicates by normalized name -> keep lowest id as primary, label the rest
const groups = {};
for (const r of rows) { const k = norm(r.name); (groups[k] ||= []).push(r); }
for (const g of Object.values(groups)) {
  if (g.length < 2) continue;
  g.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const primary = g[0];
  for (const dup of g.slice(1))
    updates.push({ id: dup.id, target: primary.name, kind: "exact_dup", note: `exact name duplicate of ${primary.name} (${primary.domain || "no domain"})` });
}

// 2. SME-cited acquired/alias mappings -> canonical (skip the canonical row itself)
for (const m of cfg.mappings || []) {
  const re = new RegExp(m.match, "i");
  for (const r of rows) {
    if (re.test(r.name) && norm(r.name) !== norm(m.canonical))
      updates.push({ id: r.id, target: m.canonical, kind: m.kind, note: m.cite });
  }
}

// 3. hierarchy (parent/child) -> record parent, keep both
for (const h of cfg.hierarchy || []) {
  const re = new RegExp(h.child, "i");
  for (const r of rows) if (re.test(r.name)) updates.push({ id: r.id, parent: h.parent, kind: "hierarchy", note: h.cite });
}

// Merge updates by id before writing. A single row can match more than one rule (e.g. exact_dup
// then hierarchy); the old per-row loop applied them sequentially (last write wins per column).
// A batched VALUES write needs one tuple per id, so collapse here preserving that ordering.
const byId = new Map();
for (const u of updates) {
  const cur = byId.get(u.id) || { id: u.id, kind: null, note: null, target: null, parent: null };
  cur.kind = u.kind;
  cur.note = u.note;
  if (u.target) cur.target = u.target;
  if (u.parent) cur.parent = u.parent;
  byId.set(u.id, cur);
}

// Single batched write. Avoids one Management-API call per row (the 429 throttle failure mode);
// nullif preserves the NULL semantics of the old conditional-column write for target/parent.
const tuples = [...byId.values()].map((u) =>
  `('${esc(u.id)}','${esc(u.kind)}','${esc(u.note)}','${esc(u.target ?? "")}','${esc(u.parent ?? "")}')`);
if (tuples.length) {
  await sql(`update ${tbl} t set
      prep_dedup_kind = v.kind,
      prep_dedup_note = v.note,
      prep_dedup_target = nullif(v.target, ''),
      prep_hierarchy_parent = nullif(v.parent, '')
    from (values ${tuples.join(",\n")}) as v(id, kind, note, target, parent)
    where t.id = v.id::uuid`);
}

const summ = await sql(`select prep_dedup_kind kind, count(*) n from ${tbl} where prep_dedup_kind is not null group by 1 order by 1`);
const detail = await sql(`select name, prep_dedup_kind, coalesce(prep_dedup_target, prep_hierarchy_parent) as target from ${tbl} where prep_dedup_kind is not null order by prep_dedup_kind, name`);
console.log(`dedup labels written to ${tbl}:`);
for (const s of summ) console.log(`  ${s.kind}: ${s.n}`);
for (const d of detail) console.log(`  - ${d.name} [${d.prep_dedup_kind}] -> ${d.target}`);

if (runId) await markDone(runId, "dedup", { labeled: updates.length, ...Object.fromEntries(summ.map((s) => [s.kind, Number(s.n)])) });
