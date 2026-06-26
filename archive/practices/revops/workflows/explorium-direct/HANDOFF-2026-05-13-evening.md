# Handoff: AAV play state after Ellie feedback + Jenn cadence pushback
**Date:** 2026-05-13 (evening)
**Pick up from:** `practices/revops/workflows/explorium-direct/`
**Previous handoff:** `HANDOFF-enrichment-resume-2026-05-13.md` (earlier today)

---

## First action in the new session

**Execute the approved plan at `/Users/nplmini/.claude/plans/write-a-plan-to-sharded-peach.md`.**

The plan was approved during plan mode this evening. Five actions in this order:

1. Ingest Ellie's 18 missing companies (from `/Users/nplmini/Downloads/Missing_NA_AAV_Companies_2026.05.13.xlsx - Missing NA AAV Companies.csv`) into Airtable Companies table.
2. Add `AAV Segment` singleSelect field (`gene_therapy`, `production_tool`, `both`, `unknown`) + classifier logic to `node-map-enriched-fields.js`.
3. Add three Ellie review UX fields: `Ellie Segment Override` (singleSelect), `Ellie Note` (multilineText), `Ellie Reviewed At` (date).
4. Investigate CT.gov L1 capture recall: why didn't Sarepta, Taysha, Atsena, Astellas Gene Therapies, PTC, Passage Bio, Encoded, Abeona, Alexion/LogicBio surface? Read-only investigation, written diagnosis, fix deferred.
5. Outline the next sourcing layer (ASGCT exhibitor directory, USPTO patent classifications, ARM Atlas, PubMed) at `aav-sourcing-layer-roadmap.md`.

Pre-conditions before running anything credit-spending: explicit Nick approval same-session per `feedback_no_autonomous_budget_actions.md`.

---

## Commitments to Teknova (active)

These are the deliverables surfaced in the two draft emails. Track these as the next-week scope.

### From the email to Ellie (drafted, not sent yet at session end)

File: `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/email-to-ellie-2026-05-13.md`

- **AAV Segment field** populated on every confirmed AAV record, auto-classified into Gene Therapy / Production Tool / Both, with known CDMOs defaulting to production_tool.
- **Ingest of the 18 missing companies** from her spreadsheet, pre-segmented per her annotations, run through firmographic enrichment.
- **Click-driven review UX** in Airtable (AAV Segment Override, Ellie Note, Ellie Reviewed At) replacing rules-doc markup.
- **Written diagnosis** of why clinicaltrials.gov sourcing missed Sarepta and the other recall misses.
- **Roadmap** of the next four sources (ASGCT, USPTO patents, ARM Atlas, PubMed) in priority order.
- **Running the new batch over the next day** — explicit timing commitment.
- **Richer enrichment per confirmed AAV record**: funding history, parent and ultimate-parent, key competitors, strategic narrative summary, ticker, SEC CIK.

### From the email to Jenn (drafted, not sent yet at session end)

File: `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/email-to-jenn-2026-05-13.md`

End-of-month outcomes she asked for, with how each maps to what we're building:

- **"95% of contacts solid"** reframed to the Cohort Quality framework's Tier A bar at both scopes. Commitment is to the framework rigor, not a Tier A volume number.
- **SF activity overlay**: field structure already in Companies table (SF Has Open Opp, SF Has Closed Won, Last Account-Level Contact Date, Account-Level DNC). Sync layer roadmapped, sequenced after AAV play proves pipeline.
- **Air-traffic control**: framework's "no active outbound cadence on this channel" suppression check handles per-contact piece. Cross-campaign visibility layer to be built after AAV play.

Operating model proposed:
- Thursday WIP at 30 min (per Jenn's suggestion).
- No second standing meeting. Replace with weekly written progress note + async pings on specific decisions.
- Ellie reviews async in Airtable.
- Christa runs project management async via the workflow itself.

---

## State of the world at session end

### Companies Enrichment workflow (`Z6RROKx5omdfvhtn`)

Heavy refactor this session. Current state:

- **Filter scopes** to specific 10 record IDs (test cohort). Will need broadening for production runs.
- **Domain backfill**: Qualify Company now extracts `firm.website` from Explorium and writes back to Airtable Domain field.
- **No-domain handling**: workflow processes records without domains; Match Business matches by name alone for famous biotechs.
- **L2 short-circuit**: Check AAV Modality skips the web-fetch gate when `Verification Status` is `surfaced` or `borderline`. Records hit `enrichment_complete` via `l2_classify_trial_evidence` source, get full Enrich Deep.
- **Deep enrichment captured**: Map Enriched Fields writes 10 new fields from Enrich Deep output.
- **4 derivable fields populated**: Delivery Vehicle (from Custom Classification), Publicly Traded (from Stock Ticker), Subsidiary Status (from Parent / Ultimate Parent). Therapeutic Modality intentionally skipped (not reliably derivable for AAV — Sangamo uses AAV for Gene Editing, not Gene Replacement).

### Test cohort results (10 records)

Execution `69663` ran with the deep enrichment code change but I did not verify those results in Airtable at session end. **First verification step in new session**: spot-check 1-2 records (suggest BioMarin `recY72bz59KCI03nG` and Solid Bio `rec1QsWki22Ne2Wtl`) to confirm the new fields populated.

Previous execution `69598` (with L2 short-circuit but before deep enrichment) results:
- **7 enrichment_complete**: Solid Biosciences, YAP Therapeutics, Tenaya, Spark, Ultragenyx, BioMarin, Precision BioSciences. All via `l2_classify_trial_evidence` source.
- **3 archived_out_of_industry**: MavriX Bio (wrong Explorium entity — `mavrixdata.com`), Adrenas Therapeutics (no Explorium match), Novartis Gene Therapies (matched Swiss parent).

### Airtable schema state

13 new fields added to Companies table today. By creation order:

Earlier today (in prior session): `Workflow ID`, `Execution ID`, `Records In`, `Records Out` on Enrichment Runs table.

This session (deep enrichment fields on Companies):
- `Deep Enrichment Raw` (fld4ucRmdEQ5YOwOx) — multilineText
- `Last Funding Date` (fld5xjxTLdXbMq732) — date
- `Last Funding Amount USD` (fldDriSe5pI5Vnm9Q) — currency
- `Total Known Funding USD` (fldo5jm8DcDwaEgoZ) — currency
- `Number of Funding Rounds` (fld0LYxPjPF6AqXcO) — number
- `Ultimate Parent` (fldlC5dnpXJrZfji0) — singleLineText
- `SEC CIK` (fldYT2zU4RIJ1MfJ4) — singleLineText
- `Key Competitors` (fldUrVkBwqWrm0m1W) — multilineText
- `Company Focus` (fldpNlGGpANQD4Q1v) — multilineText
- `Strategic Notes` (fldT8046jhJMwofe1) — multilineText

Still to create per the plan:
- `AAV Segment` (singleSelect: gene_therapy, production_tool, both, unknown)
- `Ellie Segment Override` (singleSelect: Gene Therapy, Production Tool, Both, Not AAV, Not Sure)
- `Ellie Note` (multilineText)
- `Ellie Reviewed At` (date)
- New choice `manual_ellie_feedback` on existing `Discovery Sources` field (fldTCsyrnKMIPu6IQ)

User is handling field deletions for the legacy cleanup independently.

---

## Key identifiers

| Item | Value |
|---|---|
| Airtable base | `appYBYH3aOHhTODAw` |
| Companies table | `tblnj3YlOI3thjrXp` |
| Companies Enrichment workflow | `Z6RROKx5omdfvhtn` |
| CT.gov L1 Capture workflow (investigation target) | `9gcmEjq1lvOY2jZS` |
| L2 Classify workflow | `rXKuqfDwqX7TYzxK` |
| Enrichment Runs table | `tblEVSEqetmu4ScHe` |
| Classification Rules table | `tbl1HFYzezFYs5C3k` |
| Sources table | `tblqjVzI6LRnc2paA` |
| Company Events table | `tblnzX2b2kqNGzW6r` |
| NotebookLM Teknova Events notebook | `6a18ae7c-f596-4dc7-80f2-3c1e0b72575a` |
| Cohort Quality framework | `/Users/nplmini/code/work/practices/revops/cohort-quality-framework.md` |
| Plan to execute | `/Users/nplmini/.claude/plans/write-a-plan-to-sharded-peach.md` |
| 10 test record IDs (filter scope) | rec1QsWki22Ne2Wtl, rec5m1ii3hWnyWYfE, rec6sy4IpY82zDgYo, recA4rY40iqwtNVJP, recPzB5hW1jtW5GB3, recKu9YvJgiqcp1Fw, recSQQ0mBD5jnRJQL, recwzyNrPFNiCEdEE, recNLCX1AueFWE95z, recY72bz59KCI03nG |

---

## Known-CDMO list (for AAV Segment classifier default)

Default to `production_tool`:
- Forge Biologics (override to `both` — also has therapeutic pipeline FBX-101)
- Andelyn Biosciences
- Catalent Cell & Gene Therapy
- Resilience / National Resilience
- Charles River Laboratories (Vigene)
- ProBio
- Thermo Fisher (Brammer Bio)
- Lonza
- AGC Biologics
- AAVnerGene (per ASGCT category "Viral Vector Manufacturing - Adeno-Associated Virus")

---

## Files created this session

- `aav-discovery-client-explainer.md` — client-facing piece on why identifying AAV is hard (referenced in the Ellie email indirectly)
- `companies-table-field-audit.md` — full field-by-field audit of the Companies table
- `email-to-ellie-2026-05-13.md` — response to Ellie's feedback (DRAFTED, NOT SENT)
- `email-to-jenn-2026-05-13.md` — operating model + Cohort Quality reframe (DRAFTED, NOT SENT)
- `node-check-aav-modality.js` — current Check AAV Modality JS, includes L2 short-circuit
- `node-map-enriched-fields.js` — current Map Enriched Fields JS, includes deep enrichment + 4 derivable fields
- `/Users/nplmini/.claude/plans/write-a-plan-to-sharded-peach.md` — approved plan

---

## Open items / decisions deferred

- **Send the two drafted emails.** Nick will send these on his own time; not blocking next-session work.
- **Therapeutic Modality auto-population**: skipped this session. AAV companies do varied therapy types (Gene Replacement vs Gene Editing). Manual or CT.gov-trial-data-derived. Not in current plan.
- **CT.gov L1 recall fix**: plan scopes investigation only. Implementation of the fix is a follow-up after diagnosis.
- **L3 Segment Filter workflow**: not yet built. Reads Classification Rules table, scores against criteria, writes Segment Score and Outreach Eligible. Roadmap item.
- **Cohort Quality scoring workflow**: not yet built. Writes Company Tier, Hard Filters Pass, per the framework. Roadmap item.
- **Salesforce sync layer**: not yet built. Required for SF activity overlay commitment to Jenn.
- **Cross-campaign visibility layer**: not yet built. Required for air-traffic control commitment to Jenn.

---

## Behavioral rules to carry forward

- No autonomous budget actions (no Explorium enrichment runs without explicit same-session approval).
- The workflow IS the deliverable; do not bypass n8n with direct MCP/API data moves.
- Plain English on strategy threads; no schema dumps, no tables of options.
- Show absolute file paths when creating or editing files.
- Stop and report after each substep on multi-step work.
- Never call the Teknova Airtable base "Pearl"; it's "Teknova Outreach."
- Em dashes are forbidden per Nick's global preferences. Use ellipses or periods.
