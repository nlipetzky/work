# Generic Clay -> Airtable Fan-Out via n8n

**Verdict: Yes, build one n8n workflow.** It handles every current and future Clay column that returns a JSON array, with marginal cost per new column dropping to ~10-15 minutes (one new Clay HTTP API column pointing at the same webhook, different `event_type` string).

The three alternatives (Clay-native Send Table Data, per-event Airtable scripts) both add a new persistent artifact (Clay child table OR Airtable automation) for every column you add. Maintenance burden grows linearly. n8n stays flat.

---

## The universal contract

Every Clay column posts the same payload shape to one webhook:

```json
{
  "company_record_id": "recXXXXXXXX",
  "event_type": "site" | "job" | "press" | "trial" | "conference",
  "dedupe_key": "evidenceUrl",
  "items": [ {...}, {...} ]
}
```

The webhook is the single integration surface. Clay column setup is the same every time: HTTP API column, POST to the webhook, body composed from `Name` / `Domain` / the array-output column / a hardcoded `event_type` string.

---

## The universal Airtable schema

One `Company Events` table replaces five bespoke ones.

| Field | Type | Role |
|---|---|---|
| `dedupe_composite_key` | Single line text | Primary upsert key: `<company_record_id>\|<event_type>\|<dedupe_key_value>`. Set as Airtable primary field. |
| `company_link` | Linked record (-> Companies) | Parent link. Always wrapped in an array on write; `typecast=true` required. |
| `event_type` | Single select | site / job / press / trial / conference / (future) |
| `title` | Long text | Normalized human label; nullable |
| `date` | Date (ISO-8601) | Nullable -- wet-lab sites have no date |
| `source_url` | URL | Canonical evidence link |
| `metadata` | Long text (JSON) | Full original item dumped as JSON string. **The schema-drift escape hatch -- any new Clay column's type-specific fields land here without a workflow change.** |
| `first_seen_at` | Created time | Auto |
| `last_updated_at` | Last modified time | Auto |

Per-column dedupe keys (computed Clay-side, passed in as `dedupe_key_value`):
- **Trial:** `nctId` (globally unique)
- **Job:** `url`
- **Press:** `link`
- **Conference:** composite `conferenceName + date + title`
- **Wet-lab site:** composite `city + state + siteType` (address is too noisy)

---

## The n8n workflow (5 nodes)

```
Webhook (Clay Events Inbound)
   |
   v
Code: Validate and Explode  (runOnceForAllItems)
   - validates required fields
   - maps title/date/source_url with fallbacks (title -> headline -> name, etc.)
   - normalizes dedupe_key_value (lowercase, strip trailing slash)
   - emits ONE n8n item per items[] element
   |
   v
Airtable: Upsert Company Event  (v2.2, resource=record, operation=upsert)
   - matchingColumns: ["dedupe_composite_key"]
   - typecast: true
   - onError: continueRegularOutput
   - retryOnFail: true, maxTries: 3, waitBetweenTries: 2000ms
   |
   v
Code: Aggregate Results  (success/fail counts + per-failure detail)
   |
   v
Respond to Webhook  (return JSON to Clay)
```

Skip `SplitInBatches`. The Airtable node iterates over input items natively. The Code node's `runOnceForAllItems` mode is the right fan-out point -- it returns one n8n item per `items[]` element, which the Airtable node then processes one-by-one.

---

## Scale assessment and required mitigations

**Worst case:** 400 companies x 5 event types x 10 items = 20,000 upserts in one bulk run.

**Airtable limit:** 5 requests/sec per base. 20,000 / 5 = 67 minutes single-threaded. Way past Clay's 30-60 second HTTP timeout.

**Required mitigations:**

1. **Clay chunks the payload.** 50-100 items per webhook call. Stays inside Clay's HTTP timeout. For 20K items total, Clay fires 200-400 webhook calls at its own pace.
2. **Clay HTTP API column concurrency = 1 or 2.** Prevents multiple parallel n8n executions hammering the same Airtable base from different angles (they all share the 5 req/sec limit).
3. **n8n in queue mode (self-hosted).** `EXECUTIONS_MODE=queue` + Redis. Default `main` mode serializes on one event loop and times out under concurrency. n8n Cloud Pro+ uses queue mode by default.
4. **Webhook auth via header token.** Default `authentication=none` means anyone with the URL can write to your Airtable. Use `headerAuth` with a long random token in n8n credentials; pass via Clay HTTP column header.

