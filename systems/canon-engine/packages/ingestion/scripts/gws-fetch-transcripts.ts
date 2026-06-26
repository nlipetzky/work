/**
 * Canon Engine — Fetch meeting transcripts via gws CLI.
 *
 * Flow:
 * 1. For each account, list recent Meet conference records via gws CLI
 * 2. For each conference, list transcripts with FILE_GENERATED state
 * 3. Resolve transcript -> Drive doc, export as plain text
 * 4. Get participants from conference record
 * 5. Call ingestTranscript() directly (Claude enrichment -> Supabase)
 *
 * Usage: npx tsx scripts/gws-fetch-transcripts.ts [--since YYYY-MM-DD] [--lookback-hours N]
 */

import {
  ACCOUNTS,
  gwsWithParams,
  gwsExportDriveFile,
  loadState,
  saveState,
  getTranscriptDeps,
  classifyMeeting,
  extractAccount,
  setGwsProfile,
  log,
} from './gws-shared.js';
import { ingestTranscript } from '../src/pipelines/transcript-ingest.js';
import type { TranscriptInput } from '../src/pipelines/transcript-ingest.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface TranscriptState {
  /** ISO timestamp of last successful poll per account */
  lastPolledAt: Record<string, string>;
  /** Transcript resource names already processed */
  processedTranscripts: string[];
}

