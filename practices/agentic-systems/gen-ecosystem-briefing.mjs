// Generate the session-start ecosystem briefing from canon_engine.public.systems.
// READ-ONLY on canon. Writes a compact markdown map that loads into every session
// via the SessionStart hook in /Users/nplmini/code/work/.claude/settings.json.
//
// Run: node /Users/nplmini/code/work/practices/agentic-systems/gen-ecosystem-briefing.mjs
//
// Keep the OUTPUT compact — every line pays rent in every session. One line per
// system, grouped by constellation. No full purposes, no dates.

import { readFileSync, writeFileSync } from "node:fs";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const OUT_PATH = "/Users/nplmini/code/work/practices/agentic-systems/ECOSYSTEM-MAP.md";
const PURPOSE_MAX = 90;
const PSL_MAX = 48; // only inline process_state_location if shorter than this

// Constellation print order. Anything unknown -> Unassigned bucket at the end.
const ORDER = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden"];

function loadEnv() {
  const txt = readFileSync(ENV_PATH, "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const CANON_URL = (env.CANON_SUPABASE_URL || "").replace(/\/$/, "");
const CANON_KEY = env.CANON_SUPABASE_SERVICE_KEY;
if (!CANON_URL || !CANON_KEY) {
  console.error("Missing env: CANON_SUPABASE_URL / CANON_SUPABASE_SERVICE_KEY");
  process.exit(1);
}

function truncate(s, n) {
  if (!s) return "";
  const flat = String(s).replace(/\s+/g, " ").trim();
  return flat.length > n ? flat.slice(0, n - 1).trimEnd() + "…" : flat;
}

async function main() {
  const cols = "system_slug,name,purpose,status,constellation,coverage,process_state_location";
  const res = await fetch(
    `${CANON_URL}/rest/v1/systems?select=${cols}&order=constellation,system_slug`,
    { headers: { apikey: CANON_KEY, Authorization: `Bearer ${CANON_KEY}` } }
  );
  if (!res.ok) throw new Error(`canon GET systems: ${res.status} ${await res.text()}`);
  const rows = await res.json();

  // Group by constellation (lowercased). Null/unknown -> "Unassigned".
  const groups = {};
  for (const r of rows) {
    const key = (r.constellation || "").toLowerCase().trim() || "unassigned";
    (groups[key] ||= []).push(r);
  }

  const orderedKeys = [
    ...ORDER.filter((k) => groups[k]),
    ...Object.keys(groups).filter((k) => !ORDER.includes(k) && k !== "unassigned").sort(),
    ...(groups.unassigned ? ["unassigned"] : []),
  ];

  const lines = [];
  lines.push(
    "Ecosystem map — canonical from canon_engine.public.systems. Each system: what it is, where its state lives. Treat as the system registry; do not crawl the filesystem to rediscover it."
  );

  for (const key of orderedKeys) {
    const label = key === "unassigned" ? "Unassigned" : key;
    lines.push("");
    lines.push(`## ${label}`);
    for (const r of groups[key].sort((a, b) => (a.system_slug || "").localeCompare(b.system_slug || ""))) {
      const purpose = truncate(r.purpose, PURPOSE_MAX) || "(no purpose)";
      let statusBit = r.status || "?";
      if (r.coverage) statusBit += `/${r.coverage}`;
      let line = `- ${r.system_slug} — ${purpose} — ${statusBit}`;
      const psl = truncate(r.process_state_location, PSL_MAX);
      if (psl && String(r.process_state_location).replace(/\s+/g, " ").trim().length <= PSL_MAX) {
        line += ` — state: ${psl}`;
      }
      lines.push(line);
    }
  }

  const out = lines.join("\n") + "\n";
  writeFileSync(OUT_PATH, out, "utf8");
  console.log(`Wrote ${OUT_PATH}: ${rows.length} systems, ${orderedKeys.length} groups, ${out.split("\n").length} lines.`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
