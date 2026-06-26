/**
 * Canon Engine — Cloud-native Drive document fetch.
 *
 * Polls a Google Drive folder (and its subfolders) for new documents and
 * ingests them into Canon/UKB via the document-ingest pipeline.
 *
 * Folder structure expected:
 *   <root folder>/
 *     AOS Platform/        → account: instig8
 *     RevOps/              → account: instig8
 *     Teknova/             → account: teknova
 *     Konstellation AI/    → account: konstellationai
 *     Miller Mechanical/   → account: miller-mechanical
 *
 * Supported file types:
 *   - Google Docs / Slides / Sheets → export as text/plain or CSV
 *   - PDFs and other types → skipped
 *
 * State is tracked in canon_document_state (Supabase) to avoid
 * re-processing files across invocations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { createImpersonatedAuth, DRIVE_READONLY } from './auth.js';
import { listFolderFiles, exportFile, EXPORTABLE_MIME_TYPES } from './drive.js';
import { getDocumentState, saveDocumentState } from './ingestion-state.js';
import { ACCOUNTS } from './accounts.js';
import { ingestDocument } from '../pipelines/document-ingest.js';
import type { DocumentInput } from '../pipelines/document-ingest.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentDeps {
  supabase: SupabaseClient;
  enricher: any;
  embeddings: any;
  emitter?: import('../events/event-emitter.js').CanonEventEmitter;
}

interface FileWithContext {
  file: {
    id: string;
    name: string;
    mimeType: string;
    createdTime?: string;
  };
  account: string;
  sourceContext: string;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [documents] ${msg}`);
}

// ---------------------------------------------------------------------------
// Account inference
// ---------------------------------------------------------------------------

/**
 * Infer account slug from a Drive subfolder name.
 * Falls back to 'instig8' if no match is found.
 */
function inferAccount(folderName: string): string {
  const name = folderName.toLowerCase();
  if (name.includes('teknova')) return 'teknova';
  if (name.includes('konstellation')) return 'konstellationai';
  if (name.includes('miller')) return 'miller-mechanical';
  if (name.includes('revops')) return 'instig8';
  if (name.includes('aos')) return 'instig8';
  return 'instig8';
}

// ---------------------------------------------------------------------------
// Recursive file collection
// ---------------------------------------------------------------------------

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * Recursively collect all exportable files from a folder and its subfolders.
 * Returns flat list of { file, account, sourceContext } tuples.
 */
