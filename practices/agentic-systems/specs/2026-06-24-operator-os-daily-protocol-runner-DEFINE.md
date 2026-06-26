# DEFINE — Operator-OS Daily-Protocol Runner

Step: **Define only** (method §3.1). No Plan, no Build. This is the spec that gates the Plan step.
Owner: Boris (agentic-systems) for the build; Atlas (operator-os) owns the routine it runs.
Date: 2026-06-24. Source spec: `practices/operator-os/reference/daily-protocol.md` (v1, locked
2026-06-24). Slice of: `HANDOFF-operator-os-reliability-2026-06-23.md`.

---

## 1. Identity

- **name:** Daily-Protocol Runner
- **slug:** `operator-os-daily-protocol-runner`
- **purpose (what it ENSURES, one line):** Nick's day opens and closes with a current model, an empty
  inbox, and exactly one next action — without Nick driving the routine.
- **ladders to:** Goal `Build the autonomous operating environment (operator OS)`
  (`canon.goals` id `7e0c5653-f8ac-4310-be8c-486fbadf9c2f`, Summer 2026) → Vision (assets that run
  without Nick in the loop).
- **owner:** Atlas (operator-os) runs the routine; Boris (agentic-systems) builds and stewards the
  runner.
- **type / class:** workflow (deterministic spine orchestrating narrow AI calls), class `core`.
- **lifecycle:** `emerging` (this Define artifact). Advances to `building` only after the manual
  proof in §8.

### Relationship to the existing `Operator OS` canon row

`canon.systems` already has `Operator OS` (id `8ed26879-91f9-5391-8d55-fea18079c249`, slug
`operator-os`, status `building`). That row is the **substrate** — the Work base, the spine tables,
the state layer Atlas operates on. It is NOT this system. The Daily-Protocol Runner is a **distinct
system that operates the protocol against that substrate**. DEFINE creates a new sibling row; the
substrate row stays as-is and becomes a dependency (§ Assets / Dependencies). Do not collapse the two
— substrate ≠ the routine that runs over it. (Open decision below.)

---

## 2. What it ENSURES vs what it DOES

It **ensures** the six protocol activities happen reliably every open/close, traced and verifiable. It
does **not** itself decide Nick's strategy, do his work, or become the worker (invariant 4). The AI is
a called, contracted component inside a deterministic driver (method §0, §2 — lowest rung that holds).

### Per-activity table

Architecture rung per method §2: (1) deterministic code+DB · (2) one augmented LLM call · (3) workflow
· (4) agent. Pick the lowest that holds.

| # | Activity | Current automation | Target automation | Architecture (rung) | Deterministic code | AI as called fn | Human-in-loop |
|---|----------|--------------------|--------------------|---------------------|--------------------|-----------------|---------------|
| 1 | **Orient** — load `_ai_context` + last `next_session_pointer` + canon freshness; never assert stale | manual (Atlas reads by hand) | autonomous | rung 1 | SessionStart hook reads contract, last session row, computes freshness (email/transcript/session ages) | none | none (silent unless freshness breach → surfaced) |
| 2 | **Triage inbox** — process every open `capture_item`: dedupe vs spine, ladder to goal, do/delegate/automate/drop, promote or close; inbox ends empty | manual | semi-auto (AI proposes, Nick ratifies promotions) | rung 2 per item inside rung-3 loop | driver pulls open items, dedupe candidates by embedding/keyword, enforces terminal-state write (promoted/resolved/deferred/dismissed) | one call per item: classify + ladder + verdict + draft promotion | Nick ratifies each promotion (recommend-then-ratify); contact-asks auto-route to motions (invariant 5) |
| 3 | **Surface focus** — compute the ONE next action: importance × urgency × leverage vs runway, weekly intent, calendar; with first-5-min + why-lever | manual (Atlas improvises ranking) | autonomous (compute), assisted (explain) | rung 1 compute + rung 2 explain | deterministic ranking query (the `/work` focus surface, spec R1) — code owns the number | one call to phrase the why-lever + first-5-min from the top-ranked row only | Nick consumes; pull not push |
| 4 | **Flag rituals due** — Weekly Intent (Mon/no-row), stale projects (Active 3+ wks, 0 completed), important→urgent drift | manual | autonomous | rung 1 | pure SQL predicates over spine tables → flag list | none | Nick acts on flags; never auto-flip status (ask) |
| 5 | **Mirror** (close) — actual activity vs week's intent: moved / stalled / hijacked | manual | semi-auto | rung 2 | driver pulls day's completed tasks + status changes + intent allocation | one call to summarize moved/stalled/hijacked from the deltas | Nick reads; short |
| 6 | **Log** (close) — write session to `agent_sessions` (title, decisions, action items, canon_refs, asset_refs, next_session_pointer) | manual (and dropped 2026-06-22 when canon dropped mid-close) | autonomous | rung 1 | Stop hook assembles + writes the row; retries on connection drop; never leaves a row open | optional one call to draft summary/title | none (the dropped-log failure is exactly what automation kills) |

