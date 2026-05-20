# Workflows ticket — unblock DoD1 (data fix), re-run, close contact-sourcing

**Workflow:** `bYZ0sAzyUvU60wMZ` (currently versionId `b30089a2`). **Owner:** Workflows. **agentic-systems surface-verifies, then this workflow closes.**
This is the final step. DoD2 (Apollo 5/5) and DoD3 (four honest states) are already met and surface-verified. Only DoD1 (Hunter-first real emails) remains, and it is blocked by missing data, not code. Do exactly this. No code changes. No scope expansion.

## The only change: a data fix

In the Target Companies table (Airtable base on the `All KAI Bases` credential, the table `Read Target Companies` reads), the MeiraGTx row (`Read Target Companies` returned one row "MeiraGTx, LLC"; Workflows reported its record ID as `rec7qaGedk0dmOON3` — confirm before writing) has `Domain` and `Website` both empty. Set:

- `Domain = meiragtx.com`

That is the entire change. Do **not**:
- Edit any workflow node, do a workflow PUT, or change `versionId`. There is zero code change here — Airtable data only, so there is no credential-wipe exposure this round. Keep it that way.
- Add domain-derivation-from-email logic (rejected: circular, reintroduces the guessed-email trust problem).
- Touch the merge / `LI Resolved` topology (out of scope: functional, no drop).

## Re-run

Re-run the **same bounded size:5 MeiraGTx** test (already configured, Nick's go for this bounded verification cycle stands — this is its continuation after the data fix, not a new/larger run). Do not exceed size:5 or change the company set.

## Report — references only (output contract)

- The Target Companies record ID you edited and its `Domain` value post-edit.
- The re-run execution ID and status.
- From that execution: `Build Sourcing Plan` `targetDomain` value; per-contact `Hunter` result (email returned vs error); per-contact `Apply Email Verify` `emailSource` and `Email Verified Status`.
- The records written to the Contacts table.

No narrative. No "verified/working/closed." STOP after reporting. agentic-systems independently re-pulls the execution and decides pass/fail.

## Definition of done (agentic-systems verifies DoD1 on the bounded re-run)

1. `targetDomain` is `meiragtx.com` (not null); `Hunter` no longer bad-requests.
2. For contacts where Hunter returned an address, written `Email` is Hunter's and `Email Provider Source` = `hunter`.
3. `Email Verified Status` is one of `Verified` / `Catch-all (unconfirmed)` / `Unverifiable` / `Not found`, reflecting Hunter's verdict; no catch-all/unverifiable/not-found contact has `Email Identity Confirmed = true`.

DoD1 met on the surface + DoD2/DoD3 already met = contact-sourcing is closed. Nothing else in scope. (Separate, not part of this close: Target Companies rows must carry domains before any non-test run — data-hygiene task, flag only, do not action here.)
