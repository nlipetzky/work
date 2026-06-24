/**
 * Canon Engine — Ingest local meeting transcripts from anarlog (local-first notetaker).
 *
 * Replaces the Google Meet leg (dead: external account 403s the sensitive Meet scope).
 * anarlog writes one directory per meeting: <base>/sessions/<folders...>/<session-UUID>/
 *   - transcript.json  : verbatim words (text, start_ms, end_ms, speaker, channel)
 *   - _meta.json       : { title, created_at, participants[], event, ... }
 *   - _memo.md         : AI summary (NOT used — Canon runs its own Claude enrich)
 *
 * Flow per session:
 * 1. Discover transcript.json files under the anarlog sessions dir
 * 2. Skip unchanged ones (state keyed by session UUID + file mtime)
 * 3. Reconstruct speaker-labeled text from words[] (groups consecutive words by speaker)
 * 4. Call ingestTranscript() with the session UUID as the stable dedup id
 *    -> Claude enrich -> upsert transcripts -> chunk -> embed -> insert chunks
 * The downstream transcript-router (launchd com.nick.transcript-router) then files a
 * capture_items action automatically. No work needed there.
 *
 * Dedup: driveFileId = anarlog session UUID (NOT a content hash). Editing/re-exporting a
 * meeting updates the SAME transcript row in place (onConflict google_drive_file_id).
 *
 * Sessions dir: env ANARLOG_SESSIONS_DIR, else common app-support locations are probed.
 * If none exists (anarlog not installed yet), this exits 0 with "nothing to ingest".
 *
 * Usage: npx tsx scripts/anarlog-fetch-transcripts.ts
 */

import { homedir } from 'node:os';
import { join, relative, dirname, basename } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import {
  ensureEnv,
  loadState,
  saveState,
  getTranscriptDeps,
  classifyMeeting,
  extractAccount,
  log,
} from './gws-shared.js';
import { ingestTranscript } from '../src/pipelines/transcript-ingest.js';
import type { TranscriptInput } from '../src/pipelines/transcript-ingest.js';

// ---------------------------------------------------------------------------
// State (session UUID -> transcript.json mtime ms)
// ---------------------------------------------------------------------------

interface AnarlogState {
  processed: Record<string, number>;
}

const STATE_FILE = 'anarlog-transcripts.json';

// ---------------------------------------------------------------------------
// anarlog on-disk shapes (defensive — fields are from the fs-format crate, not a
// live capture; parse leniently and tolerate missing keys)
// ---------------------------------------------------------------------------

interface AnarWord {
  text?: string;
  start_ms?: number;
  speaker?: string | number | null;
  channel?: string | number | null;
}
interface AnarTranscript {
  words?: AnarWord[];
  started_at?: number;
  memo_md?: string;
}
interface AnarTranscriptJson {
  transcripts?: AnarTranscript[];
}
interface AnarMeta {
  title?: string;
  created_at?: string | number;
  participants?: Array<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Sessions-dir resolution
// ---------------------------------------------------------------------------

function resolveSessionsRoots(): string[] {
  const env = process.env['ANARLOG_SESSIONS_DIR'];
  if (env) return [env];
  const home = homedir();
  const appSupport = join(home, 'Library', 'Application Support');
  // Real install writes to ~/Library/Application Support/anarlog/sessions/.
  // Probe the sessions dir directly (avoids walking model/audio trees).
  return [
    join(appSupport, 'anarlog', 'sessions'),
    join(appSupport, 'com.hyprnote.stable', 'sessions'),
    join(appSupport, 'com.hyprnote.dev', 'sessions'),
    join(home, '.anarlog', 'sessions'),
  ];
}

async function findTranscriptFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > 8) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(p, depth + 1);
      } else if (e.isFile() && e.name === 'transcript.json') {
        out.push(p);
      }
    }
  }
  await walk(root, 0);
  return out;
}

// ---------------------------------------------------------------------------
// Parsing / reconstruction
// ---------------------------------------------------------------------------

/** Build a chunker-friendly label. The chunker's speaker regex requires the line to
 *  start with a letter, so numeric speaker/channel ids get a "Speaker " prefix. */
function speakerLabel(w: AnarWord): string {
  const raw = w.speaker ?? w.channel;
  if (raw === null || raw === undefined || raw === '') return 'Speaker';
  const s = String(raw).trim();
  if (!s) return 'Speaker';
  return /^[A-Za-z]/.test(s) ? s : `Speaker ${s}`;
}

