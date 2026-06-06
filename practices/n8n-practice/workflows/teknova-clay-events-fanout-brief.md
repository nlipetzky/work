# Build Brief: Teknova Clay → Airtable Events Fan-Out

**Status:** Ready to build. Design locked.
**Owner:** n8n-practice operator
**Source design:** /Users/nplmini/code/work/accounts/clients/teknova/artifacts/n8n-airtable-triggered-fanout-design.md (read first; do not re-derive)
**Superseded:** /Users/nplmini/code/work/accounts/clients/teknova/artifacts/n8n-clay-airtable-fanout-design.md (webhook-based — do NOT build)
**Client context:** /Users/nplmini/code/work/accounts/clients/teknova/CLAUDE.md and STATE.md

---

## What you're building

ONE n8n workflow that watches the Teknova Airtable `Companies` table for changes and fans out per-field JSON arrays into a child `Company Events` table. Replaces the per-event Airtable-scripting approach Clay support suggested. Generic by design: every new JSON-array column added to Clay becomes one new entry in a `FIELD_MAP` config inside a single Code node.

End state: an operator drops a new JSON-array column into the Clay → Airtable sync, adds a sibling `<name>_hash` field on `Companies`, adds one row to the Code node `FIELD_MAP`. Total ~5 min per new event type. No new workflow, no new webhook, no new Airtable automation.

---

## Architecture (from source design — do not modify without flagging back)

Five-node sequence:

1. **Airtable Trigger** — polls `Companies` table, `triggerField = LastModified`, `pollTimes = everyMinute`
2. **Code (Fan out changed JSON fields)** — `runOnceForAllItems`, JavaScript. Iterates `FIELD_MAP`, hashes each JSON field with SHA256, compares to stored hash, parses changed arrays, emits items tagged `_kind = "event" | "hash_update" | "sync_error"`. Each field wrapped in its own try/catch.
3. **Switch** — routes by `_kind` to three downstream branches
4. **Airtable Upsert** — `Company Events` table, `matchingColumns: ["dedupe_composite_key"]`, `typecast: true`, `onError: continueRegularOutput`, retry 3x w/ 2s backoff
5. **Airtable Update** — writes new hashes back to `Companies` row. **Must run downstream of upsert success, not in parallel.** Use Merge node to gate.

A fourth branch (Airtable Create on `Sync Errors` table) catches per-field parse failures.

---

## Inputs needed from Nick before you start

Open ask list. Don't guess these — confirm in chat.

1. **Airtable base ID and table IDs:**
   - Companies table ID (in Teknova RevOps Surface base `appYBYH3aOHhTODAw`, table `tblnj3YlOI3thjrXp` per recent session)
   - Company Events table ID (does not exist yet — needs to be created per the schema in the source design)
   - Sync Errors table ID (does not exist yet — schema also in source design)
2. **Confirmation that the five JSON fields exist on Companies** (or commitment to add them via Clay sync mapping):
   - `wet_lab_sites_json`, `job_openings_json`, `press_mentions_json`, `clinical_trials_json`, `conference_appearances_json`
3. **Confirmation that the five hash fields exist on Companies** (Long text, hidden in operator views):
   - `wet_lab_sites_hash`, `job_openings_hash`, `press_mentions_hash`, `clinical_trials_hash`, `conference_appearances_hash`
4. **LastModified field on Companies** — must be a Last Modified Time field that updates on changes to the JSON columns (and ideally only those, to suppress trigger noise from unrelated edits)
5. **n8n Airtable PAT credential** — must have `data.records:read` and `data.records:write` on Teknova RevOps Surface base. Wider scope than the existing Salesforce-enrichment workflow's credential.
6. **n8n execution mode confirmation** — queue mode is required for self-hosted at scale. Confirm Nick's instance is queue, not main, before sizing batches.

---

## FIELD_MAP starting config (paste into Code node)

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

Full Code node body (validate + hash + try/catch per field + emit) is in the workflow output cached at /private/tmp/claude-501/-Users-nplmini-code-work-accounts-clients-teknova/6f60d216-99c9-42ba-b13c-415e98ccc318/tasks/wboc97md1.output. Adapt to project conventions; do not paste verbatim without reading.

---

## Non-obvious gotchas you MUST engineer for

These are not style preferences. Skipping any of them breaks the design.

