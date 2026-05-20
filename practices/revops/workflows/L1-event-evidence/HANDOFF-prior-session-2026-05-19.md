# HANDOFF — AAV Discovery L1: search broadening + evidence-event capture

**From:** RevOps Workflows builder session
**To:** Agentic-Systems
**Date:** 2026-05-19
**Status:** Direction proposed, awaiting Nick's answers on 3 open questions before build

---

## Live system references

- **Workflow:** `9gcmEjq1lvOY2jZS` — "Canonical AAV Discovery - L1 ClinicalTrials.gov"
- **Workflow versionId at time of writing:** `2fc8a83c-1a10-43be-aa1e-4cb389a9af07`
- **Active:** false
- **Trigger:** Weekly Monday 6am
- **Base:** RevOps Surface — `appYBYH3aOHhTODAw`
  - Companies: `tblnj3YlOI3thjrXp`
  - Company Events: `tblnzX2b2kqNGzW6r`
  - Enrichment Runs: `tblEVSEqetmu4ScHe`
- **CT.gov field reference (342 fields total):** `/Users/nplmini/code/work/practices/revops/workflows/reference/ctgov-v2-fields.md`

Re-pull live config before acting; do not trust descriptions below.

---

## Problem statement

Two defects in the current L1 workflow:

### 1. Undersearches CT.gov

Single query: `query.intr=AAV`. Substring match against intervention text only. Verified gaps:

- Trials registered under MeSH term `Dependovirus` without the bare "AAV" string in intervention names will not match.
- Trials that use full phrase "adeno-associated virus" without abbreviation are at risk depending on tokenization (needs empirical check).
- Serotype-only mentions (`AAV9`, `rAAV2`, `AAVrh10`) may or may not match a bare `AAV` query depending on Essie behavior — needs empirical check.
- Sponsor-supplied keywords and `briefSummary` content are not used as match surfaces.

### 2. Underclassifies after capture

Industry-class filter is the only post-fetch filter. Everything else gets upserted to Companies with `Verification Status = needs_verification`. The Companies row carries no per-trial mechanism evidence the downstream L2 verifier can act on without re-querying CT.gov. Known false-positive classes that currently leak through:

- AAV-as-vaccine-vector trials (different commercial profile than gene therapy)
- Trials mentioning AAV only in eligibility ("anti-AAV antibody titer < X")
- AAV-as-research-tool studies (BASIC_SCIENCE primary purpose)
- Trials with intervention.type = DRUG/DEVICE where AAV appears only in a comparator arm or description

The workflow's `Fetch AAV Studies` node only requests 10 of CT.gov's 342 available fields. Mechanism disambiguation fields (`armsInterventionsModule.interventions.type`, `designModule.designInfo.primaryPurpose`, `descriptionModule.briefSummary`, MeSH-derived terms) are not pulled.

---

## Proposed direction

### Step 1 — broaden search at source (multi-query union)

Replace the single `query.intr=AAV` call with a union of:

- `AAV`
- `"adeno-associated"`
- `Dependovirus`
- `(AAV1 OR AAV2 OR AAV3 OR AAV4 OR AAV5 OR AAV6 OR AAV7 OR AAV8 OR AAV9 OR AAVrh10 OR rAAV)`
- `("gene therapy" AND vector)`

Dedupe by NCT before passing to the Industry-class filter.

### Step 2 — narrow at source with Essie filters

Apply `filter.advanced` to require:

- `AREA[InterventionType](GENETIC OR BIOLOGICAL)`
- `AREA[StudyType]INTERVENTIONAL`
- `AREA[Phase](PHASE1 OR PHASE2 OR PHASE3 OR EARLY_PHASE1)`

This pre-filters preclinical-only registries and small-molecule trials at the API boundary.

### Step 3 — fetch disambiguation fields

Add to the `fields=` parameter:

- `protocolSection.armsInterventionsModule.interventions.type`
- `protocolSection.armsInterventionsModule.interventions.otherNames`
- `protocolSection.designModule.studyType`
- `protocolSection.designModule.designInfo.primaryPurpose`
- `protocolSection.descriptionModule.briefSummary`
- `protocolSection.designModule.enrollmentInfo.count`
- `protocolSection.statusModule.primaryCompletionDateStruct.date`
- `protocolSection.statusModule.whyStopped`
- `protocolSection.oversightModule.isFdaRegulatedDrug`
- `protocolSection.identificationModule.secondaryIdInfos`
- `protocolSection.contactsLocationsModule.locations.country`
- `derivedSection.interventionBrowseModule.meshes`
- `derivedSection.conditionBrowseModule.meshes`

### Step 4 — classify deterministically + capture as event evidence

