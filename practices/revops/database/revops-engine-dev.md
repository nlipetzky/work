# revops-engine-dev

**How to use this document.** Load this before any database work. If something below contradicts what you find in the database, the database is right and this document is stale... update it.

A curated reference for the Supabase project that holds RevOps prospect data. Audience: future Claude sessions and Nick. If you're reading this, the goal is to understand what the database does, what's populated vs. empty, and where the gotchas are, without re-discovering the schema every session.

Project ID: `mrmnyscurmkfppicqqhk`. Region: us-east-1. Postgres 17.

---

## Open questions

These are the things future-Claude shouldn't pretend to know. Resolve them before relying on assumptions.

- Are `recipes` and `enrichment_recipes` meant to be populated? Today they're empty and the operational truth lives on the filesystem.
- What's the lifecycle for `accounts` and `engine_accounts`? Empty despite IDs being referenced everywhere.
- Does `verification_receipts.scope_kind` have any consumer that filters on specific values? If yes, the new `play_company` / `play_contact` values need that consumer updated.
- Is `playbook_triggers.play_document` (jsonb) the system of record for the play artifact, or is the markdown in `clients/<client>/artifacts/` the source? Today both exist; sync direction unclear.

---

## 1. What this database is

`revops-engine-dev` is the structured data layer behind a B2B outbound prospecting program. It holds companies, contacts, the rules used to score and gate them, the signals that fire campaigns, the operations that enrich them, and the receipts that prove what happened. It's the database the engine reads to decide who to contact and the database it writes to when it acts. Today the only fully active client account is Teknova; the schema is multi-tenant via `engine_account_id` and `account_id` columns but only one engagement is loaded.

The mental model has six load-bearing concepts. **Entities** are companies and contacts, plus their canonical (deduplicated) twins. **Plays** are individual GTM initiatives, bundled into **playbooks** at the account level; each play points at an **icp_segment** that defines who qualifies. **Waves** are the execution units that run a play... a wave pulls contacts, runs enrichment recipes, evaluates them against gates, and pushes the survivors to Pearl (Airtable) for outreach. **Signals** are time-stamped behavioral facts about companies (funded last 12 months, IND filed, conference presenter) that fire **playbook_triggers** and feed scoring. **Gates** are the G1-G5 readiness ladder a contact climbs from "we have an identity" up to "sales-ready and exported." **Verification receipts** are the audit trail that records whether an operation did what it claimed.

---

## 2. The tables that matter

Row counts are as of 2026-05-06.

### Core entities

- **`companies`** (9,153 rows, 86 cols after migration). Operational company record. Modality, clinical stage, funding, headcount, Salesforce sync status, fit scores, classifier output. Watch for: 86 columns is a lot, many are legacy or v2-redundant. See gotchas. Triggers enforce data-quality fixes (`fn_dq_enforce_companies`) and block direct enrichment-field writes outside the recipe pipeline (`fn_enforce_enrichment_pipeline_companies`).
- **`contacts`** (25,927 rows, 105 cols). Operational contact record. Title, email, LinkedIn full profile, gate level, fit score, exclusion booleans, Salesforce IDs. Watch for: heavy LinkedIn-scrape payload (linkedin_raw_profile, linkedin_full_text) sits on every row whether populated or not.
- **`canonical_companies`** (8,245), **`canonical_contacts`** (23,752). The deduplicated identity layer. Each operational record points at a canonical via `canonical_company_id` / `canonical_contact_id`. Watch for: 9,153 companies vs. 8,245 canonical means ~900 operational rows have no canonical pointer or share one. Status of that gap is unclear.
- **`canonical_company_aliases`** / **`canonical_contact_aliases`**. Alternate names, domains, emails, with source and confidence per alias.
- **`accounts`** (0 rows), **`engine_accounts`** (0 rows). Both empty. The Teknova account_id (`00000000-0000-0000-0000-000000000010`) appears throughout but doesn't resolve to an `accounts` row. Referential integrity gap; unknown whether FKs enforce it.

### Play execution

