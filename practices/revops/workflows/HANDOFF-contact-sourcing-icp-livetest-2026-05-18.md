# HANDOFF — Contact Sourcing + ICP Gate, post-live-test (2026-05-18)

Supersedes prior STATUS/HANDOFF for current state. Authoritative.

Workflow: `bYZ0sAzyUvU60wMZ` "RevOps — Contact Sourcing + ICP Gate", project RevOps (`Pj1xUgbrL58T1CS1`)
State: **inactive (`active: false`)**, 23 nodes. SDK source of truth: `/Users/nplmini/code/work/practices/revops/workflows/contact-sourcing-icp.workflow.ts`

## Verified live (real executions 80775 Spirovant, 80776 MeiraGTx — not pinned)

- **Airtable credential bound + working**: `Read Persona Rules` (19 persona rows) and `Read Target Companies` (eligible filter) returned real data.
- **Explorium credential bound + working**: authenticated `/v1/prospects` calls succeeded (`request_status: success`).
- **Corrected logic confirmed on real data**: `Build Sourcing Plan` builds the right filter body; `persona_department_exclude` negate-precedence correct (positive department present → negate not applied); per-company loop runs once per company (executeOnce removal holds); chain no-ops gracefully on empty results (no crash, no Contacts written).
- **NOT verified**: Apollo, Hunter, Apify, Anthropic credentials — both live runs stopped at an empty Explorium result before reaching them.

## ROOT CAUSE (evidence-backed) — both test companies returned 0 prospects

Tiered Explorium probe on MeiraGTx business_id `6c1b67710f458a3d3c9eb444ed340366`:
- `business_id` only → prospects exist (CEO, GC, VP IT, etc.).
- Every returned record has `job_department: null`, `job_department_main: null`, `job_level_main: null`. Only free-text `job_title` is populated. **Explorium's structured department/seniority enums are essentially empty for this biotech segment.**
- `business_id + job_department + job_level` → 1 match.
- Add the 6 ANDed `job_title` anchors → 0.

The workflow's hard filter (in `Build Sourcing Plan`, all ANDed by Explorium):
1. `business_id`
2. `job_level` ∈ {director, senior manager, vice president}
3. `job_department` ∈ {r&d, manufacturing}
4. `job_title` contains one of 6 exact phrases

**The hard filter is NOT company size / employee count** — there is no headcount filter anywhere in the prospect query. Spirovant (~30 ppl) and MeiraGTx (public, hundreds) both returned 0 with the *identical* filter. Filters 2 & 3 query structured enums that are null in the source data; filter 4 (narrow contains-list, ANDed) removes any survivor. Company size is only a *soft* `persona_residual` signal scored later by the LLM (CSO-at-<200 / VP-cap-at->500) — person-level, never a query gate, never reached here.

## Recommended fix (owner: Boris / persona-projection + workflow)

1. **Stop hard-filtering on Explorium structured `job_department`/`job_level` enums** — unreliable for this segment. Pull by `business_id`; push seniority/department/title judgment into the residual LLM scorer + employer-verify, which operate on real `job_title` text.
2. **`title_include` → OR / soft, not an AND gate.** Six exact contains-phrases miss "Head of Technical Operations", "SVP Process", etc.
3. **Provider waterfall is secondary**, for *true* business_id coverage gaps only (not what we hit). Right tools: Apify LinkedIn company-employees actor or Apollo people-search by org domain. EXA is the wrong tool (semantic web search, not employee enumeration).

Further live workflow runs are pointless until the projection changes — they will keep returning zero. Do not burn more runs.

## Hard constraints for next session

- **MCP `update_workflow` wipes ALL credentials.** Credentials are now live/bound (Airtable, Explorium confirmed; others set by Nick in UI). Any workflow code change must be credential-aware: UI edit, or redeploy-then-reattach plan agreed with Nick. Do not MCP-edit casually.
- Persona row values + segment artifact: owned by Boris. Do not author/alter.
- No autonomous paid runs. Each live run needs explicit same-session Nick approval (the two runs this session were individually approved).
- `accounts/clients/` and the canonical segment artifact: out of scope, do not touch.

## Current data-fixture state (must be reconciled before production)

`Outreach Eligible` was hand-set as a TEST FIXTURE (L2 gate not run on this table):
- TRUE: MeiraGTx (`rec7qaGedk0dmOON3`) — lone eligible company, left as-is.
- FALSE (reset): Spirovant `rec0LOo5HdS4ZXmgJ`, Solid Biosciences `rec1QsWki22Ne2Wtl`, Encoded `rec8YNAe5ES927B7A`, Spur `recAUuPk6yeMlHlWz`.
These manual flags must be reset/reconciled with real L2 output before production or they desync the company gate.

## Parked

- Patient-facing disqualifier: Nick's ruling pending (fold into `persona_residual` `recF7Pxrr7nDzIQ2e`, or accept gap for first run). Untouched.

## Next action

Route the projection fix (drop enum hard-filters, OR/soften title, lean on residual scoring) to Boris. No workflow/test work until that lands.
