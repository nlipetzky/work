# Phase 3 Migration Plan: text-to-checkbox + legacy field cleanup

**Status:** Plan locked. Execute in a fresh session.
**Drafted:** 2026-05-13
**Base:** `appYBYH3aOHhTODAw` (RevOps Surface)
**Tables:** Companies (`tblnj3YlOI3thjrXp`), Contacts (`tblWJksRL1yKSUgrm`)

---

## Context

The Cohort Data Model lock (2026-05-13) replaced several text-typed boolean fields with checkbox fields and replaced one text field with a singleSelect. Phase 1 added the new checkbox / singleSelect fields. Phase 2 renamed four label-only Companies fields. Phase 3 finishes the type migration: legacy text fields move their data into the new typed fields, then the legacy fields drop.

**Architectural simplification (2026-05-13):** Supabase is OUT of the picture for now. Airtable is the source of truth. Direct sync from external systems (Salesforce, Hunter, Explorium, etc.) writes straight to Airtable. The earlier Supabase-as-middleware design comes back in a future phase. Phase 3 has no upstream-sync coordination concerns.

---

## Scope

11 fields. 6 on Companies, 5 on Contacts. Three patterns:

**Pattern A — drop and recreate** (zero data, safe).
- `Existing Customer` (text, 0 records populated) → drop, create new `Current Customer` (checkbox).

**Pattern B — migrate into existing new field, drop legacy.**
- 6 fields where Phase 1 already created the destination checkbox / singleSelect.

**Pattern C — sibling create, backfill, drop, rename.**
- 4 fields where no Phase 1 destination exists yet.

---

## Pre-flight audit (run before any change)

Before each migration, confirm the value distribution. Pull a sample of 200 records per field and count distinct values. The actual `"No"` / `"Yes"` / `"true"` / `"false"` / empty distribution per field determines the backfill logic.

I've already audited some fields. The known distribution as of 2026-05-13:

| Field | Records | Distinct values |
|---|---|---|
| `Existing Customer` | 0 | (empty) |
| `SF Has Open Opp` | 144 | `No` only |
| `SF Has Closed Won` | 144 | `No` only |
| `DNC Opt Out` | 144 | `No` only |
| `Modality Confirmed` | 179 | `No` (144), `false` (24), `true` (11) — three encodings |
| Contacts: `Opt Out`, `Do Not Contact`, `Email Opt Out`, `Hard Bounced`, `Active Cadence` | unknown | re-audit at start of session |
| `Email Verified` | unknown | re-audit at start of session |

Always re-audit at session start before mutating. Sample at least 200 records per field via `list_records_for_table`.

---

## Migration sequence

Execute in this order. Each step is atomic: complete it (including verification) before starting the next. Stop on first failure and report state.

### Companies

**Step 1 — `Existing Customer` → `Current Customer` (Pattern A).**

Field ID: `fldwDkTwex2yxuo9K`. Type: singleLineText. Records populated: 0.

Operations:
1. Delete `Existing Customer` field.
2. Create new field `Current Customer` (checkbox, icon `xCheckbox`, color `redBright`). Description: "Per the Cohort Quality framework's company-level absolute suppression check. True = the account is a current customer of the client; excluded from cohort outright."

Risk: zero data, low risk.

**Step 2 — `SF Has Open Opp` → checkbox (Pattern C).**

Field ID: `fldepvAPDsJtkfQDz`. Type: singleLineText. Records populated: 144 (all `"No"`).

Operations:
1. Create sibling field `SF Has Open Opp (v2)` (checkbox, icon `xCheckbox`, color `yellowBright`). Description: "True if Salesforce shows an active opportunity at this account. Per the Cohort Quality framework's conditional suppression — combine with AE Cleared for Outreach. Migrated from text field on 2026-05-13."
2. Backfill: read all 144 populated records; map `"Yes"` / `"true"` / `"TRUE"` / `"1"` -> checked, everything else (including `"No"`) -> unchecked. Update via `update_records_for_table` in batches of 50.
3. Verify: list records where `SF Has Open Opp (v2) = true`; should be 0 (since all source values were `"No"`). List records where the legacy `SF Has Open Opp = "Yes"`; should also be 0.
4. Delete `SF Has Open Opp` (text).
5. Rename `SF Has Open Opp (v2)` -> `SF Has Open Opp`.

Risk: low — all source values map cleanly to unchecked.

**Step 3 — `SF Has Closed Won` → checkbox (Pattern C).**

Field ID: `fldns26v1kintTGOs`. Same pattern as Step 2.

