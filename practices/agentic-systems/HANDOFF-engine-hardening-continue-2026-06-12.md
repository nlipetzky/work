# HANDOFF — Boris continues: engine-hardening + finish the mRNA list

**From:** Boris session (2026-06-11 night).
**To:** Boris (next session). Nick handed the engine to Boris; the mRNA operator session is closed.
**Read with (in order):** this file → `registry/_review/2026-06-12-engine-hardening-reconcile.md`
(the decisions) → `HANDOFF-mrna-session-state-2026-06-11.md` (the live list state, §4) →
`reference/operating-doctrine.md` (rules 1–12) → `systems/revops-engine/RUNBOOK.md` (the 7-step flow).

## What you own now
Two things, in this order: (1) **harden + finish the engine** so it survives a 500-row batch and
tells the truth, then (2) **drive the mRNA play to a delivered list**. The operator session is gone;
no concurrent writer. The engine is yours alone now — one writer, safe to edit runners + hit the DB.

## Where the deterministic engine stands (built tonight, all on main)
- `run-play.mjs` — code-driven driver. `--status`/`--json` reads real DB state (cannot narrate a
  count); `--execute` runs auto-steps, re-verifies from the DB, stops at gates; reports each gate
  WIRED/NOT WIRED. `run-play-all.mjs` + `com.nick.run-play-all.plist` — launchd, every 15min,
  read-only, writes `.run-status.json`.
- Gates: `gate-crm-suppression.mjs` (SF existing-customer/open-opp — WIRED, deterministic join, do
  NOT rebuild). `gate-ai-research.mjs` + `gates/wetlab` (generic AI-research gate, swap-the-prompt).
- `lib/db-batch.mjs` (+ test, 5/5) — batched `UPDATE … FROM (VALUES …)`, the §6.1 fix, NOT yet
  adopted into the runners.
- Exporters: `export-staging-csv.mjs` (review sheet), `export-airtable-payload.mjs` (transport).

## Step 0 — VERIFY REAL STATE FIRST (do this before building anything)
The classify job `btjres6vp` was a background process in the now-closed session — assume it DIED
mid-run. Read the truth from the table, never an exit code:
- `node run-play.mjs mrna_2026_06_11 /Users/nplmini/code/work/accounts/clients/teknova/plays/mrna-therapeutics`
- Confirm: row count (expect ~572), how many have `prep_verdict` set vs null/`semantic_error`, the
  verdict breakdown that SUMS to total. That tells you exactly where the batch really is.

## The ordered task list (decisions already made — see the reconcile proposal)
1. **Adopt batched writes.** Wire `lib/db-batch.mjs` into `classify-runner.mjs` and `verify-runner.mjs`
   (accumulate per-row results, `flushBatched` per 25) and the loaders. Keep the 429 retry-backoff too.
   This is what makes a 500+ row batch survive. Do this FIRST — everything downstream re-runs at scale.
2. **Re-run the screen** on the 572-batch with the hardened runner → real verdict counts (sums to total).
3. **Converge the AI-research path.** `verify-runner.mjs` stays the canonical **Verify node** (richer:
   deterministic `prep_qualified`, modality reconfirm); refactor it to share the per-row call + the
   batched-write lib with `gate-ai-research.mjs`. One AI-call path, not two.
4. **Run the gates on the 572-batch:** `gate-crm-suppression.mjs` (re-run, don't rebuild), then the
   verifier on IN/NARROW/NEEDS_REVIEW survivors → the real **evidence-qualified** count. That count is
   the deliverable basis. The recall lane (a search-prompt `gate-ai-research` config) handles "unclear".
5. **Register the Verify node** on `registry/signal/signal-prospecting/system.md` flow
   (Load→Stage→Screen→Flag-resolve→**Verify**→Promote→Contacts→Deliver) + verify-runner asset. Safe now
   (no concurrent editor). Run the registry smoke test after (`projection-ui` `npm test`).
6. **Finish the flow to a list:** Promote verified-qualified → **Contacts** (declared gap: build the
   Apollo people-search loader per `revops-icp-titles-mrna-therapeutics.md`, role exclusions; PAID →
   pilot 2 + price first) → contacts-screen + CRM-6mo suppression → **Deliver** (validate vs
   `delivery-contract.md`, regenerate the CSV with `export-staging-csv.mjs`, STOP for Nick's approval).
7. The client email cites the wrong inferred "43" — rewrite to the VERIFIED count, route through Hermes.

## Hard rules (this is where the night's trust failures lived)
- Counts come from the surface/query, never prose; a breakdown must sum to total (doctrine 6).
- A script exiting 0 is not "done"; the rows being in the intended state is done. Verify the table.
- "Qualified" means **evidence-verified**, everywhere. Inference flags; only cited evidence confirms.
- No ad-hoc data work — every action is a registered flow node (doctrine 12). New capability = declared
  gap → build into engine → register → use.
- Paid steps (verifier at scale, contacts pull) stop for pilot + price + Nick's approval.
- Exit: update touched system records; new state changes → `registry/_review/`.

## Pointers
Engine `systems/revops-engine/`; surface `systems/projection-ui/app/staging/page.tsx`; play
`accounts/clients/teknova/plays/mrna-therapeutics/`; registry record
`registry/signal/signal-prospecting/system.md`; open `registry/_review/2026-06-*` proposals.