async function collectFiles(
  auth: ReturnType<typeof createImpersonatedAuth>,
  folderId: string,
  account: string,
  sourceContext: string,
  depth = 0,
): Promise<FileWithContext[]> {
  if (depth > 3) {
    log(`  Skipping deep subfolder (depth ${depth}): ${folderId}`);
    return [];
  }

  const items = await listFolderFiles(auth as any, folderId);
  const collected: FileWithContext[] = [];

  for (const item of items) {
    if (!item.id || !item.name) continue;

    if (item.mimeType === FOLDER_MIME) {
      // Recurse into subfolder — infer account from subfolder name at depth 1
      const subAccount = depth === 0 ? inferAccount(item.name) : account;
      const subContext = `drive-folder:${item.id}`;
      log(`  Entering subfolder: ${item.name} → account=${subAccount}`);
      const subFiles = await collectFiles(auth, item.id, subAccount, subContext, depth + 1);
      collected.push(...subFiles);
    } else {
      collected.push({ file: item, account, sourceContext });
    }
  }

  return collected;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Fetch and ingest new documents from a Drive folder (recursive).
 * Idempotent — already-processed file IDs are skipped.
 */
export async function fetchDocuments(
  deps: DocumentDeps,
  stateSupabase: SupabaseClient,
  folderId: string,
): Promise<{ ingested: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let ingested = 0;
  let skipped = 0;

  // Load processed file IDs from Supabase
  const state = await getDocumentState(stateSupabase, folderId);
  const processedSet = new Set(state.processedFileIds);

  log(`Listing folder ${folderId} (${processedSet.size} already processed)`);

  // Try each account in order — the folder may be owned by any org
  const driveAccounts = ACCOUNTS.filter((a) => a.pipelines.includes('transcripts'));
  if (driveAccounts.length === 0) {
    throw new Error('No account configured with Drive access');
  }

  let workingAuth: ReturnType<typeof createImpersonatedAuth> | undefined;
  let lastErr: Error | undefined;

  // Try impersonated accounts first (works when folder is in a Workspace org)
  for (const account of driveAccounts) {
    try {
      const auth = createImpersonatedAuth(account.email, [DRIVE_READONLY]);
      // Probe the folder to confirm access
      await listFolderFiles(auth as any, folderId);
      workingAuth = auth;
      log(`Authenticated as ${account.email}`);
      break;
    } catch (err: any) {
      log(`  ${account.email} cannot access folder: ${err.message}`);
      lastErr = err;
    }
  }

  // Fallback: service account direct auth (works when folder is shared with the SA)
  if (!workingAuth) {
    try {
      log('Trying service account direct auth (no impersonation)');
      const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (keyBase64) {
        const keyJson = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf8'));
        const saAuth = new google.auth.JWT({
          email: keyJson.client_email,
          key: keyJson.private_key,
          scopes: [DRIVE_READONLY],
        });
        await listFolderFiles(saAuth as any, folderId);
        workingAuth = saAuth as any;
        log('Authenticated as service account (direct)');
      }
    } catch (err: any) {
      log(`  Service account direct auth failed: ${err.message}`);
      lastErr = err;
    }
  }

  if (!workingAuth) {
    throw new Error(
      `Failed to list Drive folder ${folderId}. ` +
      `Share the folder with aos-fetcher@instig8-aos-events.iam.gserviceaccount.com as Viewer. ` +
      `Last error: ${lastErr?.message}`
    );
  }

  const auth = workingAuth;

  // Collect all files recursively (top-level folders → per-account subfolders → files)
  log(`Collecting files recursively from folder ${folderId}...`);
  const allFiles = await collectFiles(auth, folderId, 'instig8', `drive-folder:${folderId}`);
  log(`Found ${allFiles.length} file(s) across all subfolders`);

  for (const { file, account, sourceContext } of allFiles) {
    // Skip already-processed
    if (processedSet.has(file.id)) {
      log(`  Skipping already-processed: ${file.name}`);
      skipped++;
      continue;
    }

    // Only process exportable Google Workspace types
    if (!EXPORTABLE_MIME_TYPES.has(file.mimeType)) {
      log(`  Skipping unsupported type ${file.mimeType}: ${file.name}`);
      skipped++;
      continue;
    }

    log(`  Processing [${account}]: ${file.name} (${file.mimeType})`);

    try {
      const exportMime = file.mimeType === 'application/vnd.google-apps.spreadsheet'
        ? 'text/csv'
        : 'text/plain';

      const text = await exportFile(auth as any, file.id, exportMime);

      if (!text.trim()) {
        log(`  Empty content — skipping: ${file.name}`);
        processedSet.add(file.id);
        continue;
      }

      const fileType = file.mimeType.includes('spreadsheet') ? 'sheet'
        : file.mimeType.includes('presentation') ? 'slides'
        : 'doc';

      const input: DocumentInput = {
        documentText: text,
        title: file.name,
        fileType,
        driveFileId: file.id,
        driveUrl: `https://docs.google.com/document/d/${file.id}`,
        date: file.createdTime ?? new Date().toISOString(),
        account,
        sourceContext,
      };

      const result = await ingestDocument(input, deps);

      log(`  Ingested: id=${result.documentId}, chunks=${result.chunksInserted}`);
      processedSet.add(file.id);
      ingested++;

    } catch (err: any) {
      const msg = `Error processing ${file.name} (${file.id}): ${err.message}`;
      log(`  ${msg}`);
      errors.push(msg);
    }
  }

  // Persist updated state
  await saveDocumentState(stateSupabase, folderId, Array.from(processedSet));

  log(`Done: ${ingested} ingested, ${skipped} skipped, ${errors.length} error(s)`);
  return { ingested, skipped, errors };
}