For every trial that passes Step 1+2, run a tiered classifier inside the workflow:

- **high** = MeSH contains `Dependovirus` AND `Genetic Therapy`, intervention.type ∈ {GENETIC, BIOLOGICAL}, primaryPurpose = TREATMENT
- **medium** = Tier 1 checks pass but MeSH ambiguous → send `briefSummary` to LLM classify
- **low / reject** = intervention.type ∈ {DRUG, DEVICE} or primaryPurpose = BASIC_SCIENCE

For every trial that gets classified (regardless of confidence), write **two** rows to Company Events (`tblnzX2b2kqNGzW6r`):

1. `clinical_trial_status` — what we already write today. Raw observable fact. Unchanged.
2. `aav_classification` — NEW event type. Carries the verdict + evidence inputs:
   - `Event ID`: `{company} — aav_classification — {NCT}`
   - `External ID`: NCT
   - `Confidence`: high / medium / low
   - `Detail`: structured evidence — classifier tier triggered, intervention.type values, MeSH terms matched, serotype + transgene parsed from intervention name, briefSummary excerpt (first 500 chars) if LLM was used, primaryPurpose, studyType
   - `Provider`: `clinicaltrials.gov`
   - `Source URL`: `https://clinicaltrials.gov/study/{NCT}`
   - `Detected At`: run date
   - `Is Latest`: true (and all prior `aav_classification` events for the same NCT get flipped to false in the same upsert pass)

Re-runs never mutate event rows. New verdicts append; prior verdicts have `Is Latest = false`. Full judgment-history audit trail.

### Step 5 — Companies row stays a rollup

L1 upserts Companies for anything passing Step 1+2 hard filters. `Canonical Status = candidate`, `Verification Status = needs_verification`. L1 does NOT decide canonical state — the verification pass does.

### Step 6 — Verification pass (separate workflow or manual review)

Reads Companies where `Verification Status = needs_verification`. For each company, pulls the latest `aav_classification` events for all linked trials. Decides yes/no, appends an `aav_classification_verified` event with reviewer (human or LLM) + final confidence, updates Companies.`Canonical Status` to `canonical` or `rejected`. No CT.gov re-query required — all evidence is in Airtable.

---

## Open questions Nick must answer before build

### Q1 — event type schema

Confirm or revise the `aav_classification` event shape proposed in Step 4. Specifically:

- Is `aav_classification` the right event type name, or should it be `aav_gene_therapy_evidence` / `trial_classification` / something else?
- Is the `Detail` field a freeform structured string, or should we add dedicated columns to Company Events (Classifier Tier, MeSH Matched, Serotype, Transgene, briefSummary Excerpt)?
- Confirm the `Is Latest` flip behavior — re-runs demote prior classification events, append new one.

### Q2 — Companies row default state

Currently L1 upserts everything passing the Industry filter with `Canonical Status = candidate`. Under the new model, should L1:

- (a) Upsert ALL trials that pass Step 1+2 hard filters as `candidate` Companies rows (low/medium/high all land), and let the verification pass decide promotion vs. rejection
- (b) Upsert only `high` + `medium` confidence as `candidate`, and write `low` to a separate holding table or skip entirely
- (c) Upsert only `high` confidence as `candidate`, holding `medium` in events-only state pending verification

Recommendation from prior session: (a). Verification pass is the gate, not L1.

### Q3 — build vs. prototype

- (a) Build directly against the live workflow `9gcmEjq1lvOY2jZS`, iterate against real Airtable surface
- (b) Prototype the query changes against the live CT.gov API in a sandbox first, measure recall/precision delta, then build

Recommendation from prior session: (a) — iteration loop is faster against real Airtable data than against an ephemeral prototype output. Build behind `Canonical Status = candidate` so nothing leaks downstream until verification.

---

## What this handoff does NOT include

- Verification-pass workflow design (Step 6) — separate handoff after Step 1-5 lands
- Sponsor-name normalization improvements (parent/subsidiary alias collapse) — flagged but out of scope for this build
- Migration of existing `needs_verification` Companies rows to the new evidence model — needs separate decision

---

## Verification-on-deploy checklist for the builder

After any update to workflow `9gcmEjq1lvOY2jZS`:

1. Re-read the live workflow via raw API GET (not `get_workflow_details` — MCP strips credentials).
2. Report `versionId` after deploy.
3. Report credential binding per node — empty `credentials:{}` in a GET is a wipe, not API opacity.
4. Trigger one execution; report execution ID.
5. Report per-node item counts read directly from that execution's runData.
6. Do NOT claim "verified" / "working" / "ready for next step." State the references; orchestrator decides if it passed.
