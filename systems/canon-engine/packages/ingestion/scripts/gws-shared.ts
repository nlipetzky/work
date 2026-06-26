/**
 * Canon Engine — Shared utilities for gws CLI-based fetch scripts.
 *
 * Provides:
 * - execGws(): shell out to gws CLI, parse JSON output
 * - Account config for all monitored accounts
 * - State management (read/write JSON state files)
 * - Dependency creation (supabase, enricher, embeddings)
 * - .env loading
 */

import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { createClient } from '@supabase/supabase-js';
import {
  createTranscriptEnricher,
  createEmailEnricher,
  createClaudeClient,
} from '../src/pipelines/adapters/index.js';
import { createEmbeddingClient } from '../src/pipelines/embeddings.js';

// ---------------------------------------------------------------------------
// .env loading (simple — no dependency needed)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

async function loadEnv(): Promise<void> {
  try {
    const envPath = join(PROJECT_ROOT, '.env');
    const content = await readFile(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env not found — rely on existing env vars
  }
}

// Load .env on import
let _envLoaded = false;
export async function ensureEnv(): Promise<void> {
  if (_envLoaded) return;
  await loadEnv();
  _envLoaded = true;
}

// ---------------------------------------------------------------------------
// Account configuration
// ---------------------------------------------------------------------------

export interface AccountConfig {
  email: string;
  org: string;
  /** Which gws config profile to use (maps to GOOGLE_WORKSPACE_CLI_CONFIG_DIR) */
  gwsProfile: string;
  pipelines: ('transcripts' | 'emails')[];
}

/**
 * gws CLI profile directories. Each org's primary user authenticates once
 * via `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=<dir> gws auth login`.
 *
 * Accounts within the same org share the same OAuth token (the primary
 * user's token can access Meet/Drive/Gmail for that org).
 */
const GWS_PROFILES: Record<string, string> = {
  instig8: join(homedir(), '.config', 'gws'),                   // default — already authed
  konstellationai: join(homedir(), '.config', 'gws-konstellationai'), // needs one-time auth
};

export const ACCOUNTS: AccountConfig[] = [
  { email: 'nick@konstellationai.com', org: 'konstellationai', gwsProfile: 'konstellationai', pipelines: ['transcripts', 'emails'] },
  // agent_8@konstellationai.com removed 2026-06-23 — account deleted by Nick
  { email: 'nick@instig8.ai', org: 'instig8', gwsProfile: 'instig8', pipelines: ['transcripts', 'emails'] },
  { email: 'agent_8@instig8.ai', org: 'instig8', gwsProfile: 'instig8', pipelines: ['transcripts', 'emails'] },
];

export const KNOWN_INTERNAL_DOMAINS = ['instig8.ai', 'konstellationai.com'];

// ---------------------------------------------------------------------------
// gws CLI execution
// ---------------------------------------------------------------------------

/** Current gws profile config dir — set by setGwsProfile() before each account's fetch run. */
let _currentGwsConfigDir: string | undefined;

/** Set the gws profile for subsequent execGws calls. */
export function setGwsProfile(profileName: string): void {
  const dir = GWS_PROFILES[profileName];
  if (!dir) throw new Error(`Unknown gws profile: ${profileName}. Known: ${Object.keys(GWS_PROFILES).join(', ')}`);
  _currentGwsConfigDir = dir;
}

export async function execGws(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (_currentGwsConfigDir) {
      env.GOOGLE_WORKSPACE_CLI_CONFIG_DIR = _currentGwsConfigDir;
    }
    execFile('gws', args, { maxBuffer: 10 * 1024 * 1024, env }, (error, stdout, stderr) => {
      if (error) {
        // gws returns JSON errors too — try to parse
        const output = stdout || stderr;
        try {
          const parsed = JSON.parse(output);
          if (parsed.error) {
            reject(new Error(`gws error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
            return;
          }
        } catch {
          // Not JSON
        }
        reject(new Error(`gws failed: ${error.message}\n${stderr}`));
        return;
      }

      const output = stdout.trim();
      if (!output) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(output));
      } catch {
        // Some commands return plain text (e.g., drive export)
        resolve(output);
      }
    });
  });
}

/**
 * Run a gws command with params object.
 */
export async function gwsWithParams(
  args: string[],
  params: Record<string, unknown>,
): Promise<any> {
  return execGws([...args, '--params', JSON.stringify(params)]);
}

// ---------------------------------------------------------------------------
// gws Drive export — saves to temp file, returns text content
// ---------------------------------------------------------------------------

let _exportCounter = 0;

/**
 * Export a Google Doc via gws drive files export.
 * gws saves binary/text output to a file — this helper writes to a temp file
 * and reads the content back.
 */
export async function gwsExportDriveFile(fileId: string, mimeType: string = 'text/plain'): Promise<string> {
  const tmpFile = join(__dirname, `.fetch-state`, `_export_${_exportCounter++}.tmp`);
  await mkdir(join(__dirname, '.fetch-state'), { recursive: true });

  try {
    await execGws([
      'drive', 'files', 'export',
      '--params', JSON.stringify({ fileId, mimeType }),
      '-o', tmpFile,
    ]);
    const content = await readFile(tmpFile, 'utf8');
    return content;
  } finally {
    // Clean up temp file
    try { await unlink(tmpFile); } catch {}
  }
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

const STATE_DIR = join(__dirname, '.fetch-state');

async function ensureStateDir(): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
}

export async function loadState<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureStateDir();
  try {
    const content = await readFile(join(STATE_DIR, filename), 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

export async function saveState<T>(filename: string, state: T): Promise<void> {
  await ensureStateDir();
  await writeFile(join(STATE_DIR, filename), JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Pipeline dependencies
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to packages/canon/.env`);
  }
  return value;
}

let _supabase: ReturnType<typeof createClient> | null = null;
let _embeddings: ReturnType<typeof createEmbeddingClient> | null = null;
let _claude: ReturnType<typeof createClaudeClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_KEY'),
    );
  }
  return _supabase;
}

export function getEmbeddings() {
  if (!_embeddings) {
    _embeddings = createEmbeddingClient(requireEnv('OPENAI_API_KEY'));
  }
  return _embeddings;
}

export function getClaude() {
  if (!_claude) {
    _claude = createClaudeClient();
  }
  return _claude;
}

export async function getTranscriptDeps() {
  await ensureEnv();
  return {
    supabase: getSupabase(),
    enricher: createTranscriptEnricher(getClaude()),
    embeddings: getEmbeddings(),
  };
}

export async function getEmailDeps() {
  await ensureEnv();
  return {
    supabase: getSupabase(),
    enricher: createEmailEnricher(getClaude()),
    embeddings: getEmbeddings(),
  };
}

// ---------------------------------------------------------------------------
// Meeting classification helpers
// ---------------------------------------------------------------------------

export function classifyMeeting(participants: string[], text: string): string {
  const textLower = text.toLowerCase().slice(0, 2000);

  if (textLower.includes('standup') || textLower.includes('stand-up')) return 'standup';
  if (textLower.includes('sprint') || textLower.includes('retrospective')) return 'sprint-ceremony';
  if (textLower.includes('interview') || textLower.includes('candidate')) return 'interview';

  return 'client-call';
}

export function extractAccount(
  participants: string[],
  text: string,
  defaultOrg: string,
): string {
  for (const participant of participants) {
    const emailMatch = participant.match(/@([a-zA-Z0-9.-]+)/);
    if (emailMatch) {
      const domain = emailMatch[1].toLowerCase();
      if (!KNOWN_INTERNAL_DOMAINS.includes(domain)) {
        return domain.split('.')[0];
      }
    }
  }
  return defaultOrg;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export function log(prefix: string, msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${prefix}] ${msg}`);
}
