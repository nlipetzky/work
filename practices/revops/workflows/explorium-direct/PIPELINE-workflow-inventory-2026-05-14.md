# Pipeline workflow inventory: ICP intelligence, source, enrich, contact

**Date:** 2026-05-14 (revised 2026-05-15)
**Companion doc:** `RESEARCH-consensus-enrichment-architecture-2026-05-14.md` (the why).
**Purpose:** A tenant-agnostic, provider-agnostic map of the RevOps pipeline workflows. This inventory is a template used across multiple client engagements. Per-tenant configuration and a per-tenant criteria artifact control what flows through it; the workflow shapes do not change per tenant.

---

## Locked decisions

- **Tenant config lives in Airtable** (a config table in the tenant base).
- **One Airtable base per tenant.** RevOps Surface (`appYBYH3aOHhTODAw`) is the base for the current (Teknova AAV) engagement. There is no separate "Teknova base."
- **RevOps Surface is the working surface.** It is where sourced and enriched state is visible. Source workflows write directly to it. There is no separate staging table. CSV export and eventual Supabase export are downstream and out of scope here.
- **Provider waterfalls are chained `Execute Workflow` calls**, one micro-workflow per provider, not a Switch node.
- **Doc moves** to `practices/revops/workflows/PIPELINE-workflow-inventory.md` once locked.

### Three-layer ownership lock (do not violate)

The criteria intelligence is split into three things in three places. Explorium-Direct owns only the third.

- **Criteria artifact schema (the contract).** Tenant-agnostic. Defines required structure including the mandatory machine-readable detection section (positive signals, negative signals, disambiguation rules, working definitions, each tagged by consumer and recall/precision bias) plus a versioned changelog with source provenance. Authored in the **agentic-systems session**. Lands at `practices/revops/schemas/`. Zero domain content. Explorium-Direct does not define or draft this.
- **The filled instance (the keystone).** The schema populated with actual machine-readable AAV detection logic, synthesized from Ellie's material via a human-in-the-loop cycle. Authored in the **agentic-systems session**. Canonical home: repo markdown at `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`. Until it exists in conforming form, every workflow here produces worthless data.
- **Runtime consumption (Explorium-Direct scope, and only this).** The Sourcing Planner (0.2) and verification gates (2.2, 3.3) read the machine-readable section of a **locked instance version** and translate it into provider queries and pass/fail checks. Consume judgment. Never author it. The pipeline stays mechanical by design.

- **Criteria artifact is canonical repo markdown, version-controlled.** Diffable and revertable. If a version regresses pipeline quality, changelog provenance drives rollback. Never stored in Airtable or NotebookLM. Airtable holds tenant config and pipeline state, not judgment.
- **Sequencing is fixed.** (1) schema authored in agentic-systems, (2) Teknova instance v1 synthesized there, (3) one manual synthesis loop proven against one real Ellie input, (4) only then any continuous-intake automation. No Family 0 build here until the schema locks.

---

## How this inventory works

Three core ideas drive the architecture.

### Idea 1: A criteria artifact carries judgment; workflows are mechanical

