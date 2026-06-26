# Handoff to Boris: system_builds.project_id + Move 4 = evidence, not status

From: Atlas (operator-os) · 2026-06-25 · For: agentic-systems (Boris)

Resolves Part 4 of your `HANDOFF-system-building-system-2026-06-25.md`. Full ratified contract:
`practices/operator-os/reference/build-spine-contract.md`. Also in your inbox as `capture_items`
`25581831`. This handoff is the short version of what's yours to do.

## What I need from you

1. **One schema add (unblocks the spine↔build join):**
   ```sql
   alter table public.system_builds add column project_id uuid references public.projects(id);
   ```
   A build ↔ one project (the "build/iterate system X" project). `project_id` is the precise join
   (a system has many projects over its life; `system_slug` alone is ambiguous). A build with no
   `project_id` is an orphan Atlas flags. This is the only schema action Part 4 needs.

2. **Build Move 4 "register" per the ratified rule (this was your open decision #4, now defined):**
   At Move 4, register writes **EVIDENCE**, never a self-reported status:
   - ensure the `systems` row exists (create via the build's `system_slug` if new); set
     `system_builds.system_slug`;
   - write/link the build's **activities** (what it does) and **assets** (workflows/functions/scripts
     it produced) into canon;
   - **do NOT set `systems.status = 'operating'`.** System State computes the rung from the evidence
     (`system-building-method §5`: status is computed, never a label). A freshly-registered system
     honestly reads `building`/`beta` until activities are ensured+verified and assets reconciled.
     Setting the label here would recreate the exact "claims operating / 0 activities" fiction System
     State just removed.
   - leave `assets.reconciled_against_reality` to the reconciliation crawler (your inbox item
     `b4ba9f6a`), not hand-claimed at registration.
   - The build's project closes when its stopping rule ("done when X") is met AND the system evidences
     at its target rung — not merely when Move 4 ran.

## What Atlas will build (the seam — so you know where we meet; waits on #1 + Nick's go)

- The Planner (`/work/plan`) seeds a `system_builds` row (stage 1) when it creates a build project →
  the build appears on `/build`. (Needs `project_id` to exist.)
- The `/work` roadmap card for a build-mode project reads `system_builds` and shows the **stage +
  pending ask + a link to /build**, so /work and /build never drift.
- The next-action routes an active build to `/build` (where the ask lives).

## Related, already in your inbox
- `b4ba9f6a` — the reconciliation crawler + register canon system `system-state` (connects to Move 4's
  asset reconciliation).
- The `offer-first-outreach` build is seeded at stage 1, queued as the next real system through the loop.

Nothing else from me. Once `project_id` lands, the Atlas-side integration is unblocked.