Operations:
1. Create sibling `SF Has Closed Won (v2)` (checkbox).
2. Backfill from text values.
3. Verify counts.
4. Delete text field.
5. Rename sibling.

**Step 4 — `DNC Opt Out` → migrate into existing `Account-Level DNC` (Pattern B).**

Field ID: `flduoXJN863aumFvc`. Destination: `Account-Level DNC` (`flde4vNwj2igDpN44`, checkbox, created in Phase 1A).

Operations:
1. Read all 144 populated `DNC Opt Out` records.
2. For each: map `"Yes"` / `"true"` -> set `Account-Level DNC = true`; `"No"` / empty -> leave `Account-Level DNC` unchanged (it's already false by default).
3. Verify: count records where `Account-Level DNC = true`; should match the count of legacy `DNC Opt Out` values that were truthy (probably 0 based on audit).
4. Delete `DNC Opt Out` field.

**Step 5 — `Modality Confirmed` → drop after redundancy check (no replacement).**

Field ID: `fld6UtGMfhXN7nKr6`. Description already marks it DEPRECATED.

The argument: `Modality Confirmed = true` is redundant with `Enrichment Status = enrichment_complete`. Confirm via audit:

1. List all records where `Modality Confirmed` in (`true`, `Yes`, `TRUE`). Count.
2. List all records where `Enrichment Status = enrichment_complete`. Count.
3. Compute set difference: any record where `Modality Confirmed` is truthy but `Enrichment Status != enrichment_complete`? If yes, surface those records and decide per-record whether they're legitimate exceptions or stale data.
4. If set difference is empty (or empty after handling exceptions), drop `Modality Confirmed`.
5. If non-empty, hold and surface for review.

Risk: medium — the redundancy claim could be wrong. Always audit before dropping.

### Contacts

**Step 6 — Email DNC consolidation: `Opt Out` + `Do Not Contact` + `Email Opt Out` → migrate into existing `DNC / Opt-Out (Email)` (Pattern B, three-way merge).**

Field IDs: `Opt Out` (`fldd4M8qyIqP5GtSo`), `Do Not Contact` (`fldKlFV3NrOqlxWSC`), `Email Opt Out` (`fldDL7pM38iWE4ApU`). Destination: `DNC / Opt-Out (Email)` checkbox created in Phase 1B.

Operations:
1. Re-audit each: pull sample, count populated, list distinct values.
2. Decide merge rule: a contact's `DNC / Opt-Out (Email) = true` if ANY of the three legacy fields was truthy (`"Yes"` / `"true"` / `"TRUE"` / `"1"`).
3. For each contact with at least one truthy legacy value: set `DNC / Opt-Out (Email) = true`.
4. Verify: count records where `DNC / Opt-Out (Email) = true`; sanity-check against union of legacy values.
5. Delete `Opt Out`, `Do Not Contact`, `Email Opt Out` (text fields).

Risk: medium — three sources merging into one. Audit the merge logic carefully before deleting source fields.

**Step 7 — `Hard Bounced` → migrate into existing `Email Hard-Bounced` (Pattern B).**

Field ID: `fldM9YDEsurkqqcEM`. Destination: `Email Hard-Bounced` checkbox created in Phase 1B.

Operations: same pattern as Step 4. Read legacy, map truthy to checked, leave falsy unchanged, verify counts, delete legacy.

**Step 8 — `Active Cadence` → migrate into existing `Email Active Cadence Elsewhere` (Pattern B).**

Field ID: `fldIlphFezFenpU6b`. Destination: `Email Active Cadence Elsewhere` checkbox created in Phase 1B.

Same pattern.

**Step 9 — `Email Verified` → migrate into existing `Email Verified Status` singleSelect (Pattern B, text→enum).**

Field ID: `fld6ckO3UuYpDdBeE`. Destination: `Email Verified Status` (singleSelect with choices `verified` / `catch-all` / `unverifiable` / `invalid`, created in Phase 1B).

Operations:
1. Re-audit: distinct values in legacy `Email Verified`.
2. Build a mapping from each legacy value to a destination choice. If the legacy carried just `true`/`false`, the mapping is `true` -> `verified`, anything else -> `unverifiable`. If it carried more nuanced values (e.g., `deliverable`, `catch_all`, `bouncing`), map each explicitly.
3. Surface the mapping for review before applying.
4. Apply: update each contact's `Email Verified Status` per the mapping.
5. Verify: count distribution across choices.
6. Delete `Email Verified` (text).

Risk: medium — the legacy field's vocabulary is unknown. Audit before mapping.

---

## Verification at each step

After each step:

1. Confirm the new field's data matches the legacy field's truthy count (with adjustment for known mapping rules).
2. Confirm zero "orphaned" records: records where the legacy was truthy but the new field is not set.
3. Confirm the field deletion succeeded by listing the table schema and looking for the absence of the legacy field.

---

## Rollback strategy

Per step:

- **Steps 1-3 (Pattern A and C):** before deleting the legacy field, the sibling has been created and backfilled. If something looks wrong, delete the sibling instead and the legacy is untouched.
- **Steps 4, 6, 7, 8, 9 (Pattern B):** before deleting the legacy, the destination has been backfilled. If a problem is found post-deletion, the legacy is gone and the destination has all the data. Worst case: re-create the legacy field (text), and the data is already in the destination — no data loss, just a name reversal.
- **Step 5 (drop):** before dropping `Modality Confirmed`, capture the redundancy audit results to a markdown file in `research/`. If something turns up later, we have the captured state.

Don't drop any field until backfill verification passes.

---

## Tools required

- `mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__list_records_for_table` (audit, read source values)
- `mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__create_field` (Pattern A and C sibling creation)
- `mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__update_records_for_table` (backfills)
- `mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__update_field` (rename legacy fields with ` - DELETE` suffix; rename siblings to canonical names after legacy deletion in UI)

No field-delete tool exists. Deletion is manual in the Airtable UI; the rename pattern above flags fields for Nick.

---

## Estimated effort

- Pre-flight audits: 15-20 minutes (one bulk list call per table; analyze in sandbox).
- Steps 1-4 (Companies): 30 minutes.
- Step 5 (Modality Confirmed drop): 15-20 minutes if redundancy holds.
- Steps 6-9 (Contacts): 45 minutes (Step 6 is the most complex; three-way merge).
- Verification at each step: 5 minutes.
- Total: 2-3 hours for full execution, depending on data audits.

---

## What's NOT in Phase 3

- **Signal: \* fields on Companies.** Those migrate into the new Company Events child table; that's Phase 4.
- **Workflow updates.** The n8n gate workflow doesn't read or write any of these specific fields today (it writes only the Modality / Custom Classification group, already handled in Phase 2). No workflow code changes needed for Phase 3.
- **External sync setup.** Removing Supabase from the architecture for now means no sync writes to these fields. They are manually populated until we wire up direct SF→Airtable (separate future phase).

---

## Deletion approach (resolved 2026-05-13)

The Airtable MCP does NOT expose a field-delete tool. Deletion happens manually in the Airtable UI.

**Pattern:** instead of "drop field X" as a programmatic step, the migration **renames** the legacy field with a ` - DELETE` suffix and updates its description with `MARKED FOR MANUAL DELETION YYYY-MM-DD`. Nick then deletes those marked fields in the Airtable UI as a final cleanup pass.

This means every step below that says "delete field X" should be read as: "rename field X to `X - DELETE` and update description; Nick deletes in UI later."

**Pre-session renames already applied (2026-05-13):**

These four fields were renamed to `- DELETE` markers in the previous session, ahead of Phase 3 execution. They are not new operations in this plan; they are inputs to it.

- `Modality Confirmed` → `Modality Confirmed - DELETE` (179 records; redundancy with `Enrichment Status` still needs verification in Step 5 before Nick deletes)
- `Primary Modality` → `Primary Modality - DELETE` (110 records; legacy taxonomy. Data preserved for now; manual review needed if you want to capture the taxonomy values elsewhere before Nick deletes)
- `V2 Primary Modality` → `V2 Primary Modality - DELETE` (1 record; abandoned)
- `Existing Customer` → `Existing Customer - DELETE` (0 records; Step 1 creates the replacement)

When the migration plan refers to these fields by their original names below, use the renamed `... - DELETE` name in the actual API calls.

---

## Suggested kickoff prompt for the new session

> Load `practices/revops/airtable-phase-3-migration-plan-2026-05-13.md` and execute it. Start with the pre-flight audits. Stop after each step and report state before proceeding to the next. Use the cohort-data-model.md and cohort-quality-framework.md as references for context if needed.

---

## Reference

- Cohort Data Model: `practices/revops/cohort-data-model.md`
- Cohort Quality Framework: `practices/revops/cohort-quality-framework.md`
- Cleanup observations: `practices/revops/airtable-companies-cleanup-plan-2026-05-13.md`
- Phase 1 work (already done): all 36 new Companies fields + 32 new Contacts fields + Company Events child table + Contact→Company link backfilled.
- Phase 2 work (already done): 7 Airtable field renames + 24 string-key replacements in the gate workflow's 6 Map\* code nodes.
