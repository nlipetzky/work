# Work calendar card — wiring recommendation

Date: 2026-06-24
Author: Boris (agentic-systems)
Surface: `systems/projection-ui/app/work/` (Focus tab, "Calendar" section, currently `not wired`)

## TL;DR

Do not wire it yet. The premise that a kept-current Google-Calendar mirror already
exists in the Work base is **false**. There is no calendar data in any trusted source
right now, so there is nothing to read. The honest "no calendar source connected" card
is currently the correct state.

The most efficient *real* path, when Nick wants this, is a thin Airtable mirror table in
the Work base populated by one scheduled sync, read by the app exactly like every other
`/work` card. Effort to get there is ~half a day, not the "trivial read" the task assumed,
because the sync does not exist and the source it assumed does not exist.

## What I found (the premise is wrong)

1. **No Calendar table in the Work base.** Base `appz7I91uNxWBnly8` has 9 tables:
   Opportunities, Consider, Yap, Roadmap, Events, Notifications, Weekly Intent,
   _ai_context. There is no "Calendar" table. The table id the task cited
   (`tbloIrSupItHqrjlP`) returns Airtable 422 "table not found."

2. **`Events` (`tbl2V5H1A0nvNy07H`) is not a calendar.** It is a Gmail-import / inbound-
   triage activity log (fields: When, Workflow, Actor, Subject, Action, Outcome). Rows are
   things like `imported: ...` and `classified (fyi): ...`. Not events on a calendar.

3. **No calendar in canon_engine either.** All 38 `public.*` tables enumerated; none is
   calendar-related. Confirms a new canon ingestion would be net-new, not a re-read.

4. **The app's Airtable token can't even reach the Work base.** `projection-ui`'s
   `AIRTABLE_API_KEY` is scoped to the RevOps base (`appYBYH3aOHhTODAw`, see
   `lib/airtable/config.ts`). A direct read of `appz7I91uNxWBnly8` returns 403
   INVALID_PERMISSIONS. So even if a Calendar table existed there, the current credential
   would need broadening.

5. **The Google Calendar MCP is dead** ("connection invalidated") and is a Claude-session
   tool anyway, not something a Next.js server component can call at render time. Not a
   render-path option regardless.

## Existing data-path pattern (what the card should imitate)

Every `/work` card follows the same shape (see `app/work/page.tsx` + `lib/queries/*`):

- `app/work/page.tsx` is a `force-dynamic`, `runtime=nodejs` server component. It calls a
  set of `listX()` query functions in a `Promise.all`, catches into one `error` string,
  and passes plain arrays to the client `WorkSurface`.
- Each query module is `import "server-only"` and reads through `canonDb()`
  (`lib/canon.ts`, `CANON_SUPABASE_*`) or `db` (`lib/supabase.ts`, `PROJECTION_SUPABASE_*`),
  returns a typed interface. Example: `lib/queries/intent.ts`.
- `WorkSurface.tsx` is pure presentation. The Calendar section lives at the
  `{/* CALENDAR — no source */}` block (~line 459) and currently renders a static
  "not wired" state. A calendar would slot in as `events: CalendarEvent[]` prop with the
  same honest-empty-state treatment the other cards use.

So the card half is trivial. The data behind it is the whole job.

## Options, ranked by efficiency (least wiring, stays current, low maintenance)

### Recommended — Airtable mirror table + one scheduled sync (when Nick wants it)

Create a `Calendar` table in the Work base (`appz7I91uNxWBnly8`) with
Title / Start / End / All Day / Status / Attendees / Event Link. Populate it from Google
Calendar with **one** scheduled job (n8n Google Calendar trigger, or a launchd cron .ts in
`systems/canon-engine/` style — same pattern as the email fetch). The app reads it.

Why this is the most efficient *real* option:
- Read side is the established `/work` pattern — a new `lib/queries/calendar.ts` + a prop on
  `WorkSurface`. ~1 hour.
- The mirror decouples render from Google auth: the app never holds a Google credential and
  never blocks on a flaky OAuth at request time. The dead MCP is irrelevant.
- One sync to own. Freshness = the cron interval (e.g. every 15 min), which is fine for a
  "what's coming today" surface.

Two real costs to flag:
- The sync does not exist. Building + authorizing the Google Calendar connection is the bulk
  of the effort. (Note the Granola/Meet calendar-scope history: external konstellationai GCP
  app 403s sensitive scopes — use Nick's primary Google identity, not that app.)
- The app's Airtable token must be broadened to read the Work base, **or** mirror into a
  canon/projection Postgres table instead (see below) so it rides the service-role key the
  app already has. Postgres mirror is slightly more setup but avoids the token problem and
  matches how every other `/work` card already reads. If we build the sync anyway, prefer
  writing to a small `public.calendar_events` canon table over an Airtable table — same
  effort to write, and the read side then needs zero new credentials.

Net recommendation: **one scheduled Google Calendar → `canon_engine.public.calendar_events`
sync, read by a new `lib/queries/calendar.ts` following the `intent.ts` pattern.**

### Not recommended

- **Direct Google Calendar API read in the server component.** Adds a second credential,
  couples render to OAuth refresh, and re-fetches per request. More wiring, more failure
  surface, no freshness benefit over a 15-min mirror.
- **Depend on the Google Calendar MCP at render time.** Not possible — MCP is a session
  tool, and it is currently dead anyway.
- **New canon ingestion pipeline for calendar.** Overkill if the only consumer is this one
  card. The single-table mirror above is the minimum that works; don't build a pipeline.

## Effort estimate

- Card/read side alone (once a source exists): ~1 hour.
- Full working feature including the Google Calendar sync + auth + the source table:
  ~half a day, dominated by the OAuth/connection setup, not code.
- Right now, with no source: leave the card honest. Zero work is the correct call until
  Nick decides the calendar is worth a sync to own.

## Caveat / decision for Nick

This is a build decision, not a quick read. The "it's already mirrored, just read it"
assumption doesn't hold. If Nick wants it, the smallest-slice path is the one scheduled
sync into a canon table; if he doesn't, the card stays as the correct honest gap.
