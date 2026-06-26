# Audit: Teknova Outreach Companies table

**Base:** `appFoLY6hjroyA2KW` (Teknova Outreach)
**Table:** `tblmd04rMsw3GE3pK` (Companies)
**Total fields:** ~90
**Audited against:** [revops-architecture-spec.md](/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md)

## Headline

The base already has a Signals table (`tbl1kg8oxubRlWtwL`) and a `Signals` link field on Companies. Most of the cleanup is removing duplicate signal representations that predate that table.

## ADD

Five fields, all small. None are dependent on other changes.

| Field | Type | Purpose |
|---|---|---|
| `Source Play` | singleSelect: `teknova-aav` | Tracks which play this company arrived via. Adds options when future plays exist. Lets the landing filter know which play context to apply. |
| `Scope Status` | singleSelect: `active`, `removed-from-scope` | Required for the "never delete, mark out-of-scope" pattern in the spec. The mover writes `removed-from-scope` when the Surface stamp flips false. Default `active`. |
| `Surface Company ID` | singleLineText | Stable join key back to RevOps Surface Companies. Written by the mover on first upsert. Enables clean re-upserts independent of name/domain drift. |
| `Strong Signal Count` | count or number | Count of linked Signals where `Signal Quality = strong`. Drives "do we have anything to act on" at-a-glance. Can be a rollup on the Signals link. |
| `Top Signal Headlines` | multilineText | Optional. Denormalized concat of the top 1-3 strong signal headlines. Only needed if the CSV-to-Ellie workflow continues; skip if review moves into Airtable directly. |

## REMOVE — definite

These are now redundant because Signals table exists.

| Field | Why |
|---|---|
| `Best Evidence` | Event-level content. Lives in Signals' `Translated Headline` now. |
| `Sample Intervention Name` | Event-level. Captured in Signals body. |
| `AAV Event Sources` | Aggregation of providers across events. The Signals table already carries `Source` per row. |
| `Hard Filters Pass` | Row's existence on this base IS the pass signal. The mover gates upstream. |

## REMOVE — legacy signal scaffolding

All of these duplicate what the Signals table now holds as rows. They'll drift out of sync the moment the new translator/mover starts writing Signals.

| Field | Why |
|---|---|
| `Signal: Recent Funding` | Signals table has Signal Type = funding. |
| `Signal: Hiring` | Signals table covers. |
| `Signal: IND Filing` | Signals table covers. |
| `Signal: Conference` | Signals table covers. |
| `Signal: Publication` | Signals table covers. |
| `Signal: Clinical Stage` | Signals table covers. |
| `Signal: Phase Transition` | Signals table covers. |
| `Signal: Facility Expansion` | Signals table covers. |
| `Active Signals` (multilineText) | Free-text summary of signals. Replaced by the Signals link + rollups. |
| `Fit Score (0-100)` | Composite score from the 8 signal booleans above. Without the booleans, no source. Rebuild from Signals table if scoring matters. |

## REMOVE — Supabase mirror fields

These duplicate data that already lives in RevOps Surface Companies. Under the new architecture, the Surface is the source of truth — the client base should not mirror Surface-side enrichment fields. The mover should write only the fields needed for outreach review.

| Field | Source on Surface |
|---|---|
| `Funding Event` | `funding_event` on Surface |
| `IND / Stage Advance` | `ind_or_stage_advance` |
| `Leadership Hire` | `leadership_hire` |
| `Recent Publication` | `recent_publication` |
| `Conference Presence` | `conference_presence` |
| `Modality Confirmed` | Surface enrichment |
| `Modality Source` | Surface enrichment |
| `Company Type (Primary)` | Surface enrichment |
| `Company Status` | Surface enrichment |
| `SF Engagement Status` | duplicates `Active BD Engagement` |
| `Customer Status (Enrichment)` | duplicates `Customer Status` |
| `Enrichment Status` | Surface-side operational state |
| `Enrichment Failed Check` | Surface-side operational state |
| `Company Score` | Surface-side composite |

Caveat: if any of these are *actively read* by downstream automations on the Teknova base, removing them will break those. Worth a `grep` of the current Airtable automations and views before deleting.

