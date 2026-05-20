# Contact Sourcing + ICP — Filter Fix Implementation Plan

> **For the executing session (workflows lane):** Self-contained. You are a cold session — read top to bottom before touching anything. This fixes one over-constrained filter in n8n workflow `bYZ0sAzyUvU60wMZ`. The fix design in Task 2 is authored by the orchestrator and reconciled against a persona contract you must NOT re-derive or re-author. "Tests" are real executions + offline output inspection, never pinned runs. Where it says STOP, stop and surface to Nick via the orchestrator.

**Goal:** The contact-sourcing workflow returns zero contacts for this biotech segment because Explorium structured enums are null and are ANDed as hard query filters. Move seniority/department/title from hard query filters to downstream scoring, so the workflow returns a real, persona-scored contact set.

**Architecture:** Query Explorium wide (by company), gate narrow downstream. Seniority/department/title precision moves out of the Explorium `/v1/prospects` query and into the residual LLM scoring + the dual-source employer-verify node. No change to company-level gating (that is L2's job, not this workflow's).

**Tech stack:** n8n workflow `bYZ0sAzyUvU60wMZ` (Contact Sourcing + ICP, inactive, ~23 nodes); source `practices/revops/workflows/contact-sourcing-icp.workflow.ts`; RevOps Surface base `appYBYH3aOHhTODAw`, Classification Rules table `tbl1HFYzezFYs5C3k` (persona rows), Companies table `tblnj3YlOI3thjrXp`; Explorium `/v1/prospects` (PAID).

---

## Ownership and hard constraints (read before Task 1)

- **Lane:** the workflows session builds and executes this. The agentic-systems orchestrator reviews and holds the two human gates (Task 6). The persona-projection session owns the persona rows and the canonical segment artifact — you **consume them, never re-author them**. `accounts/clients/` is out of scope for this work.
- **Single writer:** confirm no other session is mid-edit on `bYZ0sAzyUvU60wMZ` (System Registry `apppQjlZiktpbO4aX` → Assets → "Contact Sourcing + ICP Gate"). This workflow is a separate asset from L2, so it does not collide with the currency-gate work — but two sessions must not both edit *this* workflow.
- **Credential wipe:** `update_workflow` via n8n-mcp wipes ALL credentials (they are currently live/bound) AND does not preserve native nodes (the UI-added Hunter native node will be destroyed on regen). Therefore: prefer a **UI edit** of the single changed node (no credential wipe). If an MCP update is unavoidable, it ships via the `n8n-safe-update` skill, ALL credentials are re-attached, the Hunter native node is rebuilt as HTTP + generic credential, and every touched node is verified by a raw field-by-field read-back (validate_workflow does not catch the corruption).
- **No autonomous paid runs.** Explorium `/v1/prospects` and the bulk-enrich/Apollo/Apify/Hunter/Anthropic nodes spend. No real fetch happens until Nick authorizes it in the same session (Task 6). Offline verification (Task 4/5) comes first and requires no spend.
- **Do not add Classification Rules columns** or modify persona rows. Single-play scope.

## Current state (recon-verified 2026-05-18, agentId a495ed4dd44592573 — confirm, do not re-derive)

- **Root cause (confirmed):** node **`Build Sourcing Plan`** (n8n id `3b65758a`) builds the Explorium `/v1/prospects` filter ANDing: `business_id` + `job_level` (from `persona_seniority` `[director, senior manager, vice president]`) + `job_department` (from `persona_department` `[r&d, manufacturing]`) + `job_title` (6 exact `persona_title_include` phrases). Live probe (MeiraGTx, business `6c1b67710f458a3d3c9eb444ed340366`): every Explorium record has `job_department`/`job_level_main`/`job_department_main` = null for this segment. `business_id` alone → prospects exist; `+job_level+job_department` → 1; `+job_title` ANDed → 0. There is NO size/headcount filter in the query — size is a soft residual signal never reached.
- **Persona rows:** read by node `Read Persona Rules` from `appYBYH3aOHhTODAw` / `tbl1HFYzezFYs5C3k`, filter `AND({Active}=1, FIND('persona_',{Rule Category}))`. 19 rows, present and correct.
- **Verified working:** Airtable + Explorium credentials bound; `/v1/prospects` returns `request_status:success`; negate-precedence correct; per-company loop runs once per company; chain no-ops gracefully on empty.
- **Unverified (never reached):** Apollo, Hunter, Apify, Anthropic — both prior live runs (exec 80775 Spirovant, 80776 MeiraGTx) stopped at the empty Explorium result. First successful run is also their first real exercise — expect to surface new issues there (see Honest Limit).
- **Phase A enrich-loop correctness:** the `runOnceForEachItem` enrich + `Normalize Prospects` `.first()`-read pattern flagged in `GUIDANCE-delta-phaseA-2026-05-18.md` is NOT confirmed applied — Task 5 checks it.
- **Fixture:** `Outreach Eligible` is hand-set because L2 has not run. TRUE = MeiraGTx `rec7qaGedk0dmOON3` (lone). Reset FALSE = Spirovant `rec0LOo5HdS4ZXmgJ`, Solid Biosciences `rec1QsWki22Ne2Wtl`, Encoded `rec8YNAe5ES927B7A`, Spur `recAUuPk6yeMlHlWz`. Production contact sourcing must run against real L2 output, not this fixture (Task 8).

