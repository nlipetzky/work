/**
 * Canon Engine — Fetch all data from Google Workspace via gws CLI.
 *
 * Runs transcript and email fetchers in sequence.
 *
 * Usage: npx tsx scripts/gws-fetch-all.ts
 */

import { fetchTranscripts } from './gws-fetch-transcripts.js';
import { fetchEmails } from './gws-fetch-emails.js';
import { fetchCalendar } from './gws-fetch-calendar.js';

async function main() {
  console.log('=== Canon Engine — gws Fetch All ===\n');

  // 1. Transcripts (Meet API)
  console.log('--- Fetching transcripts ---');
  const tResult = await fetchTranscripts();

  // 2. Emails (Gmail API)
  console.log('\n--- Fetching emails ---');
  const eResult = await fetchEmails();

  // 3. Calendar (Calendar API)
  console.log('\n--- Fetching calendar ---');
  const cResult = await fetchCalendar();

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Transcripts: ${tResult.ingested} ingested, ${tResult.errors.length} errors`);
  console.log(`Emails: ${eResult.ingested} ingested, ${eResult.errors.length} errors`);
  console.log(`Calendar: ${cResult.ingested} upserted, ${cResult.errors.length} errors`);

  // Calendar scope errors (e.g. konstellationai profile pending a calendar-scope re-auth)
  // are expected and self-resolving — log them but don't fail the scheduled run.
  if (cResult.errors.length > 0) {
    console.warn('Calendar (non-fatal):', cResult.errors);
  }

  const allErrors = [...tResult.errors, ...eResult.errors];
  if (allErrors.length > 0) {
    console.error('\nErrors:');
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
