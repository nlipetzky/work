#!/usr/bin/env node
/**
 * sync-skills.mjs — mirror filesystem SKILL.md files into canon.public.skills.
 *
 * Walks the operator OS for SKILL.md files at the four canonical locations,
 * parses YAML frontmatter, and upserts one row per skill into canon. Filesystem
 * stays the source-of-truth for skill bodies; this script keeps the canon
 * mirror fresh so /operate (slice 2B) + agents can discover skills by trigger
 * or owner.
 *
 * Locations scanned (relative to /Users/nplmini/code/work):
 *   - practices/<p>/skills/<slug>/SKILL.md
 *   - capabilities/skills/<slug>/SKILL.md
 *   - systems/<s>/skills/<slug>/SKILL.md
 *   - systems/<s>/personas/<p>/skills/<slug>/SKILL.md
 *
 * Slug = the SKILL.md's parent directory name. owner_system_slug is derived
 * from the path: systems/<slug>/... -> <slug>; everything else is null (the
 * SKILL.md is owned by a practice or capability, not a system).
 *
 * Usage: node systems/canon-engine/scripts/sync-skills.mjs
 * Env:   CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY (read from .env)
 *
 * Idempotent: upsert keyed on slug; last_scanned_at = now() on every run.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, readdir, stat, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(
  process.env.CANON_SUPABASE_URL,
  process.env.CANON_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

// ── frontmatter parser (tolerant) ──────────────────────────────────────────
// Accepts `name:`, `title:`, `description:`, `status:`. Multi-line description
// values are concatenated until the next key or `---`. Malformed files yield
// {} (skipped). YAML quoting is unwrapped; everything else stays raw.
function parseFrontmatter(src) {
  if (!src.startsWith("---")) return {};
  const end = src.indexOf("\n---", 3);
  if (end < 0) return {};
  const body = src.slice(3, end).replace(/^\r?\n/, "");
  const out = {};
  let key = null;
  let buf = [];
  const flush = () => { if (key) out[key] = buf.join(" ").trim(); key = null; buf = []; };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\r$/, "");
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (m) {
      flush();
      key = m[1].toLowerCase();
      const v = m[2].trim().replace(/^["']|["']$/g, "");
      if (v) buf.push(v);
    } else if (key && line.trim()) {
      buf.push(line.trim());
    }
  }
  flush();
  return out;
}

// ── walk helpers ───────────────────────────────────────────────────────────
async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function listDirs(p) {
  if (!(await exists(p))) return [];
  const entries = await readdir(p, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => path.join(p, e.name));
}

async function collectSkillFiles() {
  const hits = []; // { absPath, slug, ownerSystemSlug }
  const add = (absPath, ownerSystemSlug = null) =>
    hits.push({ absPath, slug: path.basename(path.dirname(absPath)), ownerSystemSlug });

  // practices/<p>/skills/<slug>/SKILL.md
  for (const practiceDir of await listDirs(path.join(WORK_ROOT, "practices"))) {
    for (const skillDir of await listDirs(path.join(practiceDir, "skills"))) {
      const f = path.join(skillDir, "SKILL.md");
      if (await exists(f)) add(f, null);
    }
  }

  // capabilities/skills/<slug>/SKILL.md
  for (const skillDir of await listDirs(path.join(WORK_ROOT, "capabilities", "skills"))) {
    const f = path.join(skillDir, "SKILL.md");
    if (await exists(f)) add(f, null);
  }

  // systems/<s>/skills/<slug>/SKILL.md  AND  systems/<s>/personas/<p>/skills/<slug>/SKILL.md
  for (const systemDir of await listDirs(path.join(WORK_ROOT, "systems"))) {
    const systemSlug = path.basename(systemDir);
    for (const skillDir of await listDirs(path.join(systemDir, "skills"))) {
      const f = path.join(skillDir, "SKILL.md");
      if (await exists(f)) add(f, systemSlug);
    }
    for (const personaDir of await listDirs(path.join(systemDir, "personas"))) {
      for (const skillDir of await listDirs(path.join(personaDir, "skills"))) {
        const f = path.join(skillDir, "SKILL.md");
        if (await exists(f)) add(f, systemSlug);
      }
    }
  }

  return hits;
}

// ── .claude/skills mirror (Claude Code auto-discovery) ──────────────────────
// operating-sop is the one system whose skills must AUTO-LOAD into the Claude
// Code sessions spawned by /operate BUILD/ITERATE/RUN. Claude Code discovers
// skills from `<cwd>/.claude/skills/<name>/SKILL.md` (walking up to repo root),
// with no settings.json hook and no reliable symlink support. So we mirror the
// canonical `systems/operating-sop/skills/*` into `.claude/skills/*` as real
// files. The `status:` frontmatter line is stripped from the mirror so the
// canon-registry status (DRAFT/active) never interferes with discovery; the
// canonical copies keep it. The mirror is generated (gitignored); re-running
// this sync keeps it fresh. Not a scanned location, so no double-count in canon.
const MIRROR_OWNER = "operating-sop";
const MIRROR_DIR = path.join(WORK_ROOT, "systems/operating-sop/.claude/skills");

function stripStatusLine(src) {
  if (!src.startsWith("---")) return src;
  const end = src.indexOf("\n---", 3);
  if (end < 0) return src;
  const fm = src
    .slice(0, end)
    .split("\n")
    .filter((l) => !/^\s*status\s*:/i.test(l))
    .join("\n");
  return fm + src.slice(end);
}

async function writeMirror(hits) {
  const mine = hits.filter((h) => h.ownerSystemSlug === MIRROR_OWNER);
  await rm(MIRROR_DIR, { recursive: true, force: true });
  await mkdir(MIRROR_DIR, { recursive: true });
  let mirrored = 0;
  for (const { absPath, slug } of mine) {
    const dir = path.join(MIRROR_DIR, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "SKILL.md"), stripStatusLine(await readFile(absPath, "utf8")), "utf8");
    mirrored++;
  }
  console.log(`\nmirrored ${mirrored} ${MIRROR_OWNER} skills -> .claude/skills (Claude Code auto-discovery)`);
}

// ── main ───────────────────────────────────────────────────────────────────
(async () => {
  const hits = await collectSkillFiles();
  let upserted = 0, skipped = 0, failed = 0;

  for (const { absPath, slug, ownerSystemSlug } of hits) {
    let fm;
    try {
      fm = parseFrontmatter(await readFile(absPath, "utf8"));
    } catch (err) {
      console.error(`  read fail: ${absPath} (${err.message})`);
      failed++; continue;
    }
    const title = fm.title || fm.name || slug;
    if (!fm.title && !fm.name) {
      console.warn(`  no name/title in ${absPath} ... using slug "${slug}"`);
    }
    const rawStatus = (fm.status || "active").toLowerCase();
    const status = ["active", "draft", "deprecated"].includes(rawStatus) ? rawStatus : "active";

    const row = {
      slug,
      title,
      description: fm.description || null,
      path: absPath,
      owner_system_slug: ownerSystemSlug,
      status,
      last_scanned_at: new Date().toISOString(),
    };
    const { error } = await db.from("skills").upsert(row, { onConflict: "slug" });
    if (error) {
      console.error(`  upsert fail: ${slug} (${error.message})`);
      failed++;
    } else {
      console.log(`  upserted ${slug} <- ${absPath}`);
      upserted++;
    }
  }

  console.log(`\nscanned=${hits.length} upserted=${upserted} skipped=${skipped} failed=${failed}`);

  await writeMirror(hits);
})();
