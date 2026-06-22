# Spec: Inbox Triage System (for Boris / agentic-systems)

Status: spec, 2026-06-22. Author: Atlas (operator-os), at Nick's direction. Build owner: Boris.
Implements methodology §4 (the ascent: inbound reality → the spine) and closes the named gap in
§11.3 (the extraction/routing move). Atlas operates the ritual; Boris builds the substrate.

## What it is

A **batch, human-in-the-loop inbox-triage ritual**, run 1-2×/day, that turns new email across
Nick's two inboxes into *proposed* spine items. The autonomy is in the labor (read, extract, draft
with provenance); the commit stays human-gated. Nick reviews a projection-UI surface, resolves
questions with Atlas, and approves — approved items land in the Work tab.

## Hard invariant (do not violate)

**Propose-then-confirm. No silent writes to the spine.** The pre-pass only drafts into a proposal
queue; nothing reaches `goals`/`projects`/`tasks` without Nick's explicit approval. This is the
alignment loop (methodology §9), not a nicety. Auto-commit for trivial high-confidence items is a
*later* earned capability, behind a flag, never the default.

## Cadence & trigger

- **Pre-pass** (autonomous extraction): scheduled at **07:00 and 13:00** (Nick's TZ). Inngest or
  pg_cron — builder's call. Produces the proposal queue so it's waiting when Nick sits down.
- **Session** (interactive): Nick opens the triage surface (or chats with Atlas), answers the
  flagged questions, approves/edits/rejects. Atlas can also drive it conversationally off the queue.

## Scope (verified live 2026-06-22)

- **Two inboxes, both already in canon:** nick@konstellationai.com (1,190 msgs) and
  nick@instig8.ai (1,158 msgs, last today). No ingestion work needed — both flow today.
- **Thread-level**, re-opened when a new message lands on a handled thread.
- **Obligation-bearing email only:** `do`-quadrant + any thread with an explicit ask, commitment,
  or deadline. Everything else gets a one-line count in the digest — surfaced, never silently
  dropped (the "no silent caps" invariant).

## Current state (what exists vs. what to build)

Live: capture (both inboxes auto-ingest), Eisenhower classification (1,652 of 2,071 threads have a
`quadrant`). Schema is half-scaffolded: `email_threads` already has `signal_status`,
`snoozed_until`, `delegated_to`, `quadrant`, `classification_rationale`.

Missing (the build): (1) a triage state machine, (2) extract-to-proposal, (3) a validated write API
+ commit-on-approval, (4) the projection-UI review surface.

## Functions to build

### F1 — Triage state machine
`email_threads.signal_status` is stuck at `active` on 100% of 2,071 threads, so the system cannot
tell open from handled. Make it transition:
`untriaged → proposed → (actioned | no_action | snoozed | delegated)`; a new message on a
non-`untriaged` thread resets it to `untriaged`. Reuse the existing `snoozed_until` and
`delegated_to` columns. "What's new since last run" = `signal_status = 'untriaged'` (plus reopened).

### F2 — Extract-to-proposal (the pre-pass)
For each untriaged obligation-bearing thread: read it, decide if it carries an obligation, and if so
draft one or more proposed spine items. Each proposal carries: proposed shape (task | project),
payload (title, importance, urgency, first_5_minutes, due, candidate goal/project + area), a
`confidence` score, an optional `question` for Nick (the low-confidence or strategic call — which
goal, which entity, worth tracking at all), and a `canon_ref` to the source message. Writes to the
queue (F3 table). Flips the thread to `proposed`. **Mechanical obligations are reliably
automatable; strategic categorization is drafted as a best-guess and flagged via `question`.**

### F3 — Proposal queue + write API
New table `triage_proposals` (canon_engine):
```
id uuid pk
thread_id uuid fk email_threads
inbox text                      -- konstellationai | instig8
source_message_id uuid fk email_messages
proposed_type text              -- task | project
payload jsonb                   -- the drafted spine item(s)
confidence numeric
question text                   -- what to ask Nick; null if none
status text                     -- pending | approved | edited | rejected | superseded
canon_ref text                  -- provenance pointer
resulting_task_id uuid          -- set on commit
resulting_project_id uuid       -- set on commit
created_at / decided_at / decided_by timestamps
```
Sibling to the existing `capture_items` (manual-capture inbox); this is the auto-extracted lane.
The **write API** = the semantic moves (`propose_task` / `propose_project`) implemented as validated
functions (today they're raw SQL). On approval: validate payload → insert into the spine → set
`status=approved`, link `resulting_*_id`, flip the thread to `actioned`.

### F4 — Projection-UI review surface
A surface Nick reads (new `/triage` tab, or a section inside `/work`) — builder's call. Shows the
pending queue grouped by session/inbox; each row: source email snippet + link, the proposed item,
confidence, and the question. Actions: **approve / edit / reject / snooze**, plus batch-approve. A
header line shows the count of triaged-no-obligation email so nothing reads as silently handled.
Approve drives the F3 commit path.

## Non-goals / guardrails

- Not real-time; it's a batch ritual. Not an auto-pilot; strategic categorization stays in the loop.
- The pre-pass NEVER commits to the spine. No auto-reply to email (the canon-crm-feed outbound gate
  is separate and stays hard-gated).
- Dedup: do not re-propose an obligation already represented by an open task (match on `canon_ref` /
  thread). The lifecycle fix (F1) is what prevents dead threads from re-surfacing.

## To tune with Nick

- Confidence threshold that routes an item to "auto-approvable later" vs "always ask."
- Whether `/triage` is its own tab or folds into `/work`.
- How obligations spanning multiple emails in a thread collapse into one proposal.
