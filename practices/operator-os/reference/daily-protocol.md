# Operator-OS Daily Protocol (v1)

Status: v1, locked 2026-06-24. Owner: Atlas (operator-os). This is the repeatable routine Atlas
runs to open and close Nick's day. It is also the spec for the system that will run it
(see the operator-OS reliability layer; SessionStart/Stop hooks automate steps 1-2 and 5-6).

Principle: the operator system must reflect reality and surface the right next action WITHOUT Nick
driving it. Manual-first — Atlas runs this by hand until it's proven, then Boris builds the runner.

## Start of day
1. **Orient.** Read the operator contract (`_ai_context`) + the last session's `next_session_pointer`
   so work resumes where it left off. Pull current ground truth from canon (freshness of
   email / transcripts / sessions) so the model is not stale. No asserting a stale picture as current.
2. **Triage the inbox.** Process every open `capture_item`: dedupe vs the spine, ladder to a goal,
   apply the do / delegate / automate / drop verdict, then **promote** (→ a spine item, status=promoted,
   promoted_to set, provenance carried) or **close** (resolved / deferred / dismissed + a note). The
   inbox ends empty.
3. **Surface the focus.** Compute the ONE next action — importance × urgency × leverage, weighed
   against the runway, the weekly intent, and the calendar — with its first-5-minutes and why it is
   the lever. Pull, not push. One action, not a list.
4. **Flag rituals due.** Weekly Intent (Mondays, or whenever the current week has no row), stale
   projects (Active 3+ weeks with zero completed tasks), anything drifting from important into urgent.

## Close of day
5. **Mirror.** Actual activity vs the week's intent — what moved, what stalled, what got hijacked. Short.
6. **Log.** Write the session to `agent_sessions` (title, key decisions, action items, canon_refs,
   asset_refs, next_session_pointer) so the next run resumes cleanly.

## Invariants (the protocol fails if any breaks)
- Orient before asserting — never present a stale model as current reality.
- The inbox is never left unprocessed.
- Surface exactly one next action, with its lever and first-5-min — not a backlog dump.
- Act in the open; route work to its owner; never become the worker.
- Contact-asks (get someone to do/provide X) route to the motions system, not onto Nick's list.