---

## 3. Contract

```yaml
inputs:
  - {name: Operator contract (_ai_context, Work base + canon), status: live}
  - {name: Last session row + next_session_pointer (canon.agent_sessions), status: live}
  - {name: Open capture_items (the inbox), status: live}
  - {name: Spine tables (goals/projects/tasks), status: live (Work base today; canon on migration)}
  - {name: Weekly Intent (current week), status: live}
  - {name: Calendar + email freshness signals (canon), status: partial (email green, transcripts limited)}
outputs:
  - {name: Oriented session context (loaded, freshness-checked), status: off}
  - {name: Empty inbox (every item promoted or closed, provenance carried), status: off}
  - {name: The ONE next action (computed rank + first-5-min + why-lever), status: off}
  - {name: Ritual flags (weekly-intent due, stale projects, urgency drift), status: off}
  - {name: Daily mirror (moved/stalled/hijacked), status: off}
  - {name: Logged session row (next_session_pointer set), status: off}
metrics:
  - {name: Inbox-empty-at-close rate, value: null}
  - {name: Session-log coverage % (no dropped/open rows), value: null}
  - {name: Promotions that pass schema validation first try, value: null}
  - {name: Next-action computed deterministically (not improvised) %, value: null}
stopping: >
  Per open: orient done + inbox empty + one next action surfaced + rituals flagged.
  Per close: mirror written + session logged with next_session_pointer set.
failure: >
  Missing input (e.g. transcripts limited): proceed and report the gap, never silent-skip
  (doctrine: docs lose to live state). Canon write fails: retry, and never leave a session row
  open (the 2026-06-22 failure). Low-confidence triage classification: surface for ratify, never
  auto-promote. Ranking inputs incomplete: rank on what's present, flag what's missing.
escalation:
  - "schema-invalid write -> reject + surface to Nick, never bypass the move"
  - "contact-ask detected in triage -> route to motions (NYX CRM), not Nick's list"
  - "expert boundary -> Hermes"
  - "boundary-rule violation (person name / $ in client update / relative path) -> PreToolUse block"
cost_envelope:
  per_run: "Cheap. ~handful of LLM calls/open+close (triage per-item + 3 phrasings). No paid providers. Hooks + SQL are free."
```

---

## 4. Assets to build

All `to-build` unless noted. Types per the controlled vocabulary (`system-anatomy.md` §10).