- **`playbooks`** (1 row). Account-level GTM bundle.
- **`plays`** (4 active, 7 draft). Individual GTM initiatives. Holds `target_icp` jsonb, `acceptance_criteria` jsonb, `success_metrics` jsonb, `required_company_fields` array, `required_contact_fields` array, `freshness_window_days`. PLAY-006 ("AAV Gene Therapy — Ellie Outreach") is the active example.
- **`play_versions`**. Versioned snapshots of plays with approval state.
- **`playbook_triggers`** (48 cols). Runtime config for a play. Holds `target_modalities`, `seniority_filters`, `min_email_confidence`, `cadence_days`, `max_per_company`, `play_document` jsonb, `play_narrative`, `readiness_criteria`. The play-as-document lives here.
- **`play_company_membership`** (51 rows), **`play_contact_membership`** (168 rows). Which entities are in which play. Status, fit_score, blockers jsonb, added/removed timestamps.
- **`play_company_overlay`** (5 rows), **`play_contact_overlay`** (10 rows). Per-play scoring on top of membership. Holds `fit_score`, `readiness_score`, `fit_breakdown`, `readiness_breakdown`, `suppression`, `inclusion`, `flags`, and now **`criterion_results`** jsonb (added 2026-05-06 by option-A migration). Watch for: only sparsely populated. Most plays have membership but no overlay rows.
- **`icp_segments`** (2 rows). Segment definitions. `entry_criteria` jsonb is authoritative here, not on waves. Each wave belongs to one segment via `segment_id` FK.
- **`waves`** (2 rows, 56 cols). Execution units. A wave runs a play against a segment with a pearl policy and a strategy lock. Watch for: 56 columns indicates this table accreted many concerns; treat with care.
- **`wave_contacts`** (9 rows), **`wave_progression`** (631 rows), **`wave_operations`**, **`wave_recipes`**, **`wave_performance`**, **`wave_completion_summary`**, **`wave_snapshot_stages`**, **`wave_contact_events`**. The wave runtime telemetry stack.
- **`pearl_policies`**, **`pearl_exports`**, **`pearl_sync_log`**. Pearl (Airtable) export gating and history.

### Scoring and gating

- **`contact_classifications`** (25,927 rows). One row per contact. Holds `icp_tier`, `icp_score`, `fit_score`, `gate_blockers` jsonb, `gate_actions` jsonb, `is_gate_edge_case`, `disqualifiers` jsonb. Written by the classify-contacts Inngest function.
- **`contact_account_state`** (0 rows). Empty despite 25k contacts. Intended to hold relationship_state, opt_out, last_touch, exclusion flags. Currently those concerns live as columns on `contacts` itself. Watch for: dual location.
- **`completeness_snapshots`** (6 rows). Daily point-in-time data quality state per account. Written by completeness-snapshot Inngest cron at 03:00 UTC.
- **`company_completeness`** (0), **`contact_completeness`** (0). Per-record completeness scores; empty.
- **`v_company_gate_validation`** (view). Computes G1-G4 booleans per company.
- **`v_contact_gate_validation`** (view). Computes G1-G5 plus exclusion booleans per contact: `excluded_country`, `excluded_title`, `excluded_known`, `excluded_left_company`, `excluded_vp_large_pharma`, `excluded_personal_email`, `excluded_hard_bounce`, `excluded_dnc`, `excluded_opt_out`. Most disqualifier logic lives here.
- **`model_play_readiness`** (view). Per-play counts of in-scope, fit-qualified, verified, play-ready, and blocked... for both companies and contacts. The fastest read for "is this play ready to ship."
- **`lead_scores`** (0). Empty; intended for the four-component lead score (icp_fit, intent, engagement, data_quality).

### Signals

- **`company_signals`** (4,205 rows). Time-stamped behavioral and firmographic signals. Vocabulary: `funded_last_12m`, `hiring_process_dev`, `ind_filing_recent`, `conference_presenter`, `publication_recent`, `modality_confirmed`. Watch for: vocabulary lives in data, not in `signal_definitions` (which is empty).
- **`signal_scan_runs`** (0). Audit log of detector runs. Empty.
- **`playbook_evaluations`** (0). Records which contacts match each active playbook trigger. Empty despite the schema being designed for ongoing evaluation runs.

### Verification

- **`verification_receipts`** (2 rows). Per-scope audit receipts. Holds `workflow_completed`, `ids_targeted_match`, `fields_changed_as_expected`, `values_passed_validation`, `values_persisted`, `artifacts_refreshed`, `scores_recalculated`, `exceptions_within_bounds`, `outcome`, `failure_reasons`. `scope_kind` text column with no CHECK; conventional values are `wave`, `play`, `operation`, plus the new `play_company` and `play_contact` (added by 2026-05-06 migration comment).
- **`operation_receipts`** (8 rows). Per-operation provenance with expected vs. observed mutations, validation result, queue retry state, idempotency key.
- **`status_snapshots`** (47 rows). Point-in-time scope summaries. Written by agents.
- **`run_reports`** (0). Per-run summary; empty.

### Enrichment

