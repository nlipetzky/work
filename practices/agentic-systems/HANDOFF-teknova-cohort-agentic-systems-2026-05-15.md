# HANDOFF: Teknova AAV cohort — agentic-systems session (fresh-start)

**Date:** 2026-05-15
**For:** a fresh agentic-systems (Boris) session continuing this until the v3-classified, enriched cohort is in front of Ellie.
**Self-contained:** do not rely on prior chat. Read the canonical docs below; they are the source of truth.

## Your role (do not drift from this)

You are the agentic-systems operator. You own: the criteria artifact, the schema, SPEC/design review and contract decisions, the Ellie-facing email, and the inbound synthesis loop when Ellie replies. **You review and decide. You do not build n8n workflows** — the separate Explorium-Direct session builds; you gate-keep.

**Verify, never rubber-stamp.** Every single SPEC/design review in this effort caught a real defect (a builder injection that would have zeroed real data on 631 rows; a missing dormancy node that would have mis-surfaced dead companies; an invalid `AAV Segment` value). When E-D returns built work, check it against the canonical docs field-by-field. Approval is earned, not given.

## The goal (the finish line)

Ellie opens a clean, v3-classified, enriched Companies cohort in Airtable (RevOps Surface `appYBYH3aOHhTODAw`, Companies `tblnj3YlOI3thjrXp`) alongside the plain-language email, reacts, and the loop sharpens to v4. That validates the system for Teknova and is the precondition to templatizing across clients. It is also trust-repair: a small clean cohort beats a large contaminated one.

## Read these first, in order

1. `~/.claude/plans/we-are-aligned-draft-zany-hamming.md` — **canonical plan, all gate decisions, and the exact STEP 4 RESUME POINT.** Start here.
2. `/Users/nplmini/code/work/practices/revops/schemas/criteria-artifact.md` — the schema/contract (push-forward model, liability chain, evidence-resolution loop).
3. `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` — criteria artifact **v3** (judgment source of truth; Part 3 R-items/Q-items).
4. `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/SPEC-L2-write-nodes-2026-05-15.md` — **APPROVED rev 2** L2 write contract.
5. `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/DESIGN-step4-L2-rebuild-2026-05-15.md` — L2 design (synced to SPEC).
6. `/Users/nplmini/code/work/accounts/clients/teknova/ellie-aav-review-2026-05-15.md` — the Ellie email (push-forward framed; Part B is sendable, Part A populates from the run).
7. Memory (already loaded via MEMORY.md): `feedback_n8n_no_workarounds`, `feedback_n8n_mcp_airtable_node_corruption`, `feedback_full_code_blocks`, `feedback_client_optimizer_not_gate`, `project_teknova_decision_authority`.

## State (done & verified, 2026-05-15)

- Criteria artifact at **v3**; Classification Rules table `tbl1HFYzezFYs5C3k` = 52 v3 rows (51 `Active=true`), all stamped `...v3 pending-ratification`; the 48 stale rows were deleted by Nick.
- SPEC **rev 2 APPROVED** at agentic-systems pass 2. AAV Segment ruled Ellie-write-only. Dormancy ruled not-optional.
- Two recency fields created live on Companies: `Most Recent Trial Date` (Date), `Active Recruiting` (Checkbox) — sole writer L1, sole reader L2 dormancy.
- L1 (`9gcmEjq1lvOY2jZS`) recency change applied + field-by-field read-back verified (incl. a double-equals fix).
- HTTP-PATCH write path spike-proven (builder-immune; the n8n MCP builder corrupts Airtable update-node mappings — see memory).
- **Nothing run on the full cohort. Zero spend. Ellie has seen nothing.**

## Resume point — exactly where to pick up

Per the plan's "STEP 4 PROGRESS / RESUME POINT": the next build is the **L2 HTTP rebuild**, done by the fresh Explorium-Direct session (Nick is starting it in parallel). Your job at this stage:

1. When E-D returns the built L2 (or smoke/run results), **review against SPEC rev 2 + DESIGN §3 + the v3 artifact, node-by-node.** Do not trust "applied verbatim."
2. Hold the gates: 1a/1b (deployed-config read-back; `List All Companies` must return the live `totalRecordCount` = **631**, re-verify it yourself); re-smoke must assert numeric fields UNCHANGED on existing rows (this is what verifies E-D's claim that the `Upsert Company` zeros are intentional new-record seeds, not builder injection — do not let that claim ride on faith).
3. Any code-node edit E-D proposes must be a FULL replacement block (Nick directive `feedback_full_code_blocks`).
4. Only after gates pass: the gated full 631 run → counts → **Nick's Step 5 spend gate** (he reviews reclassified state, approves enrichment scope + credit cap; nothing spends before this).
5. Then: enrich survivors → build Ellie's filtered Companies view (this play, v3-classified, enriched, non-halt) → send Ellie the email + view → her reply → run inbound synthesis to artifact v4 → ratify R-items / answer Q-items → flip `outbound-validated`.

## Hard rules (do not relearn these the dangerous way)

- **No enrichment, no spend** until Nick's explicit same-session Step 5 approval. Prior context never authorizes spend.
- **The n8n workflow is the deliverable.** Never bypass it with direct MCP/API data moves. The n8n MCP builder corrupts Airtable update nodes (injects zero-fields, drops sparse clears; `validate_workflow` misses it) — HTTP-PATCH is the proven-safe write path; verify deployed config field-by-field.
- **Schema changes are Nick-gated.** (Playbook typed validated-flags, `Contact Sourcing Status` remain held.)
- **Push-forward / two-flag gate:** producing the review cohort on v3 *pending-ratification* is allowed (`review-validated`); outbound/cadence waits for Ellie ratification (`outbound-validated`).
- **Client-facing artifacts:** plain language, no internal base/workflow/jargon, lead with delivered output, input optional and forward-looking. The email is already built correctly — do not re-add complexity.
- **Two-session split:** you decide/review/own artifacts; Explorium-Direct builds n8n. The plan file is the anti-drift contract both sessions read. Record material decisions there.
- **Decision authority:** Jenn = direction, Ellie = output. When the cohort reaches Ellie, route as output review, not direction.
- Propose the session plan from the canonical docs; never open with "what are we working on" — the plan answers that.

## Out of scope (do not absorb)

Full provider waterfall, registry sources beyond CT.gov, Family 3 contacts, orchestrators, the enrichment monolith debt (`Z6RROKx5omdfvhtn`, deferred to Step 5/6), M1 (Novartis/Tanabe alias re-query), M2 (parent-domain extraction), Q-item/CNS expansions (Ellie's call).

## First action for the fresh session

Read the plan + canonical docs. Confirm the resume point. Then either review E-D's returned L2 build, or, if E-D hasn't reported yet, state the proposed next step and what you're waiting on. Do not build. Do not run. Do not spend.
