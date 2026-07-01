/**
 * Canon Engine — Cloud-native email fetch.
 *
 * Replaces scripts/gws-fetch-emails.ts. Same logic, same flow,
 * but uses googleapis directly instead of gws CLI, and Supabase for
 * state instead of local JSON files.
 *
 * This function is called directly from the Inngest workflow
 * (no subprocess spawning).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createImpersonatedAuth, GMAIL_READONLY } from './auth.js';
import {
  listHistory,
  getMessage,
  listRecentMessages,
  listLabels,
  parseGmailMessage,
  extractMessageIdsFromHistory,
  extractAllMessageIdsFromHistory,
} from './gmail.js';
import { getEmailState, saveEmailState } from './ingestion-state.js';
import { ACCOUNTS } from './accounts.js';
import { ingestEmail } from '../pipelines/email-ingest.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailDeps {
  supabase: SupabaseClient;
  enricher: any;
  embeddings: any;
  emitter?: import('../events/event-emitter.js').CanonEventEmitter;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AOS_INGEST_LABEL_NAME = 'AOS/Ingest';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [emails] ${msg}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function fetchEmails(
  deps: EmailDeps,
  stateSupabase: SupabaseClient,
): Promise<{ ingested: number; errors: string[] }> {
  const errors: string[] = [];
  let ingested = 0;

  const emailAccounts = ACCOUNTS.filter((a) => a.pipelines.includes('emails'));

  for (const account of emailAccounts) {
    // Create auth for this account
    const auth = createImpersonatedAuth(account.email, [GMAIL_READONLY]);

    log(`Fetching for ${account.email} (${account.org})`);

    // Resolve AOS/Ingest label ID
    let aosLabelId: string | null = null;
    try {
      const labels = await listLabels(auth);
      const aosLabel = labels.find((l: any) => l.name === AOS_INGEST_LABEL_NAME);
      aosLabelId = aosLabel?.id ?? null;
    } catch {
      // Label resolution is optional
    }

    // Load state from Supabase
    const state = await getEmailState(stateSupabase, account.email);
    let messageIds: string[];
    let newHistoryId: string | null = null;

    if (!state.lastHistoryId) {
      // No history ID saved — seed from recent messages to establish the cursor.
      // ingestAll mailboxes seed across all folders (INBOX + SENT + archived);
      // gated mailboxes seed from INBOX only.
      log(
        account.ingestAll
          ? `  No saved historyId — seeding recent mail (all folders)`
          : `  No saved historyId — fetching recent INBOX messages`,
      );
      try {
        messageIds = account.ingestAll
          ? await listRecentMessages(auth, [], 100)
          : await listRecentMessages(auth, ['INBOX'], 10);
      } catch (err: any) {
        const msg = `Error listing messages for ${account.email}: ${err.message}`;
        log(`  ${msg}`);
        errors.push(msg);
        continue;
      }
    } else {
      // Incremental fetch via history
      try {
        const historyData = await listHistory(auth, state.lastHistoryId);
        messageIds = account.ingestAll
          ? extractAllMessageIdsFromHistory(historyData)
          : extractMessageIdsFromHistory(historyData, aosLabelId);

        if (historyData?.historyId) {
          newHistoryId = historyData.historyId;
        }
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('notFound') || err.code === 404) {
          // History expired — fall back to recent messages
          log(`  History expired, fetching recent mail`);
          try {
            messageIds = account.ingestAll
              ? await listRecentMessages(auth, [], 25)
              : await listRecentMessages(auth, ['INBOX'], 5);
          } catch (listErr: any) {
            errors.push(`Error listing messages for ${account.email}: ${listErr.message}`);
            continue;
          }
        } else {
          errors.push(`Error fetching history for ${account.email}: ${err.message}`);
          continue;
        }
      }
    }

    log(`  Found ${messageIds.length} message(s) to process`);

    for (const msgId of messageIds) {
      try {
        const msgData = await getMessage(auth, msgId);

        const emailMsg = parseGmailMessage(msgData, account.email);
        if (!emailMsg) {
          log(`  Skipping message ${msgId} — could not parse`);
          continue;
        }

        const result = await ingestEmail(emailMsg, account.org, deps);

        log(`  Ingested: ${emailMsg.subject} (thread=${result.threadId}, chunks=${result.chunksInserted}, new=${result.isNewThread})`);
        ingested++;

        // Track highest historyId from message responses
        if (msgData?.historyId) {
          if (!newHistoryId || parseInt(msgData.historyId) > parseInt(newHistoryId)) {
            newHistoryId = msgData.historyId;
          }
        }
      } catch (err: any) {
        const msg = `Error processing message ${msgId}: ${err.message}`;
        log(`  ${msg}`);
        errors.push(msg);
      }
    }

    // Save state
    if (newHistoryId) {
      await saveEmailState(stateSupabase, account.email, newHistoryId);
    }
  }

  log(`Done: ${ingested} email(s) ingested, ${errors.length} error(s)`);
  return { ingested, errors };
}
