# RevOps Architecture Spec

**Status:** Locked 2026-05-21. Source of truth for all RevOps engine work going forward.
**Authors:** Nick + Boris.
**Supersedes:** Any prior ad-hoc decisions in handoff files that conflict with this spec.

## Purpose

Define the boundary, responsibilities, and data flow between the multi-tenant RevOps Surface and any client-facing base. Establish the layer model that all future workflows must fit inside. Prevent the Frankenstein-schema and moonshot-workflow patterns that have been recurring problems.

## Operating principles

1. **Tenant-agnostic schemas at the hub. Tenant-specific schemas at the edge.** The Surface holds one canonical structure for every client. Client bases hold whatever per-client taxonomy and reviewer surface the engagement needs.
2. **Value-added, not data-forwarded.** What lands in a client base is already curated, translated, and ready to act on. Raw event payloads stay in the Surface.
3. **Dumb pipes, smart endpoints.** Movement between bases is a single reusable workflow that does no computation. All transformation happens upstream (Surface side) or downstream (client side).
4. **One job per workflow.** A workflow that captures data does not classify. A workflow that classifies does not translate. A workflow that moves does not transform. A workflow that filters on arrival does not write back to Surface.
5. **Never delete reviewer state.** Once a client touches a record, scope changes are expressed as a status update (`removed from scope`), never a deletion.

## Four-layer model

```
+----------------------+    +-----------------------------+    +--------+    +--------------------+
|   Source layer       |    |   Surface layer             |    | Mover  |    |   Client layer     |
|   (tenant-agnostic)  | -> |   (tenant-agnostic schema + | -> | (dumb  | -> |   (tenant-specific)|
|                      |    |    per-client stamps)       |    |  pipe) |    |                    |
+----------------------+    +-----------------------------+    +--------+    +--------------------+
```

### Layer 1: Source

Capture workflows that fetch and normalize external data. Tenant-agnostic. Write to Surface only.

Examples: CT.gov capture, PubMed capture, Explorium enrichment, future press / funding / patent captures.

Responsibilities:
- Fetch from external systems.
- Normalize to Surface schema.
- Upsert into Surface tables.
- Tag provider metadata (`Provider`, `External ID`, `Detected At`).

Out of scope: classification, translation, client awareness.

### Layer 2: Surface

The RevOps Surface Airtable base (`appYBYH3aOHhTODAw`). Single hub for all clients.

#### Canonical tables (tenant-agnostic schema)

- **Companies** (`tblnj3YlOI3thjrXp`). Firmographics, Explorium fields, web data. ~265 columns.
- **Contacts** (`tblWJksRL1yKSUgrm`). People records with title, email, role data.
- **Company Events** (`tblnzX2b2kqNGzW6r`). Raw event records: clinical trials, publications, press, funding, patents. One row per (company, external event).
- **Contact Events**. Same pattern for contact-level events.
- **Signal Drafts** (new). Curated, end-user-facing translations of Company Events, ready to ship to client bases. See schema below.

#### Per-client stamps

Each client adds a small set of columns to Companies (and to Contacts if contacts are in scope for that client). These are the *only* per-client columns on the canonical tables.

Pattern: `<Client> <Play> Ready` (boolean) and `<Client> <Play> Match Reason` (long text). One pair per play, per client.

Example for Teknova's AAV gene therapy play:
- `Teknova AAV Ready` (boolean)
- `Teknova AAV Match Reason` (long text, written by the classifier)

When Teknova adds an oncology play later:
- `Teknova Oncology Ready`
- `Teknova Oncology Match Reason`

Per-play columns scale linearly and stay discoverable. Multi-select alternatives are rejected because they hide intent and make per-play landing filters harder to write.

#### Per-client classifier workflows

Per-client/per-play classifier workflows run inside the Surface. They read canonical data, apply client-specific judgment, and write back only to the per-client stamp columns. They do not modify canonical schema or canonical data.

Example: the existing AAV scanner becomes the Teknova AAV classifier. It rolls event-level AAV verdicts up to the `Teknova AAV Ready` stamp on the Company row.

#### Signal Drafts table

New table in Surface. Holds translated, end-user-ready signal content for any (event, play) pair.

Schema:

