# RUNBOOK — Signal Prospecting (play run)

**The authoritative step sequence for running a prospecting play through the engine.** The
canonical step list is the `flow:` on the registry record
(`registry/signal/signal-prospecting/system.md`) — this runbook details each node. If the two
disagree, the registry record wins and this file is fixed. A session running a play follows these
steps in order and does not skip ahead.

## The iron rules (every step obeys these)

1. **Every count comes from the surface or a query — never from session prose.** When the answer
   is "how many," it is a number read from the staging table (or the screen on it) plus the URL.
   No estimates, no projections stated as counts, no number repeated from earlier in the session
   without re-reading. Stale and projected numbers are how trust dies.
2. **A step is done only when its surface check passes.** Each step below ends with "VERIFY" — the
   session states the number it sees on the surface and the URL. No verify, no next step.
3. **Capture everything, faithfully.** Loaders stage every source field (nested ones
   JSON-stringified). You capture once because re-pulling costs money and you don't yet know which
   field tomorrow's question needs.
4. **No ad-hoc data work.** Every action uses the node's registered implementation. No registered
   tool for your case = a declared gap: build it into the engine, register it on the record, then
   use it (operating-doctrine rule 12).
5. **"Done" = the Deliver gate, not a feeling.** A screened batch is the MIDDLE of the flow. The
   run is done when the delivery contract is satisfied or you are stopped at a named gate.
6. **Paid steps stop for approval.** Pilot → show price → approve → run. The session is the spend
   gate until one exists in code.

---

## The steps

Each step: **precondition → action (registered impl) → writes → VERIFY (surface) → gate.**

### 0. Brief
- **Pre:** the play's strategic bundle exists (offer, segment, ICP titles, disqualifiers) and the
  play brief is approved. No sourcing before this (doctrine: the bundle is a gate).
- **Action:** confirm the play folder + `prep-recipe.json` + classifier bundle are present.
- **VERIFY:** the play folder enumerated on the staging surface once a batch loads (the "all
  context" links). Until then, the readiness report from `run-prep --print-plan`.
- **Gate:** missing inputs are surfaced as questions, batched, not improvised.

### 1. Load (node: Load)
- **Pre:** sourcing filters decided FROM the segment criteria; universe size known
  (`total_entries` from a count-only search — know the real net before you pull, so you never
  confuse "the slice we pulled" with "the universe").
- **Action:** the registered loader for the provider — `load-apollo-to-staging.mjs` /
  `load-explorium-to-staging.mjs` / `load-companies-csv-to-staging.mjs`. Play-folder-bound,
  `--source <provider>`, full faithful capture, `--dedupe-against` prior batches.
- **Writes:** `staging.companies_<batchId>` + the `staging_batch_meta` row (play context).
- **VERIFY:** `localhost:4180/staging` → the batch shows N rows. State N. That N is the only
  "how many did we pull" that counts.
- **Gate:** paid source pull → pilot + price + approval before the scaled run.

### 2. Stage (node: Stage)
- **Pre:** step 1 verified.
- **Action:** (automatic in the loader) — the staging table + meta row.
- **VERIFY:** batch visible on `/staging` with its play context links resolving.

### 3. Screen (node: Screen)
- **Pre:** staged batch + the play recipe.
- **Action:** `run-prep.mjs` drives the recipe — stage1 → classify → dedup → route →
  contacts-screen. Free compute.
- **Writes:** `prep_verdict`, `prep_confidence`, `prep_criteria`, `prep_rationale` on each row.
- **VERIFY:** `/staging` → the batch's verdict breakdown. State it as the FULL reconciliation:
  **total = IN + NARROW + NEEDS_REVIEW + OUT**, and the parts must sum to total. (Run the group-by;
  do not estimate.) `/runs` shows each stage green.
- **Gate:** none — but this is where number-drift starts, so the sum-to-total check is mandatory.

### 4. Flag-resolve (node: Flag-resolve)
- **Pre:** screened batch.
- **Action:** `flags-v0.sql` writes work-item flags; the resolver (v0 manual today) clears each
  flag the rule library covers, citing `rule_ref`. Genuinely-novel calls go into ONE batched
  four-section packet (Assumptions incl. rule_refs / Evidence / Tentative read + options /
  Question) — never retail questions.
- **Writes:** `prep_flags`, `prep_attention`, `prep_resolution`.
- **VERIFY:** `/staging` → attention roll-up (open / informational / clear) and the count of rows
  still showing "decide." State the count from the surface.
- **Gate:** the packet stops for the operator. Resolutions that gate outreach need two independent
  sources.

### 5. Promote (node: Promote)
- **Pre:** flags resolved; the qualified set agreed.
- **Action:** `promote_staging_batch()` — on-rails, idempotent, provenance-stamped.
- **Writes:** qualifying rows into Core `companies`; the promotion ledger keeps lineage.
- **VERIFY:** `/records` (or the ledger) → promoted count = the qualified count from step 4.
- **Gate:** Task-11-class destructive moves need explicit go.

### 6. Contacts (node: Contacts)
- **Pre:** promoted company set.
- **Action:** the contact-sourcing loader (people-at-company per the ICP-titles artifact, role
  exclusions applied) → `staging.contacts_<batch>` → contacts-screen runner + the
  suppression/existing-customer check against the Airtable SF mirror.
- **Writes:** `staging.contacts_<batch>`.
- **VERIFY:** `/staging` → the contacts batch row count and screened breakdown.
- **Gate:** PAID — pilot on ~2 companies, show per-contact price, approve, then the scaled pull.

### 7. Deliver (node: Deliver) — the door
- **Pre:** screened contacts (or, for an expert target-review wave, the screened companies).
- **Action:** validate the set against the play's `delivery-contract.md`; then the registered
  exporter — `export-staging-csv.mjs` (review sheet, for the client/expert) or
  `export-airtable-payload.mjs` (the Airtable transport). Only fully-qualified records cross.
- **Writes:** the CSV/payload artifact in the play `output/` folder.
- **VERIFY:** the artifact row count = the qualified set; spot-check on the surface first.
- **Gate:** **the export waits for the operator's approval.** Expert-facing delivery routes
  through Hermes (expert verdicts become rules). Nothing leaves the system without approval.

---

## Done

The run is done when step 7's artifact is approved and delivered, OR the session is stopped at a
named gate (awaiting a decision packet, a spend approval, or an export approval). "We screened a
batch" is never done — that is step 3 of 7.
