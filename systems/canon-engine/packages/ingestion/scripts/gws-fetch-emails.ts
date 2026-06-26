/**
 * Canon Engine — Fetch emails via gws CLI.
 *
 * Flow:
 * 1. For each account, get Gmail history since last poll
 * 2. For each new message, fetch full content via gws CLI
 * 3. Parse into EmailMessage format
 * 4. Call ingestEmail() directly (Claude enrichment -> Supabase)
 *
 * Usage: npx tsx scripts/gws-fetch-emails.ts [--full-sync]
 */

import {
  ACCOUNTS,
  gwsWithParams,
  loadState,
  saveState,
  getEmailDeps,
  setGwsProfile,
  log,
} from './gws-shared.js';
import { ingestEmail } from '../src/pipelines/email-ingest.js';
import type { EmailMessage } from '../src/pipelines/email-ingest.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface EmailState {
  /** Last processed Gmail historyId per account */
  lastHistoryId: Record<string, string>;
}

const STATE_FILE = 'emails.json';

/** Gmail label name that triggers AOS ingestion on any email. */
const AOS_INGEST_LABEL_NAME = 'AOS/Ingest';

// ---------------------------------------------------------------------------
// Gmail message parsing
// ---------------------------------------------------------------------------

function parseGmailMessage(msg: any, currentUserEmail: string): EmailMessage | null {
  if (!msg?.id || !msg?.threadId) return null;

  const headers: any[] = msg.payload?.headers ?? [];
  const getHeader = (name: string): string =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

  const from = getHeader('from');
  const to = getHeader('to')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const cc = getHeader('cc')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const subject = getHeader('subject');
  const date = getHeader('date');
  const labels: string[] = msg.labelIds ?? [];

  const bodyText = extractBodyText(msg.payload);
  const isOutbound = from.toLowerCase().includes(currentUserEmail.toLowerCase());

  const attachmentParts = findAttachmentParts(msg.payload);
  const hasAttachments = attachmentParts.length > 0;
  const attachmentNames = attachmentParts
    .map((p: any) => p.filename)
    .filter(Boolean)
    .join(', ');

  return {
    messageId: msg.id,
    threadId: msg.threadId,
    from,
    to,
    cc: cc.length > 0 ? cc : undefined,
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    subject,
    bodyText,
    direction: isOutbound ? 'outbound' : 'inbound',
    labels,
    hasAttachments,
    attachmentNames: hasAttachments ? attachmentNames : undefined,
    snippet: msg.snippet,
  };
}

function extractBodyText(payload: any): string {
  if (!payload) return '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBodyText(part);
      if (text) return text;
    }
  }

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64').toString('utf8');
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return '';
}

function findAttachmentParts(payload: any): any[] {
  const parts: any[] = [];
  if (!payload) return parts;
  if (payload.filename && payload.body?.attachmentId) {
    parts.push(payload);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      parts.push(...findAttachmentParts(part));
    }
  }
  return parts;
}

// ---------------------------------------------------------------------------
// History extraction
// ---------------------------------------------------------------------------

function extractMessageIds(historyData: any, aosIngestLabelId: string | null): string[] {
  const ids = new Set<string>();
  if (historyData?.history) {
    for (const entry of historyData.history) {
      if (entry.messagesAdded) {
        for (const added of entry.messagesAdded) {
          const labels: string[] = added.message?.labelIds ?? [];
          if (labels.includes('INBOX') && added.message?.id) {
            ids.add(added.message.id);
          }
        }
      }
      if (aosIngestLabelId && entry.labelsAdded) {
        for (const labelEvent of entry.labelsAdded) {
          const addedLabelIds: string[] = labelEvent.labelIds ?? [];
          if (addedLabelIds.includes(aosIngestLabelId) && labelEvent.message?.id) {
            ids.add(labelEvent.message.id);
          }
        }
      }
    }
  }
  return Array.from(ids);
}

// ---------------------------------------------------------------------------
// AOS/Ingest label resolution
// ---------------------------------------------------------------------------

