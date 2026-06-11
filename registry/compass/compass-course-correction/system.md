---
name: Compass Course-Correction
slug: compass-course-correction
home: compass
clusters: []
class: core
lifecycle: engineering
flags: []
autonomy: assisted
outcome: >
  Plan updates when reality changes; old direction retired. The studio's evolving
  state is visible and current, and Nick reorients from it instead of from scratch.
runs_surface: "localhost:4180/system — diff feed over registry git history + review queue"
contract:
  inputs:
    - {name: system.md records (registry/), status: live}
    - {name: Review queue items (registry/_review/), status: live}
    - {name: Registry git history, status: live}
    - {name: Nick's curation decisions (approve/park/kill), status: manual}
  outputs:
    - {name: Review surface (/system), status: live}
    - {name: Constellation map (/system/map), status: live}
    - {name: Per-system contract pages, status: live}
    - {name: Session entry/exit reorientation, status: manual}
  metrics:
    - {name: Review-queue items resolved vs aging, value: null}
    - {name: Sessions opened from the registry vs cold, value: null}
  stopping: >
    Per session: exit writes proposed state changes to _review/ (no auto-promote);
    touched system records updated. Per review: Nick's call applied in-session,
    item archived, last_reviewed advanced.
  failure: >
    Parse errors surface as error banners on the map and home, never silently
    hidden; a record that fails to parse drops out of the map with its error shown.
  escalation: ["state changes -> Nick approval via the review queue"]
  cost_envelope: {per_run: "none — local file reads + git"}
assets:
  - {name: Registry file tree, type: filesystem, ownership: own, status: operating,
     verified_by: null, note: "registry/ — 25 system.md records, _review/ queue, _meta.yml; source of truth"}
  - {name: Registry parser + gates, type: script, ownership: own, status: tested,
     verified_by: "systems/projection-ui/lib/registry.test.ts + registry.smoke.test.ts (12 passed)",
     note: "lib/registry.ts — emit-contract schema, verified_by + runs-visibility warnings, home validation"}
  - {name: /api/system routes (list, detail, review), type: script, ownership: own, status: operating,
     verified_by: null, note: "read-only; detail includes per-system git history, review derives the diff feed"}
  - {name: System pages (/system, /system/review, /system/inventory, per-system), type: surface, ownership: own, status: operating,
     verified_by: null, note: "landing = constellation dashboard (/system); /system/review = queue + diff; /system/inventory = every part of every system; per-system pages render the flow dashboard when the record declares flow"}
  - {name: launchd LaunchAgent, type: infrastructure, ownership: own, status: operating,
     verified_by: null, note: "com.nick.projection-ui.plist — login start + auto-restart (kill-tested 2026-06-11); logs in ~/Library/Logs/"}
  - {name: Registry smoke test, type: script, ownership: own, status: operating,
     verified_by: null, note: "real registry must always parse clean with expected count; update count when adding systems"}
context:
  - {name: Design spec, version: 2026-06-10, status: defined, verified_by: null,
     note: "practices/agentic-systems/specs/2026-06-10-system-registry-design.md — decisions, gates, out-of-scope"}
  - {name: Session entry/exit protocol, version: v1, status: defined, verified_by: null,
     note: "entry: read _review/ + relevant records, surface proportionally; exit: proposals to _review/, never direct edits without Nick's call"}
  - {name: UI protocol, version: v1, status: defined, verified_by: null,
     note: "job -> mockup with real data in chat -> approved mockup is the spec -> then code"}
  - {name: Prior art — system-overview snapshot, version: 2026-06-05, status: defined, verified_by: null,
     note: "reference/system-overview-2026-06-05.html — the first locally hosted whole-system view
     (static plain-English narrative, pre-projection-ui). Superseded by this registry (snapshots
     rot; live-derived state doesn't), but keep its idea: a generated walk-in-cold narrative
     overview rendered FROM registry records is the v1 candidate this registry still lacks"}
---

The keep-live layer: a contract-first registry of the studio's systems rendered as a review
surface. Built 2026-06-10 from the spec after the STATUS.md flat-list approach was rejected as
noise. This system is Compass's missing Core from the constellation doc — the present tense in
"decides" — and the registry it maintains is its own substrate.

Roadmap:
- **v0 (shipped 2026-06-10)** — registry + parser + three read-only views; launchd keep-alive (2026-06-11).
- **next** — prove the loop: first review item resolved in-session (demand-context definition is queued), last_reviewed advancing, exit-proposals becoming routine.
- **later** — SessionStart hook (only after the loop proves itself; enforcement-before-curation was rejected).
- **later** — curation actions in the UI (approve/park/kill); Airtable roadmap consolidation/retirement.
