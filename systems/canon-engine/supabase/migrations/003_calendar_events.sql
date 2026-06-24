-- 003_calendar_events.sql
-- Google Calendar events ingested via the gws CLI pipeline (gws-fetch-calendar.ts).
-- One row per (account_email, event_id). Read by projection-ui /work calendar card.
-- Applied to canon_engine 2026-06-24.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  account_email text not null,
  event_id text not null,
  calendar_id text not null default 'primary',
  title text,
  description text,
  start_ts timestamptz,
  end_ts timestamptz,
  all_day boolean not null default false,
  status text,
  location text,
  organizer text,
  attendees jsonb,
  html_link text,
  hangout_link text,
  source text not null default 'gws-calendar',
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_email, event_id)
);

create index if not exists calendar_events_start_idx on public.calendar_events (start_ts);
create index if not exists calendar_events_account_idx on public.calendar_events (account_email);

alter table public.calendar_events enable row level security;
-- service-role-only: RLS enabled, no anon/authenticated policies (service role bypasses RLS).
revoke all on public.calendar_events from anon, authenticated;
comment on table public.calendar_events is 'Google Calendar events ingested via the gws CLI pipeline (canon-engine). Read by projection-ui /work calendar card. Added 2026-06-24.';