# ORCHESTRATION: Teknova parallel build — single-writer lane map (2026-05-18)

**Purpose:** four sessions are working the Teknova AAV pipeline in parallel. They share three contended assets. This doc is the single authority on *who may touch what, when*. A cold session in any lane reads this before writing anything. Boris (agentic-systems) owns this file.

## The four lanes

| Lane | Session / owner | Scope | Writes to |
|---|---|---|---|
| **A — Currency gate** | agentic-systems (Boris), this session | R6/Q proposal + Phase 1 deterministic CT.gov currency + Phase 2 announcement intelligence | L2 `rXKuqfDwqX7TYzxK`, Step 9 Verify `2rTMeD7SB3SBNZZE`, artifact (proposes only) |
| **B — explorium-direct** | explorium-direct, complete | L2 v4 R5 build + Step 9 Verify build + smoke | handed off untouched; **no further L2 writes** |
| **C — Contact sourcing ICP** | workflows session | workflow `bYZ0sAzyUvU60wMZ` (23 nodes, inactive) | `bYZ0sAzyUvU60wMZ` only |
| **D — Persona projection** | agentic-systems (Phase B), complete | 19 persona rows + v5 provenance; Phase A incomplete | Classification Rules (done), artifact v5 (done) |

## Contended assets — single writer each

1. **Criteria artifact** — single authorable source, **Nick authors**. Current head = **v5** (D, persona provenance). A's currency work proposes **v6 on the v5 base** — do not branch from v4. Never re-author (segment-criteria is first-author only).
2. **L2 `rXKuqfDwqX7TYzxK`** — **A is now sole editor.** B handed it off untouched; the currency change is the only pending L2 work. No other session edits it. Ships via n8n-safe-update + raw read-back (MCP edit wipes credentials).
3. **Step 9 Verify `2rTMeD7SB3SBNZZE`** — **A is sole editor** (Phase 2 announcement intelligence folds in here). B's build is complete and frozen.
4. **Companies table fixtures** — B left 6 mixed-vintage rows; C left MeiraGTx as lone `Outreach Eligible` + 4 reset to false. **ONE reconciliation, owned by A, gated immediately before the cohort run** — not three separate cleanups.

## Convergence (not a collision): C's enum fix ⟶ D's persona contract

C's root cause (Explorium `job_level`/`job_department` enums null for this biotech segment → ANDed hard-filters zero results) is the empirical confirmation of D's persona-contract invariant 4 (those enums are fixed, source wide on the band, segment in residual). C routed the fix to Boris. **A owns the reconciliation; it must not contradict D's invariants** (esp. #3 wide seniority floor, #4 enum→residual). Output is a persona-contract-consistent fix spec C then applies to `bYZ0sAzyUvU60wMZ`. A does not edit C's workflow.

## Recommended order

1. **Now (parallel-safe, no asset writes):** A drafts Phase-1 currency spec + R6/Q proposal text; A reconciles C's enum fix against D's contract → fix spec. Nothing serialized here.
2. **Nick decides:** ratify R6 + Q4 staleness cutoff (the one input the deterministic half needs); approve Phase-2 spend (Exa/Perplexity over ~35).
3. **Serialized build:** A ships L2 currency change + Step 9 Verify Phase 2 (sole writer). C applies the persona-consistent enum fix to `bYZ0sAzyUvU60wMZ`. Different workflows, no collision.
4. **Gate before cohort run:** A reconciles Companies fixtures. Then one L2 run with modality + currency.

## Overdue teardown (lifecycle rule)

Smoke-variant `3ba5obhDdKcKc5Hs` is scratch, smoke-passed, parked. Deferred teardown is forbidden — archive it + update REGISTRY now. Owner: A or B, whoever moves first.

## Open, routed to Nick

- Q4 staleness cutoff (5yr default) — load-bearing once currency ships.
- Phase-2 spend approval.
- Patient-facing disqualifier ruling (parked from C and D).
