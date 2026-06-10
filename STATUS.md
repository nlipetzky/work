# STATUS — studio build front door

> **Read this first, every session.** Before starting new work, scan the open bridges below and ask:
> does what I want to do today relate to one of these? Resume a bridge before building the next thing.
> This is the v0 seed of the build registry (the real one — per-system status, how-to-use, resume
> pointers, with entry/exit hooks — is the next design; see `project_studio_keep_live_registry` in memory).
>
> *Last updated: 2026-06-10 (merge session; bridges 1-2 resolved).*
>
> **The registry now exists** (2026-06-10): `registry/` (source of truth, 25 systems) rendered at
> `localhost:4180/system` (review surface · /system/map · per-system pages). Spec:
> `practices/agentic-systems/specs/2026-06-10-system-registry-design.md`.
> This file is now a consumer; new session-exit items go to `registry/_review/`, not here.

---

## This session's open bridges (freshest — resume here)

1. ~~**Unmerged branch `phase-4-agent-driven-driver`**~~ **RESOLVED 2026-06-10:** fast-forwarded into
   `main` (567a681), pushed to origin, local branch deleted.

2. ~~**projection-ui `package.json` / `package-lock.json` uncommitted.**~~ **RESOLVED 2026-06-10:**
   manifest committed (567a681) with markdown deps + inngest dep (inngest app code still uncommitted,
   see HANDOFF-inngest-sync.md).

3. **Roadmap active-focus decision (open).** Next phase is either Phase 7 (context-collection hub, the
   keystone) or Phase 5 (approval gate — now live-relevant after this session spent Apollo + Explorium
   credits with no gate). → **Resume:** pick one; update the ROADMAP.md resume pointer.

4. **CIPO play is provisional / throwaway.** `patent-portfolio-mgmt` criteria were operator-authored as a
   motions cut. The real ICP comes from the **2026-06-10 CMO intake** with Will. The Explorium re-source
   needs an industry filter (`linkedin_category` / `naics_category`), not `website_keywords` (content match
   pulled media/staffing noise → all-OUT batch). → **Resume:** after the intake locks the ICP.

5. **Context reader is live but on an ephemeral dev server** (`localhost:4180/context`, detached process).
   → **Resume:** `cd systems/projection-ui && npm run dev` if it's down.

6. ~~**The build-registry / PM model is undesigned.**~~ **RESOLVED 2026-06-10:** designed and built —
   the system registry (`registry/`, 25 systems, emit contracts + inventories + lifecycle) rendered at
   `localhost:4180/system`. Spec: `practices/agentic-systems/specs/2026-06-10-system-registry-design.md`.
   The SessionStart hook remains deliberately unbuilt until the registry proves itself in use.

---

## Other open bridges (from memory — verify current status before acting; these may have moved)

- **Inngest Airtable sync** (`project_inngest_airtable_sync`): code complete on `revops-staging-pipeline`;
  needs env vars + migrations 0009/0010 before first run. Replaces the n8n webhook trigger.
- **canon-crm-feed projection gate** (`project_canon_crm_feed_projection_gate`): motions-rewire shipped;
  projection gate opens ~2026-06-12; destructive Contacts-column removal (Task 11) gated on Nick's explicit go.
- **Teknova system registry** (`project_teknova_system_registry`): engagement terminating; deliverable is a
  registry — internal base → sanitized client base (Airtable+n8n+SF only, never Supabase/Inngest); 50 workflows.
- **DB infra hygiene** (`project_revops_db_micro_cron_saturation` + ROADMAP open thread): capture the four
  audit-matview definitions in tracked migrations; rework the slow `v_contact_field_completeness` query.
- **Roadmap & registry consolidation** (ROADMAP open thread): three roadmaps compete (this STATUS seed +
  ROADMAP.md + two Airtable bases) — decide source-of-truth-by-altitude. The build registry should subsume this.
- **SME context loop, Phases 7-9** (`project_sme_context_loop`, ROADMAP): context hub → feedback path →
  autonomous synthesis. Not started.

---

## What shipped this session (so it's not re-litigated)

Phase 4 agent-driven driver (done, validated on two plays); route/dedup batched-writes fix; classifier
read-fields + generate-prep-plan made play-agnostic; CIPO `patent-portfolio-mgmt` play bundle + two motions
runs (Apollo, Explorium); SME-context-loop vision (`reference/sme-context-loop.md`) + roadmap Phases 7-9;
projection-ui `/context` reader. All on the `phase-4-agent-driven-driver` branch.
