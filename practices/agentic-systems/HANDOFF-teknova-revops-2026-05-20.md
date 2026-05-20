# HANDOFF: Teknova / RevOps — fresh session (2026-05-20)

**For:** a fresh agentic-systems (Boris) session. Self-contained. Verify against the observable surface; agent narration is hypothesis until surface-checked. **SUPERSEDES** `HANDOFF-teknova-revops-2026-05-19.md` (kept as history).

## Role / posture (do not drift)

You are Boris, orchestrator. Builders (Explorium-Direct, Workflows) execute via plans you write; Nick relays for now and is the authorization gate for spend and irreversible actions. You review and independently surface-verify every builder report — "success" ≠ delivered. **Talk to Nick in plain English. No jargon, no acronym-puzzles, no embedded questions in long outputs.** State models and engine artifacts are *data*; views are operator-owned in Airtable — do not generate visibility/"what does Ellie see" questions in those artifacts.

## Big structural changes this session — read first

1. **Currency workstream CLOSED.** Pfizer correctly demoted off `surfaced` (Verification Status `borderline`, Currency Status `discontinued` from Perplexity trade-press). Adrenas stays `surfaced` (its `unknown` signal correctly does not override CT.gov). L2 v5 (R5+currency+trade-press), Task B identity fix, L1 dedup all deployed and verified. Explorium-Direct session closed.
2. **Contact-sourcing email + employment trust CLOSED.** All 5 DoD verified on bounded MeiraGTx test (exec 80832): Hunter-first emails, Apollo returning matches, four honest verification states, no duplicates (Person Key merge), opt-out field carried. Then `ICP Score Reason` field added + per-contact rationale persisted (exec 80833) — every score is now self-explaining on the record. **First true-positives ever observed: two Lexeo CTOs scored 85 with employer-verified LinkedIn employment.**
3. **Company state model implemented.** New `Lifecycle State` column on Companies (`fldmWpRzOi0bSN34U`). State derived programmatically from observable data per `practices/revops/ARTIFACT-company-state-model-2026-05-19.md`. Distribution across all 122: **raw=82, enriched=28, classified=1, icp_validated=0, expert_ready=0, excluded=11.** Adrenas-style "surfaced + archived" contradictions resolved → `excluded`. Per-company report: `practices/revops/RECONCILE-companies-lifecycle-state-2026-05-19.md`.
4. **Field provenance audit complete.** `practices/revops/AUDIT-companies-field-provenance-2026-05-19.md`. 135 total fields, **41 working / 1 computed / 93 not_written.** Of the 93: ~10 are legitimate manual-only (`Ellie Note`, `AE Cleared By/At`, etc.); ~50 may be working-but-undetected (writer exists but audit's name-filter missed it — confirmed e.g. Currency Status is actually written); **~31 strict-orphan candidates** (no description writer, no detected writer, data-type) but visual scan shows only **9 are truly empty across all 122**: `Active Signals Summary`, `Company Status`, `Exclusion Reason`, `Pipeline Indication`, `Play`, `Play Eligibility Status`, `Playbook Fit Level`, `Research Focus`, `V2 Company Type`. Those 9 = safe-deletion list pending Nick's go.
5. **Data Sources catalog created in System Registry.** Two new tables in base `apppQjlZiktpbO4aX`: `Data Sources` (`tblut8xIt9MgMO892`, 31 sources populated incl. Explorium/Apollo/Hunter/LinkedIn/CT.gov/Perplexity/Salesforce + 24 known-available providers across IP/regulatory/funding/trade press/conference/scientific literature) and `Data Fields` (`tbl6Ou9PprvZzhkgx`, 32 Explorium high-value fields pre-populated; rest lazy). Operating Model row 8 added. Full Explorium payload (271 business fields, ~50 prospect fields) documented in `practices/revops/REFERENCE-explorium-extractable-data-2026-05-19.md`.
6. **expert-liaison cold-start artifacts (v0 sketches, registered as Assets).** `practices/revops/ARTIFACT-prospect-discovery-package-2026-05-19.md` (cold-start discovery for prospects from seed name/website/LinkedIn). `practices/revops/ARTIFACT-contact-icp-document-2026-05-19.md` (human-facing control surface Ellie reads/edits, with the deterministic doc→engine binding loop as the non-negotiable). Both registered, Reconciled=false. Binding loop tracked as Roadmap `recMf1SkC8GO8GFg4`.
7. **State `ellie_ready` renamed to `expert_ready`** (client-agnostic). Memory feedback logged: state models are data; views are operator-owned in Airtable.

## Workstream state

1. **L1 → CT.gov signals** — done, verified.
2. **L2 currency (Tasks A+B+C)** — CLOSED + verified (workstream 3 above).
3. **Contact-sourcing trust (email + employment + ICP reason)** — CLOSED + verified.
4. **Contact-sourcing delivery** — open. The workflow finds people but only Lexeo yielded any score≥60 (2 CTOs). The persona-targeting/sourcing-yield gap is real but distinct from the trust work.
5. **Collect All Prospects 15→5 reducer fix** — TICKET OUT to Workflows, not relayed yet: `practices/revops/workflows/PROMPT-contact-sourcing-collect-prospects-reducer-fix-2026-05-19.md`. Bounded re-test on Voyager + Solid. Note: a Workflows-side ad-hoc run at 21:42Z already pushed Voyager + Solid contacts through (5 each), so the reducer may have been quietly fixed — verify versionId and the multi-company run before re-issuing.
6. **Companies cleanup** — debt roadmap item `recsglBmoOXMhldav`: manual-only separation, drift fixes (`DNC Opt Out`, `Last Contacted Date` → renamed), duplicate workflow retirement (~5 dupes: L2 Classify x3, Companies Enrichment x2, via-agent x2), orphan field deletion. **9 safe-delete fields identified; awaiting Nick's go.**
7. **Companies-state path to done** — registry roadmap `recG38TbAqKYZ0wNp` (in progress): Step 1 (audit) done; Step 2 (reconcile) done; Step 3 (cohort run) blocked on reducer fix + email-gate decision.

## Hard rules a fresh session must carry

- **Never trust agent narration.** Builder reports get independent surface-verification on every claim. Two times this session a "credential-preserving PUT" wiped all creds and was reported clean — caught by re-pulling the surface.
- **Never bulk-delete on a hypothesis.** Verify empty-on-all-rows before deletion. Confirm sync-direction before deleting on a synced table.
- **No autonomous spend.** Paid runs (Explorium, Apify, Apollo, Hunter, Anthropic, Perplexity) require Nick's explicit same-session authorization. Prior-session approval does not carry over.
- **n8n PUT/MCP wipes credentials.** Capture full workflow JSON before edit, raw read-back every credential + node/conn count after. `validate_workflow` misses Airtable corruption. Selective-run filters must be STATIC Airtable formulas, never dynamic n8n expressions.
- **Never re-author the canonical Teknova segment artifact** (`accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`). Read + derive; never re-run segment-criteria on it.
- **Lifecycle State is a lower bound.** A row is only as advanced as its weakest satisfied gate. `excluded` is terminal — never both surfaced and excluded.
- **State models are data; views are operator's.** Don't generate "what does Ellie see" questions in engine/state/registry artifacts.
- **When narrating creating files, the file must exist.** Verify with a follow-up read or Write completion before claiming a path. Same primitive as builder verification, self-applied.

## Resume point — first actions

1. **Read the registry Operating Model table + the new Data Sources catalog** to orient. Confirm: Companies=122 (state distribution above), Contacts new-pipeline ~20 (legacy ~365 pending Nick-authorized delete), Data Sources=31, Data Fields=32.
2. **Three decisions sitting with Nick** (no action until he chooses):
   - **Email-gate tuning** for `icp_validated`: stay strict (Verified, Catch-all only — Lexeo's 2 employer-verified CTOs blocked because emails are Unverifiable), OR accept Unverifiable when employment is LinkedIn-verified. This is the single tuning that decides whether `expert_ready` can ever become nonzero on current data.
   - **9-field safe deletion** (Active Signals Summary, Company Status, Exclusion Reason, Pipeline Indication, Play, Play Eligibility Status, Playbook Fit Level, Research Focus, V2 Company Type). Approve list → execute.
   - **Reducer fix relay** to Workflows (or verify it's already fixed via the unannounced 21:42Z run on Voyager + Solid).
3. **Sources Nick named as known-available but not wired** that he may want next: USPTO/Google Patents/PatentsView (IP), NIH RePORTER (early-stage funding), SEC EDGAR (public-company filings), ASGCT/BioProcess International (AAV-specific conferences), Citeline (paid pharma pipeline DB). All registered in Data Sources with `available-not-wired` status; the catalog row is the placeholder for any future connection.
4. **Do NOT** start more workflow fixes after the reducer. The defined path to client-presentable is: orphan cleanup → email-gate decision → enrichment + classification runs across the cohort → reconciliation → presentable view. Not more building.

## Files created this session (canonical artifacts)

- `practices/revops/ARTIFACT-company-state-model-2026-05-19.md` — lifecycle states + field provenance map (v0, decisions logged).
- `practices/revops/ARTIFACT-contact-icp-document-2026-05-19.md` — human-facing ICP doc + binding contract (v0).
- `practices/revops/ARTIFACT-prospect-discovery-package-2026-05-19.md` — cold-start discovery (v0).
- `practices/revops/AUDIT-companies-field-provenance-2026-05-19.md` — 135-field provenance audit.
- `practices/revops/RECONCILE-companies-lifecycle-state-2026-05-19.md` — per-company state with reasons.
- `practices/revops/REFERENCE-explorium-extractable-data-2026-05-19.md` — 271 business + ~50 prospect fields from Explorium, with the honest note that Clinical Stage / Pipeline Indication / Therapeutic Modality / etc. are NOT in Explorium.
- `practices/revops/workflows/PROMPT-contact-sourcing-collect-prospects-reducer-fix-2026-05-19.md` — ticket, not relayed.
- `practices/revops/workflows/PROMPT-contact-sourcing-employment-trust-2026-05-19.md` — done (verified exec 80832).
- `practices/revops/workflows/PROMPT-contact-sourcing-icp-reason-and-3co-run-2026-05-19.md` — done (verified exec 80833).
- Plus prior closed tickets in `practices/revops/workflows/` and `practices/revops/workflows/explorium-direct/`.

## Canon primitives to capture at AOS-build close-out

- A confirmation/verification status must be backed by a currency signal, not source agreement (employment-trust = the people-side analog of company currency).
- REST PUT can wipe credentials too (not just MCP update); raw read-back is mandatory after every deploy regardless of the path.
- Self-narration vs surface: Boris was caught this session narrating a file as "created" without actually calling Write. Same primitive applies to me.

Idle-waiting on Nick's three decisions is the correct state. Do not invent work.
