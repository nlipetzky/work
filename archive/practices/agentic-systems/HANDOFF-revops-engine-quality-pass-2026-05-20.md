# HANDOFF — RevOps Engine quality pass (2026-05-20, late afternoon)

**For:** a fresh Boris session.  Surface-verify against the live n8n + Airtable state; agent narration is hypothesis until checked.

## Where things stand

The RevOps Engine has reached its first end-to-end working state on the Teknova AAV cohort:

- **L1 (CT.gov capture, n8n `9gcmEjq1lvOY2jZS`)** writes Company Events with full evidence + populates Companies via industry-sponsor rollup. The `Intervention Detail` field (added this session) carries the vector text from CT.gov's `interventions[].description`, which is the key signal that lets the AAV scanner correctly classify drug-coded interventions like PR001/LY3884961.
- **AAV scanner (n8n workflow, separate)** reads Company Events rows, runs Claude Haiku 4.5 against a per-record prompt, writes back `AAV Verdict`, `AAV Rationale`, `Activity Status`, `Activity Rationale`, `AAV Description`. Date math is pre-computed in a Code node upstream of the LLM (Haiku can't be trusted with calendar arithmetic at year boundaries). Output keys are ordered to put reasoning before structured commits where deliberation matters. ~2000+ events scanned.
- **Companies rollups** on RevOps Surface aggregate event-level AAV verdicts to company-grain: `AAV Event Count`, `AAV Active Event Count`, `Latest AAV Event Date`, plus a formula field `AAV Status (derived)` that labels each company `Active AAV` / `Former AAV` / `Not AAV`.
- **Enrichment workflow (n8n `Z6RROKx5omdfvhtn`)** matches Active AAV companies against Explorium, fetches firmographics + (for qualified companies) deep enrichment, writes 200+ fields back per company. Gate v1.9.0 (deployed this session) bypasses biotech filter for Active AAV companies, uses `locations_distribution` for US-presence checks instead of HQ-country alone, and supports a `Run Selected` manual override that bypasses biotech + geography (but NOT name-similarity).
- **Status state machine** on Companies: `running` (workflow flips at start), `enrichment_complete` / `archived_out_of_industry` / `rerouted_wrong_modality` / `needs_aav_review` / `needs_data_quality_review` (terminal). `Last Enriched At` is a Last Modified Time field scoped to `Enrichment Status` — auto-computed, never written. 90-day idempotency gate uses this. `Run Selected` self-clears at terminal (Map nodes emit `Run Selected: false`).

Current cohort: 64 Active AAV companies. Latest run processed 22 in a single execution.

## Live workflow versions

| Workflow | ID | Latest versionId | Status |
|---|---|---|---|
| L1 — Canonical AAV Discovery (CT.gov) | `9gcmEjq1lvOY2jZS` | (see GET) | `active: true` |
| Companies Enrichment (Explorium → Airtable) | `Z6RROKx5omdfvhtn` | `a4f4976c-efa2-4fa0-8497-432d7ad27fd3` (or later if patched) | `active: true` |
| AAV Relevance Scan | (Nick's webhook-driven scanner) | n/a — owner-managed | active |

**n8n active-runtime cache caveat:** when an active workflow is PUT'd via API, the runtime caches the OLD version for ~5 minutes before reloading. After every code edit, deactivate → wait 5s → reactivate, then trigger. Observed twice this session.

## Latest run state (the data)

Last enrichment execution (`83884`, post-deploy): 22 records, 0 errors. Breakdown:

- **3 enriched** (201 fields each) — Purespring (UK), VeonGen (Germany), Innopeutics (Korea). All foreign-HQ, all rescued by `Run Selected` manual override.
- **14 rerouted** — Sanofi, Orchard, CSL Behring, UniQure, Novartis Gene Therapies, AAVantgarde, Adverum, Vifor, RJK Biopharma, Avirmax, Gyroscope, InnoVec, Bionic Sight, BlackfinBio. Most ended at `rerouted_wrong_modality` because the page-scan modality classifier (Gate 2, after Qualify Company) didn't see "AAV" on the company's website.
- **5 archived** — Adrenas, Unlimited Biotechnology, Elisigen (no Explorium match → no firmographic data); Takeda Development Center Americas, Guangzhou Jiayin Biotech (caught by name-similarity → `needs_data_quality_review`).

Earlier executions also produced:
- 14 confirmed deep-enriched US Active AAV (REGENXBIO, 4D Molecular, Solid Biosciences, Astellas Gene Therapies, Encoded, Tenaya, Spark, Lexeo, Ultragenyx, NGGT INC., Affinia, Opus, Myrtelle, Elpida) — these are Ellie's immediate outbound list.

## Quality issues — status

From the 64-row Active AAV view audit, 5 quality issues were identified. Disposition:

| # | Issue | Status |
|---|---|---|
| 1 | Explorium misclassifications (wrong-entity fuzzy matches) | **Addressed** — Gate v1.8.0 added name-similarity check; bad matches now route to `needs_data_quality_review` |
| 2 | Real AAV companies failing geography gate (Sanofi, UniQure, Orchard, Takeda, etc.) | **Addressed** — Gate v1.9.0 uses `locations_distribution` for US presence check; `Run Selected` manual override bypasses geography |
| 3 | `needs_aav_review` backlog (gene-therapy companies whose websites don't say "AAV") | **Open — see "Findings to action" below.** Latest run shows this is now the dominant filter, not geography |
| 4 | `rerouted_wrong_modality` hidden targets (AbbVie, BioMarin, Innostellar, etc.) | **Open** — same root cause as #3, Gate 2 page-scan modality check is too aggressive |
| 5 | AskBio "disqualified" — appears suspect | **Open — not yet investigated** |

## Findings to action in the fresh session

### Finding A — Gate 2 (page-scan modality) is filtering Active AAV companies redundantly

The Active AAV bypass works on Gate 1 (biotech + geography in Qualify Company), but the workflow then runs `Check AAV Modality` against the company's website (Gate 2). If the website doesn't explicitly say "AAV", routes to `rerouted_wrong_modality`.

Problem: the AAV scanner has already verified these companies are doing AAV work (per CT.gov trials and PubMed publications). The website might not say "AAV" — many gene therapy companies just say "gene therapy". Running Gate 2 on these is redundant + filters out legitimate Active AAV companies based on weaker signal than what the scanner already evaluated.

**Recommended fix:** in `IF AAV?` or the upstream `Check AAV Modality` node, add a bypass: if the row has `_activeAAV = true` OR `_runSelected = true`, force `_modality = 'aav'` and route to deep enrichment. The scanner verdict at the Company Events row level is the higher-trust signal; the page scan is a redundant check.

Expected impact: would unblock the 14 currently-rerouted companies (Sanofi, Orchard, CSL Behring, UniQure, Novartis Gene Therapies, AAVantgarde, Adverum, Vifor, RJK Biopharma, Avirmax, Gyroscope, InnoVec, Bionic Sight, BlackfinBio) to deep enrichment on the next run.

Two of those 14 are name-mismatch suspects (Bionic Sight, Gyroscope) — see Finding B; the name-similarity gate should catch them before Gate 2 bypass fires.

### Finding B — Name-similarity threshold at boundary

Gate v1.8.0 name-similarity check fires when Jaccard `< 0.5`. Bionic Sight LLC matched to UK "Bionic Ltd" computed to Jaccard = exactly 0.5, didn't trigger.

**Recommended fix:** tighten the threshold to `< 0.6` in the Qualify Company `MIN_NAME_SIMILARITY` constant. Takeda and Guangzhou correctly fired at 0.5; raising to 0.6 catches Bionic and similar boundary cases without over-routing.

### Finding C — Adrenas / Unlimited Biotechnology / Elisigen — no Explorium match

These archived because Match Business returned no result, so firmographics were empty, so the workflow archived. Not a workflow bug — coverage gap in Explorium's business database for small/stealth biotechs.

**Recommended handling:** these need manual identification. Could add a fallback path (e.g., Crunchbase lookup, or LLM-based domain resolution) at the `IF Match Found?` FALSE branch, before the unmatched archive. Not urgent. For now, Ellie can hand-review and set Domain manually, then re-trigger.

### Finding D — AskBio disqualified — still unexplained

AskBio is a major AAV company (Bayer-owned). Was marked `disqualified` in the cohort. Not yet pulled. Worth a single-row inspection: pull the AskBio row, look at Classification Notes and last Qualify Company output to see why.

### Finding E — Adrenas-style empty-data archived rows still propagate

When Match Business returns nothing, Map Archive No AAV Unmatched (or similar) fires with all-null fields. The row gets `Enrichment Status: archived_out_of_industry` with no Industry, no HQ, etc. — looks like the row "lost data" if the user wasn't expecting this behavior. Not a bug, but worth documenting in the workflow notes or surfacing a different terminal status (e.g., `archived_no_match`) so it's distinguishable from "matched but out of industry".

## Engineering principles applied this session (carry forward)

- **Surface verification, not narration.** Every "this worked" was confirmed by GET-ing the live workflow + Airtable row, not by reading n8n's API response echo. Multiple times the n8n API said the data was written when in fact it wasn't (autoMap vs defineBelow, hidden columns, etc.).
- **n8n active-runtime cache.** After every PUT to an active workflow, deactivate → wait 5s → reactivate, then trigger. Observed at least twice this session that executions used pre-PUT code.
- **Auto-map vs define-below tradeoffs.** AutoMap forwards every JSON key the upstream Map node emits. Catches field-name mismatches as 422s. defineBelow silently drops unknown fields — bug-hiding behavior. Standardize on autoMap unless there's a clear reason to filter at the node level.
- **Last Modified Time fields are computed.** Never map to them in any Update node. They auto-update from configured watched fields.
- **Pre-compute deterministic math outside the LLM.** Date math in the AAV scanner moved to a Code node upstream of the model; eliminated arithmetic errors at year boundaries.
- **Key ordering matters for autoregressive models.** Verdict-first for snap classifications, rationale-first for deliberative ones (date bucketing). Match the ordering to the task shape.
- **Engine-vocabulary tenant-agnostic at the engine layer.** Industry vocabulary ("AAV", "gene therapy") lives in per-play prompts and per-tenant artifacts, not in engine schemas. Engine schemas use neutral terms (Event Type, Provider, Custom Classification, etc.).

## Resume point — first actions for fresh session

1. **Read this file.** And the engine principles at `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`.
2. **Confirm workflow state.** GET `Z6RROKx5omdfvhtn`, verify Gate v1.9.0 is live, verify all 6 Airtable nodes have credentials bound. Check whether Nick deactivated/reactivated since the last edit.
3. **Address Finding A (Gate 2 bypass).** This is the highest-leverage open item — would unblock 14 companies to full enrichment on the next pass.
4. **Address Finding B (threshold tightening).** Trivial constant change in Qualify Company; pair with #3.
5. **Investigate Finding D (AskBio).** Quick single-row pull, diagnose, decide.
6. **After #3-4 land:** trigger an enrichment pass on the rerouted cohort (clear `Enrichment Status` on the 14 rows, re-run). Verify Sanofi/Orchard/etc. flip to enriched_complete.
7. **Then move to:** Finding E (better status code for no-match cases) and Finding C (Crunchbase fallback for unmatched companies). Both are lower-priority refinements.

## Out of scope for fresh session

- Don't touch the AAV scanner — it's working as designed.
- Don't touch L1 — same.
- Don't change the rollup fields on Companies or the formula field; those are working.
- Don't propose automation of the trigger flow yet (Nick wants manual triggers until data quality stabilizes).

Idle-waiting on Nick's instruction for the fresh session is the correct state. Don't invent work.
