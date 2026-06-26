/**
 * Canon Engine — Cloud-native transcript fetch.
 *
 * Replaces scripts/gws-fetch-transcripts.ts. Same logic, same flow,
 * but uses googleapis directly instead of gws CLI, and Supabase for
 * state instead of local JSON files.
 *
 * This function is called directly from the Inngest workflow
 * (no subprocess spawning).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createImpersonatedAuth, MEET_READONLY, DRIVE_READONLY } from './auth.js';
import { listConferenceRecords, listTranscripts, getTranscript, listParticipants } from './meet.js';
import { exportFile } from './drive.js';
import { getTranscriptState, saveTranscriptState } from './ingestion-state.js';
import { ACCOUNTS, classifyMeeting, extractAccount } from './accounts.js';
import { ingestTranscript } from '../pipelines/transcript-ingest.js';
import type { TranscriptInput } from '../pipelines/transcript-ingest.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranscriptDeps {
  supabase: SupabaseClient;
  enricher: any;
  embeddings: any;
  emitter?: import('../events/event-emitter.js').CanonEventEmitter;
}

interface FetchOptions {
  lookbackHours?: number;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [transcripts] ${msg}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function fetchTranscripts(
  deps: TranscriptDeps,
  stateSupabase: SupabaseClient,
  options: FetchOptions = {},
): Promise<{ ingested: number; errors: string[] }> {
  const lookbackHours = options.lookbackHours ?? 72;
  const defaultSince = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
  const errors: string[] = [];
  let ingested = 0;

  // Dedupe conferences across accounts (same meeting seen by multiple users)
  const seenConferences = new Set<string>();

  const transcriptAccounts = ACCOUNTS.filter((a) => a.pipelines.includes('transcripts'));

  for (const account of transcriptAccounts) {
    // Load state from Supabase
    const state = await getTranscriptState(stateSupabase, account.email);
    const processedSet = new Set(state.processedTranscripts);
    const since = state.lastPolledAt ? new Date(state.lastPolledAt) : defaultSince;

    // Create auth for this account
    const auth = createImpersonatedAuth(account.email, [MEET_READONLY, DRIVE_READONLY]);

    log(`Polling ${account.email} (${account.org}) since ${since.toISOString()}`);

    // Step 1: List conference records ending after since time
    let conferences: any[];
    try {
      conferences = await listConferenceRecords(auth, since);
    } catch (err: any) {
      const msg = `Error listing conferences for ${account.email}: ${err.message}`;
      log(msg);
      errors.push(msg);
      continue;
    }

    log(`  Found ${conferences.length} conference(s)`);

    for (const conf of conferences) {
      const confName = conf.name;
      if (!confName) continue;

      // Dedupe across accounts
      if (seenConferences.has(confName)) continue;
      seenConferences.add(confName);

      // Step 2: List transcripts for this conference
      let transcripts: any[];
      try {
        transcripts = await listTranscripts(auth, confName);
      } catch (err: any) {
        log(`  Error listing transcripts for ${confName}: ${err.message}`);
        errors.push(`Transcripts list failed for ${confName}: ${err.message}`);
        continue;
      }

      for (const t of transcripts) {
        if (!t.name || t.state !== 'FILE_GENERATED') continue;
        if (processedSet.has(t.name)) {
          log(`  Skipping already-processed: ${t.name}`);
          continue;
        }

        log(`  Processing transcript: ${t.name}`);

        try {
          // Step 3: Get transcript details -> resolve Drive doc
          const tDetail = await getTranscript(auth, t.name);

          const docsDestination = tDetail?.docsDestination;
          if (!docsDestination?.document) {
            log(`  No docs destination for ${t.name} — skipping`);
            processedSet.add(t.name);
            continue;
          }

          const driveFileId = docsDestination.document.split('/').pop() ?? docsDestination.document;
          const driveDocUrl = docsDestination.exportUri ??
            `https://docs.google.com/document/d/${driveFileId}`;

          log(`  Drive file: ${driveFileId}`);

          // Step 4: Export transcript text from Drive
          let transcriptText: string;
          try {
            transcriptText = await exportFile(auth, driveFileId);
          } catch (err: any) {
            log(`  Error exporting Drive file ${driveFileId}: ${err.message}`);
            errors.push(`Drive export failed for ${driveFileId}: ${err.message}`);
            continue;
          }

          if (!transcriptText.trim()) {
            log(`  Empty transcript text — skipping`);
            processedSet.add(t.name);
            continue;
          }

          // Step 5: Get participants
          let participants: string[] = [];
          try {
            participants = await listParticipants(auth, confName);
          } catch (err: any) {
            log(`  Warning: could not get participants: ${err.message}`);
          }

          // Step 6: Classify and extract account
          const meetingDate = conf.startTime ?? new Date().toISOString();
          const meetingType = classifyMeeting(participants, transcriptText);
          const meetingAccount = extractAccount(participants, transcriptText, account.org);

          // Step 7: Build input and ingest
          const input: TranscriptInput = {
            transcriptText,
            googleDocUrl: driveDocUrl,
            driveFileId,
            meetingDate,
            participants,
            meetingType,
            client: meetingAccount,
            workspaceAccount: account.org,
            account: meetingAccount,
          };

          log(`  Ingesting: ${participants.length} participants, ${transcriptText.length} chars, account=${meetingAccount}`);

          const result = await ingestTranscript(input, deps);

          log(`  Ingested: record=${result.transcriptId}, chunks=${result.chunksInserted}`);

          processedSet.add(t.name);
          ingested++;

        } catch (err: any) {
          const msg = `Error processing transcript ${t.name}: ${err.message}`;
          log(`  ${msg}`);
          errors.push(msg);
        }
      }
    }

    // Save state (2-min overlap to avoid gaps)
    const lastPolledAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    await saveTranscriptState(stateSupabase, account.email, lastPolledAt, Array.from(processedSet));
  }

  log(`Done: ${ingested} transcript(s) ingested, ${errors.length} error(s)`);
  return { ingested, errors };
}
