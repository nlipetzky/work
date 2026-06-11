---
type: decision
system: signal-prospecting
evidence: practices/agentic-systems/HANDOFF-mrna-session-state-2026-06-11.md
proposed: "Boris's answers to the mRNA handoff §6 + a reconcile of work two concurrent sessions built in parallel"
created: 2026-06-12
---

The mRNA session and the Boris session built overlapping engine pieces in parallel tonight without
seeing each other (registry lag). Reconcile before anyone builds more.

## Duplication to resolve (built twice)
- **AI-research-per-row gate**: mRNA built `verify-runner.mjs` (+ `verify-prompt.md`); Boris built the
  generic `gate-ai-research.mjs` (+ `gates/wetlab`). Same shape (fetch site → classify NA lab sites →
  evidence URLs). DECISION: `verify-runner.mjs` is the canonical **Verify node** (it's richer — it
  recomputes `prep_qualified` deterministically and reconfirms modality). `gate-ai-research.mjs` is the
  **generic harness** for *other* soft gates (LinkedIn, recall lane, future). Converge: refactor
  verify-runner to call the generic harness's per-row call + the shared batched-write lib; keep its
  deterministic qualification logic. Do NOT maintain two AI-call paths.
- **SF existing-customer gate**: handoff §6.4 lists it "designed, not wired." It IS wired — Boris built
  `gate-crm-suppression.mjs` tonight (deterministic SF join on `public.companies` sf_* cols; found 5
  matched / 3 open-opp on the old 140-batch). DO NOT REBUILD. Re-run it on the wide-net batch once
  classify completes.

## §6 answers (Boris)
1. **Batched writes — DONE (the fix, not the band-aid).** `lib/db-batch.mjs` (`buildBatchUpdate` pure +
   `flushBatched`): one `UPDATE … FROM (VALUES …)` per ~25 rows, ~25× fewer API calls. Pure SQL-builder
   tested (`lib/db-batch.test.mjs`, 5/5, no DB). **Adopt in classify-runner / verify-runner / gates /
   loaders AFTER the live classify (`btjres6vp`) frees the engine — do not hot-swap a runner mid-batch.**
   Keep the 429 retry-backoff too (belt + suspenders). DB is a Micro instance ([[project_revops_db_micro_cron_saturation]]).
2. **Register the Verify node** on the flow (Load→Stage→Screen→Flag-resolve→**Verify**→Promote→Contacts→
   Deliver) + verify-runner asset. "Qualified" = evidence-verified everywhere (surface, counts, client
   artifacts). Hold this registry-record edit until the engine session stops editing the same file
   (concurrent system.md edits = git conflict) — that's why this is a _review proposal, not a direct edit.
3. **Recall lane** = a second `gate-ai-research` config with a *search* prompt (clinicaltrials.gov / press /
   targeted web) for the "unclear" set. "unclear" = not-on-fetched-pages, never a disqualification. A
   prompt away, not new code.
4. **Still-unwired**: acquired-entity reparenting (verifier detects, must re-screen the live parent),
   contact-level LinkedIn current-employer + CRM-6mo (Contacts stage). Contacts node loader = declared gap.

## Process note
Two sessions on one engine is what caused the duplication. While a session owns the engine + a run is
live, the other stays hands-off the DB (rate limit) and the shared files (git conflict), and proposes via
_review. Boris's safe lane tonight: new non-colliding files only (db-batch lib, this proposal).
