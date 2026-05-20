# Research: Consensus enrichment architecture for Explorium-backed pipelines

**Date:** 2026-05-14
**Sources:** Explorium NotebookLM (15 sources, primary), RevOps NotebookLM (18 sources, Clay/Apollo/Clearbit patterns), Perplexity research (industry synthesis, 2025 practice).
**Purpose:** Define the right shape for the Teknova AAV enrichment pipeline before we touch another node. Replace patchwork debugging of the current monolith with a step-by-step architecture each step of which can be tested in isolation and recorded as a Play Step.

---

## 1. The problem, in one paragraph

We have been running a single n8n workflow (Companies Enrichment, `Z6RROKx5omdfvhtn`) that takes a company name from a CT.gov record, calls Explorium Match Business with the name, then immediately gates on country, modality, and pulls deep enrichment. The Match step is the only point where entity identity is established, and it is fed name-only because CT.gov records arrive without a domain. Explorium's own documentation says name-only matching is weaker; in practice it is returning foreign ultimate parents instead of US operating subsidiaries for AAV biotechs with cross-border ownership. Every downstream gate then describes the wrong entity. Patching the geography gate three times has not fixed this because the bug is one step upstream of any gate.

---

## 2. What the three sources agree on

The Explorium NotebookLM, the RevOps NotebookLM, and the Perplexity synthesis converge on six rules. They are stated below as constraints on the pipeline, not as suggestions.

### Rule 1: Resolve a domain before matching

Domains are the only field that uniquely identifies an operating entity in B2B graphs. Names are not unique. Foreign parents and US subsidiaries share names. Cayman holding companies and Delaware operating companies share names. Searching by name alone in a global entity graph is by definition ambiguous, and Explorium says so explicitly. From the Explorium notebook: "You don't need to fill out both of these fields in order to get a valid business ID but the more information you have the stronger the match will be." From the same source on the failure mode: "entity matching is a huge issue and the messiness in the data is a issue that is created when when you only use web data."

Industry practice: use a waterfall of providers to resolve a domain from a name before any matching step. Clay's documented pattern queries Clearbit, ZoomInfo, Hunter, and others sequentially until a domain returns. Single-provider domain resolution achieves roughly 75-85% coverage; a waterfall reaches 92-97%. The implication for us: a Resolve Domain step must exist as its own workflow node, and it must run before Match Business.

### Rule 2: Match returns an identifier. It does not return data.

Explorium's foundational rule (verbatim from the notebook): "it's always get ids first then the data you need about them." Match Business is free. It produces a `business_id` that is the anchor for every later call. The match step does not consume credits and should never be skipped, simplified, or merged with an enrichment call. Treat the `business_id` as the primary key for the rest of the pipeline.

### Rule 3: Verify the match before pulling deep enrichment

After Match Business returns an ID, the pipeline must independently check that the matched entity is the one we intended. Explorium's own training video walks through this pattern: run a basic firmographics bundle (free or low-cost), then use an IF node to check signals before any deep enrichment call. Five signals are standard:

1. **Domain similarity.** The domain we resolved in Rule 1 should match the primary domain on the matched entity (root-domain similarity 90%+). Different domains usually means we matched a parent rather than the operating sub.
2. **Country.** If the source system says US (CT.gov listing site, web evidence) and Explorium returns Ireland, that is a mismatch, not an archive condition.
3. **Industry / NAICS.** The returned NAICS or industry should be in our target sector. If we are prospecting AAV biotechs and the match returns "Waste Management," it is a namesake collision.
4. **Employee count plausibility.** If we have any prior signal about size (CT.gov sponsor type, public filings) and Explorium returns three orders of magnitude off, flag.
5. **Web presence.** The matched entity should have a live website matching our resolved domain.

If any of the five fail, the record does not archive. It routes to a review state. Archives erase data; review states surface it.

### Rule 4: Parent versus subsidiary is a real, expected failure mode in biotech

Biotech and pharma frequently incorporate parents in Ireland, the Cayman Islands, or Delaware while operating in the US. Explorium's graph stores both. Match Business on a name will often return whichever entity has more web mentions, which is frequently the parent. The Perplexity synthesis cites a useful heuristic from industry practice: clinical trials are sponsored by the operating entity, not by a financial holding company, because trials require regulatory submission tied to actual research infrastructure. So when the source is CT.gov and the matched entity looks like a holdco, we should explicitly route to the operating sub rather than accept the holdco as the answer. This is exactly the failure mode that produced our four wrong-entity archives (Adverum, MeiraGTx, Nanoscope, Spur).

### Rule 5: Three-bucket outcome, not two

Mature pipelines do not run match-or-archive. They run match, verify, and produce one of three outcomes per record:

