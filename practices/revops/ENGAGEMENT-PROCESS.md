# RevOps engagement process

**Operating version:** 2026-05-13
**Maintained by:** Nick
**Reference implementation:** Teknova / AAV outreach play (in flight)

This is the master operating doc for a RevOps engagement. It describes how we take a client from "signed" to "shipping outreach" with intermediate artifacts produced at each phase. Two derivatives come from this doc:

- **Client-facing one-pager** ... what a prospect sees during the sales conversation
- **Operator runbook** ... what the operator does step by step, with which skills

Both are filters of this doc. Update this first, propagate to derivatives second. The 9-phase structure (A through I) is stable; every place we diverge intentionally from Explorium's prescription is flagged in the "Divergences from Explorium" section at the end.

---

## The shape of an engagement

Phases A through C are mostly linear. Phases D through F run as a tight loop (Gate -> Review -> Adjust -> Re-run) until the client SME is confident in the classifications. Phases G through I are ongoing once outreach goes live.

A typical first engagement runs about 4-6 weeks from intake to first send, depending on how cleanly the client can articulate their ICP and offer up front. Subsequent batches with the same client compress toward 1-2 weeks because the operating docs already exist.

---

## Folder convention

Unchanged from current doc. Each client engagement lives at `accounts/clients/<client-slug>/` with `CLAUDE.md`, `sources/`, `artifacts/`, `automation/`, `revops/`.

---

## Operating-doc pattern

Each play within an engagement produces four live operating docs that evolve over time (one added vs. prior version):

- **Offer** ... what is being pitched (locked once; rarely changes mid-play)
- **Segment criteria** ... who is in scope (locked once; rarely changes mid-play)
- **Taxonomy and gate rules** ... the classification ruleset (evolves via Phase E feedback)
- **Sourcing rules** ... which queries and signals we trust (evolves via Phase E feedback)
- **Gate results** ... per-run snapshots (Airtable Enrichment Runs + markdown pointer)

Operating docs are not approve-once-and-freeze. The taxonomy and sourcing rules are operating rulesets the client SME influences by reacting to gate results.

---

## Phase A: Intake

Unchanged.

**Purpose:** align on the business problem, scope, ICP intuition, success criteria.
**Duration:** 1-2 weeks.
**Artifacts:** intake doc, NotebookLM notebook with source materials indexed.
**Handoff:** scope agreed in writing, sponsor and SMEs identified.

---

## Phase B: Play definition

Unchanged in structure. One clarification added.

**Purpose:** translate intake into a structured play with executable rules.
**Duration:** 3-7 days.

**Skills used:** `offer-extract`, `segment-criteria`, taxonomy authoring (still manual; future skill candidate).

**Artifacts produced:**
- Offer artifact (`revops-offer-<play-slug>.md`)
- Segment criteria artifact (`revops-segment-<play-slug>.md`)
- Modality / classification taxonomy (`revops-modality-taxonomy-<play-slug>.md`)
- Sourcing rules (`revops-sourcing-rules-<play-slug>.md`)

**New clarification:** the segment criteria document is source-agnostic by contract (no provider names, no column references). The taxonomy document is the place where provider-specific vocabulary lives (e.g. Explorium-accepted `linkedin_category` and `naics_category` values come from an Autocomplete probe). Keep that separation: criteria belong to the play, taxonomy belongs to the providers the play uses.

**Handoff to Phase C:** taxonomy and sourcing rules in effect, ready to discover.

---

## Phase C: Discovery

Structurally unchanged. Two operational additions: cost-tracking discipline and an optional TAM pre-flight.

**Purpose:** build the initial candidate list across the full available universe.
**Duration:** 1-2 days.

**Operator activities:**
1. **Optional pre-flight: TAM sizing.** When the discovery target sits inside a single provider's catalog (Explorium being the primary case), run that provider's statistics endpoint first to confirm the universe is large enough to justify the run. Skip if the play sources from many providers, since the post-dedupe count is itself the TAM.
2. **Run all available providers in parallel.** Clay, Exa, clinicaltrials.gov, Crunchbase, Explorium. Each provider has different strengths; using only one produces a partial market.
3. **Check live credit balance before spending.** Stale credit numbers waste time and block work. Do not trust cached balances or the operations inventory until they are verified live.
4. **Estimate the spend.** Number of queries x credits per query. If projected spend exceeds the standing spend authority ($5 today), stop and get Nick's approval.
5. **Dedupe on canonical domain.** Strip protocol, www, trailing slashes; lowercase.
6. **Flag overlap.** Each result tagged `existing_in_play`, `existing_not_in_play`, or `new`.
7. **Apply known disqualifiers.** Named-account exclusions from the client CLAUDE.md, prior-play exclusions.

