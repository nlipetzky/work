# n8n Fan-Out, Airtable-Triggered Version

**Verdict: Better than the webhook design for your stated priority** (kill Clay-side webhook pain). The win shifts complexity into n8n. The previous design (Clay HTTP API column → n8n webhook) is superseded — do not build it. Read /Users/nplmini/code/work/accounts/clients/teknova/artifacts/n8n-clay-airtable-fanout-design.md as a historical alternative; do not implement.

---

## What changed at the architectural level

| Concern | Old (webhook) | New (Airtable trigger) |
|---|---|---|
| Trigger surface | n8n webhook URL | n8n Airtable Trigger node, polling Companies table |
| Clay-side setup per new column | New HTTP API column, payload composition, event_type string, header auth | Just add a field to the existing Send-to-Airtable sync. ~2 min vs ~10-15 min |
| Latency | Seconds | 60-120 seconds (polling floor) |
| Trigger payload | Self-describing (event_type, items[], dedupe_key) | Full Companies row; n8n must figure out what changed |
| Single point of failure | Clay HTTP timeout | n8n hash-compare logic correctness |
| Failure isolation | Excellent (one webhook call per column) | Worse (one bad JSON field can crash processing for the other 4 on the same row) |

The universal contract (`Company Events` table schema with `dedupe_composite_key`, `event_type`, `company_link`, `title`, `date`, `source_url`, `metadata` JSON) survives intact. What changes is the trigger surface and where payload assembly happens.

---

## How the n8n Airtable Trigger actually works

Confirmed via n8n-mcp:

- **Node:** `n8n-nodes-base.airtableTrigger` (v1)
- **Mechanism:** polling, not push. Minimum interval: 60 seconds.
- **Field watching:** can only watch ONE `triggerField`, which must be Created Time or Last Modified Time. **It does NOT tell you which field changed** — only that the record changed.
- **Payload:** returns the full record, subject to an `additionalFields.fields` allow-list.
- **Multi-field updates:** if multiple fields update within one poll window, you get ONE trigger fire with the latest record state. Good for batching, bad for per-field granularity.

This is the load-bearing constraint: **you cannot rely on the trigger to tell you which JSON field changed.** You have to detect it yourself.

---

## The change-detection problem and its solution

Without per-field diffing, every unrelated edit to a Companies row (a name change, a status field flip, any other Clay column running) re-processes all five JSON arrays. Idempotent (the upsert handles it) but wasteful — burns Airtable API quota on no-op upserts.

**Solution: SHA256 hash per JSON field, stored on the parent Companies row.**

Add five sibling hash columns next to your JSON columns:

| JSON field | Hash field |
|---|---|
| `wet_lab_sites_json` | `wet_lab_sites_hash` |
| `job_openings_json` | `job_openings_hash` |
| `press_mentions_json` | `press_mentions_hash` |
| `clinical_trials_json` | `clinical_trials_hash` |
| `conference_appearances_json` | `conference_appearances_hash` |

All hash columns: Long text, hidden in operator views. SHA256 hex = 64 chars.

**Why hash, not Airtable's "Last modified time (specific fields)":** Airtable supports per-field last-modified columns, but the n8n trigger watches only ONE field. You'd need five separate trigger nodes (five workflows) to use that signal. Hashes consolidate to one trigger.

**Why hash, not a timestamp from Clay:** Hashes catch the partial-completion failure mode — a prior run upserted some events but crashed before writing back the timestamp, so the next poll re-runs cleanly.

---

## The workflow (5 nodes)

```
Airtable Trigger (Companies row changed)
   pollTimes: everyMinute
   triggerField: LastModified
   additionalFields.fields: record_id, company_name,
     wet_lab_sites_json, job_openings_json, press_mentions_json,
     clinical_trials_json, conference_appearances_json,
     wet_lab_sites_hash, job_openings_hash, press_mentions_hash,
     clinical_trials_hash, conference_appearances_hash
   |
   v
Code: Fan out changed JSON fields  (runOnceForAllItems)
   - Iterate FIELD_MAP config (one entry per JSON field)
   - For each field: try/catch wrapper, hash compare, parse, explode
   - Emit two kinds of items: _kind="event" (one per array element) and _kind="hash_update" (one per row, holds new hashes)
   - On parse error: emit _kind="sync_error" item, do NOT update that field's hash
   |
   v
Switch: route by _kind
   - "event" -> Airtable upsert (Company Events)
   - "sync_error" -> Airtable create (Sync Errors)
   - "hash_update" -> waits for upserts to succeed, then updates Companies row
   |
   v
Airtable Upsert (Company Events)
   matchingColumns: ["dedupe_composite_key"]
   typecast: true
   onError: continueRegularOutput
   retryOnFail: true
   |
   v (after upsert succeeds)
Airtable Update (Companies)
   Write back the new hashes for fields that processed cleanly
```

