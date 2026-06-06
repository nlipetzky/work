# Decision: Universal Clay → Supabase → Airtable Router Pattern

**Status:** Direction agreed. Not yet built. Defer until proven across a second engagement.
**Date:** 2026-06-02
**Origin:** Building Teknova's Clay Events Fan-Out workflow (n8n `F1JB32W26ISDlXRY`). Spending a full day on one bespoke client table surfaced the question: is there a reusable pattern that makes the *next* client fast?
**Owner:** agentic-systems practice

---

## The problem being solved

Building a custom Airtable table + bespoke n8n fan-out + hardcoded field mapping for every client's every signal type is slow and non-reusable. One Teknova table took a full working day. The studio thesis is explicit: platforms own the generic workflows, client Systems exist only for genuinely bespoke needs. Per-client bespoke ETL violates that. We want a generic capture-and-route capability that turns each new need into a config change, not a build.

## The instinct that started this

"Have every Clay column output a JSON blob, land all blobs in one Airtable base, label them, and route each to the right client base." The instinct (reusable capture vs bespoke tables) is correct. Two specifics in the original framing were wrong, corrected below.

## Correction 1: The bottleneck is mappings, not tables

The time sink building Teknova was NOT creating the table (~20 min). It was:
- Discovering Clay wraps arrays in a parent object (`{sites:[...], verdict, confidence}`) rather than emitting a bare array.
- Discovering every n8n Airtable node (trigger, get, upsert) nests fields under `$json.fields`.
- Wiring conditional hash write-back so hashes only persist after a successful upsert.
- Defining which Clay key maps to which Airtable column, per event type.

A JSON-landing-base eliminates none of this. Something still has to know `nctId → External ID`, `phase → Trial Phase`, etc. The blob pattern relocates the mapping work; it does not delete it. **The real win is making each mapping a config row instead of a build cycle (new table + Code-node edit + new workflow wiring).** That is what makes client #2 fast.

## Correction 2: Raw blobs belong in Supabase, not Airtable

Studio principle (from MEMORY: "Operator surfaces are filtered"): operator-facing surfaces show only what the operator consumes; raw AI context lives upstream. A base full of raw JSON is upstream context and does not belong in Airtable, which is the clean operator surface.

Supabase (already running for Teknova) is the correct substrate:
- Real append target, no Airtable 5-req/sec/base ceiling.
- JSONB column for the raw payload.
- Native query + replay. When a mapping is later improved, history can be reprocessed.
- Airtable as a universal landing zone becomes a rate-limit chokepoint the moment more than one client flows through it.

Airtable stays as the clean, filtered, per-client *destination* surface only.

## Target architecture

```
Clay (universal envelope per row/item:
      client, event_type, source, dedupe_key, payload{...})
   |
   v
Supabase landing log  (durable, replayable, raw JSONB)
   |
   v
ONE generic router workflow (n8n, built once)
   - reads a mapping registry row for (client, event_type)
   - applies field_map to payload
   - resolves destination base/table
   |
   v
Destination Airtable base (clean, filtered, per-client operator surface)
```

### The mapping registry is the unlock

A config table (Supabase table, or n8n data table) where each row is one (client, event_type) → destination mapping. Example row:

```
client:      teknova
event_type:  clinical_trial
dest_base:   appYBYH3aOHhTODAw
dest_table:  tblnzX2b2kqNGzW6r
field_map:   {"nctId":"External ID","phase":"Trial Phase",
              "enrollmentCount":"Magnitude","overallStatus":"Signal State (raw)", ...}
```

- New event type for an existing client = add one row.
- New client = clone the rows, swap base/table IDs.
- The router workflow is built ONCE and never edited per client.

Teknova's existing `FIELD_MAP` (hardcoded in the fan-out Code node) already IS this registry, just inlined for one client. We are ~70% of the way to the generic shape; what remains is externalizing the map to data and writing a router that reads it.

## Universal envelope contract (draft)

Every Clay column, every client, emits the same shape so the router never special-cases the source:

```json
{
  "client": "teknova",
  "event_type": "clinical_trial",
  "source": "clay",
  "dedupe_key": "clinical_trial|<company_record_id>|<item_key>",
  "captured_at": "2026-06-02T22:00:00Z",
  "payload": { /* the raw item, event-type-specific keys */ }
}
```

`payload` stays event-type-specific (the router's field_map handles per-type keys). Everything outside `payload` is universal and lets the landing log and router stay generic.

## Honest cost / when to build

This does NOT make the current build faster. Envelope + Supabase log + generic router + registry is *more* work than the Teknova table was. It pays back on the third or fourth client, not the first.

Current evidence base: one engagement (Teknova). Studio rule (MEMORY / project CLAUDE.md): "automate only what has proven itself manually." One data point is not proof of a reusable pattern.

**Recommended sequencing:**
1. Run the next engagement semi-bespoke, deliberately logging which mappings and which Airtable/Clay quirks repeat.
2. Extract the router off TWO real examples, not one. This avoids baking Teknova-specific assumptions into a supposedly generic capability.
3. Then build the registry-driven router.

## Steal immediately, ahead of the full build

The durable landing log is worth pulling forward now, independent of the router. Today, when a transform botches, the raw Clay output is lost except for 500 truncated chars in the Sync Errors table. A Supabase landing log (even a single `clay_events_raw` table with a JSONB payload column, written by the existing fan-out before transformation) means improved mappings can reprocess history. Low cost, high optionality.

## Known quirks to carry into the router design

These bit during the Teknova build and any generic router must handle them:
1. **Clay wrapper format.** Clay AI columns often emit `{items_array, verdict, confidence, reasoning, stepsTaken}` rather than a bare array. The router/parser must extract the first array-of-objects when the top-level value is an object, and surface parent-level `confidence`/`verdict` as item fields.
2. **n8n Airtable `$json.fields` nesting.** Airtable nodes (trigger, get, upsert) in v2.2 return fields nested under `.fields`, not at top level. Normalize with `const fields = record.fields || record;`.
3. **Hash-gated write-back.** Per-field SHA256 stored on the parent row suppresses no-op reprocessing. Hashes must be written only after the destination upsert succeeds, gated, never in parallel.
4. **Composite dedupe key as the upsert match column.** Must be present in both the value map and `matchingColumns`, or n8n silently inserts instead of upserts.

## Cross-references

- Teknova build (reference implementation): n8n workflow `F1JB32W26ISDlXRY` "Clay Events Fan-Out"
- Source design: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/n8n-airtable-triggered-fanout-design.md`
- Clay output spec (per-event-type JSON contract): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/clay-json-spec-company-events.md`
- Studio principle: operator surfaces are filtered; raw AI context lives upstream (liaison layer / Supabase, never the operator surface).