**Skills used:** `company-discovery`.

**Artifacts produced:**
- Initial candidate list in the engagement's Airtable Companies table
- Discovery summary (`revops-discovery-summary-<play-slug>.md`)
- Disqualification flags applied but records preserved (full universe visible before and after)

**Handoff to Phase D:** list loaded, ready for classification.

---

## Phase D: Classification (Gate)

Restructured to codify the two-stage gate pattern that the Teknova workflow proved out.

**Purpose:** triage every candidate into pass, reroute, archive, or needs_review using the taxonomy from Phase B.

**Duration:** minutes to hours per run.

**The gate is a two-stage funnel.** Run the cheaper, more deterministic checks first. Spend credits only on records that survive.

**Stage 1: industry / geography filter.** Light enrichment (firmographics only) per candidate. Filter on NAICS prefix, industry keywords, and geography per the play's segment criteria. Records that fail Stage 1 archive immediately. No deeper credit spend.

**Stage 2: modality verification.** For Stage 1 survivors, fetch from the company's website (multi-URL fetch across pipeline, platform, science, technology, about subpaths) and scan for play-specific vocabulary anchors, mechanisms, and exclusions. Five-way classification (see outcome buckets below) per the play's taxonomy.

**Validity gate after Match.** A null `business_id` from Explorium's Match is normal, not an error. Route unmatched records to a parallel web-only path that still attempts modality verification from public content. Real companies missing from the provider catalog should not be silently archived.

**Parent-company short-circuit.** Maintain a per-play list of known parent-company / tools-vendor domains (Thermo Fisher, Lonza, Catalent, Charles River, Merck Millipore, Sartorius, Cytiva for biotech plays). Domains matching this list route to `needs_data_quality_review` before any fetch attempt.

**Outcome buckets (five-way, play-parameterized):**

| Bucket | Meaning | Downstream |
|---|---|---|
| `enrichment_complete` | Play-required modality confirmed | Cadence (after Phase F) |
| `rerouted_wrong_modality` | Confirmed industry but wrong modality | Alt-play pool, no deep-enrich spend |
| `needs_<play>_review` | Branded as the play's domain, no specific modality term visible | Manual SME review (Phase E) |
| `needs_data_quality_review` | Domain matches a parent-company / tools-vendor pattern | Manual correction queue |
| `archived_out_of_industry` | Failed Stage 1, OR unmatched with no recoverable web signal | Archive |

**Company tier output.** Beyond the five-bucket classification, every record exits Phase D with an explicit company tier (A / B / C / excluded), scored against the company-scope dimensions of the Cohort Quality framework (`practices/revops/cohort-quality-framework.md`). The bucket and the tier compose as follows:

| Bucket | Default tier | Lift / drop rules |
|---|---|---|
| `enrichment_complete` | Tier B baseline | Lift to Tier A if a recent company-level signal is present within its recency window OR the structural-signal-unavailability test passes |
| `needs_<play>_review` | not tiered yet | Tier assignment deferred until Phase E SME confirms; on confirm, treat as `enrichment_complete` and score; on deny, treat as `rerouted_wrong_modality` |
| `needs_data_quality_review` | not tiered yet | Tier assignment deferred until the domain is corrected; re-run Phase D against the corrected record |
| `rerouted_wrong_modality` | excluded from this play's cohort | Available for alt-play pool, where it gets its own Phase D run |
| `archived_out_of_industry` | excluded | Archive |

The company tier is what Phase F inherits when scoring the cohort tier. The five-bucket classification is what Phase E's SME reviews and what the per-run report exposes for client audit.

**Per-record fields populated:** Modality, Modality Source (provenance `<tool>:<sub_signal>`), Modality Confidence (high/medium/low), Detected Keywords, Classification Run ID, Gate Version (semver), Classification Notes (structured prose narrative for human audit), Company Tier (A/B/C/excluded), Company Tier Reason (which dimension scores produced the tier).

**Per-run artifact:** row in the engagement's Airtable Enrichment Runs table with the summary report (bucket counts, tier distribution, gate version, cost consumed).

