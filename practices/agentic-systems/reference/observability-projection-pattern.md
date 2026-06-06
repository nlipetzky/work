# Observability Projection Pattern

**Status:** Canon. 2026-06-04. Authored by Nick + Boris.
**Supersedes:** Nothing. Net-new pattern doc. Complements `/Users/nplmini/code/work/practices/agentic-systems/reference/inngest-projection-pattern.md` (orchestration side) on the data side.

## Purpose

Define the data-layer shape that makes a pipeline legible. The orchestration runs the work; this projection makes it visible. Without it, you have records that move invisibly, gaps that accumulate unnoticed, duplicates that pile up, and runs that disappear into a job queue with no link back to the records they touched.

Audience: any operator extending the RevOps engine, the Canon-CRM feed, or any other system that writes derived state. If your system runs a function over records and you cannot answer "which run wrote that field?" in one click, you need this pattern.

## The four opinions

1. **Records ↔ runs cross-link.** Every record knows which runs touched it. Every run knows which records it produced. The join is a first-class table, not a query you remember to write.
2. **Per-field provenance.** Every enrichable column carries source, run_id, captured_at, and (for paid providers) cost attribution. Provenance lives next to the value, not on the row.
3. **Dedup surface as a primitive.** Duplicate pairs are a queue, not a vibe. Refreshed nightly, scored, with resolution tracked.
4. **Gaps as views.** "Missing email", "stale employer", "missing modality" are materialized views the pipeline reads from and the UI shows progress against. They are not queries operators write from memory.

Each opinion exists because the absence of it produces a specific failure mode we have already lived through. Records that move invisibly. Stale fields nobody knows are stale. Duplicate companies discovered weeks after they shipped to a client. Functions that run successfully but produce zero output, with no surface that flags it.

## Architecture

```
+----------------+      +----------------------+      +-----------------+
| Function run   | ---> | Record write         | ---> | Provenance       |
| (any backing   |      | (canonical column)   |      | (JSONB sidecar)  |
| system)        |      +----------------------+      +-----------------+
|                |              |
|                |              v
|                |      +----------------------+
|                | ---> | enrichment_runs row  | <----+
+----------------+      | (one per record      |      |
        |               |  touched per run)    |      |
        |               +----------------------+      |
        v                                             |
+----------------+                                    |
| Surface UI     | --- queries cross-join ----------- +
| (records,      |
| runs, dupes,   |
| gaps)          |
+----------------+
```

The projection has four parts: the canonical record (existing schema), the provenance sidecar (JSONB on the record), the runs join (one row per record-touched-by-a-run), and the surface that joins them all.

## Schema

### Provenance JSONB sidecar

Every record table that holds enriched fields carries a `field_provenance` JSONB column.

```sql
ALTER TABLE contacts
  ADD COLUMN field_provenance jsonb DEFAULT '{}'::jsonb;
```

Canonical shape per field:

```json
{
  "email": {
    "value": "rubab@fuego.io",
    "source": "prospeo_verified_email",
    "run_id": "uuid",
    "captured_at": "2026-06-04T21:18:42Z",
    "confidence": 0.95
  },
  "employer": {
    "value": "Fuego",
    "source": "explorium_match_business",
    "run_id": "uuid",
    "captured_at": "2026-05-21T10:00:00Z",
    "confidence": 0.88
  }
}
```

`value` duplicates the column. That is intentional. The column is the canonical value; the provenance carries the lineage. The UI reads both. Reading provenance is cheap (JSONB index on the source key).

`run_id` is nullable. Pre-projection writes (legacy entries) carry `"run_id": null`. The UI renders these as "legacy / pre-projection" in the source column. Backfill is optional, never required.

### Runs join (reality check 2026-06-04)

The records ↔ runs cross-link is **already provided** by `revops-engine-dev`, distributed across four tables at different granularities. The original plan called for a net-new `enrichment_runs` table; pre-migration inventory found the equivalent infrastructure was already in place.

| Table | Granularity | Use it for |
|---|---|---|
| `entity_activity_log` | per entity × activity (11.9M rows, 90d retention) | The universal join. Primary table the projection surface reads. |
| `enrichment_jobs` | per entity × provider call | Per-call cost (`actual_cost`), raw response, fields updated. |
| `enrichment_ledger` | per entity × recipe step (15K rows) | Step-level diff: `fields_before`, `fields_after`, `fields_changed`. |
| `enrichment_runs` | per list+recipe execution | Wave-runner audit, with `inngest_event_id` + `inngest_run_id` for backing-system trace. |

These columns are Inngest-named at the wave layer (not vendor-agnostic). **Pragmatic acceptance:** the runtime IS Inngest today. When the runtime changes, introduce a `backing_system` enum then. Premature abstraction now would require a coordinated rename across the functions that write to it.

**Cost lives at the call level** in `enrichment_jobs.actual_cost`. Per-field cost is computed in the UI by dividing across `enrichment_jobs.fields_updated`. Aggregations to wave-level land in `enrichment_runs.total_cost`.

The projection surface joins `entity_activity_log` (entity-side) ↔ `enrichment_jobs` / `enrichment_ledger` / `enrichment_runs` (run-side). No new join tables needed; the gap was visibility, not schema.

### Duplicate review queue