- **`enrichment_ledger`** (10,705 rows). Per-field change log. Records `fields_before`, `fields_after`, `fields_changed`, provider, action, cost, duration. The most granular enrichment audit trail.
- **`enrichment_jobs`** (6 rows). Job-level rollup with `raw_response`, `failure_category`, `exhausted` flag.
- **`enrichment_runs`** (0). Empty. Newer single-source-of-truth audit table for the list-enrichment fast path; per the comment, replaces the wave cascade for enrichment intent.
- **`enrichment_failures`** (0). Empty. Intended to capture every previously-swallowed warn.
- **`enrichment_recipes`** (0), **`recipes`** (0). Both empty. The `companies.recipes_applied` jsonb arrays reference recipes by filename (e.g. `explorium-company-only.md`) and UUID, suggesting recipes are read from filesystem and these tables are unused or not yet synced. Unknown which.
- **`provider_output_declarations`** (0). Empty. Mirror of declared-outputs.ts; populated by seeder on deploy. Per comment, source of truth is the TS file.
- **`providers`** (0), **`provider_throttles`** (4). Provider catalog empty; throttle state present.

### Audit

- **`entity_activity_log`** (6,841,026 rows). Universal activity log with 90-day retention. Every enrichment, classification, gate eval, sourcing, export, and sync event lands here. Watch for: high cardinality, query with predicate filters not full scans.
- **`data_quality_violations`** (1 row). Auto-corrected DQ fixes (e.g. ALL CAPS company names, country normalization). Written by `fn_dq_enforce_companies` trigger.
- **`pipeline_alerts`** (0). Severity-tagged alerts; empty.
- **`sync_error_log`** (0). Sync failures across functions; empty.

---

## 3. Empty-but-meaningful tables

These tables exist with full schemas and zero rows. They're not dead code; they're load-bearing infrastructure waiting for content. Populating them is option B of the database work plan.

- **`gate_criteria`** (0 rows). Per-account, per-gate criteria definitions. The G1-G5 logic that `v_company_gate_validation` and `v_contact_gate_validation` compute is currently view-embedded; this table is where it should live to be configurable.
- **`eligibility_rules`** (0). Compound checks that determine outreach readiness. Per the table comment, sourced from Data Standards §7.4.
- **`exclusion_rules`** (partially populated). One active row, "Non-ICP Title Exclusion" (id `0cf917fc-762b-4536-94a2-c7a2281b3ce2`), live since 2026-03-31, with a 70+ keyword list. Read by `has_excluded_title()` and surfaced as `excluded_title` in `v_contact_gate_validation`. Active and enforcing today. A follow-up audit of the keyword list is pending: several entries (`Buyer`, `Supply Chain`, `Compliance`, bare `Regulatory`, plus 2-character substrings `QC` and `IT`) likely produce false positives against Teknova's actual buyer roles. The migration on 2026-05-07 added a second row, "Excluded titles (Teknova)," which was deactivated as redundant; it remains in the table for audit trail. Note: this section previously claimed `exclusion_rules` was empty; that was wrong. Always SELECT before declaring a table empty.
- **`design_constraints`** (0). Cross-record business rules. The "max 3-5 contacts per company per wave" rule from the client CLAUDE.md belongs here.
- **`signal_definitions`** (0). Definitions for the signal vocabulary that 4,205 rows of `company_signals` already use. Without these, scoring isn't auditable... a `funded_last_12m` signal has no metadata about what it means or how it's weighted.
- **`signal_monitor_configs`** (0). Per-account signal detector schedules. Without rows, no scheduled signal scans fire.
- **`data_standards`** (0), **`data_standard_fields`** (0). The standards-and-fields rules engine. Completeness scoring references these; with no rows, completeness computes against nothing.

The shape is right. The contents are missing.

---

## 4. Gotchas

1. **Three columns for "clinical stage" on `companies`.** `clinical_stage` (text, free-form), `development_stage` (text), `company_stage_category` (text). All three are populated with overlapping but inconsistent values. Today's migration added `clinical_stage_ordinal` (numeric) to give one normalized handle. **What to do:** read `clinical_stage_ordinal` for filters; treat the others as legacy until someone declares one authoritative.

2. **`clinical_stage` has company-size labels mixed in.** ~5,685 rows have values like "Large Pharma," "Small-to-Mid," "Startup," "Research & Discovery," "Unknown" instead of phase labels. The `field_provenance` jsonb on at least one company explicitly notes "Small-to-Mid was company-size label, not clinical stage. Reclassified..." **What to do:** don't trust `clinical_stage` for phase math without a non-null `clinical_stage_ordinal`. Re-classification of those rows is a deliberate data-cleanup job.

3. **Two columns named for "specialties" with one misspelled.** `specialties` (jsonb) and `specialities` (text, contains a JSON-string-of-an-array... double-encoded). Both populated. **What to do:** prefer `specialties`. Treat `specialities` as legacy.

4. **`nacis` (typo) and `naics_code` coexist on `companies`.** Both populated. The trigger `fn_check_modality_contradiction` reads both. **What to do:** prefer `naics_code` for new logic. Don't drop `nacis` without checking the trigger.

