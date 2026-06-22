# Handoff: Inngest Airtable Sync (replaces n8n webhooks)

**Session:** 2026-06-08  
**Branch:** revops-staging-pipeline  
**Status:** Code complete, TypeScript clean. Needs env vars filled + migrations applied before first run.

---

## What was built

Replaced the Postgres trigger → n8n webhook sync with a durable Inngest function. Root cause: the
old design fired on every row write, so a bulk Salesforce reverse-sync (~26k contacts) DoS'd the
n8n instance. The new design only fires on an explicit promote action.

### New files (projection-ui)

| File | Purpose |
|------|---------|
| `lib/inngest/client.ts` | `Inngest({ id: "projection-ui" })` singleton |
| `lib/inngest/functions.ts` | `syncCompaniesOnPromote` + `syncContactsOnPromote` |
| `lib/airtable/config.ts` | Base/table IDs from env; `getAirtableKey()` |
| `lib/airtable/fieldmaps.ts` | MAPS object ported verbatim from n8n export + `buildFields()` |
| `lib/airtable/client.ts` | `upsertChunk(tableId, chunk)` — one Airtable PATCH per call |
| `app/api/inngest/route.ts` | `serve({ client, functions })` — GET/POST/PUT |
| `app/api/staging/resync/route.ts` | POST `{batchId, entity}` — re-emits the event for recovery |

### Modified files (projection-ui)

- `app/api/staging/promote/route.ts` — after `promoteBatch()` succeeds, emits
  `revops/batch.promoted`. Send failure is caught/logged; promote still returns 200.
- `lib/queries/staging.ts` — added `promotedRecords()`, `companiesByIds()`, `contactsByIds()`,
  `companyNamesByIds()`
- `package.json` — added `inngest` dependency
- `.env.local.example` — added Inngest + Airtable keys

### New migrations (revops-engine)

- `0009_promote_airtable_synced_at.sql` — adds `staging_promotions.airtable_synced_at` timestamptz
- `0010_drop_n8n_airtable_triggers.sql` — drops `companies_n8n_sync`, `contacts_n8n_sync` triggers
  and `notify_n8n_airtable_sync()` function permanently

---

## Key design decisions (final)

**No idempotency key.** The resync recovery path re-emits the same `batchId+entity` event.
An Inngest idempotency key would silently drop that re-emit for 24 hours. Airtable upserts on
`Supabase ID` so re-runs are already safe without it.

**`concurrency: { scope: "env", key: "'airtable-revops-base'", limit: 1 }`.**
`scope: "env"` serializes _both_ functions against the shared base key, not each function against
itself. Without this, companies and contacts syncs could run concurrently and together exceed
Airtable's 5 req/s/base ceiling. Combined with `throttle: { limit: 4, period: "1s" }` the pipeline
stays comfortably under the limit.

**`public.contacts` has `company_id`, not `company_name`.** The contacts function includes a
`load-company-names` step that resolves `company_id → name` from `public.companies` and injects
`row.company_name` before calling `buildFields()`. The Airtable `Company` link resolves by name
via `typecast: true`.

---

## Before running

### 1. Fill in env vars (.env.local)

```
AIRTABLE_API_KEY=          # copy from ~/code/work/.env
AIRTABLE_REVOPS_BASE_ID=appYBYH3aOHhTODAw      # already defaulted in code
AIRTABLE_COMPANIES_TABLE_ID=tblnj3YlOI3thjrXp  # already defaulted
AIRTABLE_CONTACTS_TABLE_ID=tblWJksRL1yKSUgrm   # already defaulted
INNGEST_EVENT_KEY=         # prod only — dev server is keyless
INNGEST_SIGNING_KEY=       # prod only
```

### 2. Apply migrations

Both migrations apply to the Supabase project `mrmnyscurmkfppicqqhk`.

```bash
# From systems/revops-engine/
supabase db push
```

Or apply via the Supabase MCP: run 0009 then 0010 in order.

**0010 is the storm kill-switch.** Until it runs, the disabled triggers still exist in the DB.
Apply it as soon as the new sync is confirmed working.

---

## Verification (from the plan)

1. `npm install && npx inngest-cli@latest dev -u http://localhost:4180/api/inngest`
2. `npm run dev` in a separate terminal.
3. Promote a small companies batch via the UI → Inngest dev dashboard shows
   `sync-companies-on-promote` success → confirm rows in Airtable with `Supabase ID` set.
4. Promote the matching contacts batch → confirm `Company` field resolved to linked Companies.
5. Re-emit the same event via `/api/staging/resync` → Airtable row count unchanged (upsert idempotency confirmed).
6. After applying 0010: `update public.contacts set updated_at = now()` on a few hundred rows →
   `select count(*) from net.http_request_queue` stays 0.

---

## Catch-up / backfill

Records promoted before this change have `airtable_synced_at = null`. To sync them:

```sql
select batch_id, source_record_type
from staging_promotions
where airtable_synced_at is null
group by batch_id, source_record_type
order by batch_id;
```

Then POST to `/api/staging/resync` for each `{batchId, entity}` pair (companies before contacts).
