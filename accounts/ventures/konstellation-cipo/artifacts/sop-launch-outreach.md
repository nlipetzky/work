# SOP: Launch CIPO Outreach — signal companies to sent sequence (Konstellation CIPO venture)

Status: **draft**, well-informed pass 2026-06-26 (mined CIPO artifacts + revops-engine runners + flywheel + data model). The first SOP for the `operating-sop` system. Finalize by working the Open Questions at the bottom.

## Steps

### 1. Signal watch lands raw companies into canon.prospects
- **gate:** automatic
- **status:** done — runs daily, idempotent, credit-free; 197 companies sitting at stage='signal' right now
- **produces:** Raw prospect rows at stage='signal' in canon-engine canon.prospects (engagement_type='venture', engagement_id='konstellation-cipo'); deduped by (source, source_ref); ~197 companies landed today with domain + a signal payload (ClinicalTrials.gov INDUSTRY trials, USPTO PatentsView CPC A61* filings)
- **executed by:** canon-engine / watch-signals.mjs (watchClinicalTrials + watchPatents) → record_prospect() RPC, on daily cron/launchd
- **informed by:** Targeting & Enrichment Doctrine §6 (custom authoritative sources) + §8 step 1; segment-criteria.md soft signals (patent holding, trial-stage biotech)

### 2. Discovery recipe governs the signal→lead pipeline shape
- **gate:** approve-nick
- **status:** done — drafted exemplar stored as canon artifact; this is the spec the enrichment steps below execute against
- **produces:** canon_artifacts discovery-recipe record (CIPO engagement): ordered pipeline = signal watch → company resolution → enrich+screen → contact discovery+email → qualify → hand-off; tools_used grounded against live deepline catalog + named custom sources
- **executed by:** canon-engine / author-recipe.mjs (claude-opus-4-8, anti-fabrication checks) → record_discovery_recipe RPC; discovery-recipe.md exists as drafted exemplar
- **informed by:** Targeting & Enrichment Doctrine §1-§8; segment-criteria.md, icp-titles.md, enrichment-spec.md, list-qualification.md

