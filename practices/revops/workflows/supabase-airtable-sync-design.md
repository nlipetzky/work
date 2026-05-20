# Supabase -> Airtable Sync: Design

## Identity

- **n8n workflow ID:** `GRo45TloP6Awor4V`
- **n8n workflow name:** `Supabase RevOps -> Airtable Sync`
- **Supabase project:** `mrmnyscurmkfppicqqhk` (revops-engine-dev)
- **Airtable base:** `appYBYH3aOHhTODAw` (sandbox / visibility surface)
- **Trigger:** manual (Phase 1). Schedule possible after reliability work proves out.

## Role in the pipeline

This workflow is **read-and-mirror only**. It does not enrich. Enrichment happens upstream (Clay, Apollo, Hunter, scoring functions) and lands in Supabase. This workflow surfaces post-enrichment state in Airtable so Nick can watch it.

Out of scope for this workflow:
- Triggering enrichment providers.
- Mutating Supabase data.
- Two-way sync. Airtable is read-only-by-convention.

## Topology

```
                                    Supabase (source of truth)
                                            |
                                            | read-only
                                            v
                                     n8n: this workflow
                                            |
                                            | PATCH upsert
                                            v
                              Airtable appYBYH3aOHhTODAw (view)
                              - Companies
                              - Contacts
                              - Sync Runs  <-- new
```

## Failure modes the current workflow has

See `practices/revops/database/sync-runs.md` for the visibility design that addresses them.

1. No run log. Partial failures invisible.
2. No error branching. One bad batch halts the workflow.
3. Silent singleSelect failures. Supabase enum value not in Airtable options -> 422 on whole batch of 25.
4. Stale field retention. Mapper's `if value, set` pattern means Airtable mirrors high-water mark, not current state.
5. Silent ceilings (2000 / 1000 / 1000 limits).
6. No run-in-progress guard. Parallel runs race.

## Patched flow (Phase 1)

```
Manual Trigger
   v
Config (set play_name)
   v
[NEW] Check Active Runs           -- GET sync_runs_active. Halt if any rows.
   v
[NEW] Open Run                    -- INSERT sync_runs (status=running). Returns run_id.
   v
Get Evaluations
   v
Extract IDs
   v
[NEW] Record Fetch Counts         -- PATCH sync_runs: evaluations_matched, companies_fetched, contacts_fetched
   v
Fetch Companies
   v
Map Companies
   v
Upsert Companies                  -- continueOnFail: true
   v
[NEW] Capture Companies Errors    -- aggregate failed batches into errors[]
   v
[NEW] Update Run (companies)      -- PATCH sync_runs: companies_upserted, companies_failed, errors
   v
Start Contacts
   v
Fetch Contacts
   v
Map Contacts
   v
Upsert Contacts                   -- continueOnFail: true
   v
[NEW] Capture Contacts Errors
   v
[NEW] Close Run                   -- PATCH sync_runs: status, completed_at, contacts_upserted, contacts_failed, errors
```

## Airtable: Sync Runs table

New table in `appYBYH3aOHhTODAw`. Field map:

| Airtable field | Type | Supabase source |
|---|---|---|
| Run ID | singleLineText (primary) | `sync_runs.id` |
| Status | singleSelect: running, complete, partial, failed | `sync_runs.status` |
| Started At | dateTime | `sync_runs.started_at` |
| Completed At | dateTime | `sync_runs.completed_at` |
| Duration (s) | number | `sync_runs.duration_ms / 1000` |
| Play | singleLineText | `sync_runs.play_name` |
| Workflow | singleLineText | `sync_runs.workflow_name` |
| Triggered By | singleLineText | `sync_runs.triggered_by` |
| Evaluations Matched | number | `sync_runs.evaluations_matched` |
| Companies Fetched | number | `sync_runs.companies_fetched` |
| Companies Upserted | number | `sync_runs.companies_upserted` |
| Companies Failed | number | `sync_runs.companies_failed` |
| Contacts Fetched | number | `sync_runs.contacts_fetched` |
| Contacts Upserted | number | `sync_runs.contacts_upserted` |
| Contacts Failed | number | `sync_runs.contacts_failed` |
| Error Count | number | `sync_runs.error_count` |
| Errors | multilineText | `JSON.stringify(sync_runs.errors, null, 2)` |
| Notes | multilineText | `sync_runs.notes` |

Each n8n run writes its own `Sync Runs` row alongside the Companies / Contacts PATCHes. Nick watches this table during execution to see status flip from `running` to `complete`/`partial`/`failed` and counts populate live.

## Phase 2 (later)

Once Phase 1 proves visibility works:

- Add `Last Run ID` field to Companies and Contacts. Mapper writes it on every upsert. Lets Nick filter "show me everything from THIS run."
- Validate singleSelect values pre-write against an allowlist (fetched from Airtable metadata or hardcoded).
- Switch mapper to unconditional sets so Airtable clears stale fields when Supabase drops them.
- Assert cohort size < limit and fail loud, or paginate.
- Schedule trigger (cron) once manual runs have been stable for a week.

## Apply order

1. **Supabase migration:** apply `database/sync-runs.sql` via Supabase MCP. Creates table + active-runs view.
2. **Airtable table:** create `Sync Runs` in `appYBYH3aOHhTODAw` via Airtable MCP with the field map above.
3. **n8n patch:** add the new nodes to `GRo45TloP6Awor4V` via n8n MCP. Patch is additive... existing nodes stay; new nodes wire in around them.

Confirm each step before proceeding to the next.
