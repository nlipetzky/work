# Step 4 design: L2 Classify rebuild to v3 schema + 631 re-queue

**Date:** 2026-05-15
**Status:** DESIGN FOR REVIEW. No build. No enrichment. No spend. No outbound.
**Target workflow:** `rXKuqfDwqX7TYzxK` (the only L2; `HUpkdwNTBcDutT8o` archived by Nick).
**Reads (read-only):** Classification Rules `tbl1HFYzezFYs5C3k` `{Active}=TRUE()` (51 rows). Companies `tblnj3YlOI3thjrXp`.
**Writes:** Companies only. Never Classification Rules, never enrichment fields, never L3 (`Canonical Status`/`Segment Score`/`Outreach Eligible`).
**Grounding:** v3 projection parsed (52 rows, 51 active). Nkarta `rec0SJcJbRMJIiz3Q` inspected (see §5).

## 1. The v3 rule schema L2 must consume (9 categories)

| Category | Count | L2 uses it? | How |
|---|---|---|---|
| `vector_evidence` | 4 | YES | clause_a regex/substring (AAV name), clause_b branded-fallback→needs_aav_review, clause_c CT.gov genetic indication, salesforce_aav_tag (631 only if SF-tagged) |
| `indication_list` | 1 | YES | `canonical_aav_indications` pipe-list → positive match on CT.gov Indications |
| `disqualifier` | 3 | YES (2) | `disease_aav_exclusion` (35 variants, keystone), `dormancy_rule`. `parent_company_domain` is **Active=false** (M2-pending) — not enforced, flagged per handoff |
| `disqualifier_modality` | 6 | YES | exclusion tokens → wrong-modality detection on CT.gov text |
| `modality_bucket` | 10 | YES | the classification label written to `Custom Classification`/`AAV Segment` |
| `reroute_map` | 1 | YES | `modality_to_alt_play_map` → reroute note when non-AAV modality |
| `hard_filter` | 7 | **NO at L2** | 3 firmographic + 4 contact/demographic. Firmographic = enrichment (Step 6); contact = Family 3. Out of scope. |
| `soft_signal` | 7 | **NO at L2** | scoring signals, L3/enrichment. Out of scope. |
| `disqualifier_segment` | 13 | **PARTIAL** | 8 are contact-level (Family 3, out of scope). 5 `disq_edge_*` are company archive rules — see §4 firmographic gap. |

**Design decision:** L2 reads the whole `Active=true` set but applies only the **company-text-evaluable** categories above. The contact/firmographic/scoring categories are consumed by Family 3 / enrichment / L3, not silently dropped — explicitly out of L2 scope, documented in the workflow sticky note. This is the "consume don't author, one projection many readers" contract: L2 is one reader of the projection, not the only one.

## 2. The 631 re-queue (Nick-sanctioned)

A guarded first stage **inside the n8n workflow** (workflow is the deliverable — no MCP hand-moves):

- Node `Re-queue 631`: Airtable search Companies for this play's pre-v3 cohort, then batched update `Verification Status` → `needs_verification`. This is the deliberate human-sanctioned re-queue (halt-invariant compliant: a person triggered it; it is not a workflow auto-advancing a halt). Underlying CT.gov/enrichment data is preserved — only the stale verdict is reset.
- Scope guard: restrict to the play cohort (Discovery Sources contains `clinicaltrials_gov` and/or the play tag) so the reset can't bleed into unrelated rows. Exact selector is an **open item** (§6) — `Play` field is deprecated per the field audit; needs a concrete scoping predicate before build.
- Idempotent: re-running sets the same rows to `needs_verification`; no duplication.

Then `Read Candidates` reads `{Verification Status}='needs_verification'` (existing 631 reset + any fresh-pull rows L1 wrote as `needs_verification`).

## 3. Evaluation order (precedence) — the core logic rebuild

Replace the 2-row legacy extract with a typed evaluator. Per row, in this order (first hit wins for halt/reject; positives accumulate):