/** Reconstruct "Speaker: text" lines by grouping consecutive words by speaker. */
function reconstructText(transcripts: AnarTranscript[]): { text: string; speakers: Set<string> } {
  const lines: string[] = [];
  const speakers = new Set<string>();
  let curSpeaker: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (curSpeaker !== null && buf.length > 0) {
      lines.push(`${curSpeaker}: ${buf.join(' ').replace(/\s+/g, ' ').trim()}`);
    }
    buf = [];
  };

  for (const t of transcripts) {
    for (const w of t.words ?? []) {
      const text = (w.text ?? '').trim();
      if (!text) continue;
      const label = speakerLabel(w);
      speakers.add(label);
      if (label !== curSpeaker) {
        flush();
        curSpeaker = label;
      }
      buf.push(text);
    }
  }
  flush();
  return { text: lines.join('\n'), speakers };
}

function toIso(value: string | number | undefined, fallbackMs: number): string {
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  if (typeof value === 'number' && value > 0) {
    // Heuristic: < 1e12 is seconds, else milliseconds.
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(fallbackMs).toISOString();
}

/** True for a real human name; rejects empty values and UUID-shaped ids
 *  (anarlog's manual-mode participants are id stubs, not names). */
function looksLikeName(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    v.trim().length > 0 &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim())
  );
}

/** Pull human-readable participant names from _meta if present, else fall back to
 *  the distinct speaker labels seen in the transcript. In manual mode (no calendar
 *  sync) _meta carries only UUID stubs, so this falls back to speaker labels. */
function resolveParticipants(meta: AnarMeta | null, speakers: Set<string>): string[] {
  const names: string[] = [];
  for (const p of meta?.participants ?? []) {
    const cand = [p['name'], p['displayName'], p['full_name']].find(looksLikeName);
    if (cand) names.push((cand as string).trim());
  }
  if (names.length > 0) return Array.from(new Set(names));
  return Array.from(speakers);
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function fetchAnarlogTranscripts(): Promise<{ ingested: number; errors: string[] }> {
  await ensureEnv();

  const errors: string[] = [];
  let ingested = 0;

  const root = resolveSessionsRoots().find((p) => existsSync(p));
  if (!root) {
    log('anarlog', 'No anarlog sessions dir found (set ANARLOG_SESSIONS_DIR). Nothing to ingest.');
    return { ingested: 0, errors: [] };
  }

  log('anarlog', `Scanning ${root}`);
  const files = await findTranscriptFiles(root);
  log('anarlog', `Found ${files.length} transcript file(s)`);
  if (files.length === 0) return { ingested: 0, errors: [] };

  const state = await loadState<AnarlogState>(STATE_FILE, { processed: {} });
  const deps = await getTranscriptDeps();

  for (const file of files) {
    const sessionId = basename(dirname(file));
    let mtimeMs: number;
    try {
      mtimeMs = Math.floor(statSync(file).mtimeMs);
    } catch {
      mtimeMs = Date.now();
    }

    if (state.processed[sessionId] === mtimeMs) {
      continue; // unchanged since last ingest
    }

    try {
      const tj = await readJson<AnarTranscriptJson>(file);
      const transcripts = tj?.transcripts ?? [];
      const { text, speakers } = reconstructText(transcripts);

      if (!text.trim()) {
        log('anarlog', `  Empty transcript, skipping: ${sessionId}`);
        state.processed[sessionId] = mtimeMs;
        continue;
      }

      const meta = await readJson<AnarMeta>(join(dirname(file), '_meta.json'));
      const participants = resolveParticipants(meta, speakers);
      const meetingDate = toIso(
        meta?.created_at ?? transcripts[0]?.started_at,
        mtimeMs,
      );
      const meetingType = classifyMeeting(participants, text);
      const account = extractAccount(participants, text, 'anarlog');

      const input: TranscriptInput = {
        transcriptText: text,
        driveFileId: sessionId, // STABLE dedup id — anarlog session UUID
        meetingDate,
        participants,
        meetingType,
        client: account,
        account,
        sourceType: 'uploaded_file',
        originalFilename: relative(root, file),
      };

      log(
        'anarlog',
        `  Ingesting ${sessionId}: ${participants.length} participant(s), ${text.length} chars, account=${account}`,
      );
      const result = await ingestTranscript(input, deps);
      log('anarlog', `  Ingested: record=${result.transcriptId}, chunks=${result.chunksInserted}`);

      state.processed[sessionId] = mtimeMs;
      ingested++;
    } catch (err) {
      const msg = `Error ingesting ${sessionId}: ${err instanceof Error ? err.message : String(err)}`;
      log('anarlog', `  ${msg}`);
      errors.push(msg);
    }
  }

  await saveState(STATE_FILE, state);
  log('anarlog', `Done: ${ingested} transcript(s) ingested, ${errors.length} error(s)`);
  return { ingested, errors };
}

// ---------------------------------------------------------------------------
// Run if executed directly
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1]?.includes('anarlog-fetch-transcripts');
if (isDirectRun) {
  fetchAnarlogTranscripts()
    .then(({ ingested, errors }) => {
      if (errors.length > 0) {
        console.error('Errors:', errors);
        process.exit(1);
      }
      console.log(`Successfully ingested ${ingested} transcript(s)`);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