The "wait for upserts to succeed before writing hashes back" wiring is critical. If you write hashes back in parallel and an upsert fails, you get silently-lost events. Use a Merge node, or chain the hash update node downstream of the upsert success branch.

---

## The Code node config (the one place new columns get added)

```javascript
const FIELD_MAP = {
  wet_lab_sites_json: {
    event_type: 'wet_lab_site',
    hash_field: 'wet_lab_sites_hash',
    dedupe_key_path: (item) =>
      `${item.city || ''}|${item.state || ''}|${item.siteType || ''}`.toLowerCase().trim()
  },
  job_openings_json: {
    event_type: 'job_opening',
    hash_field: 'job_openings_hash',
    dedupe_key_path: (item) => (item.url || '').toLowerCase().replace(/\/$/, '')
  },
  press_mentions_json: {
    event_type: 'press_mention',
    hash_field: 'press_mentions_hash',
    dedupe_key_path: (item) => (item.link || '').toLowerCase().replace(/\/$/, '')
  },
  clinical_trials_json: {
    event_type: 'clinical_trial',
    hash_field: 'clinical_trials_hash',
    dedupe_key_path: (item) => item.nctId || ''
  },
  conference_appearances_json: {
    event_type: 'conference_appearance',
    hash_field: 'conference_appearances_hash',
    dedupe_key_path: (item) =>
      `${item.conferenceName || ''}|${item.date || ''}|${item.title || ''}`.toLowerCase().trim()
  }
};
```

**Adding a new event column = add one entry to this map and ship.** No new workflow, no new webhook, no new Airtable automation.

The full Code node body (validate + hash compare + try/catch per field + emit) is in the agent output at /private/tmp/claude-501/-Users-nplmini-code-work-accounts-clients-teknova/6f60d216-99c9-42ba-b13c-415e98ccc318/tasks/wboc97md1.output.

---

## What goes away from the old design

- Per-column Clay HTTP API setup (payload composition, event_type hardcoding, header auth)
- Clay's 30-60s HTTP timeout forcing payload chunking
- Clay HTTP API column concurrency tuning
- Webhook auth token rotation and leak risk
- Synchronous Clay → n8n → Airtable timeout coupling
- Project memory rule about not modifying webhook nodes (no webhook node)
- Clay-side dedupe_key computation per column (moved to n8n config, single source of truth)

---

## What's new (the actual cost of this choice)

| Gotcha | Mitigation |
|---|---|
| Trigger fires on any field change, re-processes 5 JSONs by default | Hash-compare per field, skip if unchanged |
| One malformed JSON crashes the other 4 on the same row | try/catch per field in the Code node loop |
| Trigger storms: Clay bulk-syncs 400 rows in seconds, n8n picks up 400 at next poll = 400 x 5 = 2000 JSON parses in one execution | Add a `Loop Over Items` node + Wait between batches, OR scale n8n with queue mode |
| Trigger only fires on records where LastModified changed AFTER the trigger started | Backfill existing rows once: a one-shot workflow that reads all rows and processes them, OR touch every row to bump LastModified |
| Debugging granularity loss: log says "row recXYZ updated" not "jobs column pushed" | Aggregator Code node logs per-field outcome (processed / skipped via hash match / errored) to a Sync Errors table |
| Hash storage adds 5 columns to Companies (operator-view pollution) | Hide them in operator views; they're system metadata, not user data |
| Wider Airtable PAT scope (n8n now writes to Companies, not just Events) | Use a dedicated PAT for n8n with scoped base access; rotate quarterly |
| Re-processing a record requires clearing the hash column, not just re-running the Clay column | Document this; consider a small Airtable button field or a "clear all hashes" view filter |
| Clay overwriting JSON mid-fan-out causes a redundant re-run (new hash on next poll) | Acceptable — composite dedupe key on Company Events prevents true duplicates |
| Hash write must happen AFTER upsert success, not in parallel | Wire the hash-update node downstream of upsert success via Merge node |