## RESOLVE — duplicates

Pick one of each pair, delete the other.

| Pair | Recommended keeper |
|---|---|
| `Clinical Stage` (singleLineText) vs `Most Advanced Phase` (singleSelect) | `Most Advanced Phase`. Structured beats free text. |
| `Development Stage` (singleLineText) vs `Most Advanced Phase` | `Most Advanced Phase`. |
| `Subsidiary Parent` vs `Ultimate Parent` | `Ultimate Parent`. Broader scope. |
| `Company Type` (multipleSelects) vs `Company Type (Primary)` (singleSelect) | `Company Type` (multi). Companies span types (Lonza = CDMO + Biotech). |
| `Customer Status` vs `Customer Status (Enrichment)` | `Customer Status`. SF-mirrored is closer to truth. |
| `AAV Program Confirmed` + `AAV Program Source` vs `Verification Verdict` | `Verification Verdict`. The newer field family is richer; the legacy pair can deprecate. |

## REMOVE — legacy operational fields

Likely dead from prior architecture attempts.

| Field | Why |
|---|---|
| `Play Eligibility Status` | Gate field from old framework. Mover handles gating now. |
| `Exclusion Reason` | Paired with above. |
| `Segments` (singleLineText) | "Segments" concept was replaced by "Plays" per the Plays table description. |
| `Provenance Flags` | Import-time flags from prior import flow. Verify if still written. |
| `Review Status` | Overlaps with `Verification Verdict` and `Canonical Status`. |

## KEEP — core identity, SF, taxonomy, reviewer

These are the spine. No changes.

- Identity: `Company Name`, `Website Domain`, `Country`, `HQ State`, `Employee Count`, `Industry`, `Company LinkedIn URL`, `Ticker`, `Subsidiary` flag
- Firmographics: `Recent Funding`, `Funding Context`, `Funded Recently`, `Funding Stage`, `Last Funding Amount`, `Total Funding`, `Last Funding Date`, `Company Tier / Size`, `Company Stage`
- SF: `SF Sync Action`, `SF Last Synced`, `SF Record ID`, `Salesforce Account ID`, `In SF`, `SF Account Owner`, `SF Account Type`, `Open Opp Next Step`, `SF Activity Summary`, `Active SF Opportunity`, `SF Opportunity Stage`, `Customer Status`, `Active BD Engagement`, `Last Contacted Date`, `Complaint History`
- AAV taxonomy: `Verification Verdict`, `AAV Segment`, `Canonical Status`, `Primary Modality`, `Secondary Modalities`, `Delivery Vector`, `Pipeline / Indication`, `Most Advanced Phase`, `Lead Indication`, `Ultimate Parent`
- Event summary counters: `AAV Positive Event Count`, `Most Recent AAV Event Date`
- Signals link: `Signals` (link to Signals table)
- Reviewer: `Ellie Verdict`, `Ellie Bucket`, `Ellie Note`, `Ellie Reviewed At`
- Engagement state: `Active Contacts`, `Company (Linked Contacts)`, `In Cadence Count`, `Already Engaged Count`, `TAM Note`, `DNC / Opt-Out`
- Operational: `Last Enriched At`, `Data Freshness Status`, `Field Source Log`, `Email Domain`, `LinkedIn Domain Mismatch`, `created`
- Briefing: `Company Brief`, `Brief Generated At`, `Product Recommendation`, `Product Rec. Reasoning`
- Approved facts: `Approved Stats`

## Open questions for Nick

1. **Top Signal Headlines rollup field.** Keep the CSV workflow to Ellie, or move review into Airtable directly? Decision determines whether to add that denormalized field.
2. **Strong Signal Count.** Should this be a true Airtable `count` on the linked Signals (filtered by `Signal Quality = strong`), or a number written by an automation? Airtable's native count doesn't filter by linked-record values; a rollup with conditional formula does.
3. **Supabase mirror fields.** Confirm none are actively read by Teknova-side automations before deleting. The risk is silent breakage. Worth a 5-minute scan of automations and views.
4. **AAV Program Confirmed / AAV Program Source.** These predate `Verification Verdict`. Safe to delete or are they still being written by anything?
