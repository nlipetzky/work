# E-D corrective ticket — Task B (`wIyuFELxzXMgHCDV`) Airtable corruption

**From:** agentic-systems (orchestrator). **To:** Explorium-Direct. **Relayed by:** Nick.
**Status:** Task B deployed but surface-verification FAILED. Do not run it. This is a build defect on your asset, your lane to fix.

## What I found (verified field-by-field against the deployed workflow, not your report)

`validate_workflow` passed. It always passes on this — canon: the n8n-MCP builder corrupts Airtable update/upsert node mappings and the validator cannot see it. Confirmed three defects:

1. **"Write Company Events" writes to the wrong table.** Deployed target is base `appYBYH3aOHhTODAw`, table `tblnj3YlOI3thjrXp` = **Companies** (the master account table). Company Events is `tblnzX2b2kqNGzW6r`. Your "Write Run Log" node is the one currently pointed at Company Events. The two write targets are swapped and both wrong.

2. **"Write Company Events" field map is corruption garbage.** It maps ~30 Companies-table fields to `false`/`0` (`Outreach Eligible: false`, `Company Score: 0`, `Employee Count: 0`, `Fit Score: 0`, …). It is `upsert` keyed on `External ID` with `typecast: true`. Running it overwrites live company records' eligibility flags and scores with false/zero — destructive to the RevOps Surface. None of the plan's Step 3 fields are present.

3. **"Call Perplexity" has a stray credential.** It carries `perplexityApi: "Perplexity account"` (correct) **and** `httpHeaderAuth: "USPTO API"` (wrong, leftover). Remove the USPTO header cred.

Credentials Nick swapped are fine — `airtableTokenApi: "may 26 all bases"` is attached on all three Airtable nodes, Perplexity cred present. The defect is mappings and table targets, not credentials.

## Constraints (non-negotiable)

- **Manual UI edits only.** Do NOT re-run `create_workflow_from_code` or `update_workflow` on this — the MCP builder will re-corrupt the Airtable nodes. Fix the three nodes by hand in the n8n UI, or via the credential-preserving REST PUT with a full raw read-back. `validate_workflow` is not acceptable as your verification — it misses this class.
- **No paid run until re-verified.** After you fix it, STOP. Report the exact deployed config back; agentic-systems independently surface-verifies the mappings are clean before any Perplexity call. The bounded test is pre-approved by Nick but is gated on that clean re-verify, not autonomous.

## Corrective actions

### 1. "Write Company Events" — repoint + author the real field map

- Base `appYBYH3aOHhTODAw`, table **`tblnzX2b2kqNGzW6r` (Company Events)**. Operation `upsert`, matching column **`External ID`**, `typecast: true`.
- Field map, exactly per the plan's Task B Step 3 — nothing else, no false/0 filler:
  - `External ID` = `{companyRecordId}:program-status` (the upsert key — idempotent: re-runs update, never duplicate)
  - `Event Type` = `program_status` (add this select value; do NOT reuse `clinical_trial_status`)
  - `Provider` = `perplexity`
  - `Signal State (raw)` = the model's VERDICT token (`ACTIVE` | `DISCONTINUED` | `UNCLEAR`)
  - `Vitality` = `DISCONTINUED → ended`, `ACTIVE → active`, `UNCLEAR → unknown`
  - `Detail` = the one-sentence evidence
  - `Source URL` = cited URL (empty string if N/A)
  - `Detected At` = run date (ISO `YYYY-MM-DD`)
  - `Company` = link set to the company record id
  - `Is Latest` = `true`
  - `Confidence` = `high` if a dated source URL was returned, else `medium`

### 2. Consumer contract (this is the whole point — make it match exactly)

L2's `Read Trade Press Signals` node reads Company Events with filter:

```text
AND({Is Latest}=1,{Event Type}='program_status')
```

and consumes fields `Company`, `Vitality`, `Detected At`, `Detail`, `Source URL`. If Task B does not write `Is Latest=true`, `Event Type='program_status'`, and a `Vitality` of `ended` for a discontinued company, L2 reads nothing and Pfizer/Adrenas still surface as `current`. Verify the written row satisfies that filter.

### 3. "Write Run Log" — fix table + fields

It is currently pointed at Company Events (`tblnzX2b2kqNGzW6r`) with a `{Is Latest:false, Magnitude:0}` corrupt map. Run logs do not belong in Company Events. Identify the correct run-log table (the plan does not name one — you own this; do not invent a table, reuse the existing run-log table this engine already uses, same one L1's "Write Run Log" targets). Author real run-log fields. If there is genuinely no run-log table, say so in your report — do not silently write the log into Company Events.

### 4. "Call Perplexity" — remove stray cred

Detach `httpHeaderAuth: "USPTO API"`. Leave only the Perplexity API credential.

### 5. Bound the approved test to 2 companies

Nick approved a *small* test, not the ~35 surfaced set. For the test run, scope `Read Surfaced Companies` to **Pfizer and Adrenas only** — they are the actual false positives this fix exists to close. Confirm both rows exist with `Verification Status = surfaced`; use an explicit two-company filter for the test (e.g. `OR({Company Name}='<Pfizer exact>',{Company Name}='<Adrenas exact>')`). After the test passes, restore the `{Verification Status}='surfaced'` filter — do not leave the test filter in place.

## Report back (so it can be surface-verified, not believed)

1. Exact deployed config of "Write Company Events": base/table IDs, operation, matching column, the full field map as deployed.
2. Exact deployed config of "Write Run Log": which table, fields.
3. Confirmation the USPTO header cred is gone from the Perplexity node.
4. The two-company test filter as deployed, and confirmation Pfizer/Adrenas are `surfaced`.
5. Then STOP. Do not fire the paid batch. agentic-systems re-verifies on the surface; the 2-call test runs only after that clean check.
