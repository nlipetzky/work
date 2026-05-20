# RevOps Engine — Selective-Run Protocol

**Status:** Standing build standard for every RevOps-engine workflow. Mandatory by construction for new workflows; retrofit for existing ones.
**Established:** 2026-05-18 (Nick directive — recurring problem: workflows that can only run full-cohort, forcing ad-hoc expression gymnastics to test or re-run a subset).

## The problem this removes

Several engine workflows are hardwired to process the entire table (often resetting all rows first). To run a handful of records — for a test, a re-run, or a deliberate pick — operators had to hand-edit node expressions each time. That is error-prone, leaves rows in limbo, and blocks safe bounded testing.

## The rule

Every working table in the RevOps engine carries a boolean column: **`Run Selected`** (checkbox).

Every engine workflow that processes that table obeys this at the top of its run:

- **If one or more rows have `Run Selected = true`:** the workflow processes ONLY those rows, and SKIPS any full-cohort reset/re-blank step entirely. No other row is read, reset, or written.
- **If no rows are checked:** the workflow runs its normal full-cohort behavior, unchanged.

This is safe by default (unchecked = normal) and requires no node edits to scope a run — the operator just ticks boxes in Airtable.

## Why checkbox, not a status value

Engine workflows commonly reset/clear the status field as their first step. A selection encoded in a status value would be destroyed by that reset before it could take effect. A dedicated checkbox is not touched by status resets, so it survives. This is not a preference — a status-based selection is actively unsafe on any workflow with a reset step.

## Implementation shape (proven 2026-05-18 — do NOT use a dynamic expression)

The selection filter MUST be a **static Airtable formula**, never an n8n dynamic expression. n8n's expression evaluator cannot run multi-statement JS (block-body arrows, `const`, `;`) inside `{{ }}`; it silently yields garbage and Airtable rejects it with a 422. The working shape, verified:

- The selection check (is any row selected → return only those) lives in a **Code node** (full JS is reliable there). On the L2 retrofit this is `Gate 1b Breaker`: if any row has `Run Selected` true, return only those rows; else integrity-check + return all.
- The candidate-read filter is a **static formula**: `OR({Run Selected}=1,{Verification Status}='needs_verification')`. This catches selected rows directly regardless of their status, and reduces to normal behavior when nothing is ticked. No expression, no evaluator, cannot fail to parse.

A dynamic `={{ ... ternary ... }}` filter is a known failure mode — the first L2 attempt died exactly here, leaving the 8 selected rows reset-but-unclassified (blast radius correctly contained to the selection, which is the protocol working).

## Non-negotiable: the selection gates EVERY destructive step

The selection must gate the reset/re-blank step too, not only the final read/filter. Scoping the read but still resetting all rows is worse than a full run — it wipes the cohort and reclassifies only the subset, leaving the rest in limbo. In selective mode the correct behavior is: do not reset anything; touch only the selected rows.

## Operator workflow

1. In the table, tick `Run Selected` on the rows you want (include at least one row that exercises the behavior under test).
2. Run the workflow normally.
3. Verify results on the selected rows.
4. Untick when done (or leave them; the next full run only happens when nothing is checked — so leaving boxes checked keeps the workflow in selective mode, which is a feature, not a bug: it prevents an accidental full-cohort run).

## Build requirement

- New engine workflow: include the `Run Selected` branch from day one. It is part of "done," like credential handling and the run-log.
- Existing engine workflow: retrofitting the branch is a roadmap item on `revops-engine`; until retrofitted, the workflow is flagged as full-cohort-only in the registry.

## Registry

`Run Selected` column presence and selective-mode support are asset facts. An engine workflow asset is not "reconciled" until its selective-run support is verified on the surface.
