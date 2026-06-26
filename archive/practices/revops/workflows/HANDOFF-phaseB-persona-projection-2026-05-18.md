# HANDOFF — Contact Sourcing + ICP Gate, post-Phase-B (agentic-systems)

Date: 2026-05-18
Workflow: `RevOps — Contact Sourcing + ICP Gate` (`bYZ0sAzyUvU60wMZ`)
State: **inactive, zero credentials attached, nothing has run.** Keep it that way
until Phase A corrections land and Nick approves a test run.

## Where things stand

**Phase B (persona projection) — DONE, verified.**
19 `persona_*` rows written to Classification Rules (`tbl1HFYzezFYs5C3k`, base
`appYBYH3aOHhTODAw`), `Rule Category` singleSelect options auto-created. Row IDs
and resolved values are in
`/Users/nplmini/code/work/practices/revops/workflows/PROPOSAL-persona-projection-teknova-aav.md`.
Provenance closed: v5 change-log row appended to the canonical artifact
`/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`
(append-only, no Part 1/Part 2 rule changed). Five-invariant contract honored;
contract lives in `~/.claude/.../memory/project_teknova_l2_state_and_deferred.md`.

**Phase A — NOT complete.** Corrections specified in
`/Users/nplmini/code/work/practices/revops/workflows/GUIDANCE-delta-phaseA-2026-05-18.md`.
All MCP-safe now (no creds). Summary: fix the enrich loop bug
(`executeOnce:true` + `slice(0,50)` + `.first()` in the per-company loop);
standardize on HTTP+generic creds (native-node plan is void); wire
`persona_department_exclude` as a negative `job_department` filter in
`Build Sourcing Plan` (six rows exist but are inert until consumed).

## Next actions, in order

1. **Workflows session executes Phase A corrections.** Paste-ready prompt was
   delivered to Nick on 2026-05-18; it points at the three guidance docs in
   `practices/revops/workflows/`. Output of that session: corrected graph,
   2-company acceptance result, confirmation `active:false` + zero creds.
2. **Nick rules on the patient-facing disqualifier.** v4 Part 1 line 144–148
   (patient-facing clinical roles) was NOT projected — the resolved contract was
   silent and going beyond it would be re-derivation. Decision: fold a clause
   into `persona_residual` (`recF7Pxrr7nDzIQ2e`) or accept the gap for first
   run. Does not block Phase A.
3. **Phase C (Nick, n8n UI, last):** create + attach six generic credentials
   (Explorium header `api_key`; Apollo header; Hunter query; Apify query;
   anthropicApi; airtableTokenApi). Only after Phase A is published.
4. **Phase D:** manual 2-company run, fresh spend approval required.

## Hard constraints (do not violate)

- No credential attached or workflow activated before Phase A corrections are
  published and verified. MCP `update_workflow` wipes all creds — that is why
  structure goes first.
- Never re-author the canonical segment artifact. Read + derive only. Changes
  go through its append-only change log.
- No autonomous paid runs. Spend needs explicit same-session approval.

## Open follow-ups (tracked, not blocking)

- `persona_department_exclude` consumer wiring → workflows session (in the
  Phase A prompt).
- Patient-facing disqualifier ruling → Nick.