## The 5 persona-contract invariants the fix MUST honor (do not re-derive)

1. Company hard filters (modality/stage/size/geo) are never persona rows / never this workflow's job — L2 owns them.
2. Contact-company alignment is never a persona row — the dual-source employer-verify node owns it.
3. Conditional seniority is residual, not a hard filter. `persona_seniority` carries a WIDE floor including `vice president`. Never drop VP (or any seniority) at the query layer.
4. Explorium `job_level`/`job_department` are FIXED enums and are null for this segment — they cannot carry the precision; finer title logic lives in free-text `job_title` + residual.
5. `persona_min_score` (=60) is a calibration dial with zero artifact authority — do not treat it as fixed; it is recalibrated after the first real run.

---

## Task 1: Confirm current state

**Files:** read-only — `contact-sourcing-icp.workflow.ts`; `get_workflow_details` on `bYZ0sAzyUvU60wMZ` (read-only).

- [ ] **Step 1:** Open node `Build Sourcing Plan` (`3b65758a`) in the deployed graph and in the .ts source. Confirm the filter object ANDs `business_id` + `job_level` + `job_department` + `job_title` exactly as stated above. If it diverges, STOP and report the divergence — the fix below assumes this shape.
- [ ] **Step 2:** Confirm `Read Persona Rules` returns the 19 `persona_*` rows and identify the exact downstream node(s) that perform residual LLM scoring and dual-source employer-verify (you will route precision there in Task 2). Note their node names/ids.

## Task 2: Apply the reconciled fix (design authored by orchestrator — implement exactly)

**File:** modify node `Build Sourcing Plan` (`3b65758a`) and the residual-scoring inputs. This is the only logic change.

The reconciled fix (do not re-derive, do not touch persona rows or the segment artifact):

1. **Remove `job_level` and `job_department` from the Explorium `/v1/prospects` filter body entirely.** They are null for this segment (invariant 4) and ANDing them zeros results. Query Explorium by `business_id` only (plus any already-valid company constraint that is not seniority/dept/title).
2. **Remove `job_title` as an ANDed hard filter.** The 6 `persona_title_include` phrases stop being a query gate.
3. **Pass `persona_seniority`, `persona_department`, `persona_title_include` (and `persona_title_exclude`) downstream as scoring inputs**, into the residual LLM scoring node identified in Task 1 Step 2, and let the dual-source employer-verify node enforce contact-company alignment. Title/seniority/department precision is recovered here, on the free-text `job_title`/profile, NOT at the query (invariants 3 + 4).
4. **`persona_title_include` becomes an OR/soft positive signal** feeding residual score, never an AND gate. `persona_title_exclude` remains a hard negative (it removes, it does not require).
5. Keep the seniority floor WIDE (VP stays in — invariant 3). Do not introduce any size/headcount filter (there is none today; do not add one).
6. Leave `persona_min_score` consumed as-is but treat its value as provisional (invariant 5) — do not hardcode assumptions around 60.

- [ ] **Step 1:** Implement 1–6 in `Build Sourcing Plan` and the residual-scoring node inputs. Prefer a **UI edit** (no credential wipe). If you must use MCP update, follow the credential-wipe constraint above in full.
- [ ] **Step 2:** If any node was touched via MCP, do the raw field-by-field read-back of every changed node. Confirm credentials still bound and the Hunter node (if regenerated) is HTTP + generic, not native.