| Field | Type | Notes |
|---|---|---|
| Signal Draft Key | singleLineText | **Primary field.** Format `{eventRecordId}::{play}`. Writeable text so it can be used as the n8n `matchingColumns` for upsert. |
| Surface Event ID | singleLineText | Denormalized copy of source event record ID. Idempotency check and filter convenience. |
| Company Event | link → Company Events | Source event. |
| Company | link → Companies | Denormalized for filtering. |
| Play | singleSelect | `teknova-aav`, future plays added as needed. |
| Translated Headline | singleLineText | One-line summary written for the end user. |
| Translated Body | multilineText | Curated narrative. Why this matters to this client, in plain language. Long Text, not Rich Text. |
| Signal Quality | singleSelect | Translator-assigned verdict. Options: `strong`, `weak`. The mover gates on `strong` to ship to the client base. `weak` drafts stay in Surface for tracking but never reach the client. |
| Translated At | dateTime | Last translation run timestamp. |
| Translator Version | singleLineText | Prompt/model version, for tracking re-translation cohorts. Format `<play>/<version>`, e.g. `teknova-aav/v1`. |
| Ready To Ship | checkbox | Set true when translator JSON parses and both headline and body are non-empty. |
| Shipped At | dateTime | Set by mover after successful upsert into client base. Null until then. |
| Translator Error | multilineText | Populated only when translator JSON parse fails. |
| Raw Response | multilineText | Raw AI output, kept for debugging. Optional but cheap. |

One row per (event, play). Translator workflows upsert here, keyed on `Signal Draft Key`.

A polymorphic version covering Contact Events can be added later as a sibling `Contact Signal Drafts` table if/when contact-level signals are in scope. Keeping Company and Contact drafts separate avoids Airtable's polymorphic-link awkwardness.

### Layer 3: Mover (boundary)

One reusable n8n workflow, configured per (source table, destination table, filter column, field map) tuple. No computation. No client semantics. No event translation.

Responsibilities:
- Search source table filtered on the configured stamp column.
- Map fields per the configured field map.
- Upsert to destination table using the configured match key.
- Track `Shipped At` on Signal Drafts (and equivalent on Companies) after successful upsert.

For the Signal Drafts → client Signals leg specifically: the mover filters on `Ready To Ship = true AND Signal Quality = strong`. Drafts marked `weak` stay in Surface and never ship. This keeps the client base free of low-value rows without losing the historical record of what was considered.

Out of scope: any conditional logic that varies per client, any field computation, any LLM calls. The mover gates on existing fields; it does not assign quality verdicts itself.

Stable match keys:
- Companies: `Website Domain` at the boundary. Surface `Record ID` stored in client base as `Surface Company ID` for clean re-upserts and traceability.
- Signals: `Signal Draft Key` carried through to the client base as `Surface Signal Key`.

For each (source, destination) pair, two mover configurations exist: one for Companies, one for Signals. Same workflow, different config.

### Layer 4: Client base

The client's Airtable base (e.g., Teknova Outreach, `appFoLY6hjroyA2KW`). Holds tenant-specific schema and reviewer surface.

#### Tables

- **Companies**. Subset of Surface companies that were tagged ready for any of this client's plays. Plus client-specific taxonomy fields (modality, segment, AAV bucket, etc.) and reviewer-owned fields (verdict, bucket, note, reviewed-at).
- **Contacts**. Same pattern, when contacts are in scope.
- **Signals**. Curated event content, one row per landed Signal Draft. The action surface for the client.

#### Landing filter

Per-play workflow that runs when new records arrive in the client base. Knows which play the record came from (from the `Play` column on Signal Drafts or from a `Source Play` field carried by the mover). Applies play-specific labels and taxonomy.

Example for Teknova AAV: when a new Company row lands, the landing filter writes the modality, secondary modality, AAV segment, and any other AAV-play-specific labels. The same filter never runs on records from a different play.

The landing filter does not write back to Surface. It does not call LLMs. It applies deterministic per-play labels based on data already on the row.

#### Reviewer fields

Owned by the client. Never overwritten by movers or landing filters. Typical shape: a verdict singleSelect, a bucket singleSelect, a note multilineText, and a reviewed-at date. Field names are the client's choice and may include the reviewer's identity if the client wants. The architecture treats them as opaque writeable columns.

#### Removed-from-scope handling

