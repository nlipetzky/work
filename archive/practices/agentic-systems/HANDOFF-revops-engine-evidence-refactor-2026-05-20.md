# HANDOFF — RevOps Engine evidence-capture refactor (2026-05-20)

**For:** a fresh agentic-systems (Boris) session. Self-contained. Verify against the observable surface; agent narration is hypothesis until surface-checked. **SUPERSEDES** `HANDOFF-teknova-revops-2026-05-20.md` from the morning of the same day (kept as history).

## Role / posture (unchanged)

You are Boris, orchestrator of the RevOps Engine (now a registered platform system: `revops-engine`, ID `recbpvJNm8hVCYAPu` in the System Registry). Builders (Workflows, Explorium-Direct) execute via tickets you write; Nick relays for now and is the authorization gate for spend and irreversible actions. You review and independently surface-verify every builder report. **Talk to Nick in plain English. No jargon. No bullet-soup. No "puzzle output."** State models and engine artifacts are *data*; views are operator-owned in Airtable.

## What this session was about — read first

Nick and I converged on a foundational shift in how the RevOps Engine should work. The shift is canon-tier:

> **Capture evidence. Do not compute verdicts. Engine value is in finding the right data, describing it, capturing it as source content, and building dossiers — not in writing labels over it. Classification is commodity.**

The session went through three corrections before landing:
1. I described the AAV-qualification check using a Verdict field (`Verification Status = surfaced`) — Nick called it a puzzle / hand-waving; the verdict assumes "an omnipotent being changed the status."
2. I narrowed to "two fields with Yes/No + evidence" — Nick said Yes/No fields are still verdicts; the evidence IS the answer.
3. I landed on: every paid call writes per-source evidence columns; per-play filters apply at view time; no derived booleans in fields.

Nick also corrected: the engine is **multi-tenant**. Engine-layer tables, fields, workflows, and configuration carry **no industry terms**. Biotech vocab ("modality," "AAV," "gene therapy," "vector," "clinical stage") lives only in per-client / per-play artifacts. Neutral vocabulary at the engine layer: play, target definition, discovery source, evidence, qualifying signal, disqualifying signal, suppression flag, dossier, entity.

These two corrections produced an artifact, a canon entry, and an execution plan that ran in the second half of this session.

## Big structural changes this session

1. **Engine principles registered.** `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` — 10 principles + value statement + generic play loop. Registered as Asset `rec6mo2pko7A8ecHr` linked to the `revops-engine` system. Tenant-agnostic. Every client engagement inherits this.

2. **Canon entry captured.** `practices/agentic-systems/canon/canon-log.md` — dated 2026-05-20, "Engine value is find / describe / capture / enrich; classification is commodity." Source-of-record at `practices/agentic-systems/canon/sources/2026-05-20-evidence-not-classification.md`.

3. **RevOps Surface schema additions.** Company Events table grew from 21 → 29 fields with new evidence columns (`Title`, `Names`, `Categories / Tags`, `Study Type`, `Intervention Type`, `Intervention Names`, `Conditions`, `Raw Payload`). Contact Events table was a 1-field stub; built out to 21 fields with full mirror-schema of Company Events plus contact-link.