## Task 3: Offline verification — NO spend

- [ ] **Step 1:** Execute only up to and including `Build Sourcing Plan` for the 5 fixture companies (this does not call Explorium if you stop before the fetch node; if the graph cannot stop there, inspect the node's computed output via a manual single-node evaluation). Confirm the constructed Explorium filter body now contains ONLY `business_id` (+ valid non-persona company constraints) — no `job_level`, no `job_department`, no `job_title` hard filter.
- [ ] **Step 2:** Confirm the residual-scoring node now receives `persona_seniority`/`persona_department`/`persona_title_include`/`persona_title_exclude` as inputs. Confirm `Read Persona Rules` still returns 19 rows.
- [ ] **Step 3:** Use the sample prospect shapes recorded in `HANDOFF-contact-sourcing-icp-livetest-2026-05-18.md` to hand-trace: would the new residual path score a plausible contact > `persona_min_score` without the enum fields? Document the trace. No Explorium call.

## Task 4: Phase A enrich-loop correctness

- [ ] **Step 1:** Inspect the enrich loop and `Normalize Prospects`. Compare against `practices/revops/workflows/GUIDANCE-delta-phaseA-2026-05-18.md`. If the `runOnceForEachItem` + `.first()`-read bug is present, fix it per that guidance (offline-checkable logic). If already correct, record that and move on.

## Task 5: STOP — Nick gates (via orchestrator)

- [ ] **Step 1:** Surface to Nick, through the orchestrator, with the Task 3 offline trace as evidence:
  - (a) **Authorize ONE bounded paid Explorium fetch** to verify non-zero results (≤250 records, the 5 fixture companies, `size:50`). No fetch happens without this.
  - (b) **Patient-facing disqualifier ruling** (v4 Part 1 lines 144–148, currently not projected): fold into `persona_residual` (`recF7Pxrr7nDzIQ2e`) or accept the gap. Do NOT decide this yourself; do not edit the persona artifact.
- [ ] **Step 2:** STOP until both are answered.

## Task 6: Gated live smoke (only after Task 5 approvals)

- [ ] **Step 1:** One bounded real run over the 5 fixture companies. Expected: non-zero prospects, persona-scored, with no size collapse and VP retained. This is also the FIRST real exercise of Apollo/Hunter/Apify/Anthropic — verify they are reached and do not hard-fail; record any new downstream failure as a finding, not a silent stop.
- [ ] **Step 2:** Record the execution id in an Enrichment Runs row.

## Task 7: Close-out

- [ ] **Step 1:** System Registry `apppQjlZiktpbO4aX` → Roadmap "Fix contact-sourcing enum hard-filter": set Evidence to the Task 6 execution id, Status `in progress` until Nick confirms the contact set is acceptable.
- [ ] **Step 2:** Update the "Contact Sourcing + ICP Gate" Asset row note; set `Reconciled Against Reality` true only after the raw read-back (if MCP was used) passed.
- [ ] **Step 3:** Tear down any scratch. Do not modify persona rows, Classification Rules schema, or the segment artifact.

## Task 8: Fixture/L2 dependency (flag, do not fix here)

The `Outreach Eligible` fixture (MeiraGTx lone TRUE + 4 reset FALSE) is hand-set because L2 has not run in production. Production contact sourcing must consume real L2 output. This is sequenced behind the currency-gate / first L2 run in the orchestration map — do NOT "correct" the fixture in this plan; flag the dependency in close-out so it is not lost.

## Honest limit (state to Nick, do not paper over)

This fix unblocks the chain at Explorium. It does not prove the rest works — Apollo, Hunter, Apify, and Anthropic have never been exercised. The first successful run is their first real test and may surface new, unrelated failures downstream. Phase 1 success = non-zero, persona-scored contacts out of Explorium with invariants honored; full end-to-end is a separate verification, not a claim this plan can make.

## Self-review

- Root cause → Task 1; fix → Task 2 (all 5 invariants addressed); offline-before-spend → Tasks 3–4; spend + ruling gated to Nick → Task 5; real verification → Task 6; persona artifact untouched throughout; fixture/L2 dependency flagged not silently fixed → Task 8. No placeholders; node ids and record ids exact.
