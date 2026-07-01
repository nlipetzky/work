/**
 * Canon Engine — Calendar fetch via service account (domain-wide delegation).
 *
 * Service-account port of scripts/gws-fetch-calendar.ts: replaces the gws CLI
 * + per-org OAuth profiles with createImpersonatedAuth(), so it runs headless
 * on the same aos-fetcher delegation as the email/transcript legs. Porting to
 * delegation also clears the "konstellationai pending re-auth" wall the gws
 * profile path hit (calendar.readonly is authorized domain-wide).
 *
 * Flow:
 * 1. For each ACCOUNTS entry with the 'calendar' pipeline, impersonate the
 *    mailbox with calendar.readonly.
 * 2. List events in a rolling window (now-1d -> now+30d) from the primary calendar.
 * 3. Upsert into canon_engine.public.calendar_events (idempotent on
 *    account_email,event_id — the table's unique constraint).
 *
 * Structured data only — no Claude enrichment / embeddings, matching the
 * established calendar pattern (read by projection-ui /work calendar card).
 */

import { google, type Auth } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createImpersonatedAuth, CALENDAR_READONLY } from './auth.js';
import { ACCOUNTS } from './accounts.js';

type AuthClient = Auth.JWT | Auth.GoogleAuth;

interface CalendarDeps {
  supabase: SupabaseClient;
}

interface CalRow {
  account_email: string;
  event_id: string;
  calendar_id: string;
  title: string | null;
  description: string | null;
  start_ts: string | null;
  end_ts: string | null;
  all_day: boolean;
  status: string | null;
  location: string | null;
  organizer: string | null;
  attendees: unknown;
  html_link: string | null;
  hangout_link: string | null;
  source: string;
  raw: unknown;
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [calendar] ${msg}`);
}

function toTs(slot: any): { ts: string | null; allDay: boolean } {
  if (!slot) return { ts: null, allDay: false };
  if (slot.dateTime) return { ts: new Date(slot.dateTime).toISOString(), allDay: false };
  if (slot.date) return { ts: new Date(`${slot.date}T00:00:00Z`).toISOString(), allDay: true };
  return { ts: null, allDay: false };
}

function parseEvent(ev: any, accountEmail: string): CalRow | null {
  if (!ev?.id) return null;
  const start = toTs(ev.start);
  const end = toTs(ev.end);
  const attendees = Array.isArray(ev.attendees)
    ? ev.attendees.map((a: any) => ({ email: a.email, name: a.displayName, status: a.responseStatus }))
    : null;
  return {
    account_email: accountEmail,
    event_id: ev.id,
    calendar_id: 'primary',
    title: ev.summary ?? null,
    description: ev.description ?? null,
    start_ts: start.ts,
    end_ts: end.ts,
    all_day: start.allDay,
    status: ev.status ?? null,
    location: ev.location ?? null,
    organizer: ev.organizer?.email ?? null,
    attendees,
    html_link: ev.htmlLink ?? null,
    hangout_link: ev.hangoutLink ?? null,
    source: 'calendar-api',
    raw: ev,
  };
}

async function listEvents(
  auth: AuthClient,
  timeMin: string,
  timeMax: string,
): Promise<any[]> {
  const calendar = google.calendar({ version: 'v3', auth: auth as any });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });
  return res.data.items ?? [];
}

export async function fetchCalendar(
  deps: CalendarDeps,
): Promise<{ ingested: number; errors: string[] }> {
  const { supabase } = deps;
  const errors: string[] = [];
  let ingested = 0;

  const now = new Date();
  const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // yesterday
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30d

  const calendarAccounts = ACCOUNTS.filter((a) => a.pipelines.includes('calendar'));

  for (const account of calendarAccounts) {
    const auth = createImpersonatedAuth(account.email, [CALENDAR_READONLY]);
    log(`Fetching for ${account.email} (${account.org})`);

    let items: any[];
    try {
      items = await listEvents(auth, timeMin, timeMax);
    } catch (err: any) {
      const msg = `Error listing events for ${account.email}: ${err.message}`;
      log(`  ${msg}`);
      errors.push(msg);
      continue;
    }

    const rows = items.map((ev) => parseEvent(ev, account.email)).filter(Boolean) as CalRow[];
    log(`  ${rows.length} event(s) in window`);
    if (rows.length === 0) continue;

    const { error } = await supabase
      .from('calendar_events')
      .upsert(rows, { onConflict: 'account_email,event_id' });

    if (error) {
      const msg = `Error upserting events for ${account.email}: ${error.message}`;
      log(`  ${msg}`);
      errors.push(msg);
      continue;
    }
    ingested += rows.length;
  }

  log(`Done: ${ingested} event(s) upserted, ${errors.length} error(s)`);
  return { ingested, errors };
}
