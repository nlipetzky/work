# Workflows ticket — L1 Discovery: search broadening + full evidence capture + classification event

**Write-owned by:** Workflows builder
**Workflow target:** `9gcmEjq1lvOY2jZS` ("Canonical AAV Discovery - L1 ClinicalTrials.gov")
**Working scope:** this folder (`practices/revops/workflows/L1-event-evidence/`)
**Date:** 2026-05-20
**Status:** SPEC. Canonical. Supersedes the prior-session handoff and the original PROMPT in this folder (both kept as history).

## Read order before any edit

1. `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` — engine principles (capture evidence, not verdicts; tenant-agnostic engine vocab).
2. `practices/revops/workflows/L1-event-evidence/HANDOFF-prior-session-2026-05-19.md` — the prior Workflows-session analysis of L1 defects and proposed direction. Read fully; this PROMPT consolidates and answers its three open questions.
3. `practices/revops/workflows/L1-event-evidence/PROMPT-original-2026-05-20.md` — the narrower original ticket (write 6 evidence fields). Kept for diff visibility; do not execute it separately.
4. `practices/revops/workflows/reference/ctgov-v2-fields.md` — full CT.gov v2 field catalog (342 fields). Field paths cited below come from this reference.
5. Plan: `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`.

## Directive

L1 today undersearches CT.gov (single `query.intr=AAV` substring match) and underclassifies after capture (Companies rows carry no per-trial mechanism evidence, so L2 has to re-fetch CT.gov live to decide). Fix both. Broaden the search at the source, pull the disambiguation fields, write **two event rows per trial** to Company Events — one for the trial fact, one for the classification verdict — with full source content. Companies row stays a thin entity surface; the verification pass (separate workflow, separate ticket) is the decision gate.

## Resolved open questions (from prior handoff)

**Q1 — event type schema. Resolved:**

- The engine-layer event type for the classification verdict is **`target_classification`** (tenant-agnostic per engine Principle 7). It is NOT `aav_classification` — the engine layer does not carry industry vocabulary.
- Per-play identity rides in `Categories / Tags` on the event row: e.g. `aav-gene-therapy`, `cell-therapy`, `oncology-target`. The same event row can be re-classified by additional plays without duplicating it; each play's filter at view time picks up the `Categories / Tags` it cares about.
- Reuse existing Company Events columns. No new columns. The classification evidence lands in:
  - `Detail` — structured prose: classifier tier triggered, MeSH terms matched, serotype + transgene parsed from intervention name, primaryPurpose, studyType, brief-summary excerpt if used.
  - `Categories / Tags` — play slug(s) the row qualifies for + classifier-tier tag.
  - `Confidence` — high / medium / low.
  - `Signal State (raw)` — classifier tier id (e.g. `tier1_mesh_match`, `tier2_llm`, `tier3_reject`).
  - `Raw Payload` — full evidence-input JSON (the disambiguation field set from CT.gov for this trial).
- Is Latest behavior — yes, on re-run, append the new verdict row with `Is Latest=true` and flip prior `target_classification` rows for the same External ID + Categories/Tags(play) to `Is Latest=false`. Full audit trail; never mutate the prior row in place.

**Q2 — Companies row default state. Resolved:**

- **Option (a)** — upsert every trial that passes the source-level Essie hard filters as a `candidate` Companies row. `Canonical Status = candidate`, `Verification Status = needs_verification`. L1 does NOT decide canonical state.
- Rationale: Principle 2 of the engine principles is "cast wide; the next source matters more than the next classifier." The verification pass is the gate, not L1. Holding `low` confidence in events-only state hides candidates from view-time filters that may still want to evaluate them.

**Q3 — build vs prototype. Resolved:**

- **Option (a)** — build against the live workflow `9gcmEjq1lvOY2jZS`. No sandbox. Iteration loop is faster against real Airtable surface, and the `Canonical Status = candidate` gate prevents leakage downstream until verification.

## Scope

