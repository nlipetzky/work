# Clay Workflow ... KAI Internal Medical Device Robotics (v0)

**Artifact type:** Clay workflow blueprint
**Play:** KAI Internal ... Medical Device Robotics (Playbook row `recRndspri0mfqsCT`)
**Version:** v0
**Status:** Draft (pending Nick to click through Clay UI)
**Owner:** Nick Lipetzky
**Created:** 2026-05-27
**Companion artifacts:**
- ICP titles: `kai-internal-icp-titles-v0-2026-05-26.md`
- Play definition: `kai-internal-play-medical-device-robotics-v0-2026-05-26.md`
- Trajectory: `kai-internal-trajectory-v0-2026-05-26.md`

---

## What this builds

One Clay workbook, two tables. Surfaces 200-300 medical device robotics companies, finds Tier A contacts at each, hands the contacts directly to a HeyReach campaign on Will's personal LinkedIn account. No Supabase callback, no custom infrastructure ... pure Clay + HeyReach for v0.

Build time estimate: 30-45 minutes of UI clicks if HeyReach API key is in hand.

## Workbook structure

```
Workbook: "KAI Internal ... Medical Device Robotics"

  Table 1: Companies
    Source: Find Companies (Clay List Builder)
    Filters: medical device industry + robotics keyword + NA + revenue + size
    Enrichment: Find People at Company (Tier A titles)
    Action: Send Table Data → Contacts table

  Table 2: Contacts
    Source: Send Table Data from Companies (expands the people list)
    Action: HeyReach "Add Lead to Campaign"
```

## Table 1: Companies ... configuration

### Source: Find Companies (List Builder)

In Clay UI: New table → Find Companies → set filters.

**Filters:**

| Filter | Value |
|---|---|
| Industry | "Medical Devices" + "Medical Equipment Manufacturing" (LinkedIn industry); if Clay's source allows multi-industry select, also try "Hospital & Health Care" with keyword narrowing |
| Keyword | "robotic" or "robotics" (in company description or website) |
| Headquarters country | United States, Canada |
| Revenue | $10M ... $100M |
| Headcount | 25 ... 300 (sanity floor and ceiling for the revenue band) |
| Exclude | Companies with "law", "legal", "RPA", "robotic process automation" in name or description |

**Notes:**
- Clay's "Find Companies" is powered by Apollo and other Clay-curated data; the exact filter UI names may vary slightly. Use the closest match.
- Revenue and headcount filters often have null values for private companies. Relax the filter to include nulls (i.e., "Revenue $10M-$100M OR Unknown") rather than excluding them ... otherwise you lose 30-50% of the universe.

### Passthrough columns to add manually

After Find Companies populates rows, add these as plain Text columns (will be empty until populated by you or Send Table Data):

- `play_id` ... value: `kai-internal-medical-device-robotics`
- `sourcing_run_id` ... value: `2026-05-27-v0-clay-initial`

Purpose: lineage. Every contact eventually written to the Airtable Prospects table at `app5tsy6zjfA8H3rx` (or directly into HeyReach) carries these so we can trace which run produced which lead.

### Enrichment column: Find People at Company

`+ Add column` → search "Find People at Company".

**Inputs:**
- Company name → `company_name` column
- Company domain → `company_domain` column

**Config:**
- Number of results per company: 3 (start small; up to 5 if reply rate is low)
- Title filters (include any of):
  - Founder, Co-Founder
  - CEO, Chief Executive Officer
  - President
  - Chief Commercial Officer, CCO
  - VP Sales, VP of Sales, SVP Sales, Senior VP Sales
- Title filters (exclude):
  - CTO, Chief Technology Officer
  - VP Engineering, Engineering
  - VP R&D, R&D
  - VP Product, Product Management
  - Chief Medical Officer, CMO
  - VP Regulatory, Regulatory
  - VP Clinical, Clinical
- Geography: same as company (NA)
- Only run if: `company_domain is not empty`