The pipeline does not encode what a good target looks like. That knowledge lives in a per-tenant **criteria artifact** built from curated client-expert context (e.g., Ellie's AAV guidance). The artifact is source-agnostic and provider-agnostic, written in the client's terms. Workflows and agents here **read** it for judgment; they never write it. The schema and the filled instance are authored in the agentic-systems session per the ownership lock above. This is the brain the term-based system was missing, and Explorium-Direct is the body that acts on it, not the author of it.

### Idea 2: Workflows are chained by status fields, not by direct calls

Each workflow watches the surface for records in a specific state, runs, and writes the next state. Each workflow can be triggered independently for backfill, retry, or partial rebuild. The shape is identical across tenants. Only the base, the config, and the criteria artifact change.

### Idea 3: Every external-data step is a provider waterfall

Each step that pulls third-party data is a parent workflow that calls provider micro-workflows in tenant-configured order, stopping at the first usable result. Adding a provider is a new micro-workflow plus a config line. No parent edits.

---

## The criteria artifact: one artifact, three consumers

The criteria artifact is the center of gravity. It is produced and refined by Family 0. It is consumed at three gates:

1. **Sourcing plan** (Family 0.2 → Family 1): drives which sources run and what queries they issue. Bias: **recall**. Cast wide. An imperfect net is recoverable by filtering in the surface later. This follows the standing rule to never filter at ingestion.
2. **Company verification** (Family 2.2): judges whether a matched entity actually fits what the client described, beyond mechanical country/NAICS checks. Bias: **precision**. A false certification here is expensive and silent.
3. **Contact validation** (Family 3.3): judges whether a found person fits the ICP role definition. Bias: **precision**.

Recall at sourcing, precision at the two verification gates. That asymmetry is deliberate: a wide source net is cheap to narrow; a bad verification silently certifies wrong data as true.

The artifact aligns with the existing RevOps pipeline. The canonical Teknova instance is `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`. Its conforming machine-readable structure is defined by the schema authored in the agentic-systems session. Explorium-Direct consumes the locked instance; it does not reinvent or extend the schema.

---

## Family 0: ICP Intelligence

The judgment layer. This is what was missing when AAV was sourced on raw terms with no understanding of what AAV meant. **0.1 is authored and owned in the agentic-systems session, not here.** It is described below only so Explorium-Direct knows what it consumes. **0.2 is Explorium-Direct scope.**

### Workflow 0.1: Criteria Synthesis (agentic-systems owned ... described for consumer awareness only)

**Not Explorium-Direct scope. Do not build here.** Documented so the runtime consumers know the contract they read.

**Purpose:** Turn curated client-expert context into a structured, versioned criteria artifact instance conforming to the schema.

**Corrected model (supersedes the earlier "context dropped at a location" draft):**
- Raw expert context (meeting transcripts, emails, documents) **lives in NotebookLM, queried on demand**. Not crawled, not ingested into a pipeline, not mirrored into the repo. No multi-source ingestion engine is built. That problem is solved elsewhere.
- Extracted signals are **signals, not instructions**. Synthesis surfaces questions ("this sounds different from current rule X ... confirm or clarify?") routed to the human. It does **not** propose artifact deltas autonomously.
- The artifact **only changes after a human answers**. The approval gate is non-skippable. An agent writing extracted rules into the artifact without confirmation is the original failure mode moved up one level.
- Every artifact change is **traceable to its source and reason in the changelog**. Traceability exists to support regression detection and revert, not just audit.
- It is a **loop, not a one-time intake**: source → expert reviews surface output → expert returns context → questions surfaced → human answers → new artifact version. Many cycles per engagement.

**Output:** A locked, versioned criteria artifact instance that 0.2 and the verification gates read.

### Workflow 0.2: Sourcing Planner (agent)

**Purpose:** Translate the source-agnostic criteria artifact into a concrete, recall-biased sourcing plan.

**Loose step draft:**
- Trigger: new approved criteria artifact version, or a scheduled re-plan.
- Agent reads the criteria artifact.
- Agent decides: which sources to run, and for each source, the specific queries/terms/filters. Provider-query sources get translated filter syntax; registry sources get domain query terms. The agent expands terms toward recall (synonyms, adjacent categories, known-tricky cases) rather than narrowing.
- Agent writes a structured sourcing plan: per-source query sets, include/exclude hints, expected volume.
- The plan is the input to Family 1 workflows.

**Tenant config consumed:** enabled sources, provider credentials, criteria artifact location.

**Output:** A sourcing plan consumed by Family 1.

**Why this is separate from the criteria artifact:** the client expert shapes *criteria*, in their language. The Sourcing Planner is where criteria become provider queries. The expert never touches query syntax. Clean separation of judgment (human-shaped) from translation (agent-performed).

---

## Family 1: Source workflows

Source workflows execute the sourcing plan. They write to the surface with Discovery Sources set and Enrichment Status empty, deduplicating on domain (preferred) or name. They do not filter on judgment ... recall bias. Two structurally different source types:

### Type A: Provider-query sources

Take ICP filters (industry, size, geography, keywords) and return companies. The Sourcing Planner produces the filter syntax.

**Workflow 1.1: Explorium Companies Source**
- Trigger: sourcing plan available, or schedule.
- Call Explorium fetch-businesses with planned filters.
- Normalize to the surface schema; dedupe; insert with Discovery Sources = `explorium`, Enrichment Status = empty.

**Workflow 1.2: Apollo Companies Source**
- Same shape, Apollo `mixed_companies_search` with planned filters.
- Insert with Discovery Sources = `apollo`.

### Type B: Registry / database sources

Domain-specific registries queried by terms, returning structured records that need parsing. Higher signal for niche domains; this is where AAV-relevant companies hide that the broad providers miss.

**Workflow 1.3: ClinicalTrials.gov Source**
- Trigger: sourcing plan available, or schedule.
- Query the CT.gov API with planned AAV-relevant terms.
- Extract sponsor name, sponsor type, NCT IDs, phase, intervention, locations.
- Dedupe; insert with Discovery Sources = `clinicaltrials_gov`, Enrichment Status = empty.
- Note: currently implemented as workflow `9gcmEjq1lvOY2jZS`, possibly combining L1 capture and L2 classify. Needs an audit pass when we touch it; does not block the inventory.

**Workflow 1.4+: Queued registry sources (TBD)**
- Additional registry/database sites are queued for later. Names not yet specified. Each becomes its own Type B workflow with the same shape. To be slotted when named.

### Type C: Manual ingestion

**Workflow 1.5: Manual CSV Ingestion**
- Manual trigger (file upload or surface button).
- Parse CSV, normalize, dedupe, insert with Discovery Sources = `manual`.
- Preserve any human-supplied ground-truth fields (e.g., a pre-set HQ Country or segment from the client expert).

---

## Family 2: Enrichment workflows

Provider-agnostic. Defined in detail in the research doc; summarized here with the criteria-artifact wiring.

### Workflow 2.1: Resolve Domain (parent + provider waterfall)

**Trigger:** Enrichment Status empty or `no_domain_found`, Domain empty.

Parent runs the tenant's domain-resolution waterfall over provider micro-workflows (Resolve Domain via Exa, via Explorium Autocomplete, via Perplexity, others as added). Writes Domain + Domain Resolution Method. Sets status `domain_resolved` or `no_domain_found`.

### Workflow 2.2: Match and Verify (parent + provider waterfall + criteria judgment)

**Trigger:** Enrichment Status = `domain_resolved`.

- Run match waterfall (Match via Explorium, via Apollo Organizations Enrich, others). Returns normalized `{ business_id, country, naics, employee_range, primary_domain, hq_address, provider }`.
- If no match → status `no_match`.
- **Mechanical verification** (pure logic): domain similarity, country vs tenant target geo, NAICS vs tenant target sectors, employee plausibility, web presence.
- **Criteria verification** (reads the criteria artifact): does this entity actually fit what the client expert described? Applies disambiguation rules from the artifact (e.g., the clinical-trial-sponsor-is-operating-entity rule). This is the gate that would have caught the foreign-parent matches.
- Any mechanical or criteria signal fails → status `needs_data_quality_review`, write Verification Failures with the specific reason.
- All pass → status `verified`.

### Workflow 2.3: Classify (rule engine, reads criteria artifact)

**Trigger:** Enrichment Status = `verified`.

Applies the tenant classification rule set (sourced from the criteria artifact: segments, sub-categories). Optional AI step for ambiguous cases. Writes classification fields (AAV Segment for Teknova). Out-of-scope → `archived_out_of_classification`. Else → `classified`.

### Workflow 2.4: Deep Enrichment (parent + provider waterfall)

**Trigger:** Enrichment Status = `classified`.

Per-category provider waterfalls (technographics, funding, competitive landscape, news/LinkedIn signals) over micro-workflows. AI synthesis for Strategic Notes / Company Focus / Key Competitors. Writes deep fields. Status `enrichment_complete`. Sets Contact Sourcing Status `ready`.

---

## Family 3: Contact workflows

Do not exist today. Contacts table assumed in the tenant base (verify in RevOps Surface at build time).

### Workflow 3.1: Find People at Company (parent + provider waterfall)

**Trigger:** Contact Sourcing Status = `ready`.
Prospects waterfall (Find People via Apollo, via Explorium fetch-prospects) using target titles/seniority/departments from tenant config. Insert candidates, Contact Status = `candidate`. Update Company: `candidates_found` / `no_candidates_found`.

### Workflow 3.2: Enrich Contact (parent + provider waterfall)

**Trigger:** Contact Status = `candidate`.
Contact-enrichment waterfall (Apollo people_match, Explorium enrich-prospects, Hunter, LeadMagic) for work email, mobile, LinkedIn, employment history, tenure. Status `enriched`.

### Workflow 3.3: Validate Contact (parent + provider waterfall + criteria judgment)

**Trigger:** Contact Status = `enriched`.
- Email validation waterfall (ListMint, ZeroBounce, Hunter). Invalid → `invalid_email`, optional personal-email fallback.
- **Criteria validation** (reads the criteria artifact): does this person's role fit the ICP role definition the client expert gave? Fail → `out_of_icp` with reason.
- Pass → `send_ready`.

---

## Optional: Orchestrators

- **Enrichment orchestrator:** chains 2.1 → 2.4 for new-batch happy path via sequential `Execute Workflow`, checking status between calls. Convenience only. Backfill/recovery trigger workflows directly.
- **Contacts orchestrator:** chains 3.1 → 3.3 once a company hits `enrichment_complete`.

---

## Provider capability map

The menu. Tenant config picks order; parent workflows run the waterfall. New providers added here as integrated.

| Provider | Domain resolution | Match business | Firmographics | Deep / tech / funding | Find prospects | Email enrichment | Email validation |
|---|---|---|---|---|---|---|---|
| Explorium | autocomplete | match-business | firmographics bundle | technographics, funding, competitive landscape | fetch-prospects | enrich-prospects | no |
| Apollo | partial (orgs enrich) | organizations enrich | mixed_companies_search | technographics | mixed_people_search | people_match | no |
| Exa | web search | no | partial (web extract) | news / signals | no | no | no |
| Perplexity / web | search + reason | partial (AI) | partial | news / signals | no | no | no |
| Hunter | domain lookup | partial | partial | no | no | email finder | yes |
| LeadMagic | no | no | no | no | no | personal email, mobile | yes |
| ListMint | no | no | no | no | no | no | yes (primary) |
| ZeroBounce | no | no | no | no | no | no | yes |
| Clay | waterfall | waterfall | waterfall | waterfall | Find People | waterfall | partial |
| Crunchbase | yes | yes | yes | funding | no | no | no |

---

## Teknova AAV: concrete instantiation

```yaml
tenant: teknova
base_id: appYBYH3aOHhTODAw            # RevOps Surface; also the working surface
criteria_artifact: /Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md  # canonical, agentic-systems owned; consumed read-only here
target_geographies: ["US", "Canada"]
target_sectors: ["biotechnology", "pharmaceuticals", "gene therapy", "cell and gene therapy CDMO"]
classification_field: "AAV Segment"
target_titles: ["CSO", "VP R&D", "Head of Process Development", "Director of Process Development", "VP Manufacturing"]
target_seniority: ["VP", "C-Level", "Director", "Head"]

enabled_sources: [explorium, apollo, clinicaltrials_gov, manual]   # more registry sources TBD

waterfalls:
  domain: [exa, explorium_autocomplete, perplexity]
  match: [explorium, apollo_orgs]
  deep_funding: [explorium, crunchbase]
  deep_signals: [exa, explorium_linkedin]
  prospects: [apollo, explorium_prospects]
  contact_enrichment: [apollo, explorium_prospects, hunter, leadmagic]
  email_validation: [listmint, zerobounce]
```

---

## Open questions (revised)

Resolved this round: tenant config location (Airtable), one base per tenant, RevOps Surface is the base and the surface, no staging table, chained waterfalls, doc relocation.

Still live:

1. **Confidence scoring normalization across providers.** Different providers, different confidence shapes. Needs a normalized score the parent compares to a threshold. Separate doc, agreed.
2. **Criteria artifact schema.** RESOLVED ... ownership moved to the agentic-systems session. Not an Explorium-Direct deliverable. Lands at `practices/revops/schemas/`.
3. **Criteria artifact storage + versioning.** RESOLVED ... canonical repo markdown at the client artifacts path, version-controlled, diffable, revertable. Never Airtable or NotebookLM.
4. **Queued registry sources.** You mentioned more sites in the queue. Name them when ready; each slots as a Type B workflow.
5. **Contacts table in RevOps Surface.** RESOLVED ... `tblWJksRL1yKSUgrm` exists, fully built (~80 fields, Cohort Quality framework, own `Enrichment Status` cursor). Nothing to build.
6. **Where does the human review gate for Criteria Synthesis happen?** Agentic-systems owned; out of Explorium-Direct scope. Ties to the priority-surface pattern.

---

## Inventory at a glance

| Family | Workflow | Type | Trigger | Reads criteria artifact |
|---|---|---|---|---|
| ICP | 0.1 Criteria Synthesis | Agentic-systems owned (NOT here) | New client context | Produces it |
| ICP | 0.2 Sourcing Planner | Agent (Explorium-Direct) | Locked artifact version / schedule | Reads only |
| Source | 1.1 Explorium Companies | Provider-query | Sourcing plan / schedule | Via plan |
| Source | 1.2 Apollo Companies | Provider-query | Sourcing plan / schedule | Via plan |
| Source | 1.3 ClinicalTrials.gov | Registry | Sourcing plan / schedule | Via plan |
| Source | 1.4+ Queued registries (TBD) | Registry | Sourcing plan / schedule | Via plan |
| Source | 1.5 Manual CSV | Manual | Manual | No |
| Enrich | 2.1 Resolve Domain | Parent + waterfall | Status empty + no Domain | No |
| Enrich | 2.2 Match and Verify | Parent + waterfall + judgment | Status `domain_resolved` | Yes |
| Enrich | 2.3 Classify | Rule engine | Status `verified` | Yes |
| Enrich | 2.4 Deep Enrichment | Parent + waterfall | Status `classified` | No |
| Contact | 3.1 Find People | Parent + waterfall | Contact Sourcing `ready` | Via config |
| Contact | 3.2 Enrich Contact | Parent + waterfall | Contact Status `candidate` | No |
| Contact | 3.3 Validate Contact | Parent + waterfall + judgment | Contact Status `enriched` | Yes |
| Orch | Enrichment orchestrator | Optional | New batch | No |
| Orch | Contacts orchestrator | Optional | Status `enrichment_complete` | No |
| (each parent above) | x Provider micro-workflows | Provider | Called by parent | No |