---

## Real gotchas (will bite if you ignore)

| Gotcha | Fix |
|---|---|
| Idempotency requires deterministic dedupe key | Normalize in Code node: `.trim().toLowerCase()`, strip trailing slash on URLs, strip query strings |
| Parallel n8n executions can both create the same record (no Airtable lock) | Clay concurrency = 1, or schedule a dedupe sweep |
| Failed items invisible to Clay (only aggregate counts) | Log per-failure rows to a `Sync Errors` Airtable table from the aggregator Code node |
| Nested objects in core fields write `[object Object]` | Add `typeof item.title !== 'string'` check in Code node |
| Clay webhook times out before Airtable finishes | Either chunk Clay-side, or switch to `responseMode='onReceived'` (fire-and-forget 202) and have Clay poll a status endpoint |
| Linked record field rejects bare strings | Wrap: `={{ [$json.company_record_id] }}` AND `options.typecast=true` |
| `matchingColumns` silently degrades to INSERT if it references a column not in the value map | Always include `dedupe_composite_key` in BOTH `matchingColumns` and the value object |
| Per project memory rule: never touch the webhook node on workflow updates | Any webhook config change goes through the n8n UI manually |

---

## Trade-off summary

|  | A: One n8n workflow | B: Clay Send Table Data | C: Per-event Airtable scripts |
|---|---|---|---|
| **Setup** | Medium (half day) | Low per column, x N | Medium per column |
| **Marginal cost per new column** | ~10-15 min | ~30-45 min | ~45-60 min |
| **Dedupe quality** | Strong, full control | OK, configured per sync | Manual JS every time, drift risk |
| **Bulk-run throughput** | Good if chunked | Good (Clay-native) | **Worst** -- 30s script cap + 50 automation runs/sec workspace limit causes silent drops |
| **Debuggability** | **Best** -- one execution log | Medium -- two surfaces | **Worst** -- truncated logs, no diffs |
| **Logic location** | Centralized | Distributed across N Clay tables | Distributed across N Airtable scripts |
| **Ongoing maintenance** | Low (one file) | Grows linearly | Grows linearly + drift |
| **Failure isolation** | Per-event branch good; workflow is single point | Excellent | Good per-script |

Architecture C is what Clay support recommended. It does not account for Airtable's 30-second script runtime cap and the workspace-level 50 automation runs/sec limit. At your bulk-run scale (400-row column updates), C will silently drop events.

---

## Build order

1. **Build the Airtable `Company Events` table** with the 9-column schema above. Set `dedupe_composite_key` as the primary field.
2. **Build the n8n workflow** with the 5-node sequence. Configure headerAuth credential.
3. **Test with a single Clay row.** Add an HTTP API column on the company table that POSTs the wet-lab sites array. Verify Piramal's 4 sites land as 4 Airtable rows with correct composite keys.
4. **Re-run the same column.** Confirm no duplicates created (upsert worked).
5. **Add a second Clay HTTP column** for jobs. Same webhook URL, different event_type. Verify it co-exists with the wet-lab rows in the same Airtable table.
6. **Then build the remaining three columns** (press, trials, conferences). Each is ~10-15 minutes.

---

## Migration paths (reversibility check)

This decision is reversible. If A stops fitting, switching costs:

- **A -> B (move into Clay):** ~1 day per 5 columns. No data migration; both write to the same Airtable.
- **A -> C (move into Airtable scripts):** ~2 hours per event type. Scripts can crib from the n8n Code node logic.
- **B -> A:** ~15 min per column. Trivial.
- **C -> A:** ~half day total. Scripts become reference material for the n8n Code node.

Pick A now. Switch later if needed.

---

## When the recommendation flips

- **Flip to B** if you decide the Clay workbook itself should be the canonical pipeline view (not Airtable) and you're willing to pay Clay credits for the exploded child-table rows.
- **Flip to C** if n8n becomes unavailable or you want to hand operational ownership to someone who lives in Airtable and has no n8n access.
- **Revisit A's throttling** if bulk-run volume jumps an order of magnitude (4k companies x 10 columns). Drop a Redis/BullMQ queue in front of the Airtable node.
- **Modularize A** if event types diverge significantly (different Airtable tables, very different field sets). Split into thin webhook + per-type sub-workflows via Execute Workflow. Still A, just modularized.
