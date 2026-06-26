/**
 * Canon Engine — Gmail API client.
 *
 * Replaces gws CLI calls for email fetching. Parsing logic ported directly
 * from packages/canon/scripts/gws-fetch-emails.ts.
 */

import { google, type Auth } from 'googleapis';
import type { EmailMessage } from '../pipelines/email-ingest.js';

type AuthClient = Auth.JWT | Auth.GoogleAuth;

// ---------------------------------------------------------------------------
// API operations
// ---------------------------------------------------------------------------

/**
 * List Gmail history since a given historyId.
 */
export async function listHistory(
  auth: AuthClient,
  startHistoryId: string,
): Promise<any> {
  const gmail = google.gmail({ version: 'v1', auth: auth as any });
  const res = await gmail.users.history.list({
    userId: 'me',
    startHistoryId,
    historyTypes: ['messageAdded', 'labelAdded'],
  });
  return res.data;
}

/**
 * Get a full Gmail message by ID.
 */
export async function getMessage(
  auth: AuthClient,
  messageId: string,
): Promise<any> {
  const gmail = google.gmail({ version: 'v1', auth: auth as any });
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return res.data;
}

/**
 * List recent messages matching label filters.
 */
export async function listRecentMessages(
  auth: AuthClient,
  labelIds: string[],
  maxResults: number = 10,
): Promise<string[]> {
  const gmail = google.gmail({ version: 'v1', auth: auth as any });
  const res = await gmail.users.messages.list({
    userId: 'me',
    labelIds,
    maxResults,
  });
  return (res.data.messages ?? []).map((m) => m.id!).filter(Boolean);
}

/**
 * List all Gmail labels for the authenticated user.
 */
export async function listLabels(auth: AuthClient): Promise<any[]> {
  const gmail = google.gmail({ version: 'v1', auth: auth as any });
  const res = await gmail.users.labels.list({ userId: 'me' });
  return res.data.labels ?? [];
}

// ---------------------------------------------------------------------------
// Message parsing (ported from gws-fetch-emails.ts)
// ---------------------------------------------------------------------------

/**
 * Parse a raw Gmail API message into the EmailMessage format
 * consumed by the Canon email ingestion pipeline.
 */
export function parseGmailMessage(
  msg: any,
  currentUserEmail: string,
): EmailMessage | null {
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
// History extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract message IDs from a Gmail history response.
 * Includes messages added to INBOX and messages labeled with AOS/Ingest.
 */
export function extractMessageIdsFromHistory(
  historyData: any,
  aosIngestLabelId: string | null,
): string[] {
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
