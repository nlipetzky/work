# HANDOFF: Teknova / RevOps — fresh session (2026-05-18, end of day)

**For:** a fresh agentic-systems (Boris) session resuming the Teknova AAV / RevOps effort. Self-contained. Do not rely on prior chat. Verify against the surface and the canonical docs below; treat any agent narration as hypothesis.

**SUPERSEDES** `HANDOFF-teknova-monday-2026-05-18.md` in this folder — that was the start-of-day handoff and is now stale. Use this one.

## Role (do not drift)

agentic-systems operator. You own: artifacts, the criteria/vocabulary, SPEC/design review, the build gates, and the orchestration. You review and decide; you do not improvise client messaging or fire spend. You build the reliable system; you do not co-manage the client.

## Read first, in order

1. Memory (always-loaded index will point you): `project_teknova_l2_state_and_deferred.md` (has the close-out state + the currency-gate mandate at the top), `feedback_never_reauthor_segment_artifact.md`, `feedback_build_asset_lifecycle.md`, `feedback_canon_capture.md`, `feedback_teknova_icp_fixation_pattern.md`, `project_aos_rebuild.md`.
2. Canonical criteria artifact (v4, **NEVER re-author**): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` (note `accounts/clients/`, NOT `clients/`).
3. Ellie's input for the currency layer: `/Users/nplmini/Downloads/Ellie AAV context.md` and `/Users/nplmini/Downloads/Teknova, May 18th, 2026.md` (meeting transcript).
4. Process + assets: `/Users/nplmini/code/work/practices/revops/cohort-production-process.md`, `/Users/nplmini/code/work/practices/revops/workflows/REGISTRY.md`, `/Users/nplmini/code/work/practices/agentic-systems/reference/build-operating-system.md`.

## Verified state (surface-confirmed, not narrated)

- **Companies table = 121 records**, not 631. The ~510 Supabase/mystery rows were deleted by Nick. The set is CT.gov-sourced (~103) + Ellie manual + a few other-labeled.
- **n8n:** L2 v4 R5 `rXKuqfDwqX7TYzxK` is DEPLOYED + raw-B field-by-field verified + creds attached, but **NEVER RUN in production** (last full L2_classify run is 2026-05-15 v3, exec 77423). Verify `2rTMeD7SB3SBNZZE` deployed + smoke-passed (exec 80769). Smoke-variant `3ba5obhDdKcKc5Hs` ARCHIVED by Nick.
- **Data is mixed-vintage:** most rows v3 (2026-05-15) + Verify verdicts (today); 6 rows at v4 R5 from the smoke (correct values — do not revert).
- Modality (R5 / vasculitis homonym) is **SOLVED and client-confirmed** in the 2026-05-18 meeting. ICP/size is trivial and client-trusted. Do not relitigate either.

## The priority — the currency/status gate

The unsolved layer is **"is this company doing AAV *now*, worth Teknova's time"** — not modality, not ICP. Evidence: our R5 confirms Pfizer/Adrenas (modality-true) but Ellie's method correctly marks them INACTIVE (Pfizer exited gene therapy; BridgeBio killed Adrenas' BBP-631). Two inputs to build:
1. **CT.gov-side currency (deterministic, do first):** promote the R4 dormancy/trial-status data we already capture (trial status, Most Recent Trial Date, Active Recruiting) from decorative to a *surfacing gate*; when multiple NCTs pass R5, cite the active trial, not a terminated one.
2. **Announcement/exit intelligence (new capability):** Exa/Perplexity over each surfaced company for discontinuation / strategic-exit signals (CT.gov status fields lag real program death — confirmed in-meeting). This mirrors Ellie's actual method (trade press).

The "mind-meld": encode Ellie's currency test into the pipeline as a deterministic + evidence-backed gate, repeatable and traceable — not her ad hoc per-company Claude chats.

## Decision already taken (do not reopen without Nick)

Do NOT run full L2 v4 R5 now. Fold it into the currency-gate build and run **once** with both layers. A modality-only run today produces a cohort Ellie has explicitly said she does not want.

## Resume point — first actions

1. Confirm the verified state above against the surface (run log, Companies count).
2. Brainstorm/scope the currency gate with Nick — start with the deterministic CT.gov-side half (cheap, closes Pfizer/Adrenas partially), then scope the announcement-intelligence capability. Propose the artifact change as a new R-item/Q-item on v4 — **do not write the artifact without Nick's call; never re-author it.**
3. Currency gate is also the right time to fix the deferred dup-log defect (pre-existing; receipt-only; trigger = before L2 becomes recurring).

## Hard rules (canon — these bind every session)

- Verify on the observable surface; agent narration is hypothesis.
- Never re-author the criteria artifact; read + derive. segment-criteria skill is first-authoring only.
- A build touching a platform asset is not done until deployed + verified + `REGISTRY.md` updated + scratch torn down. Deferred teardown forbidden.
- Capture generalizable primitives to `practices/agentic-systems/canon/canon-log.md` in the same turn they surface. Nick may say "canon this."
- **Company size is NOT a gate.** Never use employee-count/size as an aggressive upstream sourcing hard-filter; never let it collapse a query or block output. Label/backstop only. Settled — do not re-derive (feedback_company_size_not_a_gate.md). If a sourcing query returns zero, suspect over-constraint (size/title∧department) before a coverage gap.
- No spend (Explorium/paid enrichment) without Nick's explicit same-session approval. CT.gov reads are free.
- Any L2 change ships through the n8n-safe-update protocol + raw deployed-config read-back gate.

## Deferred / parked (tracked, do not lose)

- Dup-log defect (receipt-only) — fix within the currency-gate build.
- PTC Therapeutics duplicate company rows — resolve before any Ellie-facing view.
- Persona-projection workstream — separate session; its projection contract is resolved and pinned in `project_teknova_l2_state_and_deferred.md` ("Contact-layer persona projection contract"). Do not redo it here.
- AOS rebuild — flagged strategic initiative, `project_aos_rebuild.md`. NOT a now-task; surface when Nick prioritizes. Canon log accumulates its seed.

## Artifacts produced this session (do not recreate)

- Client-facing: `/Users/nplmini/code/work/accounts/clients/teknova/aav-identification-and-verification.md`, `/Users/nplmini/code/work/accounts/clients/teknova/methodology-outline-2026-05-18.md` (corrected post Pfizer-reframing — current/safe).
- Build/gate: everything under `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/.build/` + `ORACLE-CORRECTION-2026-05-18b.md` (authoritative over the JSON oracle).
- Operating model: `/Users/nplmini/code/work/practices/agentic-systems/reference/build-operating-system.md`, `/Users/nplmini/code/work/practices/revops/workflows/REGISTRY.md`, `/Users/nplmini/code/work/practices/agentic-systems/canon/`.

## First action

Read the canonical docs + memory. Confirm the verified state on the surface. Then propose the currency-gate scope to Nick (deterministic CT.gov half first). Do not build, run, spend, or re-author without his explicit go.