```yaml
assets:
  - {name: SessionStart hook, type: script, ownership: own, status: to-build, activity: orient,
     note: "loads _ai_context + last agent_sessions row + open-thread pointers + computes freshness; reliability-layer component #2"}
  - {name: Stop hook, type: script, ownership: own, status: to-build, activity: log,
     note: "auto-writes agent_sessions row; retry-safe; kills dropped/open-row failure; component #2"}
  - {name: Daily-protocol driver, type: script, ownership: own, status: to-build, activity: all,
     note: "deterministic control flow sequencing orient->triage->surface->flag (open) and mirror->log (close); AI called per-step"}
  - {name: Enforced semantic moves, type: edge function, ownership: "shared:operator-os-reliability", status: to-build, activity: triage,
     note: "propose_goal/project/task/set_weekly_intent/log_conversation as validated RPCs; schema = project-definition-standard.md; component #1 (build FIRST)"}
  - {name: Triage classifier prompt, type: prompt, ownership: own, status: to-build, activity: triage,
     note: "per capture_item: dedupe + ladder-to-goal + do/delegate/automate/drop verdict + contact-ask detection"}
  - {name: Computed next-action query, type: script, ownership: "shared:work-focus-surface", status: to-build, activity: surface-focus,
     note: "deterministic importance x urgency x leverage + weekly intent + calendar ranking; spec-work-focus-surface.md R1; component #3"}
  - {name: Ritual-flag predicates, type: script, ownership: own, status: to-build, activity: flag-rituals,
     note: "SQL predicates: weekly-intent-due, stale-project (Active 3+wk/0 done), urgency drift"}
  - {name: Forced-retrieval resolve tool, type: mcp server, ownership: "shared:operator-os-reliability", status: to-build, activity: triage,
     note: "canon resolve/lookup so 'which system/person/project owns X' is a query, not a question to Nick; component #4"}
  - {name: Boundary guardrail validators, type: script, ownership: "shared:operator-os-reliability", status: to-build, activity: all,
     note: "PreToolUse: block person-names-in-shared-artifacts, $-in-client-updates, relative paths; auto-flag orphans/stale/no-goal; component #5"}
  - {name: Operator OS substrate, type: airtable base, ownership: "shared:operator-os", status: connected,
     note: "canon row 8ed26879-...; Work base appz7I91uNxWBnly8 + canon spine tables — the state this runs against. Dependency, not built here."}
  - {name: canon.agent_sessions, type: table, ownership: "shared:canon", status: connected,
     note: "cross-session memory; orient reads, log writes"}
  - {name: canon.capture_items, type: table, ownership: "shared:canon", status: connected,
     note: "the inbox; triage consumes; per atlas-inbox-spec.md"}
context:
  - {name: daily-protocol.md, version: v1, status: defined, note: "the routine = the spec"}
  - {name: project-definition-standard.md, status: defined, note: "the schema the enforced moves validate against"}
  - {name: atlas-inbox-spec.md, status: defined, note: "capture_items triage contract"}
  - {name: spec-work-focus-surface.md, status: defined, note: "R1 ranking the next-action query implements"}
```

### Dependencies (esp. reliability layer + canon)

This runner **is a slice of** the operator-OS reliability layer (the handoff). It cannot be built ahead
of its components:

1. **Enforced semantic moves (component #1)** — build FIRST. Triage's promote step writes through these
   or it can guess/bypass. Hard dependency.
2. **Session lifecycle hooks (component #2)** — ARE activities 1 (orient) and 6 (log). The runner is
   partly just these hooks wired to the protocol.
3. **Computed next-action (component #3)** — IS activity 3. Depends on `/work` focus surface R1.
4. **Forced retrieval (component #4)** — triage's dedupe/ladder step routes lookups through it.
5. **Boundary guardrails (component #5)** — cross-cutting PreToolUse validators.
6. **canon** — `agent_sessions`, `capture_items`, spine tables (Work base today; repoints to canon
   Postgres on migration — do not write canon operator tables that don't exist yet).
7. **motions system (NYX CRM)** — co-owned with Hermes; triage routes contact-asks there (invariant 5).

---

## 5. Guardrails (the protocol invariants — load-bearing, build must enforce)

From `daily-protocol.md` §Invariants. The protocol *fails* if any breaks, so these are acceptance
constraints, not nice-to-haves:

1. **Orient before asserting** — never present a stale model as current. (Freshness check gates orient.)
2. **The inbox is never left unprocessed** — every open `capture_item` ends in a terminal state.
3. **Surface exactly one next action** — with lever + first-5-min, never a backlog dump.
4. **Act in the open; route to owner; never become the worker** — recommend-then-ratify; Atlas explains
   the computed rank, does not improvise it.
5. **Contact-asks route to motions, not Nick's list** — triage classifier detects "get someone to
   do/provide X" and routes to NYX CRM.

Plus method/doctrine guardrails: deterministic spine, AI as contracted component; the surface enforces
the gate (a green claim must read from live state); single-threaded writes.

---

## 6. Staged build roadmap (v0 manual → automated)

Closes the contract gaps. Each stage is a Project (method §1) that advances the System one maturity
rung; Nick gatekeeps each gate (Go/Kill/Hold/Recycle).

- **v0 (manual, NOW — pre-build)** — Atlas runs the full protocol by hand, every open and close, for a
  stretch of real days. Produces the manual-run evidence that gates the build (§8). No code yet. This
  is method §3.3 "prove manually." `emerging`.
- **v1 — log + orient autonomous.** Ship the SessionStart + Stop hooks (reliability component #2).
  Kills "pretending to remember" and dropped logs first, because those are the cheapest, highest-value
  wins and unblock clean resume. → `beta` once it runs on real sessions.
- **v2 — enforced triage.** Ship enforced semantic moves (#1) + triage classifier + forced retrieval
  (#4). Inbox triage becomes propose-and-ratify against a validated schema; contact-asks route to
  motions. → still `beta`.
- **v3 — computed focus + flags.** Ship the deterministic next-action query (#3, depends `/work` R1) +
  ritual-flag predicates. The ONE next action is computed, not improvised. → `beta`.
- **v4 — guardrails + verify gate green.** Ship boundary validators (#5). Wire verification (inbox-empty
  rate, log-coverage %, schema-pass %, computed-vs-improvised %) read live on the `/system` surface.
  When the gate passes continuously → `operating`.

Promotion up the ladder is *earned by verification history*, never asserted (method §4, §5). A demotion
fires if verification fails.

---

## 7. Register + surface (post-build, not now)

On build, this lands as its own `canon.systems` row (slug `operator-os-daily-protocol-runner`,
`goal_id` = the operator-OS goal), with its activities in `canon.activities`, assets in `canon.assets`
(`activity_id` linked), and triggers in `canon.system_triggers` (SessionStart event, Stop event, plus
the daily cadence). It renders on `/system/[slug]` per the 10-part anatomy, reconciled against live
hooks/RPCs before trusting the surface.

---

## 8. What MUST be proven manually before the build starts (method §3.3)

Do not build until Atlas has run the protocol by hand and these hold on real days:

1. **The routine is stable.** The six steps run start-to-finish without re-deciding their shape each
   day. If the steps still churn, the spec isn't locked — fix the spec, not the runner.
2. **The ranking formula produces a defensible single next action** on real spine data — importance ×
   urgency × leverage + intent + calendar yields *one* action Nick agrees is the lever, repeatedly.
   This is the riskiest AI-judgment-to-code translation; prove the formula by hand before coding it.
3. **Triage terminal-states cleanly.** Every capture_item Atlas processes lands promoted (with valid
   schema + provenance) or closed with a note — by hand — without malformed writes. Proves the
   enforced-move schema is right before it's coded.
4. **Contact-ask routing is real.** At least one "get X from someone" item routed to a motion by hand
   (the Will-transcripts example exists). Proves the classifier's target before automating it.
5. **The log round-trips.** A hand-written `agent_sessions` row with a `next_session_pointer` actually
   lets the next session resume cleanly. Proves the orient↔log contract.

Gate: Nick ratifies that the manual routine is stable and the ranking is trustworthy → then Plan, then
build v1 (the hooks).

---

## Open decision for Nick

**One row or two?** This DEFINE treats the Daily-Protocol Runner as a *separate* system from the
existing `Operator OS` substrate row (substrate = state; runner = the routine over it). The alternative
is to fold the runner into the existing `Operator OS` row as its activities. I recommend two rows —
the substrate and the routine have different lifecycles, owners (you operate the base; the runner is a
built artifact), and verification gates, and conflating them is exactly how "operating" got claimed on
unverified work before. But it's your call, and it's the one decision that changes the canon shape.
