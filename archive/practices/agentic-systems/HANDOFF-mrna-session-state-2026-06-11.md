# HANDOFF — mRNA play session + verification layer + engine-scaling break

**From:** RevOps operator session (Ferris), Teknova **mrna-therapeutics** play.
**To:** Boris (agentic-systems / meta-practice).
**Date:** 2026-06-11 (long session).
**Read with:** `HANDOFF-flag-resolve-system-2026-06-11.md` (the flag-resolve design, earlier this session),
`reference/operating-doctrine.md` (rules 1–12), `registry/signal/signal-prospecting/system.md` (the flow).

---

## 0. Why this handoff

One session ran the mRNA play from intake to a wide-net sourced batch, and in doing so (a) built a new
**evidence-verification layer** the engine was missing, (b) hit a hard **engine-scaling wall** (per-row
Management-API writes don't survive a 500-row batch), and (c) exposed a string of **trust failures** where
reported numbers/states didn't match what the operator saw. The list is **mid-finalization right now** —
§4 is the live state. Boris owns the engine-hardening decisions (§6) and should know exactly where the
list stands (§4) before the next session touches it.

---

## 1. What the session produced (the play bundle — all real, all from the playbook)

Source criteria: `accounts/clients/teknova/plays/mrna-therapeutics/Teknova_mRNA_Outreach_Playbook_v1 2026.06.10.md`
(client SME, 2026-06-10). Everything traces to it.

- Strategic artifacts (`accounts/clients/teknova/artifacts/`): `revops-offer-mrna-therapeutics.md`,
  `revops-segment-mrna-therapeutics.md`, `revops-icp-titles-mrna-therapeutics.md`,
  `revops-play-brief-mrna-therapeutics.md`.
- Play bundle (`plays/mrna-therapeutics/`): `delivery-contract.md`, `client-guidance.md`,
  `prep-recipe.json`, `classifier/` (classifier-prompt.md, read-fields.json, stage1-deterministic.sql,
  dedup-rules.json, routing-rules.json, contacts-screen-rules.json, **flags-v0.sql**, **verify-prompt.md**).
- Client-SME decisions captured in `client-guidance.md §0` (2026-06-11): oligonucleotide-only OUT;
  LNP-delivery IN; competitors + large-diversified pharma KEEP-and-FLAG; ranking wanted; **no size cutoff
  for this play**; acquired/renamed → resolve-to-live-parent; existing-customer read from the SF mirror.

## 2. The flag-and-resolve layer (built v0 this session)

Per the earlier handoff + Boris's decisions (rule-existence gate; confidence = telemetry, never gates;
prep_flags = one JSONB array + prep_attention scalar; resolver = skill/sub-agent; Deepline disciplines —
strict 4-section escalation packet, two-source rule, stop-loss-then-drop, one-flag pilot).
- `flags-v0.sql` writes `prep_flags` work items + `prep_attention` roll-up + (manually) `prep_resolution`.
- Resolver spec: `practices/agentic-systems/specs/flag-resolver-v0-spec.md`. One-flag pilot proven (an
  escalation packet for a no-domain row, then auto-dropped per the ratified data-hygiene rule:
  no-resolvable-domain-after-one-pass → DROP; over-source 1.4×N).
- Manual resolver pass run on the 140-batch: 26 of 31 flags resolved by rule (cited), 5 novel → ONE
  4-section packet. (This work was on the 140-batch, since overwritten — see §4.)
- Surface: `projection-ui` staging page now renders attention chips, flag chips, a "needs-you" filter,
  the decision-packet drawer, AND the verification view (§3). All in `app/staging/page.tsx`.

## 3. The verification layer — THE key new component (trust-critical)

**Why it exists:** the classifier INFERS gates from a one-paragraph blurb; it cannot CONFIRM. The operator
caught the session claiming "screened for a North American lab + active operations" when those gates were
never verified (only an HQ-location filter at the source) — and that false claim had been written into a
client email. The doctrine: filled ≠ trusted; a gate is met only with cited evidence.

**What was built:**
- `systems/revops-engine/verify-runner.mjs` + `plays/mrna-therapeutics/classifier/verify-prompt.md`
  (the latter adapted from the **proven ngAbs site-verification prompt the operator supplied**).
- It fetches the company's OWN website (wide path set: /about, /facilities, /locations, /contact,
  /careers, /manufacturing, /pipeline, …), extracts every **North American site**, classifies each
  (`rnd_wetlab | process_dev | gmp_mfg | qc_analytical | sales_admin | unclear`) with an **evidence URL**,
  and reconfirms the mRNA program (catching upstream false positives). It confirms a gate ONLY from
  fetched content; no fetch = not confirmed. `prep_qualified` is recomputed deterministically (a real NA
  lab site evidenced AND mRNA not contradicted) — never trusted from the model.
