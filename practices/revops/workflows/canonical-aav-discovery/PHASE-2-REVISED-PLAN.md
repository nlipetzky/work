# Phase 2 (Revised): Populate Rules Tables

**Date:** 2026-05-12
**Supersedes:** Phase 2 in `~/.claude/plans/bubbly-whistling-crane.md`
**Reason for revision:** Research on mature RevOps rule-driven systems (HubSpot lead scoring, 6sense segment catalog, Clay scoring patterns, Airtable scoring guides) surfaced three structural issues with the original plan. The revised plan applies the consensus industry pattern.

---

## What changed vs the original plan

### Original
- One Classification Rules table, 8 categories, mixed L1 sourcing + L2 classification + L3 segment rules.
- Granularity ambiguous (one row per token vs one row per list).
- Value format undefined per Category.
- L3 hard gates and soft signals stored as siblings in the same table without an enforced application order.

### Revised
- **Two tables, split by consumer:**
  - `Classification Rules` (L2/L3): vocabulary, evidence, modality, reroute, disqualifier, hard filter, soft signal.
  - `Sources` (NEW, L1): query strings, source trust rank, auto-add thresholds, source-level metadata.
- **One row per RULE, not per token.** Vocab lists are a single row; the value field holds the delimited list. Ellie edits "the list of AAV indications," not 27 disconnected rows.
- **Value format documented per Category** (newline list, JSON, regex, single value).
- **Gate-first ordering is a WORKFLOW rule, not a table rule.** The L3 workflow applies hard filters in a binary fail-closed pass, then sums soft signal weights. Documented in workflow design, not the rule table.

### Why these changes
- **L1 vs L2/L3 split:** different consumers (capture workflow vs classify/filter workflow), different edit cadence (query strings change rarely, vocabularies change weekly), different failure modes. Mature platforms (6sense, Clay) split by consumer. Keeping sourcing config in the classification table is the most common single-table anti-pattern.
- **One row per list:** Ellie's mental model is "the AAV indications list." One-row-per-token forces her to scan dozens of rows to understand one concept. List-level granularity is the dominant pattern across HubSpot ("Contains any of"), 6sense filter catalog, Clay scoring sheet.
- **Typed value formats:** a single free-text Rule Value column means Ellie has to remember formatting per Category. That's how rules break silently. Documenting the format per Category turns it into a contract.
- **Gate-first:** Clay's explicit guidance: "Every scoring system needs a primary gate. If primary gate fails, the score is automatically 0 regardless of other signals." HubSpot enforces this by making fit criteria non-additive and engagement criteria additive. If a high score can override a hard filter, the filter is theatre.

---

## Tables

### Classification Rules (`tbl1HFYzezFYs5C3k`) — EXISTING, no schema change

Categories (9):

| Category | Layer | Purpose |
|---|---|---|
| `vocabulary_filter` | L2 | Disease-AAV ambiguity terms and similar pre-checks |
| `vector_evidence` | L2 | Clause A/B/C regex patterns for AAV verification |
| `indication_list` | L2 | Canonical AAV indications |
| `disqualifier_modality` | L2 | Excludes a record from the AAV bucket (no vector evidence, disease-only mention, etc.) |
| `disqualifier_segment` | L3 | Excludes a confirmed AAV company from outreach (top-20 pharma, CDMOs, etc.) |
| `modality_bucket` | L2 | AAV / mRNA-LNP / CAR-T bucket definitions |
| `reroute_map` | L2 | Modality → play mapping for non-AAV hits |
| `hard_filter` | L3 | Binary gates applied before scoring |
| `soft_signal` | L3 | Weighted scoring inputs |

Value format by Category (NEW — this is the contract):

| Category | Value Format | Example |
|---|---|---|
| vocabulary_filter | newline-delimited string | `aav\nadenovirus\nadeno-associated virus` |
| vector_evidence | regex string | `AAV[0-9]+` |
| indication_list | newline-delimited string | one indication per line |
| disqualifier_modality | newline-delimited string | one rule per line (e.g., `no_vector_evidence`, `disease_only_mention`) |
| disqualifier_segment | newline-delimited string OR JSON | one exclusion per line (e.g., `pfizer\nnovartis\nroche`) or JSON for typed rules |
| modality_bucket | single value | `AAV gene therapy` |
| reroute_map | JSON object | `{"mRNA-LNP": "play007"}` |
| hard_filter | JSON | `{"field": "company_type", "operator": "not_in", "value": ["CDMO", "CRO"]}` |
| soft_signal | JSON | `{"signal": "recent_funding", "detection": "...", "weight": 3}` |

Rule Weight column usage:
- Populated only for `soft_signal` rows.
- Null for all other categories.

### Sources (NEW)

L1 capture workflow reads this table to know what to fetch, how to rank trust, when to auto-add vs queue for review.

Fields:

| Field | Type | Purpose |
|---|---|---|
| Source Name | single-line text | e.g., `clinicaltrials_gov` |
| Source Type | single-select | `api` / `scrape` / `manual_upload` |
| Endpoint | long text | URL pattern or base URL |
| Auth Method | single-select | `none` / `api_key` / `oauth` |
| Query String | long text | The API query that defines the universe |
| Trust Rank | number (1-5 integer) | Affects auto-add vs queue. 5 = most authoritative |
| Auto-Add Threshold | number (0.0-1.0) | Per-source confidence cutoff. Records above this auto-flow to Companies; below queues for review. Default proposed: clinicaltrials.gov=0.9, Exa/Perplexity=0.5, manual=1.0 |
| Refresh Cadence | single-select | `daily` / `weekly` / `monthly` / `manual`. Default `monthly` |
| Last Refreshed | datetime | Auto-updated by L1 workflow on each run |
| Active | checkbox | Toggle without deleting |
| Notes | long text | Free-form context |

---

## Source docs → categories (revised mapping)

| Source Doc | Rules → Classification Rules | Rules → Sources |
|---|---|---|
| `revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md` | modality_bucket, reroute_map, disqualifier_modality (edge cases) | — |
| `revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` | — | Query strings, trust ranks, thresholds, source metadata |
| `revops-segment-aav-gene-therapy-ellie-outreach.md` | hard_filter (7), soft_signal (7 with weights), disqualifier_segment (9) | — |
| `HANDOFF-aav-sourcing-workflow-validation-2026-05-12.md` | vocabulary_filter (disease-AAV, 7 terms), indication_list (canonical AAV, 27 terms), vector_evidence (regex), disqualifier_segment (top-20 pharma) | — |

---

## Deliverables (in order)

1. Create `Sources` table in Airtable Teknova Outreach base with the 9 fields above.
2. Stage rule extraction as a markdown draft at `PHASE-2-RULES-DRAFT.md`. Nick reviews before any Airtable writes.
3. On sign-off, batch-insert via Airtable MCP.
4. Update `DESIGN.md` to reflect the two-table split.
5. Add a short `L3-WORKFLOW-DESIGN.md` placeholder documenting gate-first ordering for Phase 5.

Estimated: 2-3 hours unchanged. The split adds one table create, but removes ambiguity that would otherwise produce rework.

---

## Resolutions (2026-05-12)

1. Sources table includes `Last Refreshed` (datetime) and `Refresh Cadence` (single-select, default `monthly`).
2. Trust Rank: 1-5 integer.
3. Auto-Add Threshold: per-source, in the Sources table.
4. Disqualifier split into `disqualifier_modality` (L2) and `disqualifier_segment` (L3). Categories now total 9.
5. No outliers anticipated; will flag inline during extraction if any appear.