**Handoff to Phase E:** classifications populated, needs_review bucket ready for SME eyes.

---

## Phase E: Review

Structurally unchanged. One addition: pre-SME LLM review pass on `needs_<play>_review` to amortize SME time.

**Purpose:** the client's domain SME confirms or denies uncertain classifications; taxonomy adjusts based on what was missed.

**Duration:** 30-90 minutes per run.

**Operator activities:**
1. **Optional pre-pass: LLM review on `needs_<play>_review`.** A narrow-responsibility agent reads each record's fetched web content + Classification Notes and proposes a disposition (confirm / deny / escalate). The SME sees the agent's proposed dispositions, not the raw notes. Use this only on the `needs_<play>_review` bucket; deterministic buckets do not need LLM input.
2. **Surface buckets to SME.** Airtable filtered view per bucket.
3. **Capture confirm / deny decisions.**
4. **Translate decisions into operating-doc updates.** Taxonomy change log, sourcing rules change log.
5. **Flag systemic patterns.** "The gate keeps missing X-class companies; we need to adjust Y rule."

**Artifacts produced:**
- Updated taxonomy with change log entries
- Updated sourcing rules with change log entries
- Confirmed classifications in Airtable

**Handoff to Phase F:** clean classified list ready for enrichment.

---

## Phase F: Enrichment

Restructured to make the Cohort Quality framework (at the contact scope) the explicit measurement, and to call out ABM-expansion (contacts at qualified accounts) as a named sub-step.

**Purpose:** deep enrichment of pass-bucket records and the contacts at them, scored at the contact scope against the four-dimension Cohort Quality framework (`practices/revops/cohort-quality-framework.md`).

**Duration:** hours per run.

**Sub-stages:**

**F.1 — Deep company enrichment.** Run remaining enrichment endpoints (technographics, competitive landscape, strategic insights, workforce trends) on pass-bucket records only. Surface signals: recent funding, IND filings, leadership hires, conference presence, publications.

**F.2 — ABM expansion: contact discovery at qualified accounts.** For each qualified company, fetch prospects filtered by the segment criteria's function and seniority bands. Validity gate: if a prospect ID is empty, skip; do not waste credits.

**F.3 — Contact enrichment.** Profiles first (free or near-free), then contacts (email and phone, expensive). Use the email waterfall: Explorium -> Hunter -> Apify -> Apollo, in that order, stopping at the first successful find.

**F.4 — Contact-quality scoring.** Every contact carries a composite score across the four dimensions:

- **Data hygiene** (email deliverable, employment current, title and function match, tenure >= 12 months)
- **ICP fit** (function, seniority, company segment verified by domain review)
- **Suppression state** (no active SF opportunity, no current customer, no DNC, no active cadence, no recent BD)
- **Signal and intent** (recent funding, leadership hire, IND filing, trial registration, conference, content engagement)

Records that fail any suppression check are excluded outright, not tiered.

**F.5 — Tier sort.** Tier A: hygiene 95%+, all fit pass, all suppression pass, signal present (or noted as structurally unavailable). Tier B: hygiene 80%+, fit pass, suppression pass, signal weaker. Tier C: hygiene 65%+, fit partial, suppression pass.

**Tier A list size is an estimate, not a target.** The universe determines how many records there are to activate.

**Skills used:** `enrichment-providers`.

**Provider stack:** Explorium (primary for company data and contact discovery), Hunter (email validation), Apollo (waterfall fallback), Exa (semantic web verification), Perplexity (research and list validation), Apify (LinkedIn enrichment when Explorium lacks fields), clinicaltrials.gov / PubMed / Google News (free signals). Clay is not in this stack.

**Artifacts produced:**
- Enriched company records with signals
- Enriched contact records tier-sorted
- Per-contact evidence trail (which provider supplied which field)
- Quality report with diagnostic metrics (Tier A count, exclusions by suppression dimension, etc.)

**Handoff to Phase G:** Tier A and Tier B contacts ready for outreach generation.

---

## Phase G: Outreach generation

Restructured to formalize the narrow-responsibility agent split: research first, then write.

**Purpose:** produce per-company, per-contact outreach copy aligned to the offer and the signal that justifies the outreach.

**Duration:** 1-3 days for a typical batch.

**The two-agent split.** Outreach generation is not a single LLM call. It is two narrow-responsibility agents in sequence:

**Agent 1: per-contact research.** Reads the enriched bundle (company signals, contact profile, LinkedIn activity, recent publications). Produces a structured research note: which signal justifies the outreach, the contact's likely angle, any pain points to reference, any disqualifying context.

**Agent 2: per-contact draft.** Reads the research note plus the play's offer artifact and voice samples. Produces one message per sequence step: subject, body, recipient. Soft CTA aligned to the offer's `the ask` section.

**Why split:** an LLM asked to research + write in one call produces generic copy that names signals without using them. Splitting the responsibilities improves both halves and makes each debuggable in isolation.

**Output format:** drafts only. Never auto-send. The drafts are reviewed by Nick (for voice fidelity) and then by the client SME if voice is unsettled.

**Skills used:** `creative-copy` today; future split into `outreach-research` and `outreach-draft` (not yet formalized).

**Artifacts produced:**
- Per-contact research notes
- Per-contact draft sequences
- Cadence configuration (touches, timing, channel mix)

**Handoff to Phase H:** drafts approved, ready to load into the client's outreach tool.

---

## Phase H: Send and track

Unchanged in shape; clarified the boundary.

**Purpose:** push outreach into the client's tool, monitor delivery and replies.

**The send approval boundary.** Phase G produces drafts. Phase H pushes drafts into the client's outreach tool (HeyReach, Apollo Sequences, Salesloft, Lemlist, Outreach). Send approval lives in the client's tool, on the client's side. The system does not auto-send.

**Operator activities:**
- Push records to outreach tool
- Monitor delivery, bounce, reply rates
- Escalate reply patterns to the client

**Tools used:** n8n workflows for outreach-tool integration.

**Artifacts produced:**
- Outreach sync logs
- Reply data feedback into Phase I

---

## Phase I: Iteration

Unchanged.

**Purpose:** review what worked, adjust taxonomy, sourcing, and copy; plan the next batch.

**Operator activities:**
- Review reply patterns by signal type, modality bucket, sequence position, tier
- Update operating docs (change log entries on taxonomy, sourcing, gate, copy)
- Plan next-batch scope

**Handoff to Phase C** (or Phase B if scope changes meaningfully).

---

## Divergences from Explorium's prescription

Explorium's NotebookLM teaches a five-template GTM agent stack (Slack, Inbound, ABM Expansion, Meeting Prep, Outbound), each variant of the same skeleton: Match -> Validity Gate -> Light Enrich -> Qualify -> Deep Enrich -> Two-agent message -> Draft. The skeleton overlaps with our process at a high level. The list below names every place we intentionally diverge and why.

**1. Five-bucket gate vs. binary qualify.**
Explorium prescribes `hot | nurture | cold` from an LLM agent at the qualify stage. We use a five-bucket deterministic gate (`enrichment_complete`, `rerouted_wrong_modality`, `needs_<play>_review`, `needs_data_quality_review`, `archived_out_of_industry`).
**Why:** in precision-targeted domains, "cold" hides three distinct disqualification reasons (wrong industry, wrong modality, data-quality issue) and "nurture" hides records that genuinely need human eyes. Collapsing them into one bucket loses the signal that drives Phase E review and taxonomy adjustment.
**How to apply:** keep the five-bucket gate for plays where modality precision matters. For plays where a coarse fit-or-not bucket is enough, fall back to Explorium's binary at the cost of losing Phase E feedback granularity.

**2. Keyword-first gate vs. LLM-first qualify.**
Explorium prescribes an LLM agent reading the enriched bundle and outputting a score. We use a deterministic keyword + NAICS gate that does not call an LLM at qualify time.
**Why:** keyword gates are auditable, cheap, version-controlled, and the SME (Ellie at Teknova) can argue with them. LLM scoring is opaque and expensive at scale. We do use an LLM, but as a pre-SME pass on the `needs_<play>_review` bucket only, where the deterministic gate ran out of signal.
**How to apply:** use deterministic gates wherever the play has a well-defined modality vocabulary. Use LLM scoring only where vocabulary is too fuzzy to encode.

**3. Multi-provider sourcing vs. provider-native.**
Explorium prescribes Match (known target) or Fetch (new discovery) within their own database. We run multi-provider discovery (Clay, Exa, clinicaltrials.gov, Crunchbase, Explorium) in parallel and dedupe on domain.
**Why:** in life sciences and adjacent domains, no single provider catalogs stealth, preclinical, or recently-pivoted companies completely. Single-provider sourcing misses the long tail. The dedupe step makes multi-provider scaling cheap.
**How to apply:** always run all available providers unless cost forces otherwise. Even then, Explorium-only is a degraded mode, not the default.

