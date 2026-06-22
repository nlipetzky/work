// Enrich canon_engine.public.systems with the rich detail (contract, flow,
// runs_surface, body) from the filesystem registry's system.md files.
// Additive: only sets the four new columns, never touches status/purpose/etc.
// Run from the projection-ui dir so gray-matter resolves:
//   node scripts/enrich-canon-from-filesystem.mjs

import matter from "gray-matter";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ENV_PATH = "/Users/nplmini/code/work/.env";
const REG_ROOT = "/Users/nplmini/code/work/registry";

const env = Object.fromEntries(
  readFileSync(ENV_PATH, "utf8").split("\n")
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].trim()])
);
const URL = (env.CANON_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = env.CANON_SUPABASE_SERVICE_KEY;
if (!URL || !KEY) { console.error("missing canon env"); process.exit(1); }

async function canon(method, pathStr, body, prefer) {
  const res = await fetch(`${URL}/rest/v1/${pathStr}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${pathStr}: ${res.status} ${await res.text()}`);
  return res;
}

// slug remap: filesystem -> canon
const REMAP = { "crm-motions": "crm" };
const LIFECYCLE_TO_STATUS = { operating: "operating", engineering: "building", architected: "emerging", designed: "emerging", defined: "emerging" };

function readSystems() {
  const out = [];
  for (const c of readdirSync(REG_ROOT, { withFileTypes: true })) {
    if (!c.isDirectory() || c.name.startsWith("_") || c.name.startsWith(".")) continue;
    for (const s of readdirSync(path.join(REG_ROOT, c.name), { withFileTypes: true })) {
      const file = path.join(REG_ROOT, c.name, s.name, "system.md");
      if (!existsSync(file)) continue;
      const { data, content } = matter(readFileSync(file, "utf8"));
      out.push({ data, body: content.trim() });
    }
  }
  return out;
}

async function main() {
  const canonSystems = await (await canon("GET", "systems?select=system_slug")).json();
  const canonSlugs = new Set(canonSystems.map((s) => s.system_slug));

  const fsSystems = readSystems();
  let patched = 0, inserted = 0;
  const notes = [];

  for (const { data, body } of fsSystems) {
    const slug = REMAP[data.slug] || data.slug;
    const payload = {
      contract: data.contract ?? null,
      flow: data.flow ?? null,
      runs_surface: data.runs_surface ?? null,
      body: body || null,
    };
    if (canonSlugs.has(slug)) {
      await canon("PATCH", `systems?system_slug=eq.${encodeURIComponent(slug)}`, payload, "return=minimal");
      patched++;
      if (REMAP[data.slug]) notes.push(`remapped ${data.slug} -> ${slug}`);
    } else {
      // filesystem-only system (e.g. demand-context): insert it
      await canon("POST", "systems", [{
        system_slug: slug,
        name: data.name ?? slug,
        status: LIFECYCLE_TO_STATUS[data.lifecycle] ?? "emerging",
        system_type: "platform",
        definition_maturity: "emerging",
        purpose: String(data.outcome ?? "").trim() || null,
        constellation: data.home ? data.home[0].toUpperCase() + data.home.slice(1) : null,
        class: data.class ?? null,
        ...payload,
      }], "return=minimal");
      inserted++;
      notes.push(`inserted filesystem-only system ${slug}`);
    }
  }

  const withContract = await (await canon("GET", "systems?select=system_slug&contract=not.is.null")).json();
  console.log(JSON.stringify({
    filesystem_systems: fsSystems.length,
    patched, inserted,
    canon_systems_with_contract: withContract.length,
    notes,
  }, null, 2));
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