This returns the Tier A primary set from the ICP titles artifact. If Tier A is blank at a company, leave it blank for v0 (don't fall back to Tier B yet ... cleaner test data on the lowest-friction segment first).

### Action column: Send Table Data → Contacts

`+ Add column` → "Send Table Data".

**Config:**
- Destination table: `Contacts` (create new)
- List column to expand: `Find People at Company` (this is what makes 1 row become N rows)
- Field mapping:
  - From people list: `first_name`, `last_name`, `email`, `title`, `linkedin_url`
  - Passthrough from company row: `company_name`, `company_domain`, `play_id`, `sourcing_run_id`
- Only run if: `Find People at Company is not empty`

## Table 2: Contacts ... configuration

Created automatically by the Send Table Data action above. Each row = one contact.

### HeyReach action column

`+ Add column` → search "HeyReach" → select "Add Lead to Campaign".

**Setup (one-time):**
- Manage accounts → Add connection → paste HeyReach API key (HeyReach UI: Integrations → HeyReach API → Generate)
- Select target campaign: must be ACTIVE (not DRAFT). If it's DRAFT, add a sender + activate before running.

**Field mapping:**

| Clay column | HeyReach field |
|---|---|
| `first_name` | First Name |
| `last_name` | Last Name |
| `linkedin_url` | LinkedIn URL |
| `email` | Email (best-effort; HeyReach can run LinkedIn-only) |
| `company_name` | Company |
| `title` | Position |

**Only run if:** `linkedin_url is not empty` (HeyReach needs the profile URL).

### HeyReach campaign requirements (Nick to confirm)

Before this column runs, the target HeyReach campaign needs:

1. **Status: ACTIVE** (not DRAFT)
2. **Sender:** Will's personal LinkedIn account (already active in HeyReach per prior sessions)
3. **Sequence drafted:** v0 cold messaging. (Separate artifact ... copy draft goes here when ready: `clay-heyreach-copy-v0-2026-05-27.md` or similar.)

## Credit estimate

Rough math for 200 companies surfaced:

| Action | Per-row credit | Rows | Subtotal |
|---|---|---|---|
| Find Companies | ~0.5 credit (varies) | 200 | ~100 credits |
| Find People at Company | 1 credit × ~3 people | 200 | ~600 credits |
| Send Table Data | free | 600 | 0 |
| HeyReach action | free | 600 | 0 |
| **Total** | | | **~700 credits** |

Adjust upward if you want 300 companies and 5 contacts each (~1500 credits). If you have "a ton of credits," well within budget.

## What Nick clicks (in order)

1. Open Clay → New workbook → name it "KAI Internal ... Medical Device Robotics"
2. New table → Find Companies → set filters per above → name table "Companies"
3. Run once to populate ~50 rows as a sanity check. Verify the filter is hitting actual robotics companies (not RPA, not law firms, not enterprise).
4. If sanity check passes: re-run with larger page size or remove the page cap to pull the full ~200-300 universe.
5. Add the two passthrough Text columns; manually set their values for all rows (Clay has bulk-edit).
6. Add the Find People at Company enrichment column → configure title filters per above → set auto-run OFF for now; manually `Try on 5 rows` first to verify.
7. If People enrichment looks clean: enable auto-run on the column, or run on all rows manually.
8. Add the Send Table Data column → configure mapping → Try on 5 rows.
9. Open the new Contacts table that just appeared. Verify rows landed with all fields populated.
10. In Contacts table: add the HeyReach action column → configure mapping → confirm campaign is ACTIVE → Try on 5 rows.
11. If 5-row test puts contacts into HeyReach successfully: enable auto-run on the HeyReach column.

Total clicks: ~30. Total wait time: depends on Clay's enrichment queue (typically minutes to tens of minutes for ~200 companies).

## What gets verified at the sanity-check step (step 3)

After Find Companies populates the first ~50 rows, eyeball them. Disqualifiers to spot:
- Companies that are clearly RPA vendors (not medical device robotics) ... refine the keyword filter
- Companies > $100M (enterprise leakage) ... tighten the revenue filter
- Companies that are component suppliers, not robot manufacturers ... add an exclusion keyword
- Companies outside North America ... tighten the country filter

If 80%+ of the first 50 rows look on-target, proceed. If less than 50% look right, iterate filters before scaling to 200.

## Hand-off to the next step

When this workflow completes:
- Contacts table populated with Tier A contacts at medical device robotics companies
- HeyReach campaign has new leads queued

Next artifact needed: cold copy v0 (HeyReach sequence content). Will is the sender; copy pulls from SME Voice + Hot Takes + Identity artifacts. Routes through Hermes for approval before going live.

## What's NOT in this workflow

- Email enrichment beyond what Find People at Company natively provides (no Hunter waterfall yet for v0; LinkedIn-only sequencing acceptable)
- Domain-level email warming (separate workstream; Nick owns)
- Supabase callback (no revops-engine ingestion for v0; HeyReach is the system of record for initial test cohort)
- Tier B title fallback (v0 is Tier A only)
- Sub-segment splitting (v0 runs all robotics sub-categories flat; sub-segment decision is data-led after initial 50-row sanity check)

## How this artifact evolves

- After the first 50-row sanity check, this doc gets updated with the actual filter values that produced clean results (vs. the v0 guesses above).
- After the first batch of HeyReach replies, the Find People at Company title filter may need adjustment (e.g., if CCOs respond better than founders, weight Tier A toward CCOs at next batch).
- When a second segment or sub-segment is added, this artifact forks: this one becomes the medical-device-robotics-specific workflow; the new one is the analog for the new segment.

## Open items needing your decision

1. **HeyReach campaign status.** Confirm one is ACTIVE on Will's account, or stand one up before step 10.
2. **Copy draft.** I haven't drafted the HeyReach sequence content yet. That's the next artifact after this workflow runs successfully through step 9.
3. **Sub-segment hold or split.** v0 runs all robotics sub-categories flat. If you want to pre-split (surgical first), say so before step 2; the filter changes minimally.
