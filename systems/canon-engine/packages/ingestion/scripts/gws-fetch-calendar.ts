/**
 * Canon Engine — Fetch calendar events via gws CLI.
 *
 * Flow:
 * 1. For each calendar account, set the gws profile for its org.
 * 2. List upcoming events (now-1d -> now+30d) via `gws calendar events list`.
 * 3. Upsert into canon_engine.public.calendar_events (idempotent on account+event).
 *
 * No Claude enrichment / embeddings — calendar events are structured data, not corpus.
 * Read by projection-ui /work calendar card (lib/queries/calendar.ts).
 *
 * Usage: npx tsx scripts/gws-fetch-calendar.ts
 */

import {
  ACCOUNTS,
  gwsWithParams,
  setGwsProfile,
  getSupabase,
  ensureEnv,
  log,
} from './gws-shared.js';

// Nick's two personal calendars (per the build request 2026-06-24).
const CALENDAR_EMAILS = ['nick@konstellationai.com', 'nick@instig8.ai'];

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
    source: 'gws-calendar',
    raw: ev,
  };
}

export async function fetchCalendar(): Promise<{ ingested: number; errors: string[] }> {
  await ensureEnv();
  const supabase = getSupabase();
  const errors: string[] = [];
  let ingested = 0;

  const now = new Date();
  const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // yesterday
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30d

  const accounts = ACCOUNTS.filter((a) => CALENDAR_EMAILS.includes(a.email));

  for (const account of accounts) {
    setGwsProfile(account.gwsProfile);
    log('calendar', `Fetching for ${account.email} (${account.org})`);

    let res: any;
    try {
      res = await gwsWithParams(['calendar', 'events', 'list'], {
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });
    } catch (err: any) {
      const msg = `Error listing events for ${account.email}: ${err.message}`;
      log('calendar', `  ${msg}`);
      errors.push(msg);
      continue;
    }

    const items: any[] = res?.items ?? [];
    const rows = items.map((ev) => parseEvent(ev, account.email)).filter(Boolean) as CalRow[];
    log('calendar', `  ${rows.length} event(s) in window`);

    if (rows.length === 0) continue;

    const { error } = await supabase
      .from('calendar_events')
      .upsert(rows, { onConflict: 'account_email,event_id' });

    if (error) {
      const msg = `Error upserting events for ${account.email}: ${error.message}`;
      log('calendar', `  ${msg}`);
      errors.push(msg);
      continue;
    }
    ingested += rows.length;
  }

  log('calendar', `Done: ${ingested} event(s) upserted, ${errors.length} error(s)`);
  return { ingested, errors };
}

// ---------------------------------------------------------------------------
// Run if executed directly (not when imported by gws-fetch-all)
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1]?.includes('gws-fetch-calendar');
if (isDirectRun) {
  fetchCalendar()
    .then(({ ingested, errors }) => {
      if (errors.length > 0) console.error('Errors:', errors);
      console.log(`Calendar: ${ingested} event(s) upserted`);
      // Don't hard-fail on per-account scope errors (e.g. konstellationai pending re-auth).
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
