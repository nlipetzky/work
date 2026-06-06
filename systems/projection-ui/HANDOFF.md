# Projection UI Build — Handoff for New Session

**Date:** 2026-06-05
**Purpose of this session:** Build Nick's own version of the Deepline UI ... a projection layer over his RevOps Engine that makes records, runs, provenance, duplicates, and gaps legible in one surface.
**Starting condition:** Data layer migrated. Pattern doc written. Vendor evaluated. No UI exists yet.

## Why this build exists

Nick spent 2026-06-04 to 2026-06-05 evaluating Deepline (deepline.com). Conclusion: he did NOT need Deepline's enrichment engine ... he already built that as 107 archived Inngest functions. What Deepline forced into focus was a **projection layer over the engine**. Four architectural opinions, none of them magic:

1. **Records ↔ runs cross-link.** Every record knows which runs touched it; every run knows which records it produced.
2. **Per-field provenance.** Every enrichable column carries source, run_id, captured_at, cost.
3. **Dedup as a surface.** Duplicate pairs in a queue, scored, with resolution tracked.
4. **Gaps as views.** Missing-email, stale-employer, missing-modality are materialized; pipelines read from them, the UI shows progress against them.

Nick's symptom before this evaluation: "I couldn't see the data move, I had massive gaps and duplicates." Deepline made him realize the symptom was an observability gap, not an engine gap. **The job for this new session is to build the UI that makes the engine legible.**

## What's already in place (do not rebuild)

### Data layer (live in `revops-engine-dev` Supabase)

Project ID: `mrmnyscurmkfppicqqhk`. Postgres 17. Migrated 2026-06-05.

Tables and objects the UI will read from:

- **`companies`** (9,154 rows). Has `field_provenance` JSONB (lineage per field).
- **`contacts`** (25,978 rows). Has `field_provenance` JSONB.
- **`entity_activity_log`** (11.9M rows, 90d retention). **The universal records ↔ runs join.** Filter by `entity_type` + `entity_id` to get every event for a record.
- **`enrichment_jobs`** (7 rows, growing). Per-entity per-provider-call. Has `actual_cost`, `raw_response`, `fields_updated`.
- **`enrichment_ledger`** (15,499 rows). Per-step diff: `fields_before`, `fields_after`, `fields_changed`.
- **`enrichment_runs`** (0 rows, but live). Wave-level. Has `inngest_event_id` + `inngest_run_id` (Inngest-named pragmatically; we accepted this and did not refactor).
- **`duplicate_review_queue_companies`** (materialized view, 1,391 pairs at threshold 0.7). Refresh requires `SET LOCAL pg_trgm.similarity_threshold = 0.7` first (default 0.3 explodes and times out).
- **`duplicate_resolutions`** (empty ledger). Operator decisions: `merged | not_duplicate | deferred`.
- **`v_contacts_missing_email`** (1,958 rows today).
- **`v_companies_missing_modality`** (664 rows today).
- **`v_contacts_stale_employment`** (25,978 rows today — all of them, because `field_provenance.employer` is unpopulated everywhere; becomes useful as soon as enrichment writes to it).
- **`staging` schema** (empty). In-flight enrichment lands in `staging.<entity>_<batch_id>` before promotion.
- **`staging_promotions`** (empty ledger). Records each staging → canonical move with `enrichment_run_ids` array preserving lineage.

### Registry state (System Registry Airtable `apppQjlZiktpbO4aX`)

- **RevOps Engine row** (`recbpvJNm8hVCYAPu`) was updated 2026-06-05 to absorb the new outputs and metrics.
- **Three new Assets created** and linked to RevOps Engine:
  - `rec6kXdjFMYwZ6Ol0` ... Duplicate Review Queue (Companies)
  - `rec58kpkOxx2kLDdA` ... Gap Views (RevOps)
  - `recNXjaB4PRKtE0yR` ... Staging Schema (RevOps in-flight surface)
- **Roadmap row created** for this build: `recAYDoc4kFXVa4pT` ... "Build Retool projection surface (Records / Runs / Duplicates / Gaps / Staging Batches)". Status: next. Type: build. Category: observability.