4. **Execution plan written + approved.** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`. Defines the evidence-capture refactor: which fields stay on Companies / Contacts, which demote to rollups, which delete, what events get written by which workflows, and which workflows need updates or new builds.

5. **11 build tickets written, each in its own subfolder under `practices/revops/workflows/`.** Every PROMPT carries a write-ownership header naming the workflow ID it owns + the working-scope folder. This is the parallel-safety mechanism: builders launched in their respective folders cannot collide.

6. **System Registry has 11 new Asset rows**, one per ticket, all linked to `revops-engine`, Lifecycle State = `built`, Reconciled = `false` (flips on builder ship).

7. **Teknova-specific artifacts written earlier in the session (Target Definition, Data Sources fields on the Playbook record, three new Play Steps for SF Sync + Trade Press + Manual Suppression Flags) carry engine-vs-play conflation.** Header notes added pointing to the principles. Full split is deferred to a separate plan.

8. **Mid-session schema drift observed.** The Companies table grew from 136 to 366 fields between earlier and later reads in the session. Likely the already-issued `capture-all-explorium-fields` Explorium-Direct ticket shipped during the session. **Verify what landed before launching the new Companies-Enrichment-event-writes ticket — they compose.**

## Workstream state — where everything is now

| Workstream | Status | Where it lives |
|---|---|---|
| Engine principles | Done; registered as Asset | `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` |
| Canon capture | Done | `practices/agentic-systems/canon/canon-log.md` + sources/ |
| Schema: Company Events evidence fields | Done (8 new fields) | Base `appYBYH3aOHhTODAw`, table `tblnzX2b2kqNGzW6r` |
| Schema: Contact Events table | Done (21 fields, mirror of Company Events) | Base `appYBYH3aOHhTODAw`, table `tblDYItHaNcT2gnwi` |
| Plan written + approved | Done | `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md` |
| 11 build tickets in subfolders | Done | `practices/revops/workflows/*/PROMPT.md` + `explorium-direct/*/PROMPT.md` |
| Registry Asset rows for tickets | Done (11 rows, Lifecycle = built) | Base `apppQjlZiktpbO4aX`, table `tblu5JBzOxbEHLQmP` |
| L1 PROMPT consolidates prior handoff | Done | `practices/revops/workflows/L1-event-evidence/` (PROMPT + prior HANDOFF + original) |
| Build dispatch (launch builders) | **Not started — Nick's next action** | per subfolder |
| 9-field Companies delete (orphan list) | Deferred — needs workflow-reference audit before delete | Task #13/14 still pending |
| 3-field Contacts delete (marked-for-deletion) | Deferred to a focused cleanup pass | Task #15 still pending |
| Biotech-vocab audit at engine level | Deferred — separate plan | Phase-2 follow-up |
| L2 Classify refactor (kill or repurpose) | Deferred — separate plan | Phase-2 |
| Universal target-definition / per-play filter split on Playbook | Deferred | Header notes added; full split is Phase-2 |
| Task B Perplexity activation | Still pending — credential read-back + trigger activation | One-line directive, no code change |

## Hard rules a fresh session must carry (additions to existing rules)

- **Engine vocabulary is tenant-agnostic.** Never use industry terms ("AAV," "gene therapy," "modality," "SaaS," "ARR," "fintech," etc.) in engine-level table names, field names, workflow names, or status labels. Per-play artifacts may use industry vocab freely.
- **Evidence-not-verdict.** Default to capturing source content into evidence columns. Verdicts in fields lie when criteria change. Filters at view time replace stored booleans wherever practical.
- **Pay once, capture everything.** Every paid (or free-but-pulled) API call must write every returned field to the database. The truncated full-blob is fallback, not destination.
- **Two-layer target model.** Universal Target Definition (reusable across plays in a category) + per-play Filter (tenant- and play-specific). Do not conflate.
- **One ticket = one workflow ID = one subfolder.** Builders launched in their own subfolders cannot collide as long as each PROMPT's write-ownership header is respected.
- (carrying forward from prior handoff) Never trust agent narration. Never bulk-delete on a hypothesis. No autonomous spend. n8n PUT/MCP wipes credentials.

## Resume point — first actions

1. **Read the engine principles artifact.** `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`. This is the standard everything else measures against.
2. **Verify the mid-session schema drift on Companies.** It grew from 136 to 366 fields. Confirm which `explorium_*` columns landed and whether the `capture-all-explorium-fields` ticket fully shipped. If yes, the two new Explorium-Direct event-write tickets can launch immediately. If partially, they wait.
3. **Confirm Task B (`wIyuFELxzXMgHCDV`) state.** Issue the activation directive to Workflows or whoever owns it: credential read-back per node, activate trigger, smoke-test on one company. No code change.
4. **Launch builds in parallel.** Recommended waves:
   - **Wave A (low-risk new sources, 3-4 in parallel):** USPTO/PatentsView, NIH RePORTER, SEC EDGAR, FDA Designations — different workflows, different APIs, no shared state.
   - **Wave B (mid-risk new sources, 2-3 in parallel):** PubMed (dual-target), Conference Attendee Capture.
   - **Wave C (existing-workflow updates, sequential):** L1 evidence capture (the big one — supersedes prior handoff), SF Sync event writes, Verify integrity repurpose.
   - **Wave D (Explorium-Direct, sequential after capture-all-fields is confirmed shipped):** companies-enrichment-event-writes, contact-sourcing-event-writes.
5. **Stay out of decisions Nick already made.** L2 stays alone for now. Engine-vocab audit is deferred. 9-field Companies delete is deferred. The plan deliberately scoped these out; do not pull them in.

## Decisions pending Nick — none from this session

No open decisions sit with Nick from the close of this session. The three open questions from the prior session's L1 handoff were resolved in the new L1 PROMPT per the engine principles. Nick's next action is launching builders, not deciding.

## Files created or modified this session (canonical artifacts)

- `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` — engine principles. Foundational.
- `practices/agentic-systems/canon/canon-log.md` — new entry appended.
- `practices/agentic-systems/canon/sources/2026-05-20-evidence-not-classification.md` — source-of-record for the canon entry.
- `accounts/clients/teknova/artifacts/DEFINITION-aav-gene-therapy-target-2026-05-20.md` — Teknova target definition (header note added flagging engine-vs-play conflation).
- `accounts/clients/teknova/artifacts/DATA-SOURCES-aav-gene-therapy-target-2026-05-20.md` — Teknova data-sources companion (same header note).
- `practices/revops/workflows/L1-event-evidence/PROMPT.md` — canonical L1 build ticket (consolidates prior handoff).
- `practices/revops/workflows/L1-event-evidence/HANDOFF-prior-session-2026-05-19.md` — prior session's L1 analysis, kept as history.
- `practices/revops/workflows/L1-event-evidence/PROMPT-original-2026-05-20.md` — original narrower L1 ticket, kept for diff.
- `practices/revops/workflows/{sf-sync-event-writes,verify-event-integrity,uspto-patent-capture,nih-reporter-capture,sec-edgar-capture,pubmed-capture,conference-attendee-capture,fda-designations-capture}/PROMPT.md` — 8 tickets.
- `practices/revops/workflows/explorium-direct/{capture-all-explorium-fields,companies-enrichment-event-writes,contact-sourcing-event-writes}/PROMPT.md` — 3 tickets (capture-all-fields was issued earlier; the two new ones are companions).
- `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md` — approved execution plan.
- Airtable schema changes: Company Events (+8 fields) and Contact Events (new table, +21 fields) in base `appYBYH3aOHhTODAw`.
- System Registry: 1 Asset for the principles + 11 Assets for the tickets, in base `apppQjlZiktpbO4aX`. Plus the `Target Definition` and `Data Sources` fields added to the Teknova Playbook record on the RevOps Surface base.

## Canon primitives captured this session

One entry, 2026-05-20: engine value is find / describe / capture / enrich; classification is commodity; engine-layer vocabulary stays tenant-agnostic.

This sits cleanly alongside the prior canon entries from 2026-05-18 (observable-surface-is-truth; emergent-systems-registered-not-gated; self-describing-structure; parallel-asset-write-ownership; binding-is-enforcement-not-documentation). All five are the same family: agentic systems require runtime-bound discipline, not optional convention.

## What this handoff does NOT include

- Per-builder context for each ticket (each PROMPT.md in its subfolder is self-contained for that purpose).
- A status of which n8n workflows are currently active vs. inactive (verify on session start; status flips frequently).
- The 122-company cohort's current state across the new schema (run a fresh Companies / Company Events count on session start).

Idle-waiting on Nick's go to launch builders is the correct state. Do not invent work.
