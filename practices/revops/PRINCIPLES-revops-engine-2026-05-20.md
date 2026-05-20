# RevOps Engine — Principles

**Date:** 2026-05-20
**System:** `revops-engine` (System Registry record `recbpvJNm8hVCYAPu`, base `apppQjlZiktpbO4aX`)
**Status:** Foundational. Tenant-agnostic. Every client engagement on this platform inherits these principles.

The RevOps Engine is shared infrastructure. It runs every client/engagement system on top of it. The vocabulary and design rules here are deliberately tenant-agnostic. Industry-specific terms (biotech, gene therapy, AAV, SaaS, fintech, etc.) live inside per-client artifacts, never in engine fields, table names, or workflow logic.

---

## What the engine is for

The engine exists to do one job at scale, per client, per play:

1. **Find** the entities that match a client's target definition, in every haystack worth hunting.
2. **Describe** what those entities look like, source-anchored and falsifiable.
3. **Capture** the raw evidence proving each candidate matches the description.
4. **Enrich** each captured candidate with a complete dossier from every connected source we pay for.

Classification, scoring, and verdict-writing are downstream conveniences. They are not the value. The value is the data — found, described, captured, deepened.

---

## The value statement (where classification is NOT)

> Anybody can create a table and classify data in it. That's easy. Our value is in finding the needle in the haystack, describing the needle, capturing evidence of the needle, and building a complete dossier around the needle.

This is the engine's reason for existing. Every design decision below derives from it.

---

## Core principles

### 1. Evidence is the answer. Verdicts are derived.

A row's value is the captured evidence it carries, not the labels someone wrote on top. A "Qualified = Yes" field is a single observer's verdict; it can be wrong, it can go stale, it lies when the workflow that wrote it has a bug. The captured evidence (the trial record, the patent abstract, the press URL with quote, the conference attendee row) is the truth — anyone reading the row applies the rules and decides for themselves.

Workflows should default to capturing source content into evidence columns, not computing booleans. When a label is genuinely useful (e.g. to drive a downstream view filter), it is derived at read time over the evidence, not pre-computed and stamped into a field.

**Implication:** the engine's hottest engineering work is connecting sources and pulling their content cleanly, not writing classifiers.

### 2. Cast wide. Most value is in the next source.

A single source — no matter how good — produces an incomplete picture. Real-world target identification almost always requires triangulating across multiple haystacks. The engine treats every connected source as additive: every new source connected raises the completeness of every existing dossier.

A play that runs on one source is a prototype, not a product. The production shape is many sources writing in parallel to the same row.

**Implication:** connecting the next source is almost always higher-leverage than refining the classification logic on the current one.

### 3. Pay once, capture everything.

Every paid API call grabs the full response payload and writes every field to the database. Per-source columns carry the raw source field names (prefixed with the source slug). The "Deep Enrichment Raw" full-blob is a fallback only — never the primary destination.

This is non-negotiable for paid sources. We do not pay twice because we cherry-picked the first call.

**Implication:** schema growth tracks source growth. Cleanup at "this column isn't useful" time is far cheaper than re-running paid calls.

### 4. Capture, then display. Determination is a read, not a write.

The engine's pipelines run capture-first. Display surfaces (Airtable views, dashboards, reports) read the captured fields and apply the play's criteria at view time. The same row can be presented to a US-focused play and an EMEA-focused play with different verdicts; the row itself contains the evidence, the filters do the slicing.

Filters are cheap, replaceable, and version-controlled by the people who own the play. Hard-coded verdict columns in the database are expensive and lie when criteria change.

### 5. Per-source evidence columns; per-play filters.

Schema rule: evidence is grouped by source (CT.gov, USPTO, SEC, Salesforce, Explorium, Apollo, LinkedIn, Hunter, Perplexity, etc.) and stored in source-prefixed columns. Per-play artifacts define what combinations of evidence qualify a row.

Source columns are universal. Play filters are tenant-specific. They are kept separate so:
- A new play for the same client reuses the same evidence columns with a new filter.
- A new client in the same industry reuses the same source connections with a new target definition.
- A new industry adds new evidence columns without rewriting existing ones.

### 6. Two-layer target model: universal definition + per-play overlay.

Every play has two artifacts:

- **Target Definition:** what an entity in this category looks like, source-anchored and falsifiable, industry-vocabulary allowed inside this document. Reusable across plays for the same category.
- **Play Filter:** the additional constraints this specific play applies on top of the universal definition (geography, size, current customer status, do-not-contact, etc.). Tenant- and play-specific. Lives on the Playbook record.

A 5,000-employee EU company that matches the universal target definition is still in the universe. It just doesn't pass this play's filter. The next play might keep it.