The roadmap row currently says **Retool**, but that was the pilot choice from the original plan. The new session can re-decide tech (Retool vs Next.js vs something else). Update the roadmap row if it changes.

### Canon docs to read first (in this order)

1. **`/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md`** — the canonical pattern. Four opinions, schema, data flow, forbids, open questions. Vendor-agnostic.
2. **`/Users/nplmini/code/work/practices/agentic-systems/reference/system-overview-2026-06-05.html`** — full-system plain-English overview. Renders as a web page; covers RevOps engine + Canon engine + observability layer + Deepline learnings + what's missing. This is your visual reference for what the projection layer fits inside.
3. **`/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-evaluation-2026-06-04.md`** — vendor snapshot. Decays. Useful for understanding what Deepline does and where it stops fitting.
4. **`/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md`** — the four-layer model (Source / Surface / Mover / Client) the projection sits across. Read the "Open gaps (2026-06-04, revised)" section at the end.
5. **`/Users/nplmini/code/work/practices/agentic-systems/reference/inngest-projection-pattern.md`** — the orchestration side. This UI is the data side. See cross-reference at the bottom of that doc.

### The execution plan that got us here

`/Users/nplmini/.claude/plans/lovely-dancing-pumpkin.md` ... the original plan from the Deepline session, partially executed.
- W1 (artifacts) ... done
- W2 (Supabase migration) ... done with corrections (not greenfield; layered on top of existing tables)
- W3 (pilot wiring) ... NOT started. canon-crm-feed sidecar is hard-gated until motions-rewire stabilizes ~2026-06-12.
- W2.6 (staging schema) ... done
- W3.3 (Retool surface) ... THIS BUILD

### The standalone HTML viewer (working example of "thin UI")

`/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-companies-viewer.html` ... a single-file HTML viewer I built for the ngAbs Companies CSV. Features that worked well and could inspire the new UI:

- **5 stat cards** at top (total + Site Verdict distribution)
- **Search bar** across multiple text fields at once
- **Three dropdown filters** (Site Verdict, Has ngAbs, Role)
- **Filter chips** as shortcut buttons for status values
- **Sortable table** with 10 most-used columns visible
- **Click-row-for-drawer pattern** — drawer shows all 37 fields grouped into Identity / Classification / Evidence / Modality + Signals / Firmographics / Contacts
- **Dark theme** matching Deepline's look
- **Pagination** (100 per page)
- **Embedded JSON** so it works without a server (file:// or local preview)

Limitations to fix in a real UI:
- Static (embedded JSON, doesn't refresh)
- Misses 5 of 37 columns in the drawer
- No write-back (no Merge / Not Duplicate / Defer buttons)
- No live runs view, no staging batches view, no gaps view (it's a single-CSV viewer)
- Tailwind via CDN (fine for prototypes, not production)

But the **shape** is right ... compact table, drawer for full detail, filter chips, dark theme. Worth borrowing.

## What Deepline does well that we'd want to replicate

These are the patterns from Deepline's UI that worked and informed Nick's "I want my own version" instinct. Captured for the new session to consider.

| Deepline pattern | What it does | Worth replicating? |
|---|---|---|
| **CSV Playground** at `127.0.0.1:4173/data/<url-encoded-path>` | URL-addressable spreadsheet view of any CSV on disk. Open by pasting the URL. | Yes. The URL-addressable pattern is great. |
| **Customer Database tabs** (Data / People / Companies / Raw Events) | Typed surfaces over the warehouse. Click "People" to see all people in the corpus. | Yes. Matches our Records / Runs / Duplicates / Gaps split. |
| **Integrations page** | List of providers with on/off toggles and "Override with your credentials" per provider. | Maybe ... we already have provider configs elsewhere. Could centralize. |
| **Sessions / Agent Activity sidebar** | Live narration of agent work: plan steps, status messages, output CSVs, cost. | Yes. Especially the plan-step + status-message pattern. |
| **Free tier of bundled providers** | Some providers cost nothing because Deepline negotiated bulk rates (Prospeo, Forager, LeadMagic, Dropleads observed). | N/A — that's a business arrangement, not a UI pattern. |
| **In-flight CSV view as the work surface** | The CSV the agent is editing is also what the operator sees in the playground. | Partially. We chose staging schema in Postgres instead (see `staging-schema-not-csv` memory). The work surface for us is staging tables, not CSV files. But the in-flight visibility principle holds. |
| **Workflow builder** | Visual DAG editor for cloud-deployable workflows. | No. We have Inngest. |
| **Plan + step narration during agent work** | Agent registers a plan, marks steps running/completed, narrates progress. UI shows live. | Yes. This is the "see the work move" experience Nick was missing. |

## What Deepline does poorly or doesn't fit Nick's architecture

- **Single-tenant Customer DB.** One per-org Postgres, no schema customization. Nick's architecture is multi-tenant with per-client schemas (see `revops-architecture-spec.md`).
- **No per-client routing.** Deepline's UI shows one corpus. Nick's RevOps Surface routes data to N client bases with per-client stamp columns.
- **Workflows are less sophisticated than Inngest.** Don't migrate orchestration.
- **Chat is opaque.** Whatever model is wired into Deepline's chat panel, we can do better with Claude Code in the loop.
- **Customer DB conflates "scratch" and "system of record."** We chose staging schema for scratch and canonical tables for system of record.

## What our UI should do (initial scope, not committed)

The roadmap entry calls for five pages. These are the minimum to claim parity with what Deepline's UI made visible:

1. **Records** ... search contacts/companies. Click into one. Show:
   - Canonical column values
   - `field_provenance` JSON rendered as a per-field table (source, run_id, captured_at)
   - Full `entity_activity_log` history for the record
   - Recent `enrichment_jobs` rows
2. **Runs** ... list recent `enrichment_runs`. Click into one. Show:
   - Records touched
   - Total cost
   - Fields written (across `enrichment_jobs.fields_updated` for the run)
   - Outcome
3. **Duplicates** ... `duplicate_review_queue_companies` rows above a threshold slider. Per row: Merge / Not a duplicate / Defer buttons. Writes to `duplicate_resolutions`.
4. **Gaps** ... list of gap views with counts and recent additions. Click into one to see records.
5. **Staging Batches** ... in-flight `staging.<entity>_<batch_id>` tables. Promote / Discard buttons. Promotion calls a SQL function and writes a `staging_promotions` ledger row.

But the new session should re-think this scope rather than just implementing it. Questions worth re-litigating:

- Is the **Sessions / Agent Activity** sidebar (the Deepline live-narration pattern) more valuable than any of the five pages?
- Does **multi-tenant routing** belong in v1, or do we ship single-tenant first?
- Is there a **client-facing surface** (what Ellie or future clients would see) that should be part of this build, or is that separate?
- Does Nick want to **replace** the Deepline UI for his daily work, or **complement** it?

## Tech decisions made so far (re-litigate if needed)

- **Don't put this under Canon Lens.** Earlier session confused itself by reaching for Canon constellation. This is RevOps Engine infrastructure, not a separate Canon-shaped system. (See `project_canon_crm_feed_projection_gate` memory for context on the unwinding.)
- **Staging schema, not CSV scratch.** Postgres-first. CSVs break the runs join. (See `project_staging_schema_not_csv` memory.)
- **Retool was the pilot choice** ... cheap, ~1.5 day build, proves the pattern. Next.js was reserved for after stabilization.
- **Both are still on the table** for the new session. Re-decide based on what the build is actually for.

## What this UI is NOT

- Not a Deepline replacement product to sell.
- Not a workflow builder. Inngest handles orchestration.
- Not a system-of-record edit surface. Canonical tables get written by enrichment functions, not by humans clicking buttons. The UI lets humans see and resolve duplicates and gaps; it doesn't let humans hand-edit fields.
- Not multi-tenant in v1 unless we explicitly choose that scope.
- Not client-facing in v1 unless we explicitly choose that scope.

## Open questions for the new session

1. **What's the actual business case?** Is this for Nick alone (operator visibility)? For internal team (when a team exists)? For clients (Ellie sees a curated view)? Different answers, different tech.
2. **Multi-tenant or single-tenant v1?** The simplest version is one Postgres connection (revops-engine-dev). Multi-tenant means abstracting per-client schemas, which is harder.
3. **Tech stack.** Retool (fast, low ceiling), Next.js (slow start, high ceiling), Astro + Tailwind (middle ground), or extend the standalone HTML pattern (lowest tech, hard to scale).
4. **Auth.** Local-only for now? Supabase auth eventually? This depends on the business case answer.
5. **What ships first?** Records page alone could be enough for v0. Or duplicates alone (immediate value, 1,391 pairs waiting). Or the live session narration sidebar (Deepline's killer feature). Decide before building.
6. **Where does it deploy?** Localhost only? Vercel? Behind the Mac Mini?

## File inventory (everything the new session might need)

### This handoff lives here

- `/Users/nplmini/code/work/systems/projection-ui/HANDOFF.md` (this file)
- Working folder: `/Users/nplmini/code/work/systems/projection-ui/`

### Required reading (in priority order)

1. `/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md`
2. `/Users/nplmini/code/work/practices/agentic-systems/reference/system-overview-2026-06-05.html`
3. `/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-evaluation-2026-06-04.md`
4. `/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md` (especially the "Open gaps" section)
5. `/Users/nplmini/code/work/practices/agentic-systems/reference/inngest-projection-pattern.md`

### Reference: data layer

- `/Users/nplmini/code/work/practices/revops/database/revops-engine-dev.md` ... canonical schema reference (precedes today's migration; still authoritative for everything else)
- Supabase project ID: `mrmnyscurmkfppicqqhk`

### Reference: working example of a thin UI

- `/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-companies-viewer.html` ... single-file HTML CSV viewer. Drawer pattern, filter chips, dark theme.

### Reference: plan + roadmap

- `/Users/nplmini/.claude/plans/lovely-dancing-pumpkin.md` ... original plan with staging-schema addendum. Workstream 3.3 is the Retool pilot.
- System Registry: base `apppQjlZiktpbO4aX`, RevOps Engine row `recbpvJNm8hVCYAPu`, Retool roadmap row `recAYDoc4kFXVa4pT`.

### Reference: related canon

- `/Users/nplmini/code/work/CLAUDE.md` ... studio thesis + trust boundary rules.
- `/Users/nplmini/code/work/practices/agentic-systems/CLAUDE.md` ... Boris persona.
- `/Users/nplmini/code/work/practices/agentic-systems/system-registry-operating-manual.md` ... registry conventions (Asset / System / Cluster / Constellation classification).
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/reference/catalog.md` ... the eight Constellations (Canon, Compass, Signal, Forge, Voice, Pulse, Guard, Garden). This UI is RevOps Engine infrastructure, NOT a new Constellation member.

### Related systems (don't conflate)

- `/Users/nplmini/code/work/systems/canon-crm-feed/` ... existing Inngest projection over Canon → Airtable CRM. The gated pilot for the observability pattern. Reach `~2026-06-12` when motions-rewire stabilizes for a week.

## What to do first when the new session opens

1. Read the five required-reading docs in order. Confirm understanding before designing.
2. Open the standalone HTML viewer in a browser; play with it. Note what works, what's missing.
3. Open the Deepline UI at 127.0.0.1:4173 if it's still running; note what's worth borrowing.
4. Connect to Supabase (project `mrmnyscurmkfppicqqhk`) and run a few queries against the new objects (`duplicate_review_queue_companies`, `v_contacts_missing_email`, `entity_activity_log`) to feel the data shapes.
5. Use `superpowers:brainstorming` to explore scope and tech with Nick BEFORE writing code. The open questions above (multi-tenant, tech stack, auth, what ships first) are real decisions, not implementation details.
6. Only after the brainstorm produces a scoped v0: enter plan mode, write a plan, get approval, then build.

## What this handoff does NOT do

- Doesn't pre-decide tech (Retool / Next.js / Astro / something else).
- Doesn't pre-decide scope (which page ships first).
- Doesn't pre-decide multi-tenant model.
- Doesn't say "build the Retool pilot" just because that's what the roadmap entry says. The roadmap entry can change.
- Doesn't presume the user will continue from where the last session ended. The pattern doc and data layer are stable; everything above them is open.
