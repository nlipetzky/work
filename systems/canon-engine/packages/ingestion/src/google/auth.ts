/**
 * Canon Engine — Google Auth via service account with domain-wide delegation.
 *
 * Ported from functions/src/fetcher-shared.ts (createImpersonatedAuth).
 * Replaces gws CLI's file-based OAuth profiles with cloud-native auth.
 *
 * Environment:
 *   GOOGLE_SERVICE_ACCOUNT_KEY — base64-encoded JSON key (preferred)
 *   Falls back to Application Default Credentials on GCP.
 */

import { google, type Auth } from 'googleapis';

// ---------------------------------------------------------------------------
// Scopes
// ---------------------------------------------------------------------------

export const GMAIL_READONLY = 'https://www.googleapis.com/auth/gmail.readonly';
export const GMAIL_SEND = 'https://www.googleapis.com/auth/gmail.send';
export const DRIVE_READONLY = 'https://www.googleapis.com/auth/drive.readonly';
export const MEET_READONLY = 'https://www.googleapis.com/auth/meetings.space.readonly';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Create a Google Auth client with domain-wide delegation,
 * impersonating the given user for the requested scopes.
 *
 * Uses the same pattern proven in functions/src/fetcher-shared.ts.
 */
export function createImpersonatedAuth(
  userEmail: string,
  scopes: string[],
): Auth.JWT | Auth.GoogleAuth {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (keyBase64) {
    const keyJson = JSON.parse(
      Buffer.from(keyBase64, 'base64').toString('utf8'),
    );
    return new google.auth.JWT({
      email: keyJson.client_email,
      key: keyJson.private_key,
      scopes,
      subject: userEmail,
    });
  }

  // On GCP: use Application Default Credentials with impersonation.
  return new google.auth.GoogleAuth({
    scopes,
    clientOptions: {
      subject: userEmail,
    },
  });
}
