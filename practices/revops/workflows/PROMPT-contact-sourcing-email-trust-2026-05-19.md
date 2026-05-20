# Workflows build ticket — contact-sourcing email trust (FINAL SCOPE)

**Workflow:** `bYZ0sAzyUvU60wMZ`. **Owner:** Workflows. **agentic-systems surface-verifies every step.**
This is the **entire remaining scope** of this workflow. Do exactly these three changes. Do not add, refactor, or expand anything else. When these pass surface verification, this workflow is done and closed.

## Background (verified on exec 80794, not narration)

- All 5 prospects were sourced, scored, and written. There is no silent drop. Fixes 1–4 from the prior round function.
- Email selection in `Email + Employer Verify` takes `exploriumEmail` first, Apollo only as fallback. Explorium emails are guessed (the CEO "Zandy Forbes" got `melinda.zech@meiragtx.com`).
- `Hunter` node runs but its result is not used to choose or replace the email.
- `Apply Email Verify` correctly labels catch-all as `catch-all`, but catch-all emails flow downstream identically to verified ones.
- `Apollo People Match` returned empty for all 5. Nick confirms Apollo credits exist — so this is a query/params bug, NOT exhaustion.

## The three changes (definition of done)

### 1. Hunter is the primary email finder; Explorium/Apollo are fallback/corroboration

The email written to the Contacts table must be the **Hunter-found/verified** address when Hunter returns one for that person. Use Explorium or Apollo email only when Hunter returns nothing. `Email Provider Source` must reflect the source actually used (truthful, per-contact). Note the structural issue: the email-source decision currently happens in `Email + Employer Verify` which runs *before* `Hunter`. You will need the final email choice to occur at/after `Hunter` (move the selection downstream, or restructure so Hunter's result feeds it). Implementation is yours; the required behavior is: Hunter-first, honest source label.

### 2. Fix `Apollo People Match` so it returns matches

Diagnose the request (body/params/match keys) so Apollo returns a match for matchable prospects. Credits are fine — do not report "exhausted." Restoring Apollo restores the second source that catches wrong-person guesses (employer cross-check + email corroboration).

### 3. Honest verification result, visible to Ellie

`Email Verified Status` must always carry one of exactly: **`Verified` / `Catch-all (unconfirmed)` / `Unverifiable` / `Not found`**, reflecting Hunter's verdict on the address actually used. Rules:
- A catch-all or unverifiable or not-found email must NEVER set `Email Identity Confirmed = true`. (The current code already gates identity on `status==='verified'` — keep that property; just ensure the four-state value and the `Not found` case exist.)
- The point is honesty: "we attempted verification, here is the real result." Catch-all is a legitimate final answer — surface it as unconfirmed, do not launder it into looking usable.

## Constraints (non-negotiable)

- This workflow has live credentials. n8n PUT/MCP update wipes them and `validate_workflow` misses Airtable-node corruption. This exact workflow already lost the Apollo `USPTO API` credential on a prior PUT. After any deploy: raw read-back, report the credential binding per node and node config as references. Do not assert "credentials preserved."
- No autonomous spend. Deploy inactive. The verification run is a **bounded size:5 MeiraGTx** real execution and is a STOP gate → Nick's same-session go. No pinned/simulated runs — only a real execution counts.
- Output contract (see this folder's CLAUDE.md): report only workflow ID + post-deploy `versionId`, the execution ID, record IDs written, and per-node item counts read from that execution. No narrative. No "working/verified/ready." No per-person characterization unless copied verbatim from the cited execution. agentic-systems decides pass/fail by independently re-reading the surface.

## Definition of done (agentic-systems verifies on a bounded MeiraGTx size:5 execution)

1. For contacts where Hunter returned an address, the written `Email` is Hunter's and `Email Provider Source` says so.
2. `Apollo People Match` returns non-empty for matchable prospects in that run.
3. Every written contact's `Email Verified Status` is one of the four exact values; no catch-all/unverifiable/not-found contact has `Email Identity Confirmed = true`.

Meet all three on the surface and this workflow is closed. Nothing else is in scope.
