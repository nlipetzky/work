# Source-of-record: selective-run protocol (2026-05-18)

## What happened

The L2 currency-gate "bounded 6-row smoke" was found impossible: the workflow always resets all 121 rows and reclassifies the full cohort. Nick noted this is a recurring problem across engine workflows — prior sessions had to hand-modify node expressions to run a subset. He directed a standing protocol, created and implemented now: a dedicated control (checkbox column or status) so any subset of records can be run on operator whim, and left the mechanism choice to the agent.

## The reasoning

Mechanism decision: **checkbox, not status.** Engine workflows commonly reset/clear the status field as their first step (L2 does exactly this). A selection encoded in status is destroyed by that reset before it can act. A dedicated boolean column is untouched by status resets and survives. This is a correctness constraint, not a preference.

The load-bearing detail: the selection must gate **every destructive step**, especially the reset — not just the final read. Scoping the read while still resetting all rows (the naive "maxRecords" patch) is strictly worse than a full run: it wipes the cohort and reclassifies only the subset, stranding the rest. Correct selective behavior: in selection mode, reset nothing, touch only selected rows.

Generalization: this is a build standard, not a one-off fix. Every RevOps-engine workflow gets a `Run Selected` checkbox on its table and a top-of-run branch — if any row is checked, process only those and skip resets; if none, normal full behavior (safe by default, zero node edits to scope a run). New workflows include it by construction; existing ones retrofit as a roadmap item and are flagged full-cohort-only until then. Same family as the n8n-safe-update standard and the registry: a non-skippable part of "done" for engine workflows.

## Disposition

Protocol written: `practices/agentic-systems/reference/revops-engine-selective-run-protocol.md`. `Run Selected` checkbox added to the Companies table now. L2 retrofit (honor selection + skip reset in selection mode) is the immediate next implementation step; it ships through the n8n-safe-update + raw read-back path and requires a credential reattach (two-party action with Nick regardless). Nick directive: do NOT run all records now; the selective run is the path to a real bounded test.
