# Source-of-record: capture wide, derive narrow; grain decides structure (2026-05-18)

## What happened

The currency-gate investigation revealed the clinicaltrials.gov fetch requests only four modules — status/dates were thrown away at capture. Nick generalized: when we hit a source, grab everything (especially paid data like Explorium), store it, derive what we use. He asked whether that means a table per source, and suspected not universally.

## The reasoning

Two distinct rules, often conflated:

1. **Capture wide, derive narrow.** Filtering at the moment of capture discards data you cannot cheaply get back (paid enrichment) or that reflects a point in time (trial status). Capture the full payload raw; structure only the fields operationally used. This is the architectural form of the standing "never filter during ingestion" rule — restated as: the raw layer and the curated working surface are different layers, and narrowing belongs only at the second.

2. **Grain decides structure — NOT "a table per source."** The deciding factor is record grain relative to core entities:
   - Source produces a *different kind of record* than core entities (clinicaltrials.gov: many trials per company; a trial is its own entity with status/dates/phase) → it earns its own table, one row per source-record, linked to the core entity. This is a real entity the system reasons over, not a dump.
   - Source *enriches an existing entity at the same grain* (Explorium → one company, one payload) → capture the full raw payload attached to that entity (raw blob / 1:1), project used fields. A separate table buys nothing unless history/versioning over time is needed — defer until reality demands it (emergent rule).

Reflexively making one table per source is the failure mode; so is the opposite (cramming a different-grain source into the core entity, which is what the prose-only NCT id in Classification Notes is).

## Refinement (same day, Nick correction)

The first application got the table wrong, instructively. "Different grain earns its own table" must FIRST ask "do we already have a table at that grain?" A clinical trial, to the system, is a temporal signal (status, most-recent date, alive/dead) — the exact grain of the existing, long-empty **Company Events / signals** table (spec `practices/revops/cohort-data-model.md`). Inventing a "Trials" table would have been reflexive structure-proliferation and invented vocabulary, the very thing the principle and `feedback_revops_no_invented_vocab_strict_scope` forbid. Correct model is two layers: raw full payload in a raw landing keyed by trial id (capture-wide), and the derived temporal signal projected as Company Events rows (derive-narrow, reusing existing grain-appropriate structure). Sharper rule: grain decides structure → and reuse the existing table of that grain before creating one; richness that doesn't fit the existing grain-table stays in the raw layer, it does not justify bloating the curated table into a disguised entity store.

## Disposition

Standing principle for the RevOps Engine. Concrete: clinicaltrials.gov earns a Trials table (different grain, and it directly serves the currency gate) — registered as a revops-engine roadmap item, NOT bolted onto the Phase 1 currency plan (scope/sequencing: Phase 1 ships with the minimal safe fetch change; the Trials table is its own work; currency later reads from the table). Explorium = store the existing raw blob complete (not truncated); no new table until enrichment history is a real need. Captured, with the table itself proposed not built.