- **enrichment_complete** — match passes verification, deep enrichment ran, all fields populated.
- **needs_data_quality_review** — match returned an entity but one or more verification signals failed. Record stays in the table with a reason field. A human looks at it.
- **no_match** — match returned no business_id. Record stays, with the inputs we tried recorded so we can retry with better inputs later.

Archiving on a verification failure (what we are doing now) silently drops real targets. Adverum and MeiraGTx are both real US AAV biotechs that we want in the cadence. They should never have left the table.

### Rule 6: Measure the right things

The current workflow tells us "completed vs archived." That metric is useless if half of the completed records describe the wrong entity. The standard B2B enrichment quality metrics are:

- **Match rate** — `business_id` returned / records submitted. Target above 70%.
- **False-match rate** — matches that fail verification / matches returned. Target below 5%. We have no current measurement of this; the four archived US biotechs alone tell us it is much higher than that today.
- **Field fill rate** — populated fields / expected fields per matched record. Target above 80%. The "early thin records" (Beacon, 4D, Lexeo, Voyager) are a fill-rate failure.
- **Email bounce rate** (later in the pipeline, for prospects) — target below 2%.

These metrics drive whether the pipeline gets trusted or not. Without them, every batch run is a guessing game.

---

## 3. The right architecture

The canonical pattern, decomposed into named steps each of which is independently testable:

```
Source record (CT.gov)
        │
        ▼
[Step 1] Resolve Domain ── (name + any context) ──▶ domain or null
        │
        ▼
[Step 2] Match Business ── (domain + name) ──────▶ business_id or null
        │
        ▼
[Step 3] Light Firmographics ── (business_id) ────▶ country, NAICS, employee_count, primary_domain, hq_address
        │
        ▼
[Step 4] Verify Match ── (resolved_domain vs primary_domain, country expectation, NAICS expectation)
        │                                       │
        ▼ pass                                  ▼ fail
[Step 5] Modality Gate                  needs_data_quality_review
        │                                       (stop; surface to human)
        ▼ pass
[Step 6] Deep Enrichment ──────────▶ technographics, funding, competitive landscape, LinkedIn signals
        │
        ▼
[Step 7] Write Back ──────────▶ Airtable record fully populated, enrichment_complete
```

Each step is a workflow (or a clean sub-section of a workflow with explicit inputs and outputs). Each step writes its result to a Play Step row in the Playbook table. Each step can fail loudly and surface the failure rather than silently propagating bad data.

### Why each step deserves to exist as its own thing

- **Step 1 Resolve Domain** does not exist today. This is the single biggest gap. Until it exists, every CT.gov batch will produce wrong-entity matches. Inputs: company name, optional context (state, NCT trial number, sponsor type). Outputs: a domain string with a confidence score, or null. Implementation options: Explorium autocomplete plus a web search, or a Clay-style waterfall. Until we have it, every Step 2 call against a CT.gov record is a coin flip.
- **Step 2 Match Business** keeps doing what it does today, but with both `name` and `domain` populated. Explorium's docs are explicit that the match quality jumps when the domain is included.
- **Step 3 Light Firmographics** is a cheap pull that exists to give us verification signals, not to populate the final record. We are paying for it twice today (once to verify, once during deep enrichment); that is fine, it is the same call, but the framing matters: Step 3 exists for the gate in Step 4, not for the user.
- **Step 4 Verify Match** is the new gate. It runs the five-signal check from Rule 3. Failures route to `needs_data_quality_review`, not to archive. Passes proceed.
- **Step 5 Modality Gate** keeps the existing AAV classifier logic. It is downstream of Verify Match because there is no point classifying modality on the wrong company.
- **Step 6 Deep Enrichment** is everything we do today after the gate: competitive landscape, technographics, funding, LinkedIn, Strategic Notes. Same code, just isolated to its own step so we can rerun it for the early thin records (Beacon, 4D, Lexeo, Voyager) without re-running the upstream steps.
- **Step 7 Write Back** is the final Airtable write. It is the only step that mutates the Companies table. Today this is mixed in with everything; isolating it means rerunning Step 6 cheaply for backfill.

### Where the current monolith violates this

| Rule | Current state |
|---|---|
| Resolve Domain before Match | Skipped entirely for CT.gov records. |
| Match returns ID, not data | OK, this part is correct. |
| Verify match before deep enrich | Not done. Country check happens, but no domain or NAICS or employee plausibility check. Country failure archives instead of flagging. |
| Parent vs subsidiary heuristic | Not implemented. Holdcos archive as foreign companies. |
| Three-bucket outcome | Two-bucket only: enrichment_complete or archived. |
| Quality metrics | Match rate and false-match rate not measured. |

---

## 4. Workflow decomposition: which steps belong together

