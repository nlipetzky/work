# Spec: Atlas's inbox — the formal intake to the work spine

Date: 2026-06-23. Owner: Boris (agentic-systems) — plumbing + this spec. Co-owner: Atlas (operator-os) —
the triage ritual. Status: spec to wire (no schema build needed).

## The problem

Every persona, agent, and folder discovers work that belongs on Nick's spine: Boris finds OS work,
Kepler finds GTM follow-ups, a client/venture folder surfaces a commitment, the email/transcript
pipeline extracts an obligation. Two bad equilibria without a formal path:

- **Direct writes to goals/projects/tasks** bypass Atlas's curation (dedupe, ladder-to-goal, the
  do/delegate/automate/drop verdict, the leverage sort) and the spine rots into a junk list.
- **No path at all** and work gets dropped — the executive-function failure the practice exists to
  prevent.

The resolution is an intake queue. It already exists.

## The rule

**No persona, agent, or folder writes `goals` / `projects` / `tasks` directly. They drop a capture
item into Atlas's inbox.** Atlas alone owns the spine and promotes items into it. (This formalizes the
fix for the reconciliation task hand-written into `canon.tasks` on 2026-06-23 — that should have been a
capture item.)

## The inbox: `canon_engine.public.capture_items`

Already built, currently empty. No new table, no migration. Shape:

- `title`, `body` — what the candidate work is.
- `item_type` (enum) — `decision · question · option · issue · idea · action_item`. The *kind* of
  capture, which tells Atlas how to triage (see mapping below).
- `source` (enum) — `agent_session · manual · transcript · email`. Where it originated.
- **provenance (mandatory):** `created_by` (the persona/agent), `session_id` (the originating session),
  `account_id` / `engagement_id` / `loop_id` (the folder/engagement it came from, if any).
- `owner_actor_id` — the practice that should *do* the work (e.g. "agentic-systems"). Atlas routes by
  this; it does not do other practices' work.
- `tags` (array), `metadata` (jsonb) — the flexible hints: suggested goal/project ladder, a
  `source_ref` (file path / canon_ref / n8n workflow id), and a proposed spine shape.
- `status` (enum) — `open → deferred | resolved | promoted | dismissed`. The triage lifecycle.
- `promoted_to` — the spine object id it became. `resolved_note` — why deferred/resolved/dismissed.

## The capture move (the contract every non-Atlas agent uses)

One move, kept deliberately simple — if it's heavier than a direct write, agents bypass it:

> Write one `capture_items` row with `status = 'open'`: a `title` (+ `body` if useful), an `item_type`,
> the `source`, your `created_by` and `session_id`, the `owner_actor_id` for who should do it, and any
> ladder/`source_ref` hints in `metadata`. Do not write `goals`/`projects`/`tasks`. Stop there — Atlas
> takes it from the inbox.

The chain: **discoverer → inbox → Atlas triages → Atlas proposes to Nick → Nick approves.** The inbox
sits one level above Atlas's existing `propose_*` moves (those are Atlas proposing to Nick; this is
others proposing to Atlas).

## Atlas's triage ritual (operator-os owns this)

At **session start** and in the **daily/weekly review**, Atlas processes `status = 'open'` items:

1. **Dedupe** against the existing spine and other open items.
2. **Ladder** — which goal/project does it serve? Unladderable items are surfaced as flags, not dropped.
3. **Verdict** — apply the do/delegate/automate/drop rate test and the leverage sort.
4. **Promote or close.** Promote via the `propose_*` moves (Nick approves anything landing on his
   plate); on promotion set `status = 'promoted'`, `promoted_to = <spine id>`. Otherwise `deferred` /
   `resolved` / `dismissed` with a `resolved_note`. Always carry the item's provenance into the spine
   object's `canon_ref`.

Type → spine mapping (a guide, not rigid): `action_item` → Task; `idea` / `option` → Consider; `issue`
→ Task or flag; `decision` / `question` → a note or an ask to Nick.

## Boundaries

- This is the **work-spine** inbox. The **registry `_review/` queue stays separate** — different
  curator (Boris), different objects (systems / activities / assets). Two queues, two curators, same
  propose-then-triage pattern. Do not merge them.
- The **triage cadence is load-bearing**, not the table. An inbox no one processes rots exactly like an
  unprocessed email inbox. Atlas must process `open` items every session, or the queue is worse than
  nothing.

## Wiring (what makes this live)

- `operator-os/CLAUDE.md` — Atlas's triage step added to its rituals + reads (done 2026-06-23).
- `work/CLAUDE.md` — the cross-practice rule + pointer to this spec, so every persona inherits it
  (done 2026-06-23).
- No schema change. `capture_items` is ready as-is.
