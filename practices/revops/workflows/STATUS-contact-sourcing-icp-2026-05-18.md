# STATUS — Contact Sourcing + ICP Gate (workflows → agentic-systems)

Date: 2026-05-18
Workflow: `bYZ0sAzyUvU60wMZ` — `active: false`. Source: `/Users/nplmini/code/work/practices/revops/workflows/contact-sourcing-icp.workflow.ts`

## Phase A — COMPLETE (all corrections + persona_department_exclude consumer gap closed). Unchanged.

## Test setup ("small test with 5") — DONE at the data layer

Diagnosed the real blocker by inspection (not asking):
- Persona rows: **19 present and correct** in Classification Rules (`tbl1HFYzezFYs5C3k`).
- Explorium Business IDs: **40+ AAV companies have them** in Companies (`tblnj3YlOI3thjrXp`).
- **Root blocker:** `Outreach Eligible = true` matched **0 companies**. The L2 company gate that normally sets this flag has not been run on this table, so the workflow's filter `AND({Outreach Eligible}=1, {Explorium Business ID}!='')` returned nothing — every run no-ops at the company step.

Fix applied (data, not workflow code — deliberately, to avoid the MCP credential-wipe): set `Outreach Eligible = true` on **5 in-scope AAV companies**, all with Explorium Business IDs:
- Spirovant Sciences (`rec0LOo5HdS4ZXmgJ`)
- Solid Biosciences (`rec1QsWki22Ne2Wtl`)
- MeiraGTx (`rec7qaGedk0dmOON3`)
- Encoded Therapeutics (`rec8YNAe5ES927B7A`)
- Spur Therapeutics (`recAUuPk6yeMlHlWz`)

The existing filter now naturally bounds a run to exactly these 5. No workflow edit was made, so Nick's UI credential work is untouched.

**Test-fixture caveat (non-obvious, flagged):** these 5 `Outreach Eligible` flags are a hand-set test fixture, NOT L2 gate output. Before production, L2 must derive `Outreach Eligible` properly and these manual flags should be reset or reconciled, or they desync from the real company gate.

## Observed Nick UI changes (reconciled, not reverted)

Since the last MCP push Nick edited in the UI (`templateCredsSetupCompleted: true`, versionId now `af14e517`):
- `Hunter Email Verify` (HTTP) replaced with a **native `Hunter` node** (`operation: emailVerifier`, `email = {{ $json.email }}`), wired `LI Resolved → Hunter → Apply Email Verify`. This reverses Boris's C2 "HTTP-only" decision — it is Nick's deliberate owner choice; left intact. (Native node will not survive a future MCP regen — known tradeoff.)
- `Apify LinkedIn Verify` switched to `predefinedCredentialType` / `apifyApi`.
- Explorium/Apollo on `genericCredentialType httpHeaderAuth`; anthropic/airtable on predefined types.
I did NOT MCP-edit anything — that would wipe all of the above.

## Honest limitation — credential binding not verifiable from my side

The n8n MCP redacts the `credentials` field from `get_workflow_details`. I cannot confirm whether the six credentials are actually bound, only that auth *types* are configured and `templateCredsSetupCompleted: true`. Definitive verification is the test run itself or Nick's UI view. Not something I can check.

## One remaining knob (stated, not asked)

Per-company prospect depth is `size:50, page_size:50` in `Build Sourcing Plan`. The test is bounded to 5 companies but up to ~50 prospects each (≤250 total) across all paid providers. Lowering it requires editing the `Build Sourcing Plan` Code node — MCP would wipe credentials, so if a tighter test is wanted it's a one-line UI edit Nick makes while in there (`size: 50, page_size: 50` → `5`). Otherwise the test runs at 5×50.

## State

Inactive, not run, no spend incurred. Test is data-ready for 5 companies. Running it remains Nick's gated step (his credential completion + explicit run/spend approval). Patient-facing disqualifier still parked for Nick's ruling.
