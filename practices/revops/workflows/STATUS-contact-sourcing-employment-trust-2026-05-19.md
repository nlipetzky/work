# Contact Sourcing — Employment-Currency Trust + Capture-Wide (2026-05-19)

Workflow: `bYZ0sAzyUvU60wMZ` ("RevOps — Contact Sourcing + ICP Gate")
Pre-deploy versionId: `b30089a2-82ae-4525-9c1a-dd45ee028a4f`
Post-deploy versionId: `1917c10b-fd33-4382-b5e4-2b67b7ffef6a`
Deploy method: credential-preserving raw REST PUT (`settings` stripped to `{executionOrder}`). Inactive.

## References (machine-checkable only)

Read-back (raw GET, post-PUT): PUT 200, READBACK 200, active=false, 23 nodes,
22 connection keys, 10/10 credential bindings present (same credential IDs as
pre-deploy). Patched node jsCode lengths/sha:
- `f31e4503` Email + Employer Verify — len 1118 sha 5bdbb54a804a
- `36773da5` Apply LinkedIn Result — len 4455 sha 2da9c2742c61
- `d20246e3` Normalize Prospects — len 3370 sha e1c22b79c1e4
- `f89be51b` Apply Email Verify — len 1351 sha 6b469f34a1dd
- `ab2306af` Prepare Contacts Upsert — len 2922 sha c85126b82ebf

Airtable Contacts table `tblWJksRL1yKSUgrm` (base `appYBYH3aOHhTODAw`) fields created:
- `Person Key` = `fldJjssF4hqM2O55A` (singleLineText)
- `Employment Verification Status` = `fld3wmNLzIXdnsgpe` (singleSelect; choices: Employed (current, verified) / Not currently employed / Employer unconfirmed / No signal)
- `Raw Provider Payloads` = `fldW06P1crsdY2DUZ` (multilineText)
Opt-out reuses existing `DNC / Opt-Out (Email)` = `fldnAfHjhPtQDUDPN` (checkbox).

Existing MeiraGTx people in `tblWJksRL1yKSUgrm`: 5 records, one per person (no
duplicates present at deploy time — prior "8 rows/3 stale dups" already cleaned
in a prior session). `Person Key` backfilled on all 5 (= normalized LinkedIn
URL, same rule the workflow now computes):
- rec3aJipKk2uNGfHg Christine Sheehy
- recHC8u2mAhl3bU1s Jeffrey Biss
- recV2Iw7UUx5euUHn (name "Zandy Forbes" / email melinda.zech@ — pre-existing name/email mismatch, out of scope)
- recWERHGXgIRbzPAT Girish Chitnis (regression-oracle subject)
- reck5Bpd9wdFf1tpX Robert Wollin

## What each item changed (code is the deliverable; see live workflow)

1. Capture-wide: `rawExplorium` (Normalize Prospects), `rawApollo` (Email +
   Employer Verify), `rawLinkedin` (Apply LinkedIn Result), `rawHunter` (Apply
   Email Verify); written to `Raw Provider Payloads` (JSON, ≤90KB).
2. Employment currency: provider agreement no longer sets `employerConfirmed`;
   `needsLiCheck` is always true (LinkedIn currency runs even when
   Explorium+Apollo agree); `employerConfirmed` true only on a CURRENT
   LinkedIn position at the target; start/end/tenure captured.
3. `Employment Verification Status` written with honest states; no record reads
   confirmed without a current-position signal.
4. Upsert re-keyed `fieldsToMergeOn: ['Person Key']` (was `['Email']`);
   existing 5 rows backfilled so re-runs update in place.
5. `DNC / Opt-Out (Email)` written on every contact (explicit boolean, never
   silently absent; true on a provider DNC signal).

## Bounded run — exec 80831 (manual, draft 1917c10b)

Nick authorized same-session. Read Target Companies confirmed bounded: exactly
1 row matches `Outreach Eligible=1 AND Explorium Business ID present` =
MeiraGTx, LLC rec7qaGedk0dmOON3. exec 80831 success, 20:07:59→20:08:40Z.

Per-node items (from exec 80831 runData): Build Sourcing Plan 1; Explorium
Fetch/Profiles/Contacts 1; Normalize Prospects 5; Collect All Prospects 5;
Apollo People Match 5; Email + Employer Verify 5; Needs LinkedIn Tiebreak? 5;
**Apify LinkedIn Verify 5→4**; Apply LinkedIn Result 4; LI Resolved 4; Hunter
4; Apply Email Verify 4; Residual ICP Score 4; Apply Score + Map 4; Prepare
Contacts Upsert 1; Upsert Contacts to Airtable 1. No node errors; no
top-level error. Contacts table still 5 rows (Person Key merge updated in
place — no new duplicates).

