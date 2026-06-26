/**
 * Canon Engine — Google Meet API client.
 *
 * Replaces gws CLI calls:
 *   gwsWithParams(['meet', 'conferenceRecords', 'list'], ...)
 *   gwsWithParams(['meet', 'conferenceRecords', 'transcripts', 'list'], ...)
 *   gwsWithParams(['meet', 'conferenceRecords', 'transcripts', 'get'], ...)
 *   gwsWithParams(['meet', 'conferenceRecords', 'participants', 'list'], ...)
 */

import { google, type Auth } from 'googleapis';

type AuthClient = Auth.JWT | Auth.GoogleAuth;

/**
 * List conference records ending after the given time.
 */
export async function listConferenceRecords(
  auth: AuthClient,
  sinceTime: Date,
): Promise<any[]> {
  const meet = google.meet({ version: 'v2', auth: auth as any });
  const res = await meet.conferenceRecords.list({
    filter: `end_time >= "${sinceTime.toISOString()}"`,
  });
  return (res.data as any)?.conferenceRecords ?? [];
}

/**
 * List transcripts for a conference record.
 */
export async function listTranscripts(
  auth: AuthClient,
  conferenceName: string,
): Promise<any[]> {
  const meet = google.meet({ version: 'v2', auth: auth as any });
  const res = await meet.conferenceRecords.transcripts.list({
    parent: conferenceName,
  });
  return (res.data as any)?.transcripts ?? [];
}

/**
 * Get transcript details (includes docsDestination with Drive file reference).
 */
export async function getTranscript(
  auth: AuthClient,
  transcriptName: string,
): Promise<any> {
  const meet = google.meet({ version: 'v2', auth: auth as any });
  const res = await meet.conferenceRecords.transcripts.get({
    name: transcriptName,
  });
  return res.data;
}

/**
 * List participants for a conference record.
 */
export async function listParticipants(
  auth: AuthClient,
  conferenceName: string,
): Promise<string[]> {
  const meet = google.meet({ version: 'v2', auth: auth as any });
  const res = await meet.conferenceRecords.participants.list({
    parent: conferenceName,
  });
  return ((res.data as any)?.participants ?? [])
    .map((p: any) =>
      p.signedinUser?.displayName ??
      p.signedinUser?.user ??
      p.anonymousUser?.displayName ??
      '',
    )
    .filter(Boolean);
}