---

## Should you use Airtable Automations instead of n8n polling?

Alternative: Airtable's native "When record updated → specific field changed" automation that POSTs to a simple n8n webhook. Trade-offs:

**Pros:**
- Near-real-time (5-15s vs 60-120s for polling)
- Can fire per-field (one automation per JSON field), eliminating the hash-compare logic
- No wasted polls when Companies is quiet

**Cons:**
- Five Airtable automations to maintain (one per JSON field), no version control
- Burns Airtable automation run quota
- Retry semantics worse — Airtable retries 3x then drops; n8n polling self-recovers next poll if hash wasn't written
- Adds a second moving part in Airtable's UI

**Verdict:** stick with n8n polling. The latency doesn't matter for your manual-validate-then-bulk-run workflow, and hash-based detection is more debuggable than "lost webhook = lost events." Flip only if Ellie or downstream consumers complain about minute-scale latency.

---

## Operational runbook

### Add a new event column

1. Add the array-output column in Clay (e.g., `patent_filings`).
2. Map it into the existing Clay Send-to-Airtable sync as a new field on Companies (Long text).
3. Add a sibling `patent_filings_hash` field on Companies (Long text, hidden in operator views).
4. Add one entry to the n8n Code node `FIELD_MAP`:
   ```javascript
   patent_filings: {
     event_type: 'patent_filing',
     hash_field: 'patent_filings_hash',
     dedupe_key_path: (item) => item.patent_number || ''
   }
   ```
5. Publish the workflow (n8n creates a new draft on update).

Total: ~5 minutes. No new table, no new automation, no new webhook.

### Debug a failed sync

1. Open the Sync Errors table in Airtable. Filter by `company_record_id` or `field_name`.
2. The `raw_input` (truncated to 500 chars) tells you the shape that broke.
3. Fix the parser in the n8n Code node OR ask Clay to re-emit clean data.
4. To re-trigger: clear the relevant `<field>_hash` on the Companies row. The next poll picks it up and re-runs that field only.
5. If the n8n execution itself failed (not just one field), check n8n execution history.

### Reprocess a record

- Single record: clear the relevant `<field>_hash` on Companies. Wait one poll cycle.
- All records, one field: bulk-clear that hash column in Airtable grid view. n8n processes in the next poll batch (watch Airtable rate limits — 5 req/sec/base).
- All records, all fields: clear all five hash columns. Same caveat.

---

## Build order

1. **Add the 5 JSON fields + 5 hash fields + LastModified field on Companies.** Hide hash fields in operator views.
2. **Build the Sync Errors table** in Airtable: timestamp, company_record_id, field_name, event_type, error_message, raw_input.
3. **Confirm the Company Events table schema** matches the universal contract (9 fields, `dedupe_composite_key` as primary).
4. **Build the n8n workflow** with the 5-node sequence above. Set poll interval to `everyMinute`. Configure Airtable PAT credential with base-scoped write access.
5. **Test with one Clay row.** Run the wet-lab AI column on Piramal. Wait for Clay to sync the JSON field to Airtable. Verify the n8n trigger fires within 60-120s and creates 4 Company Events rows.
6. **Re-run the same Clay column.** Confirm no new Company Events rows are created (dedupe works) AND the n8n execution either skips entirely (hash match) or runs and finds nothing to insert.
7. **Manually edit an unrelated Companies field** (e.g., notes). Confirm the trigger fires but the Code node skips all 5 JSON fields via hash match. Watch the execution log to verify.
8. **Add the second JSON field** (jobs) to prove the FIELD_MAP scales. Same field, different event_type, different dedupe_key_path.
9. **Then the remaining three** (press, trials, conferences).
10. **Backfill existing rows** with a one-shot workflow that reads all Companies rows and processes them, or touch each row's LastModified to trigger the standing workflow.

---

## Latency is fine for this use case

You're doing manual classifier validation now, then a one-time bulk run on 400 rows. The poll interval (60-120s) is a non-issue. If the use case changes later (say, real-time outreach triggering off of new press mentions), revisit and consider the Airtable-automation-fires-webhook alternative.

---

## Cost / migration

Neither design is built yet. Migration cost is zero — you're picking between two unbuilt designs. The Airtable-triggered version takes the same effort as the webhook version to build initially; the savings are downstream (every new column is 5 min instead of 15).