- Sits as a new **Verify node** between Screen/Flag-resolve and Promote.
- **Proven on the (prior) 140-batch: 12 evidence-qualified of 42** classifier-survivors (vs 43 inferred).
  It caught real false-positives (a cell-therapy co the classifier called mRNA; an anti-miRNA-oligo
  pipeline I'd resolved to IN). Per-site cited evidence (e.g., ElevateBio → GMP Waltham MA + Pittsburgh PA
  + R&D Durham NC, all @elevate.bio/facilities).
- Surface: `prep_qualified` chip column + a "Verification — evidence" drawer section with per-site
  classification and clickable evidence URLs. Live in `app/staging/page.tsx`.

**The honest lesson that shaped this:** "43 qualified" was inference; "12" was evidence. The verified
number is the only one that may reach the client. The 21 "unclear" on that batch were unverified (their
sites don't publish a lab address) — NOT disqualified; they need a second evidence lane (targeted search).

## 4. CURRENT LIVE STATE — the list is mid-finalization (read carefully)

### SESSION-END UPDATE (2026-06-11 — supersedes the "right now" prose below)
The wide-net SCREEN **completed**. The earlier classify failures were TWO separate things: a transient
Supabase 429 on a setup query (fixed with retry), and the REAL blocker — **the Anthropic API ran out of
credits** ("credit balance too low" on every call). Anthropic is now **funded**, and the runners were
**rewritten to the proper batched-write architecture** (`lib/db-batch.mjs` = one `UPDATE … FROM (VALUES …)`
per 25 rows; `lib/ai-call.mjs` = shared Anthropic call with 429/529 backoff + loose-JSON parse). That is
the §6.1 fix — DONE — and `classify-runner.mjs` + `verify-runner.mjs` now use it.

**Final state of `staging.companies_mrna_2026_06_11` (572 rows) — SCREEN COMPLETE:**
- stage1 OUT: 50 · classify OUT: 396 · **IN: 94 · NARROW: 3 · NEEDS_REVIEW: 79** → **176 deliverable
  candidates**.
- **VERIFY HAS NOT RUN on the wide net.** `prep_verify` / `prep_qualified` are empty (the 140-batch's verify
  was overwritten by the wide pull). The evidence-qualified count is UNKNOWN until verify runs on the 176.

**NEXT SESSION, step 1:** `node verify-runner.mjs mrna_2026_06_11 companies --play <classifier_dir>` (it
self-selects the 176 IN/NARROW/NEEDS_REVIEW rows) → the real evidence-qualified number. Then flags +
resolver pass, promote the qualified set, build the contacts loader (paid pilot gate), deliver (export
gate). **Verify counts in the table; never trust a runner's exit code** (the canonical failure this session).

---


**Decision in force:** deliver the *real* (verified) universe, not an inferred count. No loosening of the
*screen*. Widen the *source* net and let the screen + verifier filter. Explorium is a later top-up
(the Konstellation Explorium account is credit-depleted: ~8 of 12,500; the key in `.env` IS that account).

**The batch right now: `staging.companies_mrna_2026_06_11`**
- **572 rows.** Sourced from Apollo's **wide keyword net** (mRNA keywords, US+CA, **NAICS gate removed** —
  690 net, 572 had domains to enrich), `source=apollo`, full faithful capture (48 cols). This **overwrote**
  the earlier 140-company NAICS-tightened batch (drop+recreate) — so the 140-batch's screen/flag/verify
  work, including the 12 verified-qualified, is GONE from the table (known by name only; the wide net is a
  superset and will redo it).
- **stage1: 50 OUT** (deterministic), **522 residual**.
- **classify: re-running in the background RIGHT NOW** (`btjres6vp`). NOTHING in the wide net is screened,
  flagged, verified, or qualified yet.

**What just went wrong (and was fixed):** the first classify pass **failed on all 522** — the Supabase
**Management-API rate-limited (429)** the per-row writes, the runner threw every row into permanent
`semantic_error`, and **still exited 0** (a false "CLASSIFY DONE"). The retry-loop wrapper was useless
because it only re-runs `residual` rows, not `semantic_error`. Fix applied: **429/503/544 retry-with-
backoff added to `sql()` in BOTH `classify-runner.mjs` and `verify-runner.mjs`**; the 522 reset to
`residual`; classify relaunched. **Do NOT trust a runner's exit code on big batches — verify the actual
verdict counts in the table.** (UI was also silently capping the staging preview at 500 rows; raised to
5000 + a "rows loaded X of Y — truncated" indicator in `app/staging/page.tsx`.)