1. **Hash write-back ordering.** Hashes must be written AFTER the Airtable upsert succeeds, NEVER in parallel. Parallel wiring + a failed upsert = silently lost events. Use Merge node downstream of the upsert success output to gate.
2. **Per-field try/catch in the Code node.** One malformed JSON field must not skip the other four on the same row. Iterate FIELD_MAP with for-of, each field's parse/explode wrapped in its own try.
3. **Hash update conditional on per-field success.** If wet_lab_sites parses cleanly but job_openings throws, write `wet_lab_sites_hash` only — leave `job_openings_hash` untouched so the next poll retries.
4. **Trigger storms.** Clay bulk-sync of 400 rows = single n8n execution processing up to 2000 array elements. Add a `Loop Over Items` + `Wait` to throttle Airtable upserts to under 5 req/sec/base.
5. **Backfill is manual.** Airtable Trigger only fires on records modified AFTER the trigger started. Touch every existing row's LastModified, OR build a one-shot backfill workflow.
6. **`additionalFields.fields` allow-list MUST include all 10 fields** (5 JSON + 5 hash) plus `record_id` and `company_name`. Missing a field means the Code node can't read it.
7. **Linked record field on Company Events.** `company_link` must be wrapped: `={{ [$json.record_id] }}`. Set `options.typecast: true` on the upsert node.
8. **`matchingColumns` must reference a column that's also in `value`.** If `dedupe_composite_key` is in `matchingColumns` but not in the value map, n8n silently does INSERT instead of UPSERT.
9. **Code node return shape.** `runOnceForAllItems` must return an array of `{json: {...}}` objects. Returning a flat array of values or a single object breaks downstream iteration.
10. **Project memory rule.** This workflow has no webhook node, so the no-touch-webhook rule does not apply here. But if you ever add one, the rule reactivates.

---

## Acceptance criteria

The build is done when ALL of these are true:

- [ ] Workflow created in n8n, validated via `n8n_validate_workflow`, test-executed cleanly via `n8n_test_workflow` against a single test Companies row
- [ ] Piramal Pharma Solutions test: Clay's NA Wet-Lab Sites column has already populated `wet_lab_sites_json` with 4 sites. Trigger fires within 120s of a LastModified bump. 4 rows appear in Company Events with correct composite keys.
- [ ] Re-run test: bump Piramal's LastModified again with no JSON change. Code node executes, all five fields skip via hash match, zero new upserts, zero hash writes.
- [ ] Unrelated-edit test: change Piramal's `company_name` only. Trigger fires, Code node skips all 5 JSON fields via hash match, zero new upserts.
- [ ] Dedupe test: clear `wet_lab_sites_hash` on Piramal. Re-trigger. 4 upserts run, no new rows created in Company Events (matching key collides), `last_updated_at` on existing rows updates.
- [ ] Failure-isolation test: inject malformed JSON into one field on one row (e.g., `job_openings_json = "{not json"`). Trigger fires. The other 4 fields process normally. A `Sync Errors` row is created with the bad input truncated to 500 chars. The bad field's hash is NOT updated; next trigger retries.
- [ ] Second-column test: add `job_openings_json` flow to FIELD_MAP. Run on FUJIFILM Biotechnologies (has 10 NA bench postings). 10 rows appear in Company Events with `event_type = job_opening`.
- [ ] Workflow published. Polling active. Nick can run any Clay column and see events land in Airtable within 2 minutes.

---

## Out of scope

- The Clay column setup (Nick + the Teknova engagement own this side)
- The Companies-side AI classifier prompt (already locked, validated on 4 rows)
- The `NA Wet-Lab Sites (AI Research)` Clay column itself (already built, validated)
- The contact-sourcing table and downstream contact gates (Phase 2 work — separate brief when ready)

---

## Open questions to surface back

If any of these aren't already resolved by the time you start, flag back to Nick before building:

1. Is the n8n instance running in queue mode? If main mode, trigger storms will time out.
2. Does the existing Teknova RevOps Surface PAT have the scope to write to Companies + Company Events + Sync Errors, or does a new PAT need to be issued?
3. Should the LastModified field on Companies watch only the 5 JSON fields, or all fields? Watching only the 5 reduces trigger noise but means a manual hash-clear can't re-trigger (because clearing the hash doesn't bump LastModified). Watching all fields means more trigger fires but the hash-match short-circuit makes them cheap.
4. Where does the `Company Events` table live — same base as Companies, or separate base for child-event data? (Affects rate limit math; same-base means all upserts share the 5 req/sec/base limit.)

---

## Related files

- Source design (read first): /Users/nplmini/code/work/accounts/clients/teknova/artifacts/n8n-airtable-triggered-fanout-design.md
- Superseded webhook design (do not build): /Users/nplmini/code/work/accounts/clients/teknova/artifacts/n8n-clay-airtable-fanout-design.md
- Workflow research output (full Code node body): /private/tmp/claude-501/-Users-nplmini-code-work-accounts-clients-teknova/6f60d216-99c9-42ba-b13c-415e98ccc318/tasks/wboc97md1.output
- Teknova operations inventory: /Users/nplmini/code/work/accounts/clients/teknova/artifacts/teknova-operations-inventory.md (update after this workflow is live)
- Teknova client CLAUDE.md: /Users/nplmini/code/work/accounts/clients/teknova/CLAUDE.md
- Teknova STATE.md: /Users/nplmini/code/work/accounts/clients/teknova/STATE.md
