# Contact Sourcing — Collect All Prospects multi-run reducer fix (2026-05-19)

Workflow: `bYZ0sAzyUvU60wMZ`.
Pre-fix versionId: `17944090-5ddb-49c4-a10f-bc0363ccf32c`.
Post-fix versionId (selective run state): `fad590b7-9ab4-4b2e-8036-7ddfdde83076`.
Post-restore versionId (production): `1ab0f32f-2aff-4cd5-aeab-f790cb8d96e5`.
10/10 credential bindings preserved across both PUTs. 23 nodes, 22 conn keys.

## Fix pattern (smallest correct, no new nodes, no rewiring)

Per-execution accumulator in `$getWorkflowStaticData('global')`. Two code-node
edits, zero topology change:

- **Normalize Prospects** (`d20246e3`) — at the end of its per-iteration code,
  appends the iteration's output items into `sd._csCollected[$execution.id]`.
  Original normalization logic unchanged; the push is in a try/catch so it
  never blocks emission of the iteration's items downstream into the loop.
- **Collect All Prospects** (`8f7f739e`) — reads
  `sd._csCollected[$execution.id]` (the union across all loop iterations),
  deletes that key, opportunistically prunes orphaned keys (>50 → keep 25
  newest), then dedupes by `prospectId` (or fullName|targetCompany) and emits.

`$execution.id` keys the accumulator so concurrent executions never cross-
contaminate, and the delete-on-read ensures clean reuse. Static data is
n8n's canonical primitive for collecting across SplitInBatches iterations.

## Bounded run — exec 80834 (manual, draft fad590b7, success, 21:41:17→21:42:27Z, 70s)

Scope: Run Selected=TRUE on Voyager (recITaZ11Ot0ztV90) + Solid Biosciences
(rec1QsWki22Ne2Wtl); cleared on Abeona/BioMarin/PTC for the run.
filterByFormula temporarily swapped to
`AND({Run Selected}=1, {Explorium Business ID}&''!='')`. Pre-run live read
confirmed exactly 2 rows match.

Per-node items from exec 80834 runData:

| Node | Count |
|---|---|
| Read Target Companies | 1r / 2i |
| Build Sourcing Plan | 1r / 2i |
| Loop Companies | 3r / 10i |
| Explorium Fetch Prospects | 2r / 2i |
| **Normalize Prospects** | **2r / 10i** (DoD1 ✓) |
| **Collect All Prospects** | **1r / 10i** (DoD2 ✓ — was 1r/5i before fix) |
| Apollo People Match | 1r / 10i |
| Email + Employer Verify | 1r / 10i |
| Apify LinkedIn Verify | 1r / 9i (1 dropped — same blocked-profile class as exec 80831, separate from this ticket) |
| Apply LinkedIn Result | 1r / 10i (join still emits 10) |
| LI Resolved | 1r / 10i |
| Hunter | 1r / 10i |
| Apply Email Verify | 1r / 10i |
| Residual ICP Score | 1r / 10i |
| Apply Score + Map | 1r / 10i |
| Prepare Contacts Upsert | 1r / 1i (1 batch, 10 records) |
| Upsert Contacts to Airtable | 1r / 1i |

No node errors. No top-level error.

## Surface — Contacts `tblWJksRL1yKSUgrm`, all carry ICP Score Reason

Total rows for Voyager / Solid / Lexeo: 15 (5 each). Lexeo's 5 prior rows
unchanged (Last Enriched At = 2026-05-19T21:17:09Z, from exec 80833 — no
regression). 10 new rows from exec 80834 (Last Enriched At =
2026-05-19T21:42:24Z):

### Solid Biosciences Inc.
- recsVa77lkXjaemjo Gabriel Brooks, CMO — score 5, icp_filtered_out
- recBXSAO6OI3dVqO3 Jessie Hanrahan, Chief regulatory and preclinical ops — score 0, icp_filtered_out
- rec2OU5vhWkDoA7B9 Kevin T., CFO — score 0, icp_filtered_out
- **recjlWNEuLaDYlfZA Paul Herzich, CTO — score 75, enrichment_complete** ≥60
- rectUnDSBW194miQy Ty Howton, COO + General Counsel — score 0, icp_filtered_out

### Voyager Therapeutics
- recqpDdQVjz51avHZ Al Sandrock, CEO — score 0, icp_filtered_out
- rec2qElaBpQLXx3IO Nathan Jorgensen, CFO — score 0, employer_unconfirmed
- recdLckEQVBMa2ICI Robin Swartz, COO — score 15, icp_filtered_out
- recZrwkZYve48wmzS Toby Ferguson, CMO — score 0, employer_unconfirmed
- **recN6uPvqHYAN4S32 Todd Carter, CSO — score 85, enrichment_complete** ≥60

**≥60 count for this run: 2 (Paul Herzich 75 Solid, Todd Carter 85 Voyager).**

## DoD vs surface

1. `Normalize Prospects`: 2 runs / 10 items ✓
2. `Collect All Prospects`: emits all 10 (not 5) ✓
3. Downstream processes 10, all reach upsert (Prepare Contacts Upsert 1 batch
   of 10 records; Upsert 1 PATCH; 10 new contact rows on the surface) ✓
4. Voyager 5 + Solid 5 identifiable on surface by Company Name ✓
5. Lexeo's prior 5 rows untouched (Last Enriched At 21:17:09 unchanged) — no
   regression ✓

## Restore

Production state restored:
- filterByFormula reverted to
  `AND({Outreach Eligible}=1, {Explorium Business ID}&''!='')`.
- Run Selected cleared on Voyager + Solid; re-toggled to TRUE on
  Abeona/BioMarin/PTC (pre-session state preserved).
- Collect-fix code in `Normalize Prospects` + `Collect All Prospects` retained
  in production (the reducer-fix is the deliverable).

agentic-systems re-reads the surface independently and decides pass/fail.
References only; self-verification not performed.