async function resolveAosIngestLabelId(): Promise<string | null> {
  try {
    const res = await gwsWithParams(
      ['gmail', 'users', 'labels', 'list'],
      { userId: 'me' },
    );
    const label = (res?.labels ?? []).find((l: any) => l.name === AOS_INGEST_LABEL_NAME);
    return label?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function fetchEmails(): Promise<{ ingested: number; errors: string[] }> {
  const state = await loadState<EmailState>(STATE_FILE, { lastHistoryId: {} });
  const deps = await getEmailDeps();
  const errors: string[] = [];
  let ingested = 0;
  const isFullSync = process.argv.includes('--full-sync');

  const aosLabelId = await resolveAosIngestLabelId();

  const emailAccounts = ACCOUNTS.filter((a) => a.pipelines.includes('emails'));

  for (const account of emailAccounts) {
    // Switch gws profile for this account's org
    setGwsProfile(account.gwsProfile);

    log('emails', `Fetching for ${account.email} (${account.org})`);

    let messageIds: string[];

    const lastHistoryId = state.lastHistoryId[account.email];

    if (!lastHistoryId || isFullSync) {
      // No history ID saved — do a full sync of recent INBOX messages
      log('emails', `  No saved historyId — fetching recent INBOX messages`);
      try {
        const listRes = await gwsWithParams(
          ['gmail', 'users', 'messages', 'list'],
          { userId: 'me', labelIds: 'INBOX', maxResults: 10 },
        );
        messageIds = (listRes?.messages ?? []).map((m: any) => m.id).filter(Boolean);
      } catch (err: any) {
        const msg = `Error listing messages for ${account.email}: ${err.message}`;
        log('emails', `  ${msg}`);
        errors.push(msg);
        continue;
      }
    } else {
      // Incremental fetch via history
      try {
        const historyRes = await gwsWithParams(
          ['gmail', 'users', 'history', 'list'],
          {
            userId: 'me',
            startHistoryId: lastHistoryId,
            // historyTypes omitted (fix 2026-06-23): the gws CLI serializes an array as a
            // single JSON value the Gmail API rejects ("Invalid value at 'history_types'").
            // Default returns all types; extractMessageIds() already filters to messagesAdded
            // + labelsAdded, so behavior is unchanged.
          },
        );
        messageIds = extractMessageIds(historyRes, aosLabelId);

        // Update history ID from response
        if (historyRes?.historyId) {
          state.lastHistoryId[account.email] = historyRes.historyId;
        }
      } catch (err: any) {
        const _m = err.message ?? '';
        // History expired/invalid presents several ways from the gws CLI: 404, notFound,
        // or "Requested entity was not found." (fix 2026-06-23 — broadened to self-heal).
        if (_m.includes('404') || /not\s*found/i.test(_m) || _m.includes('Requested entity')) {
          // History expired — fall back to recent messages
          log('emails', `  History expired, fetching recent INBOX`);
          try {
            const listRes = await gwsWithParams(
              ['gmail', 'users', 'messages', 'list'],
              { userId: 'me', labelIds: 'INBOX', maxResults: 5 },
            );
            messageIds = (listRes?.messages ?? []).map((m: any) => m.id).filter(Boolean);
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

    log('emails', `  Found ${messageIds.length} message(s) to process`);

    for (const msgId of messageIds) {
      try {
        const msgData = await gwsWithParams(
          ['gmail', 'users', 'messages', 'get'],
          { userId: 'me', id: msgId, format: 'full' },
        );

        const emailMsg = parseGmailMessage(msgData, account.email);
        if (!emailMsg) {
          log('emails', `  Skipping message ${msgId} — could not parse`);
          continue;
        }

        const result = await ingestEmail(emailMsg, account.org, deps);

        log('emails', `  Ingested: ${emailMsg.subject} (thread=${result.threadId}, chunks=${result.chunksInserted}, new=${result.isNewThread})`);
        ingested++;

        // Save historyId from message response if available
        if (msgData?.historyId && (!state.lastHistoryId[account.email] ||
            parseInt(msgData.historyId) > parseInt(state.lastHistoryId[account.email]))) {
          state.lastHistoryId[account.email] = msgData.historyId;
        }
      } catch (err: any) {
        const msg = `Error processing message ${msgId}: ${err.message}`;
        log('emails', `  ${msg}`);
        errors.push(msg);
      }
    }
  }

  await saveState(STATE_FILE, state);

  log('emails', `Done: ${ingested} email(s) ingested, ${errors.length} error(s)`);
  return { ingested, errors };
}

// ---------------------------------------------------------------------------
// Run if executed directly (not when imported by gws-fetch-all)
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1]?.includes('gws-fetch-emails');
if (isDirectRun) {
  fetchEmails()
    .then(({ ingested, errors }) => {
      if (errors.length > 0) {
        console.error('Errors:', errors);
        process.exit(1);
      }
      console.log(`Successfully ingested ${ingested} email(s)`);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
