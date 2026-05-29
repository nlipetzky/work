# Canon Engine ... legacy project assessment (2026-05-26)

**Supabase project:** `canon_engine` (`mzzjvoiwughcnmmqzbxv`), us-east-2, created 2026-03-17, ACTIVE_HEALTHY.

**Verdict:** Repurpose. Do not tear down.

## What it does today

A multi-source knowledge layer with live ingestion, embeddings, full-text search, and lineage primitives. The pipeline runs on Voyage AI for embeddings.

**Active sources (ingestion running today, 2026-05-26):**
- Email: 1,192 embedded + 119 failed (latest ingestion 20:00 UTC today)
- Transcripts: 21 embedded (latest 18:00 UTC today)
- Email messages corpus: 1,983 rows, latest 22:44 UTC today
- 6,042 chunks total, latest 22:44 UTC today

**Stale sources:**
- Drive documents: 29 embedded, last activity 2026-04-14 (6 weeks dormant)
- canon_docs (governance corpus): 151 rows, last update 2026-04-17 (5 weeks dormant). All from a one-time `etl-import` source (145 rows) plus 6 ui-edits. Comment on the table: "Replaces the local Obsidian vault."

**Account scoping (existing, partial):**
- konstellationai: 724 transcript chunks + 240 email + 9 doc
- teknova: 102 canon + 48 email + 36 doc
- instig8: 45 canon + 47 doc + 10 email
- mms: 10 canon
- miller-mechanical: 5 doc
- **3,967 email chunks with NULL account_name** (unattributed)

**Clusters:** All 7 are smoke-test / SDK test from 2026-05-05. Three already archived. Concept exists, never used in production.

## What's architecturally right (keep)

- **Multi-source ingestion model** ... source_type discriminator across email, transcript, document, canon. Matches what Canon System needs.
- **Pipeline tracking on `ingestion_manifest`** ... received_at → enriched_at → chunked_at → embedded_at lifecycle states with failure recording. Exactly the asset-lifecycle pattern.
- **Chunking + embeddings layer (`chunks`)** ... rich metadata (account_name, meeting_date, participants, speakers, from_address, subject, direction, document_path, tags). Hybrid retrieval (vector + tsvector) ready.
- **Lineage primitives on `canon_docs`** ... `supersedes_id` and `superseded_by_id` columns. This is the artifact version graph we'd otherwise have to design.
- **Event log (`canon_events`)** ... 1,994 events with payload jsonb + correlation_id. Audit trail for processing.
- **Per-source state tracking** ... `canon_document_state`, `canon_email_state`, `canon_transcript_state` track what's been processed.
- **Full-text search on canon_docs** ... `search_tsv` column ready.

## What's broken or thin

1. **canon_docs is a frozen snapshot.** One-time ETL import 5 weeks ago. Not synced from anything live. If governance docs evolved (which they have ... this whole session produced new ones), Canon doesn't know.
2. **Drive ingestion stopped.** Document source died 2026-04-14. Either restore or replace.
3. **3,967 email chunks unattributed** to account. Re-attribution job needed (from_address / to_address → account mapping).
4. **119 emails failing** to embed. Need triage and retry.
5. **No artifact concept.** canon_docs is the closest thing but it doesn't model the artifact discipline (no explicit version field, no approval signature, no engagement linkage, no engine-binding metadata beyond jsonb).
6. **Clusters never used.** 7 smoke-test rows, several archived. Concept exists in the schema, no production use.

## How it maps to the Canon System role we just defined

| Canon System job | canon_engine status |
|---|---|
| Index artifacts (semantic + metadata) | Has chunking + embeddings + tsvector. Missing: artifact source type. |
| Serve retrieval queries | Has query_cache table (empty). Needs query API. |
| Track lineage between artifacts | Has supersedes_id/superseded_by_id on canon_docs. Needs graph extension for cross-artifact dependencies. |
| Cross-artifact consistency checks | Not present. New work. |
| Historical snapshots | Implicit via canon_events + supersedes chain. Needs query surface. |
| Cross-engagement knowledge transfer | Partial via account_name on chunks. Needs cross-account query patterns. |
| Context bundles served to engines | Not present. New work. |

The bones are right. The work is filling gaps, not redesigning.

## Recommended work to make it Canon v1

1. **Re-attribute orphaned email chunks** (3,967 rows). Address → account mapping via existing engagement directories.
2. **Triage failed email batch** (119 rows). Likely fix once, retry, move on.
3. **Add artifact ingestion source.** New `source_type = 'artifact'` row in ingestion_manifest model. Source path = filesystem path under ventures/, clients/, practices/. Trigger: git commit, filesystem watcher, or manual sync command.
4. **Extend canon_docs (or create canon_artifacts).** Explicit columns for version, approval_date, approver, engagement, engine_bindings (jsonb). Right now it's all in metadata jsonb.
5. **Decide Drive sync future.** Either restore the document source or accept that on-disk artifacts under engagement folders replace it. Lean: replace.
6. **Build query interface.** Hybrid retrieval (vector + tsvector + metadata) exposed as MCP tool or REST endpoint. Consuming engines (GTM, RevOps, future) call this when they need context.
7. **Clean smoke-test clusters.** Delete the 7 test cluster rows. Repurpose the clusters concept later if a real grouping use case emerges.
8. **Register as Asset under Canon System (`recggwUTDke8Y7UMe`).** Asset type: Supabase project. External ID: `mzzjvoiwughcnmmqzbxv`. Lifecycle: running. Notes: legacy pipeline being repurposed.

## What to tear down

- The 7 smoke-test clusters (no risk).
- The 119 failed email batch (after triage; retry or accept loss).

Nothing structural. The schema, the embeddings, the event log, the email/transcript live ingestion ... all earn their keep.