```sql
CREATE MATERIALIZED VIEW duplicate_review_queue AS
SELECT
  a.id AS record_a, b.id AS record_b,
  'company' AS record_type,
  similarity(a.domain, b.domain) AS domain_score,
  similarity(a.name, b.name) AS name_score,
  (similarity(a.domain, b.domain) * 0.7
   + similarity(a.name, b.name) * 0.3) AS combined_score
FROM companies a JOIN companies b
  ON a.id < b.id
  AND (similarity(a.domain, b.domain) > 0.85
       OR similarity(a.name, b.name) > 0.85)
WHERE NOT EXISTS (
  SELECT 1 FROM duplicate_resolutions r
  WHERE r.record_a = a.id AND r.record_b = b.id
);
```

Plus a `duplicate_resolutions` table for the operator's decisions (`merged`, `not_duplicate`, `deferred`). Requires the `pg_trgm` Postgres extension. Refreshed nightly (this is a review queue, not a write-time guard).

### Gap-view template

Every gap is a view with the same shape. Parameter is the SELECT criterion.

```sql
CREATE VIEW v_<entity>_<gap_name> AS
  SELECT id, <identifying_columns>
  FROM <entity>
  WHERE <gap_predicate>;
```

First three instances:

```sql
CREATE VIEW v_contacts_missing_email AS
  SELECT id, full_name, company_id, linkedin_url
  FROM contacts WHERE email IS NULL AND linkedin_url IS NOT NULL;

CREATE VIEW v_companies_missing_modality AS
  SELECT id, domain, name FROM companies WHERE primary_modality IS NULL;

CREATE VIEW v_contacts_stale_employment AS
  SELECT id, full_name, company_id
  FROM contacts
  WHERE (field_provenance->'employer'->>'captured_at')::timestamptz
        < now() - interval '90 days';
```

New gaps follow the template. They do not get bespoke schemas.

## Data flow

For every function that touches a record:

1. **Fetch** the record(s) the function needs (existing pattern, no change).
2. **Do the work** (existing pattern: call providers, derive state, classify).
3. **Write the canonical column** (existing pattern).
4. **Write the provenance entry.** `UPDATE ... SET field_provenance = field_provenance || jsonb_build_object('<field>', jsonb_build_object('value', ..., 'source', ..., 'run_id', ..., 'captured_at', now()))`.
5. **Insert one `enrichment_runs` row per record touched**, with `backing_system`, `backing_run_id`, `provider`, `cost_usd`, `outcome`, `fields_written`.

Steps 4 and 5 are the new discipline. Without them, the function is invisible to the projection.

## The projection surface

A thin UI that joins records ↔ runs ↔ provenance ↔ gaps. Four pages:

- **Records.** Search by name/domain/email. Click → show the record's columns, all provenance entries (source + when + which run + cost), all `enrichment_runs` rows for the record (history).
- **Runs.** List recent `enrichment_runs`. Click → show the records this run touched, fields written, cost, outcome.
- **Duplicates.** Show `duplicate_review_queue` top N. Three buttons per row: Merge / Not a duplicate / Defer. Writes to `duplicate_resolutions`.
- **Gaps.** List the gap views. Each view shows count + recent additions. Click → see the records.

Pilot surface is Retool (1 day to build). Reserve Next.js for after the pattern stabilizes.

## What this forbids

- **Vendor-specific run IDs as top-level columns.** No `inngest_run_id` column on the runs table. Use `backing_system` + `backing_run_id`. The pattern survives runtime changes.
- **Per-field cost storage without an allocation rule.** Until a rule exists, cost lives on the call, not the field. The UI divides.
- **Bespoke gap views.** Every gap follows the template. Operators who want a new gap fill in the entity + predicate; they do not invent a new schema.
- **Write-time dedup claims without a synchronous lookup function.** The queue is post-hoc. If write-time dedup matters for a system, that's a separate primitive — build it explicitly, do not pretend the queue covers it.
- **Functions that write records without an `enrichment_runs` row.** A function that skips this is invisible to the projection. Discipline is per-function.

## Open questions

- **Dedup allocation rule.** When two records merge, which provenance wins per field? Most-recent? Highest-confidence? Source-priority list? Decide before the first merge.
- **Gap-view refresh cadence.** Some gaps (missing email) are real-time. Others (stale employment) tolerate daily refresh. The template should support a cadence hint; the surface should respect it.
- **Surface tech for v2.** Retool covers the pilot. The case for Next.js (custom workflows, embedded into the operator OS, multi-tenant) needs a separate decision after pilot.
- **Adoption discipline across the 107 archived RevOps functions.** Each function needs to be extended individually. Sequence and priority are a separate roadmap (see `revops-architecture-spec.md`).

## File references

- `/Users/nplmini/code/work/practices/agentic-systems/reference/inngest-projection-pattern.md` — the orchestration side of the projection. This doc is the data side.
- `/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md` — the four-layer model this pattern fits inside (Source → Surface → Mover → Client). The projection sits across all four; the runs table lives in the Source/Surface boundary.
- `/Users/nplmini/code/work/practices/revops/database/revops-engine-dev.md` — current schema state. Names what exists, what's missing.
- `/Users/nplmini/code/work/systems/canon-crm-feed/PLAN-motions-rewire.md` — in-flight workstream. Do not extend Motions provenance until rewire ships + 1 week green.

## Origin

How I came to this view: [deepline-evaluation-2026-06-04.md](/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-evaluation-2026-06-04.md). Deepline's UI made the four opinions concrete. The opinions stand independent of the vendor. The vendor doc decays; this one does not.
