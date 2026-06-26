# HANDOFF — Canon UI (build in a new session)

**Created:** 2026-06-09. **Author:** Hermes (expert-liaison) + Boris (agentic-systems) in session.
**Build persona:** Boris (agentic-systems). **Status:** not started ... this doc primes the build.

## Launch instructions for the new session

- Root the session so Boris loads (agentic-systems). Read first:
  `/Users/nplmini/code/work/practices/agentic-systems/CLAUDE.md` and
  `/Users/nplmini/code/work/practices/agentic-systems/reference/architecture-notes.md`.
- Then read this file. It carries the full design context so you don't re-investigate.
- Brainstorm/confirm scope with Nick before building. Keep it SIMPLE, MVP-first.

## Goal

A **Canon UI**: a simple human + agent surface over the `canon_engine` Supabase project. Canon
already captures all comms automatically (Gmail/Drive pollers). What's missing is a way to *see*,
*be notified about*, and *shape* that context per relationship. Three wants:

1. **Track interactions** ... per account/relationship: email threads, messages, transcripts, and a
   relationship stage. The data already exists in Canon; there is no UI rendering it.
2. **Notify on new context** ... when new email/transcript lands for a watched account, surface it
   (to Nick, and as a signal an agent can act on).
3. **Ask AND inform the system** ... two directions:
   - *Ask:* query the corpus (RAG over `chunks`/`documents`). Lower priority ... agents can already
     query Canon via SQL/MCP in-session.
   - *Inform (the important one Nick expanded on):* agents author how emails/transcripts are
     **parsed and presented to them**. Agent-authored projection rules over the existing corpus,
     not changes to ingestion. This is the differentiator ... build the primitive for it even if the
     UI for it comes later.

## Where to build (Boris recommendation)

- **New folder: `/Users/nplmini/code/work/systems/canon-ui`.** One Next.js app. Already created (empty).
- NOT projection-ui (that points at revops-engine-dev ... a different Supabase project; it is the
  RevOps surface, not Canon). NOT canon-crm-feed (headless Inngest worker, no UI).
- UI and the agent-projection/feedback layer are ONE app: same Supabase client, types, and queries.
  The agent layer is thin API route handlers + Canon tables. Splitting buys nothing at MVP.
- Register as a **System** under the agentic-systems practice, sibling to projection-ui and
  canon-crm-feed. A system isn't shipped until registered.

## Stack & conventions (mirror projection-ui)

- Copy `/Users/nplmini/code/work/systems/projection-ui` package setup: Next 15 / React 19 / Tailwind,
  server-only `@supabase/supabase-js`, a `lib/queries/*` read layer. Different port (e.g. 4280).
- **CRITICAL env lesson:** use a **`CANON_` prefix** (`CANON_SUPABASE_URL`,
  `CANON_SUPABASE_SERVICE_ROLE_KEY`). A bare `SUPABASE_URL` in the shell profile shadows `.env.local`
  ... this already bit projection-ui (forced the `PROJECTION_` prefix). Do not repeat it.
- Read Canon direct via a server-only Supabase client through `lib/queries`. Keep projection logic
  (events → relationship view) in a pure `lib/projection` module (mirror canon-crm-feed's
  `derive.ts` discipline) so it's testable and reusable headless later.

Suggested skeleton:
```
canon-ui/
  app/                # /accounts, /accounts/[id], app/api/agent/*
  components/
  lib/
    canon.ts          # server-only Supabase client, CANON_ env
    queries/          # threads.ts, messages.ts, transcripts.ts, relationship.ts
    projection/       # pure: events + rules -> relationship stage + presented context
    types.ts
  .env.local.example
```

## Build order (MVP-first ... keep it simple)

- **Phase 0 — Attribution primitive (FOUNDATION, build first).** Everything keys on account identity.
  Add a Canon table `canon_account_identity` (account_id, match_type = domain|email|alias, value,
  confidence, source) + a backfill script over `email_threads`/`email_messages` participants. Both
  canon-ui and canon-crm-feed read it, retiring canon-crm-feed's hardcoded `ACCOUNT_KEYS` map.
  Needed because personal-gmail contacts (e.g. Larry) can't be resolved by domain.
- **Phase 1 — Thin UI.** `/accounts` list + `/accounts/[id]` view: comms timeline (threads, messages,
  transcripts) + relationship stage + links to the account's artifacts. This is the surface Nick
  asked for.
- **Phase 2 — Notifications.** Derived read over `canon_events` (+ message/transcript timestamps) vs.
  a per-agent/per-account last-seen watermark (small in-boundary table). "New context since you last
  looked." The plumbing exists (`canon_events`, dormant `paperclip-wake-bridge`, `wake_log`) but
  excludes email and needs `account_name` ... Phase 0 unblocks it.