**Immediate next steps (once `btjres6vp` completes — VERIFY counts, don't trust exit):**
1. Confirm all 522 actually classified (re-run on any genuine errors).
2. Apply `flags-v0.sql` + a resolver pass on the survivors.
3. Run `verify-runner.mjs` on the IN/NARROW/NEEDS_REVIEW survivors → the real evidence-qualified count.
4. That verified count is the deliverable basis. Then: promote → contacts → deliver (§5).

## 5. The flow + where finalization sits

`registry/signal/signal-prospecting/system.md` now has nodes: **Load → Stage → Screen → Flag-resolve →
Promote → Contacts → Deliver**. We are at **Screen** (re-running) on the wide net. Still ahead:
- **Promote** the verified-qualified set to Core (`promote_staging_batch`).
- **Contacts** node — DECLARED GAP, to build: a contact-sourcing loader (Apollo people search) per
  `revops-icp-titles-mrna-therapeutics.md` with the engagement role exclusions, same conventions as the
  company loaders (`load-apollo-to-staging.mjs` / `load-explorium-to-staging.mjs`), into `staging.contacts_*`.
  PAID — pilot on 2 companies, bring the per-contact price BEFORE the scaled pull. Then contacts-screen +
  the **existing-customer / CRM-6mo suppression read against the Airtable SF mirror `app5wdHwgM1SPNxcx`**
  (mirror tables `ME_Account_Mirror` / `ME_Contact_Mirror` / `ME_Opportunity_Mirror`, native SF sync).
- **Deliver** node — validate the contact list against `delivery-contract.md`, show on the staging
  surface, STOP for the operator's export approval. Nothing leaves without it. **The list the client SME
  receives is the Deliver-node output.**

**Email to client SME:** a draft exists (`plays/mrna-therapeutics/email-ellie-mrna-company-list-2026-06-11.md`)
but it cites "43" (inferred) and is therefore WRONG — must be rewritten to the verified number, and it
routes through **Hermes** (expert-liaison), not sent from the play folder.

## 6. Engine-hardening decisions for Boris (the systemic items)

1. **Per-row Management-API writes don't scale.** This is the real wall. Retry-backoff (added) is a
   band-aid; the right fix is **batched writes** — accumulate per-row results and flush one `UPDATE … FROM
   (VALUES …)` per ~25 rows, cutting API calls ~25×. Applies to classify, verify, and the loaders. Decide
   the pattern and graduate it into the runners. (Also: the DB is a Micro instance — memory
   `project_revops_db_micro_cron_saturation`.)
2. **The Verify node is now a permanent part of the flow** — register it (it's built but not yet on the
   registry record's flow/assets). Evidence-gated qualification is the contract; "qualified" must mean
   verified, everywhere (surface, counts, client artifacts).
3. **Recall lane for the verifier.** "unclear" = "not on the pages we fetched," not "doesn't exist." A
   second evidence lane (targeted web search / clinicaltrials.gov / press) is needed before a not-found is
   trustworthy, especially for thin small-developer sites.
4. **Still-unverified criteria** (so the gate set is honestly complete): G4 reagent-fit / existing-customer
   (SF-mirror read — designed, not wired), acquired-entity **reparenting** (verifier detects, doesn't
   re-screen the parent), contact-level LinkedIn current-employer + CRM-6mo (the contacts stage).
5. **Source loaders registered** (`load-apollo-to-staging.mjs` VERIFIED; `load-explorium-to-staging.mjs`
   path-proven, credit-blocked) on the Load node. Both: play-folder-bound, `--source PROVIDER`, full
   faithful capture, `--dedupe-against`, NAICS industry filter, Explorium pre-flight `/v1/credits` check.

## 7. Operating-discipline corrections this session (how to not repeat the failures)

- **Report the number the SURFACE shows, or reconcile it out loud.** This session quoted 43 (inferred),
  12 (verified), 690/572 (loader), 500 (UI cap) — none reconciled to the operator's screen. Trust broke.
- **Verify before reporting "done."** A script exiting 0 is not done; the rows being in the intended state
  is done. The false "CLASSIFY DONE" over an all-errored batch is the canonical failure.
- **Never claim a gate is met without the cited evidence on the record.** The faked NA-lab claim in a
  client email is the worst event of the session. Inference flags; only evidence confirms.
- **The surface IS part of the build.** A runner that writes to the DB but isn't legible on the projection
  surface is not done. Verification data had to be built into the staging view, not offered after.
- Doctrine rule 12 honored on the loaders (declared gap → build into engine → register → use), and rule 1
  (recommend-then-ratify) on the open decisions.

## 8. Pointers
- Engine: `systems/revops-engine/` — `verify-runner.mjs` (NEW), `classify-runner.mjs` (+retry),
  `loader/load-apollo-to-staging.mjs` (NEW), `loader/load-explorium-to-staging.mjs` (NEW),
  `run-stage1.mjs`, `lib/`, `supabase/migrations/`.
- Surface: `systems/projection-ui/app/staging/page.tsx` (+ `components/DataTable.tsx` renderCell).
- Play: `accounts/clients/teknova/plays/mrna-therapeutics/` + `accounts/clients/teknova/artifacts/revops-*-mrna-therapeutics.md`.
- Registry: `registry/signal/signal-prospecting/system.md` + `registry/_review/2026-06-11-*.md` (two proposals).
- Specs/handoffs: `practices/agentic-systems/specs/flag-resolver-v0-spec.md`,
  `practices/agentic-systems/HANDOFF-flag-resolve-system-2026-06-11.md`, this file.
