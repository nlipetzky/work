# Handoff — CRM workflow session (next)

Date: 2026-06-04. Prior session = built the machinery. Next session = make the CRM legible and
usable, add Will, and build out the workflow Nick is articulating. **Implement WITH Nick, don't
solo-build.** Keep outputs short and plain (Nick's explicit ask).

## Current state (quiet)

- All background processes are STOPPED. Nothing runs until restarted. CRM won't change on its own.
- The system `canon-crm-feed` (at `/Users/nplmini/code/work/systems/canon-crm-feed/`) works and is
  proven: inbound state projection, outbound send-as-Nick, daily digest drafting. It's just paused.
- CRM = Airtable base `app5tsy6zjfA8H3rx`, "Prospects" table `tblG44S3hYR5j5K2t`.

## What Nick said (the real problem to solve)

"I need to look at the CRM and understand what's happening and what needs to happen." Today it does
NOT give him that. Specifically:
- **Next Action Date** column is useless (2 stale dates, 3 empty).
- **Next Action** is not kept current.
- No clear way to see/operate **Will's daily email**.
- The table doesn't inspire confidence that we're on top of things.

## Next-session agenda (Nick's articulation)

1. **Rename "Prospects" -> "Contacts"** (general contacts table). Add **Will** as a record, labeled
   **Partner** (Type field already exists: Engagement / Partnership ... may need a "Partner" value
   or rethink Type).
2. **Make it legible at a glance.** Decide the few views that answer "what's happening / what needs
   to happen" (e.g. "My court", "Needs action by date", "By partner"). Fix the Next Action +
   Next Action Date discipline: decide how they stay current (manual? derived from events? a mix?).
3. **Define the Will daily-email UX.** How Nick interacts with the daily digest: where the drafts
   show up, how he approves, how Will receives his "do these things" list. The digest function
   exists; the operating ritual around it does not.
4. **Build out the workflow Nick is articulating** ... capture it with him, then implement.

## Decisions to make together (don't assume)

- Is "Type" the right axis, or do Contacts need a separate "Role" (Partner / Prospect / Client
  contact / Champion)? Will is a Partner; Jari/Larry are prospective partners; Chris/Shawn are
  client contacts.
- Should Next Action / Next Action Date be human-maintained, or derived from the latest event /
  digest? (This is the heart of "I want to trust what I see.")
- Per-owner sender: Will's outbound should send as will@konstellationai.com (capability built;
  not yet wired into the digest/send by owner).

## Deferred infra (not blocking the workflow; mention, don't rabbit-hole)

- **Process durability**: to be truly always-on on the Mac Mini, the app + `inngest dev` need to
  auto-start/restart (launchd plist or pm2). Today they're manual processes.
- **Transcript->deal resolution**: `Stage` under-reports because meeting transcripts aren't
  matchable by domain. `Waiting On` is trustworthy; `Stage` is not yet.
- **Path B real-time trigger**: checkbox -> instant send needs Inngest Cloud + an Airtable
  automation. Today it's the */5 cron (Path A).

## How to restart the system (next session)

```bash
# terminal 1: the app
cd /Users/nplmini/code/work/systems/canon-crm-feed && node --import tsx src/server.ts
# terminal 2: the dev server pointed at it
npx inngest-cli@latest dev -u http://localhost:3939/api/inngest
```
Dry-test scripts (create nothing): `node --import tsx scripts/validate-digest.ts` (and
`validate-send.ts`, `validate-derive.ts`). env loads via `src/lib/load-env.ts` (override on).

## How the system is meant to work (orientation for Nick)

- Each **contact** carries state: `Waiting On` = whose court the ball is in; `Next Action` = the
  next move; `Stage` = pipeline position.
- **Inbound** comms (for engagements with a `Canon Domain`) flow from Canon and auto-set
  `Waiting On`. That part is trustworthy.
- The **daily digest** drafts a touch for anyone needing attention -> lands as a `Drafted` Event.
- Nick reviews drafts, checks **"Approved to send"** -> the send function emails it as Nick (or
  Will), logs it `Sent`. Nothing sends without the checkbox.
- The reason it doesn't feel trustworthy yet: the data (Next Action/Date) is stale and hand-kept.
  Next session's job is to make that state reliable so the CRM is a true picture.

## Files / IDs

- System: `/Users/nplmini/code/work/systems/canon-crm-feed/`
- CRM base: `app5tsy6zjfA8H3rx`; Prospects `tblG44S3hYR5j5K2t`; Events `tbl3t6RkAPxouWWzj`
- Canon Engine (Supabase): project `mzzjvoiwughcnmmqzbxv`
- Send identity: aos-fetcher SA, impersonates nick@ / will@ via konstellationai.com + instig8.ai DWD

## Deferred: observability projection sidecar (gated)

**Do not start until `PLAN-motions-rewire.md` Tasks 1-11 ship AND the Motions board runs green for 1 full week.** Hard gate. Adding provenance writes to `updateMotionState()` mid-rewire = two simultaneous mutations to the same function. Don't.

When the gate opens, this system is the pilot for the observability projection pattern (see `/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md` and plan `lovely-dancing-pumpkin`).

Scope when unblocked:
1. Add `provenance` long-text field to Motions table (`tblK83JY2FUj3zR31`) ... stringified JSON, Airtable has no JSONB.
2. Extend `updateMotionState()` in `src/lib/airtable.ts` to write `{ waiting_on: { value, source: "canon-derive", run_id: ctx.runId, backing_system: "inngest", backing_run_id: ctx.event.id, captured_at, basis_evidence: derived.basis } }`. The `basis` narrative is currently logged but not persisted; this is where it lands.
3. Verify via the Records page of the Retool projection surface once stood up.

Why canon-crm-feed first: smallest live system (3 functions), fast JSONB-shape iteration, immediate visible proof point in Motions. The 107 archived RevOps functions adopt the pattern after this pilot stabilizes.