The seven conceptual steps in the architecture do not map one-to-one onto n8n workflows. Some belong together because they share data and have no independent reuse case. Others must be split because we already need to rerun them in isolation. The decomposition below is driven by three concrete reuse cases we have already hit this week:

- **Backfill case.** Beacon, 4D, Lexeo, and Voyager need only their deep-enrichment fields populated. They were already correctly matched and verified. We must be able to rerun deep enrichment alone, without re-paying for match or re-doing firmographics.
- **Wrong-entity rerun case.** Adverum, MeiraGTx, Nanoscope, and Spur need their domain resolved, then a fresh match, then verification, then everything downstream. We must be able to restart the chain from Resolve Domain.
- **Reclassification case.** Gate v1.7.0 was the third revision of the modality classifier in two weeks. The next time the rules change, we should be able to reclassify every existing matched record without re-fetching Explorium data.

These cases tell us where the seams have to be. Steps that get rerun together belong in one workflow. Steps that need to be triggered independently must be separate workflows.

The recommended decomposition is **four standalone n8n workflows**, each triggered by a record reaching the right state in Airtable. Airtable status fields are the orchestration glue. A record's Enrichment Status field is the cursor that says which workflow runs next.

### Workflow 1: Resolve Domain

**Purpose:** Take a company name (plus any available context) and produce a verified domain.

**Inputs:** Company name, optional state, optional NCT trial number, optional sponsor type.

**Steps inside:** Explorium autocomplete to test for an obvious match, then a web search fallback (Perplexity, Exa, or Google site operators) for ambiguous cases, then a confidence scoring step.

**Output:** Writes Domain field and a Domain Resolution Method field to Airtable. Sets Enrichment Status to `domain_resolved` or `no_domain_found`.

**Why standalone:** A domain is reusable for any future data source, not just CT.gov. It is also the most failure-prone step and the one most likely to need its own retry logic, its own metrics, and its own per-source tuning. Bundling it with Match Business means a domain resolution failure forces a full retry of an Explorium call we did not need to make.

**Triggered when:** A record has no Domain and Enrichment Status is empty or `no_domain_found`.

### Workflow 2: Match and Verify

**Purpose:** Take a name plus domain, get a business_id, pull verification firmographics, run the five-signal check, decide whether to proceed.

**Inputs:** Company name, domain (required; this workflow rejects records without one), source type for parent-vs-subsidiary heuristic.

**Steps inside:** Explorium Match Business (name + domain) → IF node checking business_id is not null → Explorium Light Firmographics (country, NAICS, employee count, primary domain, HQ address) → five-signal verification logic (domain similarity, country match, NAICS plausibility, employee plausibility, web presence) → write verification result.

**Output:** Writes Business ID, HQ Country, Industry, Primary Domain, Verification Status, and Verification Failures (long text, lists which signals failed) to Airtable. Sets Enrichment Status to `verified`, `needs_data_quality_review`, or `no_match`.

**Why combined:** Match and Light Firmographics are sequential, both Explorium calls, both cheap, and you never want one without the other. The verification logic is pure IF nodes that consume the firmographics data already in memory. Splitting these would introduce three webhook handoffs for no benefit.

**Why not also Modality:** Modality classification can need rerunning when classifier rules change, even when the underlying match is fine. Keeping it separate means we can reclassify without re-paying for Explorium.

**Triggered when:** Domain is populated and Enrichment Status is `domain_resolved`.

### Workflow 3: Classify Modality

**Purpose:** Take the verified record and assign AAV Segment plus modality classification.

**Inputs:** Company name, industry, business description, any firmographic data already in Airtable.

**Steps inside:** The current Check AAV Modality node logic, isolated. Reads firmographic fields from Airtable rather than from Explorium directly, so it can run independently of any new Explorium call.

**Output:** Writes AAV Segment and modality classification fields to Airtable. Sets Enrichment Status to `modality_classified` or to an archive state if the modality is confirmed non-AAV.

**Why standalone:** This is the classifier that has changed three times. Isolating it means future rule changes are a single workflow rerun across the existing verified records, no Explorium credits consumed.

**Triggered when:** Enrichment Status is `verified`.

### Workflow 4: Deep Enrichment

**Purpose:** Pull everything else from Explorium and any other provider, populate the send-ready record.

**Inputs:** Business ID.

**Steps inside:** Explorium technographics, competitive landscape, funding history, LinkedIn signals, plus any prospect-finding waterfall we add later. Writes deep fields straight to Airtable as each call completes.

**Output:** Writes Company Focus, Key Competitors, Strategic Notes, Funding, Technographics, and other deep fields. Sets Enrichment Status to `enrichment_complete`.

**Why standalone:** This is the expensive step and the one we most need to rerun in isolation. Beacon, 4D, Lexeo, and Voyager prove the case. Future classifier or verification changes should never force us to re-pay for deep enrichment we already have.