- **Phase 3 — Agent-authored projection rules.** Table `agent_projection_rules` (id, author,
  scope = account|global, rule_kind = parse|present|filter, config JSONB, version, created_at).
  Agents POST rules via `app/api/agent/projection-rules`; the pure `lib/projection` module applies
  matching rules before returning content. This is the "inform the system" want.
- **Defer:** a persistent RAG/query endpoint (`canon_query_cache` is an empty stub; embeddings exist
  in `chunks`/`documents` but no query service). Agents query Canon directly in-session for now.

## Canon schema cheat-sheet (so you don't re-investigate)

Project ref: **mzzjvoiwughcnmmqzbxv** (`canon_engine`). Relevant tables:
- `email_threads` (thread_id, subject, account_name, participants, thread_summary, key_decisions,
  action_items, signal_status, quadrant, urgency, importance, ...), `email_messages` (message_id,
  thread_id, date, from_address, to_addresses, direction, body_text, snippet, ...).
- `transcripts` (transcript_title, meeting_date, account_name, participants, summary, key_decisions,
  action_items, topics, google_doc_url, raw_transcript_text, ...).
- `canon_artifacts` (versioned: artifact_type, version, content_md, status, approver/approval_*,
  supersedes_id/superseded_by_id, search_tsv) + `canon_artifact_bindings` (artifact↔engine_system).
- `canon_events` (event_type, source_type, source_ref, account_name, payload, correlation_id) ... the
  event spine, one row per ingest.
- `chunks`/`documents` (embeddings, RAG corpus). `canon_query_cache` (empty stub).
- `paperclip_routing` + `paperclip-wake-bridge` edge fn + `wake_log` (notification dispatch; dormant,
  email excluded). `canon_email_state` / `canon_transcript_state` (ingestion cursors, live).

## Hard constraints

- **The ingestion WRITER is OUTSIDE the trust boundary** (archived `@aos` monorepo). We cannot change
  ingest-time parsing/tagging. Everything here is **read/projection side**: new in-boundary tables
  (identity, rules, watermarks) + backfills + the UI. Agents shape presentation of the existing
  corpus, not capture.
- Do not reuse projection-ui's DB or env.
- Don't write to `canon_engine` without Nick's explicit go (see open decision).

## First concrete account to wire: Larry / Tweed

Use the live expert-liaison work as the first real account ... folder
`/Users/nplmini/code/work/accounts/prospects/Tweed/collaboration/`.
- **Identity:** `letweed@gmail.com` (personal gmail ... the exact case domain-matching fails on, which
  is why Phase 0 exists). Also subject prefix `"Absolute:"`. Company: Absolute Mechanical; contact
  Chris Kellner.
- **Already in Canon, needs attribution:** transcript `id 0a8ac0e9-2d62-466c-aad2-c355e157da66`
  (05-19 call) is misfiled as `account_name='konstellationai'`; two email threads ("Re: Absolute:
  scoping the first step" and a calendar accept) carry `account_name=NULL`. Re-tag these to the Larry
  account once the account key is chosen (`absolute`? `tweed`?).
- **Relationship stage model** to render: see
  `/Users/nplmini/code/work/accounts/prospects/Tweed/collaboration/relationship-tracker-larry.md`
  (the stage ladder S0–S8). Its hand-kept comms log should become a VIEW over Canon ... that is
  exactly what this UI replaces.
- **SME artifacts** (the 11 + trackers) live in that same folder; they graduate to `canon_artifacts`
  when Larry qualifies (stage S4+).

## Open decisions for Nick

1. **Where does `canon_account_identity` (and the rules/watermark tables) live** ... inside
   `canon_engine` proper, or a sibling in-boundary schema? Read-side schema is fine, but it's a write
   to the Canon project and the trust boundary says the writer is external. Nick's call.
2. **Account key for Larry/Absolute:** `absolute` vs `tweed` vs other.
3. Confirm the relationship-stage ladder (S0–S8) is the right model to render, or recut it.

## Pointers

- This session's Larry artifacts: `/Users/nplmini/code/work/accounts/prospects/Tweed/collaboration/`
- Partner-orientation pattern: `/Users/nplmini/code/work/practices/expert-liaison/reference/partner-orientation-pattern.md`
- In-boundary Canon reader to learn from: `/Users/nplmini/code/work/systems/canon-crm-feed`
- Surface pattern to mirror: `/Users/nplmini/code/work/systems/projection-ui`
