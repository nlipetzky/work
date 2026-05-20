# Workflows ticket — Verify: repurpose for event integrity

**Write-owned by:** Workflows builder
**Workflow target:** `2rTMeD7SB3SBNZZE` (Verify)
**Working scope:** this folder (`practices/revops/workflows/verify-event-integrity/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

The Verify workflow today re-verifies L2's classification verdicts against live CT.gov fetches. With L1 now writing full per-trial evidence to Company Events (separate ticket), the re-fetch path becomes redundant. **Repurpose Verify** to check **event integrity**: every Company Events and Contact Events row has the required provenance fields populated. Surface rows that fail integrity to a needs-review queue.

## Scope

- **Workflow ID:** `2rTMeD7SB3SBNZZE`
- **Workflow name:** Verify
- **Source tables:** Company Events (`tblnzX2b2kqNGzW6r`) and Contact Events (`tblDYItHaNcT2gnwi`)
- **Output:** an Enrichment Runs row per execution with the integrity report; plus a flag on individual event rows that fail integrity

## Integrity rules — an event row passes if all of these are true

- `Event Type` is populated and is one of the canonical singleSelect values
- `Event Date` is populated
- `Provider` is populated
- `External ID` is populated
- `Source URL` is populated AND is a resolvable URL (or explicitly marked "no source URL available" with reason)
- `Raw Reference` is populated and matches the pattern `<provider>:<id>`
- `Detected At` is populated
- The linked Company (for Company Events) or Contact (for Contact Events) is non-empty
- `Is Latest` is set (true or false, not blank)

Optional but reported:
- `Raw Payload` is populated (warn if empty for paid-source events; allowed empty for free-source aggregate rows)
- `Detail` is populated

## What to do

1. Replace the workflow's current CT.gov re-fetch logic with a pure-Airtable integrity check.
2. Walk every row in Company Events and Contact Events. Run the integrity rules above.
3. For each failing row, write a flag note (a new field `Integrity Flag` on each events table — create if not exists — with the specific rule(s) that failed).
4. Write one summary row to Enrichment Runs: total rows checked, passes, failures, failure-reason breakdown.
5. Deploy via credential-preserving REST PUT.
6. Read back and verify credentials intact.

## Field to add to both Events tables before this ticket can ship

| Table | Field | Type | Description |
|---|---|---|---|
| Company Events | `Integrity Flag` | multilineText | Specific integrity rule failures, one per line. Empty = passes integrity. Written by Verify workflow. |
| Contact Events | `Integrity Flag` | multilineText | Same purpose, contact-scoped. |

The builder creates these fields via Airtable MCP `create_field` as part of the workflow build.

## Hard rules

- **Do not delete event rows that fail integrity.** Flag them; do not remove. Removing source evidence is forbidden per the principles.
- **Do not auto-fix integrity failures.** A failure means the source workflow needs to be fixed at the writer; Verify only reports.
- **Verify is read-mostly.** The only writes are: `Integrity Flag` on events tables + one Enrichment Runs row. No writes to Companies or Contacts.

## Verification gate

After deploy:
- Run Verify against the current event rows (188 Company Events, 0 Contact Events).
- Confirm an Enrichment Runs row is written with the integrity counts.
- Spot-check 5 random events that pass — `Integrity Flag` should be empty.
- Manually create 1 deliberately-broken event row (missing External ID) and re-run; that row should be flagged.

## Handoff

`practices/revops/workflows/HANDOFF-verify-event-integrity-2026-05-20.md`. Include the Enrichment Runs row from the validation execution.

## Out of scope

- L2 Classify changes (Phase-2 plan).
- Cost-monitoring / API usage Verify functionality (separate ticket if needed).
- Verify writing verdicts back to Companies (it no longer does; the principles forbid it).