### Two load-bearing findings (references; not a pass/fail call)

F1 — DoD1 decisive oracle NOT met on surface. Girish Chitnis
recWERHGXgIRbzPAT still reads `Employer Match Confirmed = true`,
`Employment Verification Status` empty, Last Enriched At 2026-05-19T19:09:22Z
(a PRIOR run, not 80831). Cause from runData: he is the item silently dropped
at `Apify LinkedIn Verify` (input 5, output 4; dropped = Girish Chitnis,
provMatch=1). Apify returned 0 dataset items for his profile URL → the
httpRequest node emits no item for him → he never reaches Apply LinkedIn
Result / upsert → his stale confirmed=true survives. Same silent-drop /
stale-agreement disease the ticket targets, relocated to the Apify node.

F2 — LinkedIn currency signal not actually parsed. For the 4 that reached
Apply LinkedIn Result, `linkedinValid=false` for all → the parser found no
firstName/lastName/linkedinUrl/experience in the harvestapi response shape.
All 4 fall through to `Employment Verification Status = "Employer unconfirmed"`
by default, not by a real current-position determination. Item 2/3's currency
verdict is therefore not yet genuine (a departed person and a current employee
both read "Employer unconfirmed"). Raw payload IS now persisted
(`Raw Provider Payloads`) so the actual shape is inspectable and should drive
the parser.

### Spec/oracle contradiction — escalated, then F1+F2 approved by Nick

Nick approved F1 + F2. Both fixed in ONE node (no node added, no rewiring):
`Apply LinkedIn Result` (36773da5) converted to `runOnceForAllItems` and
rewritten as a JOIN over `$('Email + Employer Verify').all()` ×
`$('Apify LinkedIn Verify').all()` (matched by LinkedIn id / publicIdentifier
/ url). It emits exactly one item per prospect (no Apify-empty drop) and
parses the real harvestapi shape (`currentPosition[].companyName` +
`endDate:{text:"Present"}`) for a genuine current-employment verdict.

Redeploy: pre `1917c10b...` → post versionId
`440383e0-06af-42a1-a776-528391ff31fd`. PUT 200, READBACK 200, active=false,
23 nodes, 22 conn keys, 10/10 credential bindings present. Apply LinkedIn
Result mode=runOnceForAllItems, jsCode len 4348 sha 3ad449286cc7.

## Re-run — exec 80832 (manual, draft 440383e0)

Success, 20:18:08→20:18:52Z. Per-node items from 80832 runData: Email +
Employer Verify 5; Needs LinkedIn Tiebreak? 5; Apify LinkedIn Verify 5; Apply
LinkedIn Result 5; LI Resolved 5; Hunter 5; Apply Email Verify 5; Residual ICP
Score 5; Apply Score + Map 5; Prepare Contacts Upsert 1 (5 records); Upsert
Contacts to Airtable 1. No node errors. No 5→4 drop.

### Surface (Contacts tblWJksRL1yKSUgrm, 5 rows, all lastEnr 2026-05-19T20:18:51Z)

- recWERHGXgIRbzPAT Girish Chitnis — `Employer Match Confirmed`=false,
  `Employment Verification Status`="Not currently employed", Source
  Confirmation Count=1, Enrichment Status=employer_unconfirmed, Raw Provider
  Payloads len 42689. (DoD1 regression oracle.)
- rec3aJipKk2uNGfHg Christine Sheehy — confirmed=true, "Employed (current,
  verified)", src=3, tenure=115, raw 24549.
- recHC8u2mAhl3bU1s Jeffrey Biss — confirmed=true, "Employed (current,
  verified)", src=3, tenure=48, raw 40366.
- reck5Bpd9wdFf1tpX Robert Wollin — confirmed=true, "Employed (current,
  verified)", src=3, tenure=81, raw 31349.
- recV2Iw7UUx5euUHn Zandy Forbes — confirmed=true, "Employed (current,
  verified)", src=3, tenure=133, raw 27416.
- `DNC / Opt-Out (Email)`=false written on all 5. totalRecordCount=5 (one
  row per person; Person Key merge updated in place — no new duplicates).

### Residual (documented, out-of-scope topology)

The F1 join makes the silent drop structurally impossible WHEN Apify returns
≥1 item (`Apply LinkedIn Result` rebuilds from the full prospect set). If
`Apify LinkedIn Verify` returned 0 items for ALL inputs, the Code node would
not execute (no input) and all prospects would drop — eliminating that needs
an edge/topology change, which is out of ticket scope. In exec 80832 Apify
returned 5/5.

agentic-systems re-reads the surface independently and decides pass/fail
against the 5 DoD. Self-verification not performed.
