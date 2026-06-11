# System dashboard views — design (constellation + system level)

*2026-06-12. Extends the registry spec (`2026-06-10-system-registry-design.md`). Both views were
mockup-approved by Nick in-session (UI protocol: the approved mocks ARE the spec; this doc records
the data contract and decisions). Database: registry files in git — NOT Airtable, NOT Supabase.
Supabase remains the row-data store; Airtable's fate decided after a week of surface use.*

## Job statements

- **Constellation dashboard** (replaces `/system/map` content, same route): "everything on the
  table" — all 8 constellations, every system as a state-colored chip, an attention strip
  (review-queue count, dated items, active builds), legend. One screen, no scrolling, drill-down
  by click.
- **System dashboard** (`/system/<constellation>/<slug>`, new layout): "what is this system made
  of and how does it work" — the FLOW (inputs → pipeline nodes → outputs) as the center, every
  node naming its concrete implementation (script/RPC/schema/workflow, monospace) with
  exists/to-build state; node click expands its implementation inventory; header counts the
  build gap and links the full roadmap; bottom three panels: Moving now / Decisions banked / Next.
  The current record layout remains reachable (full contract, full inventory, history) below or
  via "Full record".

## Schema additions (all optional, additive — parser must not break existing records)

```yaml
# on asset/context rows:
path: systems/revops-engine/run-prep.mjs    # formalizes what notes carried informally; click target

# on the record:
flow:                                        # the system as a sequence; absent -> page falls back to list layout
  - {node: Load, assets: [Source loaders (Apollo, Explorium, CSV)], impl: load-companies-csv-to-staging.mjs, kind: node script}
  - {node: Stage, assets: [Staging schema + promote_staging_batch], impl: staging.* + staging_batch_meta, kind: Postgres schema}
  - {node: Screen, assets: [Prep runners (stage1, classify, dedup, route, contacts-screen), run-prep orchestrator + --print-plan], impl: run-prep.mjs + 5 runners, kind: node scripts}
  - {node: Flag-resolve, assets: [], impl: flags-v0.sql + resolver (tbd), kind: SQL + skill}
  - {node: Promote, assets: [Staging schema + promote_staging_batch], impl: promote_staging_batch(), kind: SQL RPC}
flow_inputs:  [{name: Play bundle, status: live}, ...]   # optional; defaults to contract.inputs
flow_outputs: [{name: Qualified rows -> Core, status: live}, ...]  # defaults to contract.outputs
dates:                                       # dated commitments — surfaced on the constellation dashboard
  - {date: 2026-06-12, label: "crm-motions green gate completes"}
now: ["flag-resolve v0 (mRNA session)", "source-column fix in the loader"]  # what's moving; agent-maintained
```

Derivations (no new fields needed):
- Build gap = count of asset/context rows with status `to-build`/`to-write` vs the rest.
- Node state = worst status among its assets (to-build > building > built/tested/operating).
- "Moving now" panel = record `now` list + last git commits touching the system dir (detail API
  already returns history).
- Decisions banked = context rows, newest `version` first.
- ● active marker on the map = record has a non-empty `now`.
- ◌ awaiting-review marker = an open `_review/` item names the system.

## Decisions

1. Constellation dashboard replaces the map page content; the home review surface stays the
   landing (`/system`), with a prominent link. Revisit after use.
2. Flow is agent-maintained YAML like everything else; the smoke test gates parseability.
3. Only signal-prospecting gets a `flow` seed now (richest real example). Records without flow
   render the existing layout — no forced migration.
4. crm-motions gets the `dates` seed (the 6/12 gate). demand-context gets `now: []` left empty.
5. v1 read-only, same as everything: no editing from the surface.

## Out of scope

Editing from the UI; auto-deriving flow from code; Airtable sync; generated narrative overview
(banked as prior art on compass-course-correction).