- **Workflow:** `9gcmEjq1lvOY2jZS`
- **Tables written:**
  - Companies (`tblnj3YlOI3thjrXp`) — upsert as candidate, no verdict columns touched
  - Company Events (`tblnzX2b2kqNGzW6r`) — two event rows per trial
  - Enrichment Runs (`tblEVSEqetmu4ScHe`) — one summary row per execution

## What to build — step by step

### Step 1 — Broaden search at source (multi-query union)

Replace the single `query.intr=AAV` call with a union of these queries against CT.gov v2 `/studies`:

- `query.intr=AAV`
- `query.intr="adeno-associated"`
- `query.intr=Dependovirus`
- `query.intr=(AAV1 OR AAV2 OR AAV3 OR AAV4 OR AAV5 OR AAV6 OR AAV7 OR AAV8 OR AAV9 OR AAVrh10 OR rAAV)`
- `query.term=("gene therapy" AND vector)`

Dedupe results by NCT ID before passing to Step 2.

Note for portability: the search queries above are play-specific (AAV gene therapy is Teknova's first play). When a second play is added (cell therapy, oncology, etc.), the search-query set becomes per-play config. For this ticket, hard-code the AAV set; flag the future-config issue in your handoff. The classification logic below is already play-aware via `Categories / Tags`.

### Step 2 — Narrow at source with Essie filters

Apply `filter.advanced` to each query above:

- `AREA[InterventionType](GENETIC OR BIOLOGICAL)` — drops DRUG/DEVICE/PROCEDURE noise
- `AREA[StudyType]INTERVENTIONAL` — drops observational, expanded-access
- `AREA[Phase](PHASE1 OR PHASE2 OR PHASE3 OR EARLY_PHASE1)` — drops preclinical-only registries

These three filters reduce the working set substantially before any classifier runs.

### Step 3 — Fetch the expanded CT.gov field set

Replace the current 10-field `fields=` parameter with this expanded set (paths per `reference/ctgov-v2-fields.md`):

**Identification:**
- `protocolSection.identificationModule.nctId`
- `protocolSection.identificationModule.briefTitle`
- `protocolSection.identificationModule.officialTitle`
- `protocolSection.identificationModule.secondaryIdInfos`

**Sponsors:**
- `protocolSection.sponsorCollaboratorsModule.leadSponsor`
- `protocolSection.sponsorCollaboratorsModule.collaborators`
- `protocolSection.sponsorCollaboratorsModule.responsibleParty`

**Status + dates:**
- `protocolSection.statusModule.overallStatus`
- `protocolSection.statusModule.whyStopped`
- `protocolSection.statusModule.startDateStruct`
- `protocolSection.statusModule.primaryCompletionDateStruct`
- `protocolSection.statusModule.lastUpdatePostDateStruct`

**Design (classification critical):**
- `protocolSection.designModule.studyType`
- `protocolSection.designModule.phases`
- `protocolSection.designModule.designInfo.primaryPurpose`
- `protocolSection.designModule.enrollmentInfo.count`
- `protocolSection.designModule.enrollmentInfo.type`

**Interventions (classification critical):**
- `protocolSection.armsInterventionsModule.interventions.type`
- `protocolSection.armsInterventionsModule.interventions.name`
- `protocolSection.armsInterventionsModule.interventions.description`
- `protocolSection.armsInterventionsModule.interventions.otherNames`

**Conditions:**
- `protocolSection.conditionsModule.conditions`
- `protocolSection.conditionsModule.keywords`

**Description (classification critical for medium-confidence tier):**
- `protocolSection.descriptionModule.briefSummary`

**Geography:**
- `protocolSection.contactsLocationsModule.locations.country`

**Oversight:**
- `protocolSection.oversightModule.isFdaRegulatedDrug`

**Derived (MeSH-driven classification):**
- `derivedSection.interventionBrowseModule.meshes`
- `derivedSection.conditionBrowseModule.meshes`

### Step 4 — Run the tiered classifier in-workflow, write `target_classification` event row per trial

Classifier tiers (deterministic first, LLM fallback for medium):

- **Tier 1 — high confidence (deterministic):**
  - `derivedSection.interventionBrowseModule.meshes[].term` contains `Dependovirus`
  - AND `derivedSection.conditionBrowseModule.meshes[].term` contains `Genetic Therapy` OR equivalent
  - AND any `armsInterventionsModule.interventions[].type` ∈ {`GENETIC`, `BIOLOGICAL`}
  - AND `designModule.designInfo.primaryPurpose` == `TREATMENT`
- **Tier 2 — medium confidence (LLM-augmented):**
  - Tier 1 partial match (e.g. intervention.type passes but MeSH ambiguous), OR
  - Bare-name match (AAV in intervention.name but missing MeSH)
  - Route `briefSummary` + intervention.name + conditions to an LLM classifier (Anthropic Claude via existing credential) with the prompt: "Does this clinical trial study an AAV-vectored gene therapy product as its primary intervention? Reply JSON {verdict: 'yes'|'no'|'unclear', reason: '...'}."
  - LLM yes → medium; LLM no → low / reject; LLM unclear → medium with reason captured.
- **Tier 3 — low / reject (deterministic):**
  - All interventions have type ∈ {`DRUG`, `DEVICE`}, OR
  - `primaryPurpose` ∈ {`BASIC_SCIENCE`, `DIAGNOSTIC`}, OR
  - Eligibility-only AAV reference (the `briefSummary` mentions AAV only in the context of anti-AAV antibody titer or eligibility — caught by LLM tier).

For every trial that passes Step 1+2, write **two event rows** to Company Events.

**Row A — `clinical_trial_status` (existing event type; extend):**

| Field | Source |
|---|---|
| Event Type | `clinical_trial_status` |
| Event Date | trial start date or last update date |
| Provider | `clinicaltrials.gov` |
| Company | linked Companies row by sponsor name |
| External ID | NCT |
| Title | briefTitle |
| Study Type | studyType (INTERVENTIONAL / OBSERVATIONAL / EXPANDED_ACCESS) |
| Intervention Type | comma-joined intervention.type values |
| Intervention Names | newline-joined intervention.name values |
| Conditions | newline-joined conditions |
| Signal State (raw) | overallStatus |
| Vitality | normalized: active / ended / unknown |
| Source URL | `https://clinicaltrials.gov/study/<NCT>` |
| Raw Reference | `ctgov:<NCT>` |
| Detected At | run timestamp |
| Is Latest | true on most recent observation per NCT |
| Detail | freeform summary (sponsor, phase, status, date) |
| Raw Payload | full CT.gov study JSON, capped at 95K |

**Row B — `target_classification` (NEW event type; engine-layer name):**

| Field | Source |
|---|---|
| Event Type | `target_classification` (typecast=true auto-creates the singleSelect option) |
| Event Date | run timestamp (this is a verdict event, not a trial event) |
| Provider | `clinicaltrials.gov` |
| Company | linked Companies row |
| External ID | NCT |
| Title | classifier-tier label (e.g. `tier1_mesh_match`, `tier2_llm_yes`, `tier3_reject`) |
| Categories / Tags | newline-joined: play slug (`aav-gene-therapy`), classifier tier id |
| Confidence | high / medium / low |
| Signal State (raw) | classifier tier id verbatim |
| Detail | structured prose: MeSH terms matched, serotype parsed from intervention name, transgene parsed, primaryPurpose, studyType, intervention.type list, brief-summary excerpt (first 500 chars) if LLM was used, LLM verdict + reason if applicable |
| Names | parsed serotype (e.g. `AAV5`) on one line, parsed transgene (e.g. `hFIXco`) on the next |
| Source URL | `https://clinicaltrials.gov/study/<NCT>` |
| Raw Reference | `ctgov:<NCT>:target_classification:<run_id>` |
| Detected At | run timestamp |
| Is Latest | true; flip prior `target_classification` rows for the same NCT + same play slug to false |
| Raw Payload | full classifier-input JSON (the CT.gov disambiguation field set + LLM response if applicable), capped at 95K |

### Step 5 — Upsert Companies row as candidate

For every trial that passes Step 1+2, upsert one Companies row keyed by sponsor name (apply existing sponsor-name normalization; flag unresolved/parent-collision sponsors for review). Set:

- `Canonical Status = candidate`
- `Verification Status = needs_verification`

L1 does NOT write `target_classification` verdicts back to the Companies row. The row stays a thin entity surface. View filters and the verification workflow read the events table.

### Step 6 — Write Enrichment Runs summary

One row per execution with: queries run, total NCTs returned, dedupe count, post-Essie count, per-tier counts (high/medium/low), Anthropic call count + token usage, total event rows written, total Companies upserts, run duration, workflow + execution ID. Mark `Is Latest` on the most recent run.

### Step 7 — Deploy via credential-preserving REST PUT

- Capture full workflow JSON before edit.
- Modify nodes per Steps 1–6. Preserve every `credentials` object on every node verbatim.
- PUT with modified JSON. Settings: keep only `executionOrder`.
- Immediately GET the workflow via raw API and verify:
  - Every credential object is intact on every node.
  - Node count + connection count match expectation.
  - The new fields and event-type write paths are present.

## Hard rules

- **REST PUT and MCP `update_workflow` both wipe credentials unless preserved.** Mandatory read-back after deploy.
- **Anthropic spend authorization required.** Tier 2 LLM classification calls Claude. Smoke-run against ≤5 trials first; report Anthropic usage; await Nick's go for the full run.
- **CT.gov is free; the multi-query union is fine cost-wise.** Honor CT.gov rate limits (no published hard cap, but stay polite — 1-2 requests/sec).
- **Never trust `get_workflow_details` for credential state.** It strips credentials in the response; raw API GET is the truth.
- **Engine-layer vocabulary stays tenant-agnostic.** Do not name the event type `aav_classification` or `aav_evidence`. Use `target_classification`. Per-play identity in `Categories / Tags`.
- **Do not write any verdict column on the Companies row.** `Verification Status`, `Currency Status`, `Custom Classification`, etc. are out of scope for L1 under the new model. The Phase-2 plan handles their removal.
- **Do not delete or rename the existing `clinical_trial_status` writes.** Extend them with the additional fields; the prior 188 event rows must remain compatible.

## Verification gate

Smoke run on a constrained query (e.g. one sponsor — Spark Therapeutics or a known-AAV company):

1. CT.gov queries fire across all 5 search variants; deduped result count reported.
2. Essie filters drop preclinical / DRUG-only / OBSERVATIONAL — count drop reported.
3. For one representative trial:
   - One `clinical_trial_status` event row with all 18 fields populated (existing 12 + new 6).
   - One `target_classification` event row with tier label, confidence, structured Detail, serotype/transgene parsed.
   - Companies row carries `Canonical Status = candidate`, `Verification Status = needs_verification`.
4. Enrichment Runs row written with per-tier counts.
5. Workflow credentials intact on every node post-deploy.
6. Report `versionId` after deploy.

## Handoff

Write your handoff to `practices/revops/workflows/L1-event-evidence/HANDOFF.md` (no date suffix in the file name; the date goes in the document header — this is the canonical handoff for this build).

Include:
- Workflow `versionId` after deploy.
- Per-node credential binding report (empty `credentials:{}` = wipe).
- Smoke-run execution ID + per-node item counts read from the execution's runData.
- The two event rows from the representative trial (record IDs + key fields).
- The Enrichment Runs row from the smoke.
- Any deviations from this spec, with reason.
- Do NOT claim "verified" / "working" / "ready for next step." State the references; the orchestrator decides.

## Out of scope

- Verification pass workflow (Step 6 of the prior handoff). Separate ticket. The `target_classification` events this workflow writes are the verification workflow's input.
- Sponsor-name normalization improvements (parent/subsidiary alias collapse). Flagged for separate ticket.
- Migration of existing `needs_verification` Companies rows to the new evidence model. Phase-2.
- Phase-2 demotion / removal of verdict columns on Companies. Phase-2.
- Search-query-set externalization (moving the 5 query variants into per-play config). Tracked here; future ticket when play #2 lands.
- The biotech-vocab audit at engine level (Verification Status, Vector Evidence Clause, AAV Segment, etc.). Separate ticket.
