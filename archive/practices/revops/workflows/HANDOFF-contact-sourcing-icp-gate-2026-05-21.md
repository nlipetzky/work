# Handoff — Contact Sourcing + ICP Gate

**Date:** 2026-05-21
**Workflow:** `bYZ0sAzyUvU60wMZ` ("RevOps — Contact Sourcing + ICP Gate")
**Workflow URL:** https://instig8.app.n8n.cloud/workflow/bYZ0sAzyUvU60wMZ
**Status:** Running successfully end-to-end. Output quality is wrong — see core problem.

## Core problem

The workflow sources executives (CEOs, "Biotechnology Executive" titles) instead of the operators Ellie needs to talk to: process development, CMC, manufacturing, vector production, downstream processing, fill-finish leads at director / senior manager level.

Example from execution `90493` against MeiraGTx, LLC:
- Zandy Forbes (CEO)
- Robert Wollin
- Jeffrey Biss

All three are exec-tier. None are CMC / process dev / manufacturing.

## Root cause

Three compounding issues in the workflow design:

1. **Explorium API call uses `business_id` only.** No seniority, department, or title filter. Per the workflow's own description: "seniority/dept/title precision moved to residual LLM scoring." That decision was wrong — it relies entirely on the LLM to cull a pool that's already exec-heavy.
2. **Pool size = 5 per company.** `Build Sourcing Plan` Code node sets `size: 5, page_size: 5` on the Explorium prospect body. Explorium ranks its top 5 by prominence (typically execs). The right people (Director of Process Development, etc.) are deeper in the ranking and never get fetched.
3. **LLM residual scoring with `personaMinScore: 60`** is too permissive. Even when the residual prompt says "EXCLUDE VP-level and above at non-CDMO companies >500 employees," the LLM gives partial credit and admits exec-level people scoring 60+.

## What IS working

- Persona rules in the Rule Category table (`appYBYH3aOHhTODAw` / `tbl1HFYzezFYs5C3k`) are correct and complete:
  - `persona_seniority`: director, senior manager, vice president
  - `persona_department`: manufacturing, r&d
  - `persona_title_include`: process development, process science, CMC, viral vector, downstream processing, purification
  - `persona_department_exclude`: legal, it, human resources, sales, finance, marketing
  - `persona_min_score`: 60
  - `persona_residual`: rich narrative covering CSO-at-small-company shortcut, agronomy penalty, regulatory/PM/QC exclusions
- The flow itself is plumbed correctly: webhook → read rules → read target companies → build sourcing plan → loop companies → Explorium fetch + profiles + contacts → normalize → Apollo people match → email/employer verify → LinkedIn tiebreak (Apify) → Hunter email verify → residual LLM score → upsert to Airtable Contacts
- `Person Key` dedup is working (the upsert keys on normalized LinkedIn URL, falls back to `explorium:<id>` or `name:<n>|<co>`)
- The upsert writes to Contacts table `tblWJksRL1yKSUgrm` in `appYBYH3aOHhTODAw` and updates existing rows correctly

## Authoritative persona sources

Two places to read the target persona for the Teknova AAV play:

1. **Teknova Outreach Plays table** (`appFoLY6hjroyA2KW` / `tblcOH0OaU9XT0LuQ`). Per-play criteria fields:
   - `Criteria - Persona Definition` — "In-scope functions (Tech Ops, Process Dev, CMC, Manufacturing, External Manufacturing, Supply Chain) and seniority floor (Director and above)"
   - `Criteria - Role Exclusions` — Legal, Sales, TA, Marketing, IT, Finance, QC, Patient-facing, non-CMC Regulatory, non-CMC Program/Project Management
   - `Criteria - Disqualifiers` — current customer, active opp, do-not-contact, hard-bounce history
2. **Local segment-criteria artifact** (likely): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`

## Fix proposal (not yet executed)

Two changes to the workflow:

1. **Push persona constraints to Explorium server-side.** In `Build Sourcing Plan` Code node, extend the `filters` object passed to Explorium to include:
   - `job_level`: derived from `personaSeniority` (director, senior manager, manager, VP — confirm Explorium's enum vocabulary)
   - `job_department`: derived from `personaDepartment` (manufacturing, r&d) plus an exclusion list for `persona_department_exclude`
   - Optional: `job_title` keywords from `persona_title_include`
2. **Increase pool size.** Change `size: 5, page_size: 5` to `size: 25–50` so the candidate pool is deeper before LLM scoring. Watch cost — Explorium billing scales with pool.

A third optional change worth considering: tighten `persona_min_score` to 75 in the Rule Category table, OR add an additional hard gate after the LLM that rejects any contact whose `seniority` field contains "c-suite" / "executive" unless `Employee Count < 200` (the existing CSO shortcut).

## Open questions for fresh session

1. Confirm Explorium's filter vocabulary for `job_level` and `job_department`. The current Explorium docs at `/Users/nplmini/code/work/practices/revops/workflows/reference/explorium-fields.md` may have the answer; otherwise hit the Explorium API docs directly.
2. Decide whether to keep the LLM scorer as a layered defense after server-side filtering, or simplify by removing it.
3. After the first re-run, audit the new prospects against Ellie's target persona. If still off, the segment-criteria artifact is the next thing to revisit.

## Resume point

First action for the fresh session: read this handoff, then read `/Users/nplmini/code/work/practices/revops/workflows/reference/explorium-fields.md` (or the live Explorium docs) to confirm the filter vocabulary. Then update the `Build Sourcing Plan` Code node in workflow `bYZ0sAzyUvU60wMZ` per the fix proposal above. Test on one company before bulk-running.

## Related context (don't re-do)

- AT2AT mover (Companies leg): workflow `u4KXy7b01MmzyUTX`, working, writes 17 fields from Surface to Teknova Outreach Companies
- SF enrichment: workflow `uDflPbg6KsTX7ALJ`, working, writes 49 fields from SF mirror + live SF to Teknova Outreach Companies. One known bug: opportunity search formula returns all opportunities when no Account ID match found — guard not yet added.
- Signal Drafts table: populated by translator workflow, 76+ rows
- Signal Drafts → Signals mover: NOT YET BUILT. This is the next-priority workflow after contact sourcing is fixed.

## Files referenced

- Architecture spec: `/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md`
- Memory: `/Users/nplmini/.claude/projects/-Users-nplmini-code-work/memory/MEMORY.md`
- This handoff: `/Users/nplmini/code/work/practices/revops/workflows/HANDOFF-contact-sourcing-icp-gate-2026-05-21.md`