When the Surface classifier flips a stamp from true to false, the mover does not delete from the client base. The mover writes `Scope Status = removed` (or equivalent) on the client row. The row, its taxonomy, and any reviewer state stay intact. Reviewer verdicts are sacred.

## Data flow, end to end

For one row, from external system to the client reviewer's screen:

1. Source workflow fetches a clinical trial from CT.gov, upserts a Company Event into Surface.
2. AAV scanner (per-event classifier) writes `AAV Verdict` and `Activity Status` on the Event row.
3. Per-play Company classifier (Teknova AAV) reads the rolled-up event verdicts, decides the Company qualifies, sets `Teknova AAV Ready = true` and writes a `Teknova AAV Match Reason`.
4. Translator workflow scans for Company Events linked to companies with `Teknova AAV Ready = true` that do not yet have a Signal Draft for play `teknova-aav`. Translates each into a Signal Draft row. Sets `Ready To Ship = true` when passing QA.
5. Mover (Companies config) finds companies with `Teknova AAV Ready = true` and no recent ship, upserts them into Teknova Outreach Companies. Carries `Source Play` metadata.
6. Landing filter on Teknova Outreach Companies applies AAV play taxonomy fields to the new arrivals.
7. Mover (Signals config) finds Signal Drafts with `Ready To Ship = true` and no `Shipped At`, upserts them into Teknova Outreach Signals.
8. The client reviewer reviews. Verdicts written to reviewer fields on the client base. Never propagated back to Surface.

## What this means for current state (Teknova AAV, 2026-05-21)

- The 16 fields already added to Teknova Outreach Companies stay. Some are play taxonomy (modality, segment), some are reviewer fields. They fit the new model unchanged.
- Anything in those 16 that was event-level computation (Best Evidence, Sample Intervention, AAV Event Sources) belongs in Signals, not Companies. Pull it.
- The current AAV scanner stays in Surface and keeps writing event-level verdicts. It becomes the engine of the per-play Company classifier.
- A new small workflow rolls event-level verdicts into the `Teknova AAV Ready` Company stamp.
- The current mover gets gutted. Rebuilt as the dumb pipe in Layer 3.
- A new translator workflow writes Signal Drafts.
- A new landing filter workflow runs on Teknova Outreach arrivals.

The migration plan is a separate document. This spec defines the target.

## What this spec forbids

- Adding per-client or per-play columns to Surface canonical tables beyond the stamp pair.
- Putting LLM calls or transformations inside the mover.
- Computing client-facing event narratives inside the client base.
- Deleting records from a client base based on Surface state changes.
- Building any new workflow that does more than one of: capture, classify, translate, move, label-on-landing.

## Open items, not blocking

- Contact Signal Drafts table: defer until contacts are in scope for the AAV play.
- Translator re-run policy when prompt/model versions change: track via `Translator Version` field, define cohort re-run trigger later.
- Mover idempotency window: define a "do not re-upsert if shipped within N hours" guard once we see real volume.
- Multi-play overlap: when a single company qualifies for two plays of the same client, decide whether to land one row with both `Source Play` tags or two separate runs. Defer until the case exists.

## File references

- Inventory of current state: `/Users/nplmini/code/work/practices/agentic-systems/INVENTORY-state-for-ellie-2026-05-21.md`
- Latest AAV Mover handoff: `/Users/nplmini/code/work/accounts/clients/teknova/HANDOFF-airtable-mover-aav-companies-state-2026-05-21.md`
- Original AAV Mover scope (pre-architecture): `/Users/nplmini/code/work/accounts/clients/teknova/HANDOFF-airtable-mover-aav-companies-2026-05-20.md`
- Companies Enrichment state: `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-companies-enrichment-domain-resolver-2026-05-20.md`
- RevOps engine quality pass: `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-revops-engine-quality-pass-2026-05-20.md`
- L1 Event Evidence (CT.gov) state: `/Users/nplmini/code/work/practices/revops/workflows/L1-event-evidence/HANDOFF-revops-to-agentic-systems-2026-05-21.md`
- PubMed capture state: `/Users/nplmini/code/work/practices/revops/workflows/HANDOFF-pubmed-capture-2026-05-21.md`
- Explorium fields capture state: `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/HANDOFF-capture-all-explorium-fields-2026-05-20.md`
