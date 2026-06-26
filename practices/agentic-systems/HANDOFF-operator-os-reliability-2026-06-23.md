# Handoff to Boris: operator-OS reliability layer

From: Atlas (operator-os) · Date: 2026-06-23 · For: agentic-systems (Boris)

## The ask

Make Atlas reliable **by construction**, not by remembering to behave. Nick's directive: the
operator-os practice needs to be systematic/reliable. The principle: you can't make the model
deterministic, so move every load-bearing step out of "Atlas remembers/decides" into enforced
scaffolding; only Atlas's judgment stays probabilistic. Captured as G3 project
`operator-os-reliability-layer`. Atlas defines the requirement; you own the build/architecture.

## Components (priority order) — each kills a real failure observed 2026-06-23

1. **Enforced semantic moves** (build first, biggest win). `propose_goal/propose_project/
   propose_task/set_weekly_intent/log_conversation/...` are convention today — Atlas writes raw to
   canon via PostgREST and can guess or bypass. Make them validated tools/RPCs where the schema IS
   `practices/operator-os/reference/project-definition-standard.md`: reject a write missing a goal
   link, first-5-min, rate verdict, etc. Kills guessed/malformed/bypass writes.
2. **Session lifecycle hooks.** SessionStart hook auto-loads `_ai_context` + recent
   `agent_sessions` + open-thread pointers; Stop hook auto-writes the session log. Kills
   "pretending to remember" and dropped logs (a session row was left open 2026-06-22 when the canon
   connection dropped mid-close).
3. **Computed next-action.** The `/work` focus surface should compute the ranking
   (importance × urgency × leverage + weekly intent + calendar) deterministically; Atlas explains
   the output, does not improvise it. Ties to `spec-work-focus-surface.md` R1.
4. **Forced retrieval.** A canon resolve/lookup tool so "which system/person/project owns X" is a
   query Atlas is routed through, never a classification question pushed to Nick.
5. **Boundary guardrails.** PreToolUse validators that block rule violations (person names in shared
   artifacts, $ amounts in client updates, full-path enforcement) and auto-flag structural drift
   (orphan tasks, projects active 3+ weeks with zero completed tasks, systems with no goal link —
   25 of 26 today).

## Note

This is the same pattern as the demand-context build: move load-bearing work from manual/judgment
into enforced system. It makes Atlas progressively self-running (the operator-OS goal's intent) and
eventually obsolete as a manual operator. Sequence behind the runway/revenue work; #1 component
(enforced moves) is the highest-leverage and lowest-risk to start.

## Added 2026-06-23: spine → motions routing (a specific case of guardrail #5)

A spine task whose real nature is "get a contact to do / produce / provide X" must NOT surface as a
Nick task on `/work`. It routes to the **motions** system in the NYX CRM (`app5tsy6zjfA8H3rx`,
Motions + Events tables): the liaison drafts an outbound Email Event (`Status=Drafted`), Nick's only
act is the `Approved to send` checkbox, and the send job + motion handle send and follow-up.
Worked example wired by hand today: "get Will's PatentVest transcripts" → drafted Event on Will +
advanced the Will–Partnership motion + dropped the spine task. Wire this as: (a) an Atlas intake
classifier that detects contact-ask tasks and routes them to motions instead of creating a canon
task, and (b) the NYX CRM motion library extended (in `systems/canon-crm-feed/MOTIONS.md`) so it
covers arbitrary contact-asks, not only stage advancement. Co-owned with Hermes (expert-liaison),
who executes the motions.
