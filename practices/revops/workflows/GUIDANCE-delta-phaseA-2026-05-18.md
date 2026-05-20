# GUIDANCE DELTA — Phase A is NOT complete (agentic-systems → workflows)

Date: 2026-05-18
From: agentic-systems folder (Boris)
Re: deployed graph review of `bYZ0sAzyUvU60wMZ` after build-agent Phase A
Status: Phase A reported done + validated. Validation passed; the workflow is
still wrong for its job. Three corrections below. All are MCP-safe NOW (no
credentials attached) — do them in this window, not as post-credential UI edits.

## Confirmed correct (no change)

- Persona hard filters applied at Explorium query time in `Build Sourcing Plan`
  (`filters.job_level / job_department / job_title`). The locked "filter at
  query time, not post-hoc" decision is implemented correctly. Enrich runs on
  an already-gated population — no wasted-spend issue. The earlier cost concern
  does not hold.
- Two Explorium bulk-enrich nodes (profiles + contacts) replace the bogus
  single endpoint. Endpoints and response parsing in `Normalize Prospects`
  match the probed shapes. Parsers for harvestapi / Hunter match observed
  output.

## Correction 1 — enrich loop semantics (correctness bug, blocks Phase D)

`Explorium Profiles Enrich` and `Explorium Contacts Enrich` both have
`executeOnce: true` and `prospect_ids: (...).slice(0,50)`. `Build Sourcing
Plan` requests `size:100, page_size:100`.

- `slice(0,50)` + 100-cap fetch → prospects 51–100 silently dropped from
  enrichment every run. Spec said batch in 50s; build truncated.
- `executeOnce:true` in the per-company `splitInBatches` loop → enrich fires
  for the first company only; companies 2+ get no enrichment.
- `Normalize Prospects` uses `$('Explorium Fetch Prospects').first()` and
  `.first()` on both enrich nodes → in a loop, returns iteration 1's data.

Fix (simplest correct version for first runs):
- Remove `executeOnce: true` from both enrich nodes.
- In `Build Sourcing Plan`, set `size: 50, page_size: 50` (cap one company at
  50 prospects for the first runs). This makes `slice(0,50)` a no-op and
  removes the truncation path entirely. >50/company multi-batch is a deferred
  enhancement, not first-run scope.
- Rewrite `Normalize Prospects` to read fetch + both enrich results from the
  immediate input chain for the current loop item, not via
  `$('NodeName').first()`. It must operate on the company currently in the
  loop, not iteration 1.

Acceptance: a 2-company manual run enriches and normalizes both companies'
prospects independently, no cross-company bleed, no silent drop.

## Correction 2 — kill the native-node plan (decision, locked by Boris)

The SDK rebuild erased Nick's hand-added native `Run an Actor` (Apify) and
native `Hunter` nodes. The graph now uses HTTP nodes with `httpQueryAuth` for
both — which is the correct auth mechanism for Apify and Hunter.

Decision: **standardize on HTTP + generic credentials for every external
provider call. Drop native Apify/Hunter nodes entirely.** Rationale: native
nodes do not survive MCP/SDK regeneration (just demonstrated — Nick's manual
additions were wiped), and they fragment the credential model. HTTP genericAuth
is functionally complete and rebuild-stable.

Consequence: the "delete the HTTP dupes, keep native" item in
`HANDOFF-contact-sourcing-icp-2026-05-18.md` (Credential/node state section) is
**void**. No native nodes to restore. Phase C creates generic credentials only.

## Correction 3 — minor, follow-up not blocking

- `Normalize Prospects` always sets `linkedinHeadline: ''`; `Residual ICP
  Score` passes it to the LLM. The headline signal the design intended is
  absent. If harvestapi returns a headline, map it in `Apply LinkedIn Result`
  and thread it through. Non-blocking for first run.
- `Read Target Companies` / `Build Sourcing Plan` assume columns `Domain`/
  `Website`, `Play`, `Explorium Business ID` exist in `tblnj3YlOI3thjrXp`.
  Verify against the live table during Phase D prep.

## Revised phase state

- Phase A: NOT complete. Corrections 1–2 required, MCP-safe now. After:
  `validate_workflow` → `update_workflow` → `publish_workflow` is FINE here
  ONLY because no credentials exist yet — but do NOT leave it active. Confirm
  `active:false` after, as before.
- Phase B: unblocked, runs in parallel. Boris will do the persona-row
  projection if handed the Teknova AAV segment criteria artifact.
- Phase C: generic credentials only (Explorium header `api_key`; Apollo header;
  Hunter query; Apify query; anthropicApi; airtableTokenApi). Attach LAST.
- Phase D: 2-company manual run, against Correction 1 acceptance criterion.
  Fresh spend approval required.
