# Handoff to Boris: build the /work calendar (sync now) — BUILD-READY

From: Atlas (operator-os) · 2026-06-24 · Nick: "Build the calendar, sync now. No effort from me. Both nick@konstellationai.com AND nick@instig8.ai. Reuse the Google Workspace pipeline."

Supersedes the "half-day, OAuth-dominated" conclusion in
`specs/2026-06-24-work-calendar-card-wiring.md`. With the existing pipeline reused, **there is no
fresh OAuth** — auth is already solved.

## The efficient path (confirmed live)

The canon-engine ingestion already authenticates via **one Google service account with domain-wide
delegation** and impersonates users per scope:
- `packages/ingestion/src/google/auth.ts` → `createImpersonatedAuth(userEmail, scopes)`; current
  scopes = GMAIL_READONLY, GMAIL_SEND, DRIVE_READONLY, MEET_READONLY.
- `packages/ingestion/src/google/accounts.ts` → already lists **nick@konstellationai.com AND
  nick@instig8.ai** (single service account, both orgs).

So the calendar is **one scope + one fetcher + one table + one query + one card**.

## Build order

1. **Scope:** add `CALENDAR_READONLY = "https://www.googleapis.com/auth/calendar.readonly"` to
   `auth.ts`. Verify it's authorized on the domain-wide delegation in Workspace admin — this is the
   ONLY possible human step (Nick said "no effort from me," so confirm it's already granted; flag if
   not, don't silently assume).
2. **Fetcher:** `packages/ingestion/src/google/fetch-calendar.ts`, mirroring `fetch-emails.ts` /
   `fetch-transcripts.ts`. Impersonate each account in `accounts.ts`, pull events (now → +14 days),
   upsert. Checkpoint per account like the other fetchers.
3. **Table:** `canon_engine.public.calendar_events` — `account_email`, `event_id` (unique per
   account), `title`, `start_ts`, `end_ts`, `all_day`, `status`, `location`, `attendees`,
   `html_link`, `source`, `updated_at`. RLS service-role-only per the locked canon posture.
4. **Schedule:** add to the existing fetch cadence (the `com.canon-engine.fetch` launchd job / cron)
   so it stays current — same as email.
5. **Surface:** `systems/projection-ui/lib/queries/calendar.ts` (read next N days from
   `calendar_events`, server-side via `canonDb()`), then wire the `{/* CALENDAR — no source */}`
   block in `app/work/WorkSurface.tsx` following the tasks/intent pattern. force-dynamic already set.

## Estimate
~1-2 hrs (auth solved). The card is ~1 hr; the fetcher+table is the rest. Both calendars come for
free because both identities are already in the delegation.