5. **Legacy vs. v2 modality columns.** `primary_modality` and `secondary_modalities` (jsonb) coexist with `v2_primary_modality`, `v2_company_type`, `v2_modality_confidence`, `v2_classified_at`, `v2_classifier_version`, `v2_needs_manual_review`. Both systems are populated. **What to do:** read v2 for new logic. Sunset of legacy is unscheduled.

6. **`companies.last_funding_date` is `text`, not `date`.** Same for `last_funding_value` (text, should be numeric) and `confidence_score` (text, should be numeric). **What to do:** cast on read. A type-fix migration is a separate piece of work.

7. **`accounts` and `engine_accounts` are empty despite their IDs being referenced everywhere.** The Teknova account_id `00000000-0000-0000-0000-000000000010` appears in dozens of tables and resolves to no row. **What to do:** don't write joins that require an `accounts` row. Unknown whether FK constraints exist; assume they don't.

8. **`enrichment_recipes` and `recipes` are both empty despite recipes being referenced everywhere.** The `companies.recipes_applied` jsonb arrays reference recipes by filename and UUID. Recipes appear to be read from the filesystem at runtime. **What to do:** treat the database tables as not-the-source-of-truth for recipes. Unknown whether they're meant to be populated.

9. **`fit_score` type mismatch between tables.** `companies.fit_score` is integer; `play_company_overlay.fit_score` is numeric. Different scales, possibly different meanings. **What to do:** name the table when discussing a fit score. Don't assume comparability.

10. **Direct UPDATEs to enrichment fields on `companies` are blocked.** The `fn_enforce_enrichment_pipeline_companies` trigger raises an exception unless `my_app.recipe_id` is set or the user is `postgres`. The watched fields include `size_bucket`, `employee_count`, `industry`, `country`, `funding_stage`, `total_funding_amount`, `primary_modality`, `secondary_modalities`, `clinical_stage`, `revenue_range`, `website`, `territory`, `specialties`, `naics_code`, `research_focus`, `company_score`, `known_unknown_status`, `field_provenance`. **What to do:** use the recipe pipeline or set the config flag. Don't write directly.

11. **RLS is disabled on 32 tables.** Including `play_company_membership`, `segment_company_membership`, all overlays, all canonical tables, all versions tables, `offers`, `foundation_assets`. Anyone with the anon key can read or modify any row. **What to do:** known issue. Surface to user before exposing the project to client portals.

12. **`teknova_input_companies_c1` (103 cols) and `teknova_input_contacts_c1` (113 cols) are empty Airtable-shaped staging tables.** Field names use Airtable conventions (spaces, brackets, "[SF]" suffixes). **What to do:** ignore unless explicitly working an Airtable import. Not the source of truth.

---

## 5. How qualification works

Qualification happens at three levels.

**Company level.** `companies` holds the firmographic and modality answers, plus internal classifier output (`v2_primary_modality`, `v2_company_type`, `v2_modality_confidence`, `playbook_fit_score`, `playbook_fit_level`, `playbook_fit_rationale`). `field_provenance` jsonb captures per-field source and timestamp. This is "is this company in our universe and how do we describe it."

**Contact level.** `contacts` holds the person-level answers. `contact_classifications` adds the per-contact `icp_score`, `fit_score`, `gate_blockers`, `disqualifiers`. The view `v_contact_gate_validation` computes the boolean exclusion ladder (country, title, VP-at-large-pharma, hard-bounce, opt-out, etc.) per contact. This is "is this person targetable and not on the do-not-touch list."

**Play overlay level.** `play_company_overlay` and `play_contact_overlay` hold per-play scoring on top of the universal company/contact data. As of today's migration, both tables have a `criterion_results` jsonb column. The shape is `{"<criterion>": {"status": "pass|fail|unknown", "value": <observed>, "expected": <rule>, "source": <text>, "checked_at": <timestamptz>, "notes": <text>}}`. This is the per-criterion audit trail that lets you defend "why is this company on the list" to a stakeholder.

**Verification receipts** sit alongside as the proof-of-evaluation: `verification_receipts` rows with `scope_kind = 'play_company'` or `'play_contact'` record that an evaluation ran, what passed, what failed, and when. These are the artifact you'd hand to a client.

The flow: a play has criteria (in `target_icp`, `acceptance_criteria`, and `playbook_triggers.readiness_criteria`). Companies and contacts exist independently of the play. Membership tables (`play_company_membership`, `play_contact_membership`) declare scope. Overlays (`play_company_overlay`, `play_contact_overlay`) hold per-play verdicts. Receipts (`verification_receipts`) record evaluation events. The view `model_play_readiness` rolls it up into one row per play.

The mapping from a specific play's criteria to specific columns lives in the segment-qualify skill, not here. That mapping changes every time an offer changes; keeping it in this document would guarantee staleness.

---

*Last updated: 2026-05-06 after option-A migration. Next update: when option B (rules-table population) lands.*
