# RESUME HANDOFF — L2 HTTP-PATCH rebuild (next session)

**Date:** 2026-05-15
**Checkpoint:** L1 recency change complete + verified. Clean boundary. L2 build deliberately deferred to a fresh session — it is the highest-stakes step (MCP-corruption hazard lives there) and must work from approved canonical docs, not a tail-end push.

## State at checkpoint (all verified)

- v3 L2 classifier logic: PROVEN (sandbox + real 4-record smoke that wrote correct verdicts to Nkarta/Pfizer/PTC/Sensorion).
- `SPEC-L2-write-nodes-2026-05-15.md`: **rev 2 APPROVED** by agentic-systems pass 2. Binding build contract.
- `DESIGN-step4-L2-rebuild-2026-05-15.md`: synced (route 4 dormancy ruled, route 5 AAV Segment retired).
- 2 recency fields live in Companies `tblnj3YlOI3thjrXp`: `Most Recent Trial Date` (`fld8wCr8FI00xjqnz`, date), `Active Recruiting` (`fldIQZlyDRW10nWVE`, checkbox).
- L1 `9gcmEjq1lvOY2jZS`: 4 edits applied + read-back verified exact (fetch date params, Extract recency code, Merge passthrough, Upsert 2 new single-`=` mappings). Not executed.
- HTTP-PATCH write path: spike-proven builder-immune (`sY4rR92r7EpMHTbJ`).
- Companies table: 631 rows, all with a Verification Status (627 needs_verification, 1 borderline Sensorion, 2 surfaced Pfizer/PTC, 1 rejected Nkarta).
- Nothing run. No spend. Gates 1a/1b hard.

## Exact resume point — do this next session, in order

1. **L2 rebuild per `SPEC-L2-write-nodes-2026-05-15.md` rev 2**, HTTP-PATCH path, ONE MCP push to `rXKuqfDwqX7TYzxK`. All 7 Companies write nodes (Reset+Clear Stale, Update Surfaced, Disease Reject, Modality Reroute, Dormant, Needs Review, Borderline) = HTTP Request PATCH to `https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp`, sparse `{records:[{id,fields:{...}}],typecast:true}`, batch ≤10. Reads stay Airtable `search`. Switch = 6 outcomes. Apply Rules = the proven v3 evaluator (`norm()` uses `[^a-z0-9]`).
2. Read deployed config back; confirm every HTTP body is the exact sparse field set per SPEC (no injected numerics) before anything runs.
3. Nick (UI, one-time): attach `may 26 all bases` to each HTTP node; set `List All Companies` → Return All ON.
4. **Gate 1a/1b:** read-back proving the re-queue read returns exactly the live `totalRecordCount` (631 now).
5. **Re-smoke** (Nkarta/Pfizer/PTC/Sensorion) — see carry-forward 1.
6. Only then: gated full-cohort run. Report counts + Nkarta acceptance. Input to Nick's Step 5 spend gate.

## Two carry-forwards (do not lose)

1. **Re-smoke MUST assert numeric fields UNCHANGED on existing rows.** Read Trial Count / Employee Count / funding fields on the smoke records BEFORE and AFTER the L2 write; prove they are identical. This is what verifies the "zeros in L1 Upsert are intentional seeds, not builder injection" claim — that claim is NOT settled until the smoke proves L2 doesn't zero existing data. Treat as open until proven.
2. **Every code-node edit in the L2 build = FULL replacement block**, never partial-insert, in chat and in any SPEC (Nick directive 2026-05-15, in memory `feedback_full_code_blocks.md`).

## Canonical docs the fresh session reads first

- `SPEC-L2-write-nodes-2026-05-15.md` (rev 2 APPROVED — the build contract)
- `DESIGN-step4-L2-rebuild-2026-05-15.md` (§3 precedence/routes)
- `STATE-MACHINE-families-1-3-2026-05-15.md` (live option strings, halt invariant)
- This handoff (resume point + carry-forwards)