const STATE_FILE = 'transcripts.json';
const DEFAULT_LOOKBACK_HOURS = 72;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseSinceTime(): Date {
  const args = process.argv.slice(2);
  const sinceIdx = args.indexOf('--since');
  if (sinceIdx !== -1 && args[sinceIdx + 1]) {
    return new Date(args[sinceIdx + 1]);
  }
  const lookbackIdx = args.indexOf('--lookback-hours');
  const hours = lookbackIdx !== -1 && args[lookbackIdx + 1]
    ? parseInt(args[lookbackIdx + 1], 10)
    : DEFAULT_LOOKBACK_HOURS;
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function fetchTranscripts(): Promise<{ ingested: number; errors: string[] }> {
  const state = await loadState<TranscriptState>(STATE_FILE, {
    lastPolledAt: {},
    processedTranscripts: [],
  });

  const processedSet = new Set(state.processedTranscripts);
  const defaultSince = parseSinceTime();
  const deps = await getTranscriptDeps();
  const errors: string[] = [];
  let ingested = 0;

  // Dedupe conferences across accounts (same meeting seen by multiple users)
  const seenConferences = new Set<string>();

  const transcriptAccounts = ACCOUNTS.filter((a) => a.pipelines.includes('transcripts'));

  for (const account of transcriptAccounts) {
    const since = state.lastPolledAt[account.email]
      ? new Date(state.lastPolledAt[account.email])
      : defaultSince;

    // Switch gws profile for this account's org
    setGwsProfile(account.gwsProfile);

    log('transcripts', `Polling ${account.email} (${account.org}) since ${since.toISOString()}`);

    // Step 1: List conference records ending after since time
    let conferences: any[];
    try {
      const res = await gwsWithParams(
        ['meet', 'conferenceRecords', 'list'],
        { filter: `end_time >= "${since.toISOString()}"` },
      );
      conferences = res?.conferenceRecords ?? [];
    } catch (err: any) {
      const msg = `Error listing conferences for ${account.email}: ${err.message}`;
      log('transcripts', msg);
      errors.push(msg);
      continue;
    }

    log('transcripts', `  Found ${conferences.length} conference(s)`);

    for (const conf of conferences) {
      const confName = conf.name; // e.g. "conferenceRecords/abc123"
      if (!confName) continue;

      // Dedupe across accounts
      if (seenConferences.has(confName)) continue;
      seenConferences.add(confName);

      // Step 2: List transcripts for this conference
      let transcripts: any[];
      try {
        const tRes = await gwsWithParams(
          ['meet', 'conferenceRecords', 'transcripts', 'list'],
          { parent: confName },
        );
        transcripts = tRes?.transcripts ?? [];
      } catch (err: any) {
        log('transcripts', `  Error listing transcripts for ${confName}: ${err.message}`);
        errors.push(`Transcripts list failed for ${confName}: ${err.message}`);
        continue;
      }

      for (const t of transcripts) {
        if (!t.name || t.state !== 'FILE_GENERATED') continue;
        if (processedSet.has(t.name)) {
          log('transcripts', `  Skipping already-processed: ${t.name}`);
          continue;
        }

        log('transcripts', `  Processing transcript: ${t.name}`);

        try {
          // Step 3: Get transcript details -> resolve Drive doc
          const tDetail = await gwsWithParams(
            ['meet', 'conferenceRecords', 'transcripts', 'get'],
            { name: t.name },
          );

          const docsDestination = tDetail?.docsDestination;
          if (!docsDestination?.document) {
            log('transcripts', `  No docs destination for ${t.name} — skipping`);
            processedSet.add(t.name);
            continue;
          }

          // Extract Drive file ID from the document resource name
          const driveFileId = docsDestination.document.split('/').pop() ?? docsDestination.document;
          const driveDocUrl = docsDestination.exportUri ??
            `https://docs.google.com/document/d/${driveFileId}`;

          log('transcripts', `  Drive file: ${driveFileId}`);

          // Step 4: Export transcript text from Drive
          let transcriptText: string;
          try {
            transcriptText = await gwsExportDriveFile(driveFileId);
          } catch (err: any) {
            log('transcripts', `  Error exporting Drive file ${driveFileId}: ${err.message}`);
            errors.push(`Drive export failed for ${driveFileId}: ${err.message}`);
            continue;
          }

          if (!transcriptText.trim()) {
            log('transcripts', `  Empty transcript text — skipping`);
            processedSet.add(t.name);
            continue;
          }

          // Step 5: Get participants
          let participants: string[] = [];
          try {
            const pRes = await gwsWithParams(
              ['meet', 'conferenceRecords', 'participants', 'list'],
              { parent: confName },
            );
            participants = (pRes?.participants ?? [])
              .map((p: any) =>
                p.signedinUser?.displayName ??
                p.signedinUser?.user ??
                p.anonymousUser?.displayName ??
                '',
              )
              .filter(Boolean);
          } catch (err: any) {
            log('transcripts', `  Warning: could not get participants: ${err.message}`);
          }

          // Step 6: Get meeting date from conference record
          const meetingDate = conf.startTime ?? new Date().toISOString();

          // Step 7: Classify and extract account
          const meetingType = classifyMeeting(participants, transcriptText);
          const meetingAccount = extractAccount(participants, transcriptText, account.org);

          // Step 8: Build input and ingest
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

          log('transcripts', `  Ingesting: ${participants.length} participants, ${transcriptText.length} chars, account=${meetingAccount}`);

          const result = await ingestTranscript(input, deps);

          log('transcripts', `  Ingested: record=${result.transcriptId}, chunks=${result.chunksInserted}`);

          processedSet.add(t.name);
          ingested++;

        } catch (err: any) {
          const msg = `Error processing transcript ${t.name}: ${err.message}`;
          log('transcripts', `  ${msg}`);
          errors.push(msg);
        }
      }
    }

    // Update last polled time for this account (2-min overlap to avoid gaps)
    state.lastPolledAt[account.email] = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  }

  // Save state
  state.processedTranscripts = Array.from(processedSet);
  await saveState(STATE_FILE, state);

  log('transcripts', `Done: ${ingested} transcript(s) ingested, ${errors.length} error(s)`);
  return { ingested, errors };
}

// ---------------------------------------------------------------------------
// Run if executed directly (not when imported by gws-fetch-all)
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1]?.includes('gws-fetch-transcripts');
if (isDirectRun) {
  fetchTranscripts()
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