### 3. Targeting artifacts (WHO/WHAT) approved as the qualification contract
- **gate:** approve-nick
- **status:** partial — all four approved v1 by Nick (targeting governance is Nick's domain); pending Will's certification of entry signals + receptivity rungs, and internal-list disqualifiers (DQ3-DQ6: current customers, burned audiences, do-not-contact) still need explicit supply from Will/Nick
- **produces:** Four approved-v1 targeting artifacts: segment-criteria.md (HF1-HF4, SS1-SS5, DQ1-DQ6), icp-and-disqualifiers.md (law-firm hard exclusion), icp-titles.md (DM1-DM3, IN1-IN3, EX1-EX4), enrichment-spec.md (Groups 1-4), list-qualification.md (verdict bands: qualified ≥6, edge 4-5, not-qualified ≤3)
- **executed by:** revops-engine compilation target / govern-artifacts.mjs (produce + gate); artifacts live under accounts/ventures/konstellation-cipo/context/revops/
- **informed by:** Targeting & Enrichment Doctrine §1-§4; segment-criteria.md, icp-titles.md, enrichment-spec.md, list-qualification.md; CRAFT REVIEW notes (HF3 funding-stage reliability, sub-50-employee email coverage, USPTO assignee match-rate)

### 4. Enrich + qualify prospects (resolve domain → firmographics → ICP contacts → verified email → verdict)
- **gate:** approve-nick
- **status:** partial — PLAN mode wired; EXECUTE mode is a GATED STUB. Deepline BYO-keys (Nick's own paid keys in /code/work/.env) not wired into the per-tool execute chain, so no enrichment runs and the 197 stay at stage='signal'
- **produces:** INTENDED: canon.prospects advanced signal→enriched→qualified/edge/not-qualified via advance_prospect(); enrichment JSON populated (firmographics, ICP-title CONTACTS with verified work emails — emails belong to the contacts found at each company, not the company), account-first then contact verdict + rationale. ACTUAL TODAY: enrich-prospects.mjs only prints the 5-step PLAN; mutates nothing
- **executed by:** canon-engine / enrich-prospects.mjs (--execute) via deepline-tools (Apollo/Hunter/Dropleads/Crustdata/Explorium/Exa/Serper/ZeroBounce)
- **informed by:** Targeting & Enrichment Doctrine §8 steps 3-5; enrichment-spec.md (Group 2 verified-work-email hard gate); MEMORY: Deepline BYO keys before credits

### 5. Bridge qualified prospects from canon.prospects into revops-engine staging
- **gate:** needs-build
- **status:** blocked — THIS IS WHERE THE PIPELINE IS SEVERED. canon.prospects (197) and revops public.companies (9167) have NO wired flow; Records reads revops, the flywheel writes canon, nothing connects them
- **produces:** UNBUILT: an ETL/RPC that takes canon.prospects (qualified, domain-resolved) and writes them into revops-engine staging.companies_<batch> (and contacts), engagement-tagged, so the prep funnel and Records can consume them
- **executed by:** unbuilt — no script, RPC, dual-write, or sync exists between the two separate Supabase projects (canon mzzjvoiwughcnmmqzbxv ↔ revops mrmnyscurmkfppicqqhk)
- **informed by:** Gap analysis (016_prospects_spine.sql vs 0001_promote_staging_batch.sql); HANDOFF-targeting-flywheel-continue-2026-06-26.md (Canon→RevOps bridge NOT BUILT)

### 6. RevOps prep funnel: deterministic + semantic classification of the company batch
- **gate:** automatic
- **status:** done — runners built, on-rails, auto-execute stages 1-5; but idle for CIPO because no batch is loaded (depends on seq 5 bridge or a manual CSV load)
- **produces:** prep_verdict (IN/NARROW/OUT/NEEDS_REVIEW), prep_confidence, prep_criteria, prep_rationale columns on staging.companies_<batch>
- **executed by:** revops-engine / run-prep.mjs orchestrator → run-stage1.mjs (SQL keyword rules), classify-runner.mjs (Claude semantic, residual rows)
- **informed by:** Play's stage1.sql + classifier bundle (classifier-prompt.md, read-fields.json); prep-recipe.json

### 7. CRM suppression + existing-customer gate (deterministic)
- **gate:** automatic
- **status:** done — wired and deterministic; runs once a batch exists
- **produces:** crm_status verdicts on the batch: dnc_suppress (hard cut), open_opp_review (flag), existing_customer (keep+flag), clear (pass); joined to Salesforce mirror by normalized domain
- **executed by:** revops-engine / gate-crm-suppression.mjs (joins public.companies SF history)
- **informed by:** Salesforce mirror (public.companies: sf_account_id, sf_has_open_opp, sf_dnc_opt_out, existing_customer); MEMORY: mRNA suppression is contact-level

### 8. Flag-resolve: operator review of novel flags
- **gate:** approve-nick
- **status:** partial — flags written by SQL; each novel flag needs Nick to resolve or cite a rule_ref before promote
- **produces:** prep_flags, prep_attention, prep_resolution on the batch; one four-section packet (Assumptions/Evidence/Tentative read/Question) per novel flag for operator decision
- **executed by:** revops-engine / flags-v0.sql (writes flags) + Nick (manual resolution; no AI auto-resolve)
- **informed by:** flags-v0.sql rule library; RUNBOOK step 4

### 9. Promote qualified companies to Core
- **gate:** approve-nick
- **status:** done — on-rails, idempotent, RLS-aware; Task-11-class destructive move requiring Nick's explicit go
- **produces:** Rows in revops-engine public.companies with per-field provenance + promotion ledger (staging_promotions, entity_activity_log); deduped by domain (case-insensitive)
- **executed by:** revops-engine / promote_staging_batch(p_batch_id,'companies',p_promoted_by) SQL function
- **informed by:** 0001_promote_staging_batch.sql; MEMORY: Promote = explicit operator approval, on-rails canonical write

### 10. Source + screen CONTACTS at promoted companies (the emails live here)
- **gate:** approve-nick
- **status:** partial — runners built; PAID contact enrichment needs pilot + price approval before scaled pull; company set promotes first, contacts sourced after
- **produces:** staging.contacts_<batch> with ICP-title contacts resolved at each promoted company, verified work emails (name+domain waterfall → Hunter/Dropleads/Crustdata/PDL), prep_contact_status/checks; email_verified_status hard gate; unreachable qualified accounts route to 'edge' not discard
- **executed by:** revops-engine / contact-sourcing loader + contacts-screen-runner.mjs + route-runner.mjs
- **informed by:** icp-titles.md + role exclusions; enrichment-spec.md Group 2 (verified-work-email hard gate); Airtable SF suppression mirror

### 11. Promote contacts to Core + export the qualified list
- **gate:** approve-nick
- **status:** done — export enforces delivery contract at generation time; waits for Nick's approval before delivery
- **produces:** public.contacts (deduped by email) with company_id link; deliverable CSV (<batch>-contacts-review.csv) and/or Airtable payload with all 8 required fields, merge_on=Email
- **executed by:** revops-engine / promote_staging_batch(...,'contacts',...) + export-staging-csv.mjs / export-airtable-payload.mjs
- **informed by:** delivery-contract.md; AIRTABLE_MERGE_ON_FIELD (Email for contacts, Domain for companies)

### 12. Offer ladder approved (HINGE that unblocks copy)
- **gate:** approve-will
- **status:** done — Will (legal/IP expert) has approved the offer; offer-architecture-and-pricing.md approved v1; ladder is the HINGE that gates copy production
- **produces:** outreach-offer-ladder.md: 2-3 front-end offers (Reverse Lead Magnet '1-page IP exposure read') laddering to core retainer (Scout $2.5K / Shield $5K / Arsenal $10K per mo)
- **executed by:** offer-extract skill / human designer; context under accounts/ventures/konstellation-cipo/context/revops/
- **informed by:** outreach-offer-ladder.md + offer-architecture-and-pricing.md; offer-pricing tiers (Scout/Shield/Arsenal)

### 13. Produce the cold sequence (System M): rules-gate + LLM-judge
- **gate:** automatic
- **status:** done — driver built; runs once HINGE (offer ladder, seq 12) is approved, which it is; produces the draft artifact for sign-off
- **produces:** 4-touch LinkedIn sequence (connect note → +0h DM → +3d follow-up → +4d breakup) as JSON in canon_artifacts, every step source-tagged; passes deterministic rules-gate (no brand words, no pricing figures, shape-complete) AND LLM judge (voice fidelity, raised-hand CTA, no invented POV)
- **executed by:** canon-engine / produce-sequence.mjs (node scripts/produce-sequence.mjs run venture konstellation-cipo linkedin); Claude Opus 4.8 as called function at produce+judge, iterates ≤3 revisions
- **informed by:** produce-sequence.mjs; outreach-offer-doctrine.md + linkedin-outreach-doctrine.md; faithfulness-constraints.md (CIPO title OK, attorney/lawyer FORBIDDEN, zero public pricing)

### 14. Will certifies the copy (expert sign-off)
- **gate:** approve-will
- **status:** blocked — Will has NOT signed off; v0 artifact carries 5 blocking flags: (1) whole sequence needs cold-copy approval, (2) FDA AI-device claim needs device/company/year cert, (3) $500-800/hr anchor OK to cite?, (4) 'subscription not hourly' OK public?, (5) target-segment confirmation
- **produces:** Approved copy-cipo-linkedin-will-v0.md under Will's name; 5 flagged lines resolved
- **executed by:** Will Rosellini (expert) via Hermes liaison (expert-liaison practice)
- **informed by:** accounts/ventures/konstellation-cipo/artifacts/copy-cipo-linkedin-will-v0.md; faithfulness-constraints.md

### 15. Nick signs off on targeting + send strategy
- **gate:** approve-nick
- **status:** todo — separate gate AFTER Will certifies copy; depends on a real qualified list existing, which depends on the seq 5 bridge being built
- **produces:** Nick's approval of the qualified prospect list (from seq 11), segment qualification, send cadence/timing; go/no-go for execution
- **executed by:** Nick Lipetzky (sponsor) via Polaris (engagement-governance practice)
- **informed by:** Approved segment-criteria + list-qualification artifacts; the exported list from seq 11

### 16. Send the sequence on Will's LinkedIn
- **gate:** manual
- **status:** todo — terminal step; blocked behind both approvals (seq 14 Will, seq 15 Nick) and a real qualified list (seq 5 bridge + seq 10 contacts)
- **produces:** 4-touch sequence delivered to qualified prospects from Will's LinkedIn account; confirm_outreach_sequence RPC moves the artifact to sent; full provenance + source-map retained
- **executed by:** Will (manual per-touch via LinkedIn) OR HeyReach automation (respects per-account daily connect/DM limits)
- **informed by:** produce-sequence.mjs / confirm_outreach_sequence RPC; channel cadence connect→+0h DM→+3d→+4d; HeyReach client

## Build gaps (steps blocked on unbuilt systems)

- seq 4 — enrich-prospects.mjs --execute is a gated stub: the per-tool deepline-tools execute chain is unbuilt and Deepline BYO-keys (Nick's own paid APOLLO/HUNTER/EXA/SERPER/ZEROBOUNCE/EXPLORIUM keys in /code/work/.env) are not wired in, so the 197 signal companies cannot advance past stage='signal'.
- seq 4 — the qualification-logic judge (account verdict H1-H5 + D1-D6 + S1-S8, then contact reachability gate) is drafted but not implemented in code, so signal→enriched→qualified never completes.
- seq 5 — THE SEVERED LINK: no bridge (script/RPC/sync/ETL) routes qualified, domain-resolved canon.prospects into revops-engine staging. canon-engine and revops-engine are two separate Supabase projects; the flywheel writes canon.prospects (197) but Records and the prep funnel read revops public.companies (9167). Until this exists, the front half (signal→qualify) and the back half (prep→promote→outreach) are two disconnected pipelines.
- seq 5/6 — revops needs an engagement-aware company loader: it currently ingests raw CSV/API dumps and has no engagement concept (carries engine_account_id/account_id, no link to canon engagement_type/engagement_id). It must accept canon.prospects as a typed input.
- Cross-cutting — the feedback edge (revops.contacts outcomes/verified emails → back to canon to tune targeting artifacts) is unbuilt; the flywheel does not yet close on itself.

## Open questions (Nick's domain judgment finalizes the SOP)

- Bridge-or-bypass for this first run: do we build the canon→revops bridge (seq 5) now so the 197 signal companies flow through the real funnel, or hand-load a CSV into revops staging once to get CIPO outreach live, and build the bridge after? This decides whether launch waits on a build.
- Internal-list disqualifiers (DQ3-DQ6): current customers, active CRM cycles, burned audiences, do-not-contact — do these lists exist for CIPO yet, or do we declare them empty for v1? The suppression gate (seq 7) and qualification (seq 3) need them named.
- Deepline spend posture for the first enrichment run: confirm BYO-keys (your paid keys) are used before Deepline credits, and approve the pilot batch size + price for contact sourcing (seq 10) before any scaled paid pull.
- Which 5 Will-flags are real blockers vs. drop-from-v1: the FDA AI-device claim (hold out?), the $500-800/hr competitor-rate anchor, and the 'subscription not hourly' public statement all need your call alongside Will's cert before the sequence can send.
- Target-segment lock (Will's flag 5): deep-tech/biotech/medtech primary, or include DoD/SBIR adjacent? This changes the segment-criteria and which of the 197 signal companies actually qualify.
- CRAFT-REVIEW risks flagged 'partial': HF3 funding-stage facet reliability, sub-50-employee email-waterfall coverage, USPTO assignee match-rate haircut — accept these as known-thin for v1, or fix before first send?