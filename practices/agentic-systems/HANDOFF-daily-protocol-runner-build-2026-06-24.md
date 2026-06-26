# Handoff to Boris: build the Daily-Protocol Runner (operator requirements)

From: Atlas (operator-os) · 2026-06-24 · For: agentic-systems (Boris)

Builds on your DEFINE spec: `specs/2026-06-24-operator-os-daily-protocol-runner-DEFINE.md` and the
locked protocol `practices/operator-os/reference/daily-protocol.md`. Canon system row already
registered: `84ca591d` (Defined). This handoff adds the concrete **trigger + interaction + surface**
requirements Nick wants, so it can go to Plan once the protocol is proven manually.

## The shift

Today Atlas runs the protocol by hand each turn. The system turns it into something **Nick triggers
from `/work`** and clicks through — Atlas proposes, Nick confirms, the system writes. The protocol
is the spec; this is how it becomes a running surface.

## Triggers / entry points (Nick's explicit ask)

- **Primary "Start my day" button at the top of the Focus view** (`/work`, focus tab). Triggers a
  morning **protocol run**: orient → triage inbox → surface the one next action. This is the anchor
  requirement.
- The same entry (or an adjacent **"Triage (N)"** chip showing the open `capture_items` count)
  launches **the triage session we just did by hand** — see below.
- **"Close out" button** (end of day) → mirror + log.
- Button-only (pull) for v1, matching the protocol's "pull, not push." A scheduled morning auto-run
  is a later option, not v1.

## What each step needs as a system (answering "what else")

1. **Orient.** Load `_ai_context` + the last session's `next_session_pointer`, and run a **canon
   freshness check** (last ingest timestamps for email/transcripts) so the run never asserts a stale
   model. Output: a 2-line "where we left off + what's stale."
2. **Triage (the interactive core).** For each open `capture_item`: Atlas **pre-computes** a proposed
   verdict (do / delegate / automate / drop), the goal it ladders to, and dedupe-against-spine — and
   presents them. Nick **approves or overrides per item with one click**. On confirm, the system
   writes via the **enforced semantic moves** (promote → spine with provenance, or close with a
   note). Inbox ends empty. This is the panel the button opens.
3. **Surface focus.** **Compute** the one next action (importance × urgency × leverage, weighed
   against runway + weekly intent + calendar), with its first-5-min and why it's the lever. Render at
   the top of Focus. (This is reliability-layer component 3 — the ranking must be proven by hand
   first; it's the riskiest piece.)
4. **Flag rituals.** Deterministic checks: Weekly Intent stale (Mondays / no current row), projects
   Active 3+ weeks with zero completed tasks, anything drifting important→urgent. Surface as flags.
5. **Mirror (close).** Compare the day's actual spine activity vs the week's intent — what moved /
   stalled / got hijacked. Needs a per-day activity signal (what changed in the spine today).
6. **Log (close).** Write the `agent_sessions` row (title, decisions, action items, canon_refs,
   next_session_pointer). This is reliability-layer component 2 (Stop hook).

## Interaction model
Atlas proposes, Nick confirms, the system writes. AI is a **called function** for the judgment bits
(triage verdicts, the ranking, the focus rationale); the writes are **deterministic semantic moves**,
never free-text CRUD. A protocol **run is a session** with state (so it's resumable and logged).

## Surfaces & writes
- Surface: the `/work` Focus view (triggers + triage panel + computed next-action + ritual flags).
- Writes: `capture_items` status + spine via semantic moves; the run logs to `agent_sessions`.

## Dependencies
- The **operator-OS reliability layer** (`HANDOFF-operator-os-reliability-2026-06-23.md`): enforced
  semantic moves (the write layer triage uses), SessionStart/Stop hooks (orient/log), computed focus.
  The Daily-Protocol Runner is the **orchestration on top of** those primitives — sequence them.
- The `capture_items` inbox (exists), the spine (exists), the ranking formula (to prove).

## Open design decisions (for your Plan)
1. **Triage UX:** per-item click-through vs batch "Atlas proposed N, review & bulk-approve." (Lean
   batch with per-item override — faster for Nick.)
2. **How the button invokes Atlas:** an API route that runs a protocol driver calling the model for
   the judgment steps, vs a queued agent run. (Doctrine: code-driven driver, AI as called function.)
3. **Where the triage panel lives:** modal on Focus vs a `/work/triage` route.
4. **The ranking formula** for the one next action — define + prove manually before coding it.

## Gate (unchanged)
Build is gated on Atlas running the protocol manually for a stretch of real days to produce the
DEFINE §8 proof (ranking trustworthy, triage terminal-states clean, log round-trips) and Nick
ratifying. This handoff is the build target Plan works toward once that passes.