1. `parent_company_domain` — SKIP (Active=false, flagged).
2. **`disease_aav_exclusion`** — normalize CT.gov Indications (lowercase, decode HTML entities, collapse whitespace, strip punctuation) then match the 35 variants. Hit → `Verification Status=rejected`; `Rejection Reason` = the **matched variant string(s) verbatim** (not a fixed `disease_AAV` token); `Classification Notes` = collision detail. Subsumes Amgen/Fate/Nkarta (R2).
3. **`disqualifier_modality` exclusion tokens** + non-AAV `modality_bucket` — token match with required context word on CT.gov intervention/condition text. Hit → `Enrichment Status=rerouted_wrong_modality`; attach `modality_to_alt_play_map` line to `Classification Notes`; `Verification Status=rejected`.
4. **`dormancy_rule`** (evaluated BEFORE positive — precedence step 4) — **RULED (agentic-systems pass 2 + Nick):** hit → `Verification Status=borderline`; `Rejection Reason="dormant: most recent trial >5yr, no active/recruiting (machine default, Q4 pending Ellie)"`; no new option. **Requires L1 scope addition:** L1 (`9gcmEjq1lvOY2jZS`) must persist most-recent-trial date + an active/recruiting/enrolling flag (already fetched from CT.gov). Without these R4 is decorative and dormant AAV shells (Tacere/Avigen/Ceregene/Neurologix) mis-surface. Not optional.
5. **Positive evidence** (rank order from rule notes): `salesforce_aav_tag` (rank 1, 631 only) > `clause_c_canonical_indication_genetic` (CT.gov genetic indication, outranks website) > `clause_a_intervention_name` (AAV regex/substring). Any positive AND disease filter did **not** trigger → `Verification Status=surfaced`; `Custom Classification` = `aav`; `Vector Evidence Clause` = C or A by which fired. **AAV Segment: NOT written by L2 — Ellie-write-only (RULED pass 2).** The original `AAV Segment=modality_aav` is retired as an invalid instruction: `modality_aav` is not a live `AAV Segment` option (`{gene_therapy|production_tool|both|unknown}`); the gene-therapy-vs-production-tool axis is a commercial judgment L2 cannot derive from CT.gov text (it is the review's purpose; companion `Ellie Segment Override`/`Ellie Reviewed At`). Leave blank = awaiting Ellie; do not pre-fill even `unknown`.
6. `clause_b_gene_therapy_branded_fallback` — branded gene-therapy language, no AAV terms → `Enrichment Status=needs_aav_review` (halt, not auto-reject).
7. Else → `Verification Status=borderline` (halt), `Classification Notes` = "no canonical match, no collision — manual review".

## 4. The firmographic-archive gap (must decide before build)

The handoff acceptance test says **bread company → `archived_out_of_industry`**. L2 over CT.gov text **cannot** detect a non-biotech company: the 5 `disq_edge_*` archive rules and the 3 firmographic `hard_filter`s need headcount / HQ country / NAICS / subsidiary data that only **enrichment** (Explorium, spend-gated, Step 6) produces. Nkarta carries **no** firmographic fields (not enriched) — confirmed in §5; a bread-company contaminant from a non-CT.gov source would be the same.

Three options for Nick — I recommend (a):

- **(a) Scope the acceptance test to what L2 can actually do.** L2 delivers: Nkarta → `rejected` (vasculitis), wrong-modality → `rerouted`, dormant → disqualified, AAV → `surfaced`, unknown → `borderline`. Out-of-industry archival is explicitly an **enrichment-stage** outcome (Step 6, behind the spend gate), because that is the only stage with firmographics. The bread company stays `borderline` after L2 and is archived at enrichment. Honest about where the capability lives; no invented heuristic.
- (b) Add a deterministic non-biotech heuristic at L2 (e.g., zero CT.gov indications + zero AAV evidence + zero trial count + no modality token → `archived_out_of_industry`). Risk: over-archives genuine borderlines that just lack CT.gov text. Not recommended without Ellie ruling.
- (c) Inspect the actual bread record's existing fields and special-case. Brittle, one-off, not a rule. Not recommended.

This is the single biggest scoping decision in Step 4. It does not block building the rest of L2.

## 5. Acceptance-test grounding (read-only, done)

- **Nkarta** `rec0SJcJbRMJIiz3Q`: `Verification Status=borderline`; CT.gov Indications = "Systemic Sclerosis; Idiopathic Inflammatory Myopathies; **Antineutrophil Cytoplasmic Antibody-Associated Vasculitis**"; Notes = "No canonical match and no disease-AAV collision" (proof the legacy 2-row L2 missed it). v3 `disease_aav_exclusion` 35-variant set includes ANCA-Associated Vasculitis ⇒ rebuilt L2 step 3.2 flips Nkarta → `rejected`, `Rejection Reason` = the matched vasculitis variant. **Test achievable.** No firmographic fields present (not enriched) — confirms the §4 gap.
- **Bread company:** not name-searchable in Companies; not a CT.gov-sourced row. Representative out-of-industry contaminant. Subject to the §4 decision.

## 6. Open items for Nick (decide before build)

1. **631 scoping predicate** for the re-queue (`Play` field deprecated — what selects this play's cohort? Discovery Sources = clinicaltrials_gov? a Playbook link? a date floor?).
2. **Dormancy target state** — `rejected` w/ reason vs. an archive bucket (no `dormant` option exists).
3. **Firmographic-archive gap (§4)** — adopt option (a) (recommended) or direct otherwise.
4. **Fresh CT.gov pull** — L1 `9gcmEjq1lvOY2jZS` re-run is in Step 4 scope; dedupe on Company Name (its upsert key) — confirm Company Name is the dedupe key vs. Domain (L1 currently upserts on Company Name; Domain often empty pre-enrichment).

## 7. Explicitly NOT in this build

Enrichment / Explorium / any spend. The enrichment monolith `Z6RROKx5omdfvhtn` (findings 4–5: 2.2 fused/wrong-order, second hardcoded rules source, mixed gate versions) — deferred to Step 5/6 behind Nick's spend gate, not absorbed here. Family 3 contact rules, `hard_filter`/`soft_signal`/contact `disqualifier_segment`, L3 promotion, M1/M2. `parent_company_domain` stays inactive.

**Next:** Nick rules on §6 (esp. #3). Then I build `rXKuqfDwqX7TYzxK` to this design via the n8n-safe-update path (credentials wiped on update, 500-on-success, republish) and validate against Nkarta before any broader run. Still no enrichment, no spend.
