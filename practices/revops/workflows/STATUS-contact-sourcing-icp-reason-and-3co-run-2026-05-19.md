# Contact Sourcing — ICP Reason persisted + 3-company diagnostic (2026-05-19)

Workflow: `bYZ0sAzyUvU60wMZ`.
Pre-session versionId: `440383e0-06af-42a1-a776-528391ff31fd`.
Post-deploy versionId (selective run): `84eae071-7c27-483a-a2ad-991d1bea1d55`.
Post-restore versionId (production): `17944090-5ddb-49c4-a10f-bc0363ccf32c`.
10/10 credential bindings preserved across both PUTs. 23 nodes, 22 conn keys.

## Item 1 — ICP Score Reason persisted (deployed and retained)

Airtable Contacts `tblWJksRL1yKSUgrm` field created: `ICP Score Reason` =
`fldRUrGtI53qOkMWU` (multilineText). `Apply Score + Map` already emitted
`icpReason`; `Prepare Contacts Upsert` was patched to write
`'ICP Score Reason': d.icpReason || ''` for every row that reaches upsert
(pass or fail). This change REMAINS in the restored production workflow
(only the selective filterByFormula was reverted).

## Item 2 — Bounded 3-company diagnostic (exec 80833)

Preconditions:
- All 3 companies exist in `tblnj3YlOI3thjrXp`.
- Domains: Solid Biosciences `solidbio.com` (rec1QsWki22Ne2Wtl); Voyager
  `voyagertherapeutics.com` (recITaZ11Ot0ztV90); Lexeo `lexeotx.com`
  (recQK2eCNVTSguA1r).
- Explorium Business IDs: Solid `b95e2ed664e5130d6c179ff15535f3bf`; Voyager
  `cb324be64b013f15d0928dc4688e0d2f`; Lexeo `188cde7f29bb6f7fb80c8b62aa15c5af`
  (Lexeo's was missing; Nick authorized resolution via Explorium
  `match-business` (0 credits) and write to recQK2eCNVTSguA1r before run).

Scoping: Read Target Companies filterByFormula temporarily swapped to
`AND({Run Selected}=1, {Explorium Business ID}&''!='')`. Three pre-session
Run Selected=TRUE rows (Abeona, BioMarin, PTC) were cleared for the run and
restored after. Live read confirmed exactly 3 rows matched the selective
filter before the run.

Execution `80833` (manual, draft 84eae071, success, 21:16:05→21:17:10Z, 65s).
Per-node items from 80833 runData:
- Read Target Companies 3; Build Sourcing Plan 3 (all 3 companies emitted
  with their domains + biz ids).
- Loop Companies 4r/15i; Explorium Fetch/Profiles/Contacts 3r/3i each;
  Normalize Prospects 3r/15i (Solid 5 + Voyager 5 + Lexeo 5).
- **`Collect All Prospects` 1r/5i — reduces 15 → 5.**
- Everything downstream 5 (Lexeo only): Apollo, Email + Employer Verify,
  Apify LinkedIn Verify, Apply LinkedIn Result, LI Resolved, Hunter, Apply
  Email Verify, Residual ICP Score, Apply Score + Map.
- Prepare Contacts Upsert 1 batch / 5 records; Upsert 1 PATCH.

### Decisive question answered

**Can this workflow yield an ICP-qualified contact (≥60) with a visible
reason?** Yes — for the company that actually reached scoring. 2 of 5 scored
contacts at Lexeo scored ≥60, both with persisted reasons:
- rec0mcPxrGd3TGSB7 Paul McCormac, CTO — ICP Score **85**, status
  enrichment_complete, employment Employed (current, verified). Reason
  persisted (`fldRUrGtI53qOkMWU`).
- recuRRkOxDa5j0kCU José Manuel (manny) Otero, CTO — ICP Score **85**,
  status enrichment_complete, employment Employed (current, verified). Reason
  persisted.

Other 3 Lexeo (refs): rec8gNCerVKZqwBIu Eric Adler CMO score 5
employer_unconfirmed; recypO0jlHq93s1Wx Nolan Townsend CEO 0 icp_filtered_out;
recaJ2Gdhf39nBFuh Narinder Bhalla CMO 15 icp_filtered_out. All carry
`ICP Score Reason`.

### Spec/oracle escalation — Collect All Prospects silent reducer

**Voyager Therapeutics and Solid Biosciences sourced 5 prospects each from
Explorium and reached `Normalize Prospects` (3r/15i total), but 0 of their
prospects reached scoring/upsert.** All 10 of their prospects vanished at
`Collect All Prospects`, which emits 1 run with 5 items (Lexeo only). Root
cause (from the node code): it calls `$('Normalize Prospects').all()` from
outside the SplitInBatches loop; in n8n, `.all()` on a node that ran multiple
times returns a single run's items, not the union — so two of the three
companies are silently discarded. Single-company runs (MeiraGTx) masked this.

This is out of the ticket's stated scope ("no merge-topology, no sourcing-
query redesign"). Surfaced as a load-bearing reference, not built through:
the 3-company diagnostic's answer for Voyager / Solid is "untested" because
their prospects never reached the scorer. The ticket's decisive question is
answered for Lexeo; for Voyager and Solid, this collection defect must be
fixed before the diagnostic can be re-evaluated against them.

## Restore

Production state restored:
- Workflow filterByFormula reverted to
  `AND({Outreach Eligible}=1, {Explorium Business ID}&''!='')`.
- Run Selected cleared on the 3 targets (Voyager/Solid/Lexeo).
- Run Selected re-toggled to TRUE on the 3 pre-session rows (Abeona,
  BioMarin, PTC). Final live read shows 6 rows with Run Selected=TRUE total:
  Abeona, BioMarin, PTC (re-restored) + GenSight, Biogen, eyeDNA (pre-session
  state, never touched; lack Explorium Business ID so don't affect prod runs).
- Lexeo's newly-written Explorium Business ID is retained (per session
  authorization; not session-temporary).
- Item 1 code patch (ICP Score Reason mapping in Prepare Contacts Upsert)
  retained in production.

agentic-systems independently re-reads the surface; pass/fail not asserted
here. References only.
