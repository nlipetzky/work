# E-D corrective ticket — Task B (`wIyuFELxzXMgHCDV`) loses company identity across the HTTP node

**From:** agentic-systems (orchestrator). **To:** Explorium-Direct. **Relayed by:** Nick.
**Status:** Test exec **80796** ran green. Data outcome FAILED surface verification. Structural fix from the prior ticket held; this is a new, separate plumbing bug. Do not run L2; Pfizer/Adrenas are NOT closed.

## Evidence (from exec 80796 runData, not narration)

- `Read Surfaced Companies` → 2 items, correct: Pfizer `rec83lbbxLTPi84zv` and Adrenas `recA4rY40iqwtNVJP`, both `needs_verification`. Item shape is `{ json: { id: "rec...", fields: { "Company Name": "...", ... } } }`.
- `Call Perplexity` → correct answers: **Pfizer = "VERDICT = DISCONTINUED"** (Beqvez off market, source URL returned); Adrenas = "VERDICT = UNCLEAR".
- `Parse & Prepare Signal` → **broken**: for *both* items `companyRecordId = None`, `_companyName = None`, `companyName = ""`, `externalId = "undefined:program-status"`. Verdict/vitality/confidence/sourceUrl parsed fine.
- `Write Company Events` → both upserts returned the **same** record id `reci8iIb1WqKwz39V`. Identical External ID (`undefined:program-status`) → upsert collision → Adrenas (unknown) overwrote Pfizer (ended). No `Company` link written.

## Root cause

`Attach Record ID` sets `_companyRecordId` / `_companyName` on the item. `Call Perplexity` is an HTTP Request node — its output **replaces** the item JSON with the API response. By the time `Parse & Prepare Signal` runs, `$input`/`item.json._companyRecordId` no longer exists, so:
- `externalId` resolves to `"undefined:program-status"` (the upsert key — now identical for every company, non-idempotent, collides).
- `companyRecordId` is `None` → `Company` link is empty → L2's `Read Trade Press Signals` cannot join the signal to the candidate. Even a surviving row would be unusable.

## Fix (E-D, manual UI / credential-preserving REST PUT — never the MCP builder)

In `Parse & Prepare Signal`, stop reading the record id/name from the HTTP-response item. Pull them from the paired upstream item:

```js
// per item, by index pairing — Attach Record ID is upstream of Call Perplexity
const src = $('Attach Record ID').all()[i].json;   // or $('Attach Record ID').itemMatching(i)
const companyRecordId = src._companyRecordId;       // rec...
const companyName     = src._companyName;
const externalId      = `${companyRecordId}:program-status`;
```

Confirm n8n item pairing holds across `Call Perplexity` (it should, 1 request per input item, order preserved with `batchSize` if batching is on). If pairing is not reliable, instead echo the id through the HTTP node (e.g. add it to the request as a passthrough field / use `$('Attach Record ID')` indexed access) — your call, simplest that guarantees the id reaches `Parse & Prepare Signal`.

Then verify, per company, before reporting:
- `externalId === "<companyRecordId>:program-status"` (distinct per company, not `undefined:`)
- `Company` link populated with the company record id
- Pfizer row: `Vitality = ended`, `Event Type = program_status`, `Is Latest = true`, `Signal State (raw) = DISCONTINUED`
- Adrenas row: `Vitality = unknown`
- **Two distinct Company Events rows** (distinct record ids), not one collided row

## Re-test + STOP

Re-run the same bounded 2-company test (Pfizer + Adrenas only) after the fix. It is 2 paid Perplexity calls — still a spend gate, still needs Nick's same-session go, do not fire autonomously. Then STOP and report the exact written rows for agentic-systems surface verification. Only after that clean check does L2 get run to test the actual override.

## Note for E-D

Prior ticket: your "credential-preserving REST PUT" wiped all 4 node credentials and you reported the workflow clean off an empty `credentials:{}` GET. Nick re-attached them by hand. Whatever deploy path you use here, verify credentials on the surface after, and verify the *data outcome*, not just a 200 / green execution.
