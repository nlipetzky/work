# sync_runs: run log for Supabase -> Airtable mirror

## Purpose

Every execution of the Supabase -> Airtable sync workflow writes a header row here at start and updates it at finish. This is the visibility surface. If a run silently truncates, partially fails, or halts mid-batch, this table shows it.

Solves the "AI said it did it, fields missing" problem at the workflow layer. You can:
- Filter Airtable Companies by `Last Run ID` to see exactly which rows a given run touched.
- See partial-success counts at a glance.
- Reconstruct error payloads from the `errors` JSONB without scraping n8n execution logs.

## Lifecycle

A run progresses through four statuses:

| Status | When |
|---|---|
| `running` | Inserted by n8n's "Open Run" node before any data work. |
| `complete` | All batches succeeded. All counts match expectations. |
| `partial` | Workflow finished but at least one batch errored. Errors logged. |
| `failed` | Workflow halted before close. `completed_at` may be null. |

## Run-in-progress guard

The `sync_runs_active` view returns currently-running rows. n8n queries this before opening a new run and halts if any are open (preventing parallel mutation of the same Airtable rows).

If a workflow crashes without closing its run, the row stays `running` and blocks future runs. Recovery: manually update the stuck row to `failed` (with a note), then re-run.

## Field semantics

- `evaluations_matched` — count returned from `playbook_evaluations` query before dedup.
- `companies_fetched` / `contacts_fetched` — unique IDs after dedup, before upsert.
- `*_upserted` — rows the Airtable PATCH actually accepted.
- `*_failed` — rows in batches that returned non-2xx.
- `companies_fetched - companies_upserted - companies_failed` should be zero. If not, something dropped silently.

## Error payload shape

```json
{
  "phase": "companies",
  "batch_index": 7,
  "http_status": 422,
  "message": "Invalid value for field 'Enrichment Status'",
  "payload": { "records": [...] }
}
```

The full batch payload goes in `payload` so you can replay it manually after fixing the root cause (usually an Airtable singleSelect option that doesn't exist).

## Migration

Apply via Supabase MCP `apply_migration` or psql against project `mrmnyscurmkfppicqqhk` (revops-engine-dev). SQL lives in `sync-runs.sql`.

## Airtable mirror

Mirror this table to Airtable base `appYBYH3aOHhTODAw` as `Sync Runs`. Field map in `workflows/supabase-airtable-sync-design.md`.
