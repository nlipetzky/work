# Build Brief: On-rails batch ingest → canonical → records-to-client

**For:** the RevOps engine session.
**From:** Boris (agentic-systems).
**Status:** ready to build. One hard blocker (see below) must be cleared first.
**First batch:** the 128 ngAbs contacts. The pipeline is reusable; ngAbs is just batch #1.

---

## HARD BLOCKER — clear before any building

This work happens in the **live engine repo** where `records-to-client` and the Supabase
schema are deployed. You have only seen the archived compiled copy under
`/code/ARCHIVE/aos/...`, which is **out of bounds** per the trust rules in
`/Users/nplmini/code/work/CLAUDE.md`. Do not build from it, do not cite it.

**Action for Nick:** point this session at the live engine repo (path on disk). If that path
is unknown or unavailable, stop and report — do not reconstruct the engine from the archive
or guess. Everything below assumes you are working in that live repo.

## Why this exists

Today, batch data (a CSV of enriched contacts) reaches Airtable only through throwaway
session scripts. That is the trap: every refresh starts over, and the writes are off-rails —
no `field_provenance`, no `entity_activity_log` event, no run record. The projection surface
(`/Users/nplmini/code/work/systems/projection-ui/`, port 4180) renders any such value as
**suspect (no provenance)**, because a value with no lineage is exactly how a fabricated /
broken-export value looks. We are not going to add more of those.

The durable system: **batch lands in `staging` → a promotion function moves it to canonical
with full lineage → the existing `records-to-client` syncs canonical → Airtable.** The
projection UI's Staging and Records pages are the verification harness for this flow.

## Non-goals (do not do these)

- **No CSV → canonical `contacts` direct write.** That is the off-rails pattern we are
  removing. Canonical tables are written by controlled functions that stamp provenance.
- **No one-off / unblock-today push.** Nick explicitly chose the long-term solution.
- **Do not rebuild the Supabase → Airtable half.** `records-to-client` already systematizes
  it. Fix it if broken; do not replace it.
- **Do not invent a parallel CSV chain.** Canon is staging-schema-not-CSV
  (`project_staging_schema_not_csv`).

## Canon to honor (read first)

- `/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md`
  — records↔runs join, per-field provenance, dedup queue, gaps, `staging_promotions` lineage.
- `/Users/nplmini/code/work/practices/revops/database/revops-engine-dev.md` — schema reference.
- Supabase project `mrmnyscurmkfppicqqhk` (revops-engine-dev). RLS is now enabled on all
  public tables (no policies = deny-by-default); the engine uses the service role and bypasses
  it. Do not add anon/authenticated policies without a reason.

## Architecture (the reusable pipeline)

```
batch (CSV/any)
   │  [1] ingest loader  (parameterized, account/play-scoped)
   ▼
staging.<entity>_<batch_id>        ← raw, typed, nothing canonical yet
   │  [2] promote_staging_batch()  (the missing piece — identity-resolve + stamp lineage)
   ▼
canonical companies / contacts     ← with field_provenance + entity_activity_log + run row
   │  [4] records-to-client (EXISTS — fix, don't rebuild)
   ▼
client Airtable base (per account_airtable_config)
```

## Work items

### 1. Ingest loader (new, parameterized)
- Input: a batch file + an explicit mapping (source column → canonical field) + `account_id` /
  play scope + `entity` (`companies` | `contacts`).
- Output: writes to `staging.<entity>_<batch_id>` (create table on demand). Records the batch.
- Writes **nothing** to canonical. Typed, idempotent (re-running same batch_id is safe).
- Lives in the engine repo, callable from CLI/function. ngAbs mapping is config, not code.
- **Done when:** running it on the 128 ngAbs contacts creates `staging.contacts_<batch_id>`
  with 128 typed rows and a batch record; the projection UI Staging page lists the batch.

### 2. `promote_staging_batch()` — the missing piece (new SQL RPC)
This is what makes the data trustworthy, and it does not exist today (confirmed: no promotion
function in the DB). Signature (align exactly — the projection UI Promote button will call it):

```
promote_staging_batch(p_batch_id text, p_entity text, p_promoted_by text)
  returns table(promoted int, merged int, inserted int, run_id uuid)
```

Per row in the staging batch, inside one transaction:
- **Identity-resolve** against canonical using `identity_resolution_rules` (email / domain /
  linkedin). On match, update applying `survivorship_rules`; else insert a new canonical row.
  Do NOT create duplicates — this is the whole point of resolving first.
- **Stamp `field_provenance`** for every field written: `{source: 'ingest:'||p_batch_id,
  action: 'promote', timestamp: now(), confidence: <from batch or default>}`.
- **Log `entity_activity_log`**: one row per record, `activity_type='staging_promotion'`.
- **Record the run**: one `enrichment_runs` row for the batch (scope, counts, cost 0 for a
  pure ingest) so the Runs page shows it.
- **Write `staging_promotions`**: one row per promoted record (`batch_id`,
  `source_record_type`, `source_record_id`, `canonical_record_id`, `enrichment_run_ids`).
- **Idempotent:** a record already in `staging_promotions` for this batch is skipped.
- **Done when:** calling it promotes the 128, the projection UI Records page shows them with
  **real provenance** (source = `ingest:<batch_id>`, not blank), and a Runs row exists.

### 3. Config + registration (reusable, account-scoped)
- Fill `account_airtable_config` with the ngAbs Airtable base/table IDs.
- Register the ngAbs play/account so `records-to-client` knows its scope.
- **Done when:** `records-to-client` can resolve the ngAbs account to a target base/table
  with no hardcoding.

### 4. Fix `records-to-client` (exists, ran partial/failed in May)
- Diagnose the May partial/failure; repair; confirm deployed.
- Reads canonical → Airtable. Once [2] lands data in canonical, it rides.
- **Done when:** a clean run syncs the promoted ngAbs contacts to the ngAbs Airtable base
  with zero partial/failed records, and a `sync_runs` row records it.

### 5. End-to-end verification (use the projection UI as the harness)
Land → promote → sync, observed at each boundary:
1. Loader → Staging page shows `contacts_<batch_id>` with 128 rows.
2. `promote_staging_batch` → Records page shows the 128 with real `field_provenance`; Runs
   page shows the batch run; `staging_promotions` has 128 rows.
3. `records-to-client` → the client Airtable base shows the 128; `sync_runs` clean.
4. Spot-check the count end to end (the "70 vs 420" discipline): staging rows == promoted ==
   synced. No silent drops.

## Cross-session boundary (do not cross)

The **projection UI is owned by the other (surface) session.** Your deliverable from item [2]
is the `promote_staging_batch` RPC with the signature above. Wiring the UI's Promote button to
that RPC is a follow-up in the surface session, not your task. Keep the contract stable and you
two never collide.

## Open judgment calls (decide with Nick, don't assume)

- Identity-resolution behavior on promote: how aggressive is auto-merge vs. routing ambiguous
  matches to the duplicate queue? Reuse existing rules; surface the threshold choice.
- Whether the loader should also be the path for future enriched batches generally, or stay
  ingest-only with enrichment happening upstream. Lean reusable, but confirm.
