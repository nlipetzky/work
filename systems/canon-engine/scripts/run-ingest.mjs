#!/usr/bin/env node
/**
 * run-ingest.mjs — the scheduled multi-account Canon ingest (SERVICE-ACCOUNT path).
 *
 * Runs the three Canon ingest legs in sequence on the cloud-native / domain-wide
 * delegation path (createImpersonatedAuth over the aos-fetcher service account) —
 * NOT the legacy gws-CLI profile path. Designed to run every 5 minutes under
 * launchd (com.nick.canon-ingest.plist), modeled on scripts/watch-signals.mjs.
 *
 *   (a) emails      — runIngestEmails()        [Gmail -> Claude enrich -> embed -> pgvector]
 *   (b) calendar    — fetchCalendar({ supabase }) [structured events -> calendar_events]
 *   (c) transcripts — runIngestTranscripts()   [Meet transcripts -> chunk -> embed]
 *
 * Each leg is wrapped in its own try/catch so a failure in one (notably the Meet
 * transcript leg, which can 403 on a GCP auth blocker) does NOT abort the others.
 * The process always exits 0 so launchd's StartInterval keeps firing on schedule.
 *
 * Runs under plain `node` — it imports the BUILT dist output (apps/api/dist,
 * packages/ingestion/dist) by relative path, so each module resolves its own
 * @canon-engine/* workspace deps from its own package node_modules (bare
 * @canon-engine/* specifiers do NOT resolve from this root-level script).
 *
 * Precondition: run `pnpm build` at the canon-engine root first (turbo builds
 * @canon-engine/db, core, ingestion, then apps/api). Missing/stale dist -> import errors.
 *
 * Usage:  node scripts/run-ingest.mjs
 * Env (from /Users/nplmini/code/work/.env, loaded below):
 *   CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY  (Canon Postgres, service role)
 *   OPENAI_API_KEY                                  (email/transcript embeddings)
 *   ANTHROPIC_API_KEY                               (Claude enrichment)
 *   GOOGLE_SERVICE_ACCOUNT_KEY or _KEY_PATH         (SA key for domain-wide delegation)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Env — same dotenv-free loader watch-signals.mjs uses: read the work-root .env
// and set any var not already present in the process env.
// ---------------------------------------------------------------------------
const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

// ---------------------------------------------------------------------------
// Pipeline imports — the BUILT dist files, by relative path. Importing the
// compiled output lets each module resolve its own workspace deps from its
// package node_modules. The email + transcript wrappers self-wire the full
// Canon deps (service-role Supabase client, Claude enricher, embeddings,
// emitter); getCanonSupabase is that same client, reused for the calendar leg.
// ---------------------------------------------------------------------------
const HERE = path.dirname(fileURLToPath(import.meta.url));
const distUrl = (...p) => pathToFileURL(path.join(HERE, "..", ...p)).href;

const { getCanonSupabase } = await import(distUrl("apps", "api", "dist", "pipelines", "deps.js"));
const { runIngestEmails } = await import(distUrl("apps", "api", "dist", "pipelines", "ingest-emails.js"));
const { runIngestTranscripts } = await import(distUrl("apps", "api", "dist", "pipelines", "ingest-transcripts.js"));
const { fetchCalendar } = await import(distUrl("packages", "ingestion", "dist", "google", "fetch-calendar.js"));

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const stamp = () => new Date().toISOString().slice(11, 19);
const log = (msg) => console.log(`[${stamp()}] [canon-ingest] ${msg}`);

/**
 * Run one leg, catching everything. A thrown error becomes { ingested: 0,
 * errors: [msg] } so one leg's failure never aborts the others.
 */
async function runLeg(name, fn) {
  try {
    const res = (await fn()) ?? {};
    const ingested = typeof res.ingested === "number" ? res.ingested : 0;
    const errors = Array.isArray(res.errors) ? res.errors : [];
    log(`${name}: ingested ${ingested}, ${errors.length} error(s)`);
    for (const e of errors) log(`  ${name} error: ${e}`);
    return { ingested, errorCount: errors.length };
  } catch (err) {
    log(`${name}: FAILED — ${err?.message ?? String(err)}`);
    return { ingested: 0, errorCount: 1 };
  }
}

async function main() {
  log("start (service-account path)");

  const supabase = getCanonSupabase();

  const emails = await runLeg("emails", () => runIngestEmails());
  const calendar = await runLeg("calendar", () => fetchCalendar({ supabase }));
  const transcripts = await runLeg("transcripts", () => runIngestTranscripts());

  const totalIngested = emails.ingested + calendar.ingested + transcripts.ingested;
  const totalErrors = emails.errorCount + calendar.errorCount + transcripts.errorCount;
  log(
    `done — ingested ${totalIngested} total ` +
      `(emails ${emails.ingested}, calendar ${calendar.ingested}, transcripts ${transcripts.ingested}); ` +
      `${totalErrors} error(s)`,
  );
}

// Never propagate a non-zero exit — launchd should keep the interval running.
main()
  .catch((err) => log(`fatal (swallowed): ${err?.message ?? String(err)}`))
  .finally(() => process.exit(0));
