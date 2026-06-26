---
name: Daily-Protocol Runner
slug: operator-os-daily-protocol-runner
home: compass
clusters: []
class: core
lifecycle: defined
flags: []
autonomy: manual
depends_on: [operator-os]
outcome: >
  Nick's day opens and closes with a current model, an empty inbox, and exactly
  one next action -- without Nick driving the routine
stub: false
---

DEFINE complete 2026-06-24. Spec:
`practices/agentic-systems/specs/2026-06-24-operator-os-daily-protocol-runner-DEFINE.md`.
Canon row: `84ca591d-7753-4aa6-b85d-2ee2c45916e8` (status `emerging`).

A distinct system from the Operator OS substrate (`8ed26879-...`): substrate = state;
this runner = the routine over it (Nick ruled TWO rows, 2026-06-24). It ensures the six
daily-protocol activities (orient, triage inbox, surface focus, flag rituals, mirror, log)
run reliably every open/close. Deterministic spine, AI as a called component.

A slice of the operator-OS reliability layer
(`practices/agentic-systems/HANDOFF-operator-os-reliability-2026-06-23.md`). Build is gated:
does NOT advance past `defined`/`emerging` until Atlas proves the protocol manually on real
days (spec section 8) and Nick ratifies. First build stage is v1 (the SessionStart + Stop
hooks). Routine spec: `practices/operator-os/reference/daily-protocol.md`.