Conflating the two — treating play filters as part of the definition — destroys reuse and produces ambiguous verdict fields.

### 7. Tenant-agnostic vocabulary at the engine layer.

Engine-level tables, fields, workflows, and configuration carry **no industry terms**. The neutral vocabulary is:

- **Play** — a targeted outreach campaign for a client
- **Target Definition** — the description of the right entity for a play
- **Play Filter** — the per-play targeting constraints layered on top
- **Discovery Source** — a haystack the engine hunts in
- **Evidence** — captured source content
- **Qualifying Signal** — evidence that supports the target definition
- **Disqualifying Signal** — evidence that rules a candidate out
- **Suppression Flag** — a tenant-relationship reason to hold a candidate (DNC, existing customer, active opportunity, etc.)
- **Dossier** — the full collection of captured evidence about one entity
- **Entity** — a company or a contact (the row being captured-around)

Industry terms (gene therapy, AAV, modality, vector, clinical stage, SaaS, ARR, fintech, etc.) live inside per-client / per-play artifacts. They do not appear in engine field names, engine table names, engine workflow names, or engine status labels.

### 8. Provenance on every captured field.

Every evidence column carries enough metadata to back-trace it to its source:
- Which discovery source produced it
- Which workflow wrote it
- When it was last refreshed
- A URL or ID linking back to the source record where possible

A row whose evidence can't be back-traced to source is hypothesis, not truth. The reconciliation discipline (canon: built ≠ verified ≠ deployed ≠ running) applies at the field level too.

### 9. Side artifacts are torn down or captured in the same cycle.

Anything a workflow creates that is not the deliverable (scratch tables, test workflows, exploratory queries, learned primitives) gets either deleted or registered in the same cycle that produced it. "Later" is the anti-pattern. The engine's debt floor is "no orphan assets" at every session close.

### 10. Self-describing structure at the point of access.

Engine tables and fields ship with description text that explains the intent, not just the type. A cold AI session pointed at the registry can read the Operating Model table and understand the model without crawling and guessing. Schemas without embedded intent become the SaaS-trap artifact, not the agentic one.

---

## The generic play loop (what every play does)

Every play, regardless of client or industry, runs this loop:

1. **Discovery.** Run every connected source that can surface candidates matching this category. Write candidates to the Companies/Contacts table with source attribution.
2. **Match.** Join the candidate to canonical identifiers (Explorium business_id, Apollo organization_id, SEC CIK, the client's CRM record ID, etc.).
3. **Capture.** Pull every available field from every paid source on the candidate; write to per-source evidence columns. Include the full raw payload as a fallback.
4. **SME review (optional).** A domain expert reads the captured evidence on borderline rows and applies judgment the engine cannot.
5. **Suppression check.** Apply the play's tenant-relationship flags (DNC, existing customer, active opportunity, recent BD activity).
6. **Filter.** Apply the play's target definition + play filter to the captured evidence, at view time, producing the cohort.
7. **Outreach generation, send, track, iterate.** Downstream of the engine.

The Play Steps table is the per-tenant instantiation of this loop, with workflow IDs and step-specific evidence columns named.

---

## What this displaces

This principles artifact supersedes any per-tenant document that has been doing the engine's job by accident. In particular:

- The `Target Definition` field on the Teknova Playbook record (written 2026-05-20) mixes the universal AAV definition with play-specific filters. To be split per Principle 6.
- The `Data Sources` field on the same record references biotech-specific source roles in a way that should be neutralized to the source/category abstraction.
- The classifier logic in the L2 Classify workflow (Verification Status, R5 3-clause gate, Currency Status, etc.) is engineering on top of evidence — useful, but its outputs should be treated as a view-time convenience, not the system of truth. The truth is the captured CT.gov trial records.

A separate audit pass is needed to find every place biotech vocabulary leaked into engine-level surfaces and route the language correctly. That audit is not part of this artifact — this artifact is the standard the audit measures against.

---

## How this artifact stays honest

This file is registered as an Asset linked to the `revops-engine` system (System Registry, base `apppQjlZiktpbO4aX`, Systems table `tbldwCzbavBcOlP2C`, system `recbpvJNm8hVCYAPu`). It is canon-tier — changes to it ripple through every client engagement.

Edits to these principles should:
- Carry a date and a reason in the change log.
- Be tested against the canon entries that derive from this work (`practices/agentic-systems/canon/canon-log.md`).
- Trigger an audit of per-tenant artifacts that reference the changed principle.

The engine evolves. The principles evolve with it. What does not evolve is the value statement: find the needle, describe the needle, capture evidence, build the dossier.
