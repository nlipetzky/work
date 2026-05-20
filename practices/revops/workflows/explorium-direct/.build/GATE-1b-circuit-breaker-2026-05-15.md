# GATE 1b pre-write circuit breaker — REV 2 (for agentic-systems review, NOT deployed)

**Date:** 2026-05-15
**Target:** L2 Classify `rXKuqfDwqX7TYzxK` (version 198ccfb4)
**Status:** REV 2 — shared-mechanism blind-spot closed. DESIGN + CODE + SANDBOX-PROVEN. Not wired, not deployed. Awaiting agentic-systems clearance.
**Rev-2 change:** `Count Live Companies` is now an HTTP Request node hitting Airtable REST directly with its own offset-pagination loop — a different code path from the Airtable v2.2 search node, same `may 26 all bases` token. Closes the circularity agentic-systems flagged.

## Topology delta (unchanged from rev 1)

```
List All Companies -> Count Live Companies (HTTP, executeOnce) -> Gate 1b Breaker (Code) -> Re-queue Batches
```
Fail-closed placement before the first PATCH (`Reset + Clear Stale`) is unchanged and was ACCEPTED.

## New node A — `Count Live Companies` (HTTP Request, v4.2)

- `method: GET`
- `url: https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp`
- `authentication: predefinedCredentialType`, `nodeCredentialType: airtableTokenApi`, credential `may 26 all bases` (Nick UI attach, same as the 7 PATCH nodes)
- `sendQuery: true`, query params: `pageSize=100`, `fields[]=Company Name` (single tiny field — minimizes payload; Airtable returns `id` regardless)
- **Pagination** (the node's own offset loop, different code path from the v2.2 node):
  - `paginationMode: updateAParameterInEachRequest`
  - parameter: type `qs`, name `offset`, value `={{ $response.body.offset }}`
  - `paginationCompleteWhen: other`, `completeExpression: ={{ $response.body.offset === undefined }}`
  - `limitPagesFetched: false`
- `executeOnce: true` (fed the List items; must call once, not per-item)
- Output shape: one item per page; each `item.json` = an Airtable list-records body `{ records: [...], offset?: ... }`.

## Flagged deviation from the prescribed mechanic — needs an agentic-systems call

The instruction said the node should "emit the true total as an integer" and
the breaker read `$('Count Live Companies').first().json.total`. A bare HTTP
Request node **cannot** do that: the Airtable REST list endpoint has no count
field and returns `{records,offset}` per page. The total only exists once the
paginated pages are summed. With "same token, different code path, no third
party" as the explicit ceiling (no extra reducer node, no out-of-band source),
the only place the sum can live is the breaker. So the breaker computes `live`
by summing `records.length` across the HTTP node's paginated page-items,
instead of reading a `.total` scalar that the HTTP node structurally cannot
produce. Substance is identical (independent REST count vs List count); only
the read mechanic differs from the literal instruction. Calling it out for
explicit confirmation rather than silently substituting.

## New node B — `Gate 1b Breaker` (Code, v2, runOnceForAllItems) — REV 2

FULL replacement code block (entire jsCode for the node):

```javascript
const emitted = $('List All Companies').all().length;

// Count Live Companies = HTTP Request node, Airtable REST, own offset
// pagination. Emits one item per page; each item.json is an Airtable
// list-records body. Different code path from the v2.2 search node ->
// a shared-mechanism cap can no longer pass this gate silently.
const pages = $('Count Live Companies').all();
let live = 0;
let sawRecordsArray = false;
for (const p of pages) {
  const body = (p && p.json) ? p.json : {};
  if (Array.isArray(body.records)) { live += body.records.length; sawRecordsArray = true; }
}

if (!sawRecordsArray) {
  throw new Error('GATE 1b ABORT: Count Live Companies returned no parseable Airtable pages (auth/parse failure). Hard stop before any PATCH.');
}
if (!Number.isInteger(live) || live <= 0) {
  throw new Error('GATE 1b ABORT: independent live Companies count invalid (' + live + '). Hard stop before any PATCH.');
}
if (!Number.isInteger(emitted) || emitted <= 0) {
  throw new Error('GATE 1b ABORT: List All Companies emitted invalid count (' + emitted + '). Hard stop before any PATCH.');
}
if (emitted !== live) {
  throw new Error('GATE 1b ABORT: List All Companies emitted ' + emitted + ' but independent Airtable REST count is ' + live + '. Mismatch -> hard stop before any PATCH.');
}

return $('List All Companies').all();
```

Throw -> workflow errors -> `Re-queue Batches` never runs -> `Reset + Clear
Stale` (first PATCH) never fires. Fail-closed. On exact match, returns the
original `List All Companies` items so re-queue behaviour is unchanged.

## Sandbox proof — REV 2 comparison, same case matrix (2026-05-15)

| Case | emitted | REST pages → live | Result |
|---|---|---|---|
| Nominal | 631 | 100×6+31 = 631 | PASS — forwards 631 |
| ~576 regression | 631 | 576 | THROW — zero PATCH |
| **List capped 100, REST 631 (the blind spot)** | 100 | 631 | **THROW — now caught** |
| REST no records array (auth/parse fail) | 631 | — | THROW — zero PATCH |
| REST total 0 | 631 | 0 | THROW — zero PATCH |
| List empty | 0 | 631 | THROW — zero PATCH |
| Count legitimately changed | 584 | 584 | PASS — forwards 584 |

The blind-spot case (List shares-mechanism caps at 100 while true total is
631) now THROWS because the REST path does not share the v2.2 returnAll
mechanism. Circularity closed.

## Not done (per instruction)

No wiring, no `update_workflow`, no publish, no smoke, no full run, no spend.
Revised Count-node config + updated breaker block + proof go to
agentic-systems first, including the flagged `.total`-mechanic deviation
for explicit confirmation.