**4. Validity gate routes, does not skip.**
Explorium prescribes an IF node after Match that skips the loop if `business_id` is empty. Our gate routes unmatched records to a parallel web-only path that still attempts modality verification.
**Why:** real companies missing from Explorium were getting archived as "match failed" without checking the web. The web path catches them.
**How to apply:** never skip on a null match. Route to the web path; archive only after the web path also fails.

**5. Parent-company short-circuit.**
Not addressed by Explorium. We maintain a per-play list of parent-company / tools-vendor domains and route them to `needs_data_quality_review` before any fetch attempt.
**Why:** parent-company domains burn fetch time and produce misleading reviews ("AAV not found at thermofisher.com" is meaningless). The short-circuit saves credits and SME time.
**How to apply:** every play that operates in a domain with consolidated tools vendors needs its own short-circuit list. Biotech's list is in `match-qualify-enrich.md`.

**6. Contact-quality framework.**
Explorium prescribes light + deep enrich but does not prescribe a tiered cohort-quality framework. Our four-dimension Cohort Quality framework (hygiene, fit, suppression, signal) scored at both company and contact scopes with Tier A/B/C sort is the explicit standard.
**Why:** "X% solid at the list level" is not a meaningful measurement. Per-contact tiering against four dimensions is what the work runs against.
**How to apply:** every Phase F output carries per-contact dimension scores and a tier assignment. The composite is the measurement, not the aggregate.

**7. Cadence / sequencing / deliverability / reply handling.**
Explorium explicitly does not teach this ("covered in live hackathons, not course material"). We treat this as Phases H and I.
**Why:** Explorium is a data provider; we are an outbound system operator. The gap is our scope.
**How to apply:** Phase H pushes to the client's tool with cadence config. The client tool handles send approval. Phase I closes the loop on reply patterns.

**8. Draft, never auto-send.**
This is the one prescription we adopt verbatim. Phase G produces drafts. Phase H pushes them to the client's tool. The client's tool handles send approval. No path in the system auto-sends.

**9. Narrow-responsibility agent split.**
Explorium prescribes splitting research from writing. We adopt this for Phase G. Future skills will be split: `outreach-research` then `outreach-draft`. Today this is one `creative-copy` step that we should refactor.
**How to apply:** when the outreach-generation skill is rewritten, split it.

**10. AI agent inside `Loop Over Items` batch size 1.**
Operational n8n rule. AI agent nodes do not auto-paginate. The workflow must wrap them in `Loop Over Items` with batch size 1 or it will process item 1 and silently drop the rest.
**How to apply:** every n8n workflow that feeds multiple records into an AI agent uses `Loop Over Items` batch size 1. No exceptions.

---

## What is not in this doc yet

- **Phase G, H, I** are sharper than the prior version but still pre-production. Fill in after the first Teknova send cycle.
- **Multi-tenancy.** When this process runs for client #2 in parallel with client #1, what changes? Addressed once a second engagement starts.
- **Pricing and engagement model.** Separate doc.
- **Outreach tool playbooks.** Per-tool config (HeyReach, Apollo, Salesloft) gets its own reference docs.
- **Automation roadmap.** Where each manual step today becomes a tool tomorrow.
- **Meeting Prep Agent archetype.** Explorium ships one; we don't. Possible future product, not part of an outbound play.

---

## Change log

| Date | Change | Reason |
|---|---|---|
| 2026-05-11 | Initial scaffold | First reference implementation (Teknova AAV) in flight |
| 2026-05-13 | Major revision. (1) Codified the two-stage gate in Phase D with five-bucket outcomes and a Company Tier output. (2) Embedded the Cohort Quality framework (formerly Contact Quality, extended to score at both company and contact scopes) as the measurement standard inside Phase F. (3) Split outreach generation in Phase G into research-agent and writer-agent (narrow-responsibility split). (4) Added optional Explorium TAM pre-flight in Phase C. (5) Added optional LLM pre-pass on `needs_<play>_review` in Phase E. (6) Added Divergences-from-Explorium section. | Comparison against Explorium NotebookLM prescription + lessons from Teknova gate v1.6.0 production run + cohort-framework unification. |