**Triggered when:** Enrichment Status is `modality_classified`.

### What about an orchestrator?

For batch runs of fresh records, an orchestrator workflow that walks a record through all four stages is useful for the happy path. It is implemented as `Execute Workflow → Execute Workflow → Execute Workflow → Execute Workflow`, with Airtable status checks between each. The orchestrator pattern is optional, not required. For backfill, partial reruns, and recovery from wrong-entity matches, we trigger the relevant workflow directly against the affected records. The orchestrator is for new batches; the standalone workflows are for everything else.

### Why not split further?

A finer split (Resolve Domain, Match, Light Firmographics, Verify, Modality, Deep Enrichment as six separate workflows) is technically defensible but loses on practical grounds:

- Match without Light Firmographics has no use. The match is unverified data.
- Light Firmographics without Verify has no use. The data is collected only to run the gate.
- Verify without Match has no use. There is nothing to verify.

These three are a single decision unit. Splitting them adds webhook overhead, three more places for trigger logic to go wrong, and no reuse benefit, because we never want one without the others.

---

## 5. The ordered work to get there

This is the build sequence, not a phase scheme. Each item is a discrete piece of work. Numbering is just for reference in conversation.

1. Build the Resolve Domain workflow (Explorium autocomplete + web search fallback).
2. Test Resolve Domain against the 4 wrong-entity records (Adverum, MeiraGTx, Nanoscope, Spur) plus 6 known-good US AAV records. Target 90% precision.
3. Build the Match and Verify workflow. Refactor the current Match Business call to require both name and domain. Add the Light Firmographics call. Add the five-signal verification logic.
4. Add `domain_resolved`, `verified`, `needs_data_quality_review`, `no_match`, `modality_classified`, and `enrichment_complete` as options on the Enrichment Status field. Add a Verification Failures long-text field. Add a Domain Resolution Method field.
5. Isolate the Classify Modality workflow from the current monolith. Confirm it reads from Airtable, not from a live Explorium call.
6. Isolate the Deep Enrichment workflow from the current monolith. Confirm it can be triggered against a record with a Business ID without any upstream re-call.
7. Backfill test: rerun Deep Enrichment alone against the 4 thin early records (Beacon, 4D, Lexeo, Voyager). Confirm Company Focus, Key Competitors, Strategic Notes, funding all populate.
8. Rerun the 4 wrong-entity records (Adverum, MeiraGTx, Nanoscope, Spur) through the new pipeline starting from Resolve Domain. Confirm they enter as US operating entities.
9. Add a quality metrics view to Airtable: match rate, verification failure rate, fill rate per batch.
10. Run Phase 4b batch 2 (10 records) through the new pipeline. Compare quality metrics to batch 1.

---

## 5. What this changes about the current workflow file

Three concrete changes to the Companies Enrichment workflow (`Z6RROKx5omdfvhtn`) at the file level:

1. **New node before Match Business: Resolve Domain.** This is a sub-workflow. Inputs: company name, CT.gov state, NCT IDs if available. Outputs: domain, resolution_method, confidence. Failure to resolve a domain for a CT.gov-sourced record is itself a quality signal (`no_domain_resolved`), not an automatic disqualification.
2. **Split Qualify Company into two nodes.** Today it does both the verification check and the geography decision in one place. The new shape: a Verify Match node that does the five-signal check and writes verification failures to a reason field, then a separate Geography Gate that only runs if verification passes.
3. **Stop archiving on verification failures.** Wire verification failures to `needs_data_quality_review`. Archives remain only for genuine out-of-scope cases (Korea, China, non-AAV modality confirmed).

The existing local files this affects: `node-qualify-company.js` (split into two), `node-map-enriched-fields.js` (add domain + verification fields), `node-check-aav-modality.js` (no change), and a new file `node-resolve-domain.js`.

---

## 6. Sources

- Explorium NotebookLM (`dfe9886d-ef75-42ae-9d63-ac22472591f3`). Primary-source guidance from Explorium training videos: get IDs first, name-only is weaker, IF-node validation pattern after Match.
- RevOps NotebookLM (`9822358b-636d-4689-8b42-8c3d90b1117c`). Industry pipeline patterns: intake → match → firmographics → AI ICP gate → deep enrichment → prospect waterfall → email validation. Clay "jigsaw framework" for fallback fields.
- Perplexity research (2025 synthesis, saved to `~/.claude/projects/.../toolu_018rQSJhh19AY9KcV7cAgdfW.txt`). Industry consensus on canonical six-stage architecture, domain resolution tactics, biotech parent/subsidiary heuristic, quality metric targets.

All three converged on the same architecture without contradiction. The current workflow violates rules 1, 3, 4, 5, and 6.
