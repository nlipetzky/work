# HANDOFF: LinkedIn Live Verification Workflow

**Created:** 2026-05-22
**For:** Fresh Claude session, agentic-systems practice
**Originated by:** Nick + Boris
**Prior session context:** `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-revops-engine-evidence-refactor-2026-05-20.md` is unrelated. The relevant session work is captured in this file plus the workflow `0gWOTnVnVs8y1S7L` at https://instig8.app.n8n.cloud/workflow/0gWOTnVnVs8y1S7L.

## Goal

Build a separate n8n workflow that takes contacts already in the Airtable Contacts table, hits live LinkedIn via Apify per contact, compares LinkedIn's current data to what we have stored, and updates Airtable. **LinkedIn live data is the source of truth on conflicts.** Write a human-readable summary of the live current role to a new field called `LinkedIn Verified Live`.

The point: Apollo's data refreshes monthly. People change jobs faster than that. The existing contact-sourcing workflow trusts Apollo. This new workflow exists to keep Airtable current with the actual job state on LinkedIn at verification time.

## Why this is separate, not folded into the sourcing workflow

Two different jobs:
- **Sourcing workflow** (`0gWOTnVnVs8y1S7L`): find net new contacts at a target company. Run when adding companies to outreach.
- **Verification workflow** (this one): re-verify contacts already in the database. Run periodically or on-demand. Doesn't add contacts. Doesn't query Apollo.

Bundling them would make the sourcing workflow slower and more expensive per run. Keep them apart.

## Existing infrastructure to reuse

- **Airtable base:** `appYBYH3aOHhTODAw` (RevOps Surface)
- **Contacts table:** `tblWJksRL1yKSUgrm`
- **n8n instance:** https://instig8.app.n8n.cloud
- **Apify credential:** `apifyApi` — already attached to the sourcing workflow's `Apify LinkedIn Profiles` node. Same credential reusable here.
- **Apify actor:** `harvestapi~linkedin-profile-scraper`
- **Apify endpoint:** `https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items`
- **Apify body format:**
  ```json
  {"queries": ["<linkedin url 1>", "<linkedin url 2>"], "profileScraperMode": "Profile details no email ($4 per 1k)"}
  ```
- **Apify cost:** ~$0.004 per profile. 100 contacts ≈ $0.40.
- **Airtable token credential:** `All KAI Bases` (auto-assigned for native Airtable nodes)

## Apify response schema (confirmed from this session)

Each LinkedIn profile returned by `harvestapi~linkedin-profile-scraper` includes (relevant fields only):

```text
linkedinUrl              "https://www.linkedin.com/in/<slug>"
publicIdentifier         "<slug>"
firstName, lastName
headline                 "Principal Scientist, Purification Process Development at Pfizer"
about                    string or null (LinkedIn About section)
location                 {linkedinText, countryCode, parsed}
currentPosition          Array — most recent active job; field shape includes:
                           companyName, position (= title), location, startDate {year, text}, durationInDays
experience               Array — full job history, same shape as currentPosition
education                Array — {schoolName, degree, fieldOfStudy, startDate {year}, endDate {year}}
certifications           Array — {name, authority}
languages                Array — {name, proficiency}
skills                   Array — {name}
openToWork               boolean — IMPORTANT freshness signal
hiring                   boolean
connectionsCount         number
followerCount            number
```

For verification purposes, the key fields are `currentPosition`, `experience`, `headline`, and `openToWork`.

## Required Airtable fields to create

Before building the workflow, add these fields to the Contacts table (`tblWJksRL1yKSUgrm`):

1. **`LinkedIn Verified Live`** (multilineText)
   Human-readable summary of the live current role at verification time. Format:
   ```text
   <Live Title> at <Live Company> · <Live tenure>
   Headline: <LinkedIn headline>
   Open to work: yes/no
   Verified: <ISO timestamp>
   ```

2. **`LinkedIn Last Verified At`** (dateTime)
   When this verification last ran. Used by the workflow to skip recently-verified contacts.

3. **`LinkedIn Verification Status`** (singleSelect)
   Choices:
   - `Verified` — Apify returned a profile and live data was processed
   - `Stale Match` — Apify returned a profile but live data matches our stored data (no change)
   - `Stale Mismatch` — Apify returned a profile and live data differs from stored. Stored fields were overwritten with live data.
   - `Open to Work` — Apify shows the contact has Open to Work badge. Treat as a strong stale signal.
   - `Not Found` — Apify could not find a profile at the given URL
   - `URL Invalid` — Contact has no LinkedIn URL or URL malformed

4. **`LinkedIn Live Employer`** (singleLineText)
   Live currentPosition company name from LinkedIn. Kept as a separate field so historical Apollo-side `Company Name` is preserved for audit.

5. **`LinkedIn Live Title`** (singleLineText)
   Live currentPosition title from LinkedIn.

6. **`LinkedIn Live Tenure (months)`** (number, precision 0)
   Computed from `currentPosition.startDate` to verification timestamp.

## Architecture

```text
Trigger (Webhook, query param drives behavior)
  ↓
Read Target Contacts (Airtable search)
  → input: query mode = "all", "primary_only", or "single recordId"
  ↓
Filter Contacts (Code)
  → drop any without a LinkedIn URL
  → drop any verified in the last N days (configurable, default 14)
  → emit one item per contact to verify
  ↓
Build Apify Batch (Code)
  → collect LinkedIn URLs into a single batch payload
  ↓
Apify LinkedIn Profiles (HTTP, batched call)
  → POST to harvestapi scraper, returns array of profiles
  ↓
Compare Live vs Stored (Code)
  For each contact in input:
    → find matching live profile by LinkedIn slug
    → if no live profile: status = "Not Found", emit unchanged contact
    → if live profile found:
       compare currentPosition.position vs Title
       compare currentPosition.companyName vs Company Name
       compute live tenure from currentPosition.startDate
       set status = "Stale Mismatch" if any disagree, else "Stale Match"
       set status = "Open to Work" if openToWork true (override above)
       build LinkedIn Verified Live summary string
    → emit contact with live-overridden fields
  ↓
Batch for Airtable Update (Code)
  → group into batches of 10
  → build PATCH payload — only include the verification fields
  → Person Key as merge field (or use record id directly)
  ↓
Patch Contacts (HTTP PATCH to Airtable)
  ↓
Build Verification Run Record (Code)
  → counts: verified, stale matches, stale mismatches, not found, open to work
  → cost: number of Apify calls × $0.004
  ↓
Create Run Record (Airtable, Enrichment Runs table tblEVSEqetmu4ScHe)
```

## Trigger and scope decisions for the builder

These are the open questions. Make a call and document it in the workflow description.

### Trigger style

Three reasonable patterns. Pick one based on how Ellie will actually use it:

1. **Per-contact webhook** — Pass `?recordId=rec...` and verify one contact at a time. Best for "I'm about to email this person, verify them now." Lowest cost per call.
2. **Per-company webhook** — Pass `?companyId=rec...` and verify all contacts at that company. Good for "I'm working Pfizer this week, refresh everyone there."
3. **Scheduled batch** — Cron-triggered, picks up any contact where `LinkedIn Last Verified At` is older than 14 days. Most automated. Highest steady-state cost.

Default recommendation: **build #2 first**. It's the natural unit of work (Ellie thinks in terms of accounts) and bounds Apify cost per run. Add #3 later if needed.

### Which contacts to verify

Two filters:

- **Has a LinkedIn URL.** Drop anyone without one (rare for Apollo-sourced contacts).
- **Not recently verified.** Skip if `LinkedIn Last Verified At` is within the last 14 days. Configurable via webhook query param `force=true` to bypass.

### Update policy on mismatch

**Default behavior**: LinkedIn is the source of truth. On mismatch, overwrite the stored field. Always.

But preserve the original Apollo-sourced data in a separate set of fields (`LinkedIn Live Employer`, `LinkedIn Live Title`, `LinkedIn Live Tenure (months)`) so the comparison is auditable. Do not touch `Company Name`, `Title`, `Tenure at Company (months)` directly — those stay as the sourcing-time values. The "live" prefix fields hold the verification-time values.

Rationale: this gives you a clean audit trail. If `Title` and `LinkedIn Live Title` disagree on a row, you know Apollo is stale on that contact.

### Cost guardrails

For Pfizer-scale runs (50-100 contacts per company), Apify cost is ~$0.20-$0.40 per company verification. Schedule batch runs deliberately, not constantly.

## Specific implementation details

### URL normalization

Apify and Apollo return LinkedIn URLs in different protocol styles (`http` vs `https`, with/without `www.`). Use this helper everywhere matching is needed:

```js
function normLi(u) {
  if (!u) return '';
  return String(u).trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '');
}
```

### Live tenure calculation

Apify's `currentPosition.startDate` is `{year, text}` or sometimes `{year, month}`. Build defensively:

```js
function liveTenureMonths(startDate) {
  if (!startDate) return null;
  const y = startDate.year || (typeof startDate.text === 'string' && (startDate.text.match(/(\d{4})/) || [])[1]);
  const m = startDate.month || 1;
  if (!y) return null;
  const now = new Date();
  return (now.getFullYear() - +y) * 12 + (now.getMonth() + 1 - +m);
}
```

### Tenure format for the summary

Same convention as the sourcing workflow's `Current Role` field:

```js
function tenureHuman(months) {
  if (months == null || months <= 0) return '';
  if (months < 12) return Math.round(months) + ' mo';
  const years = Math.floor(months / 12);
  const remMonths = Math.round(months % 12);
  if (remMonths === 0) return years + ' yr';
  return years + ' yr ' + remMonths + ' mo';
}
```

### LinkedIn Verified Live summary string

```text
<Live Title> at <Live Company> · <tenure>
Headline: <live headline>
Open to work: <yes|no>
Verified: <ISO timestamp>
```

When `status = Not Found`, write:
```text
NOT FOUND on LinkedIn at <verification timestamp>. URL: <url>. Consider this contact stale until manually checked.
```

When `status = Open to Work`:
```text
OPEN TO WORK badge active on LinkedIn at <verification timestamp>. <live title> at <live employer> · <tenure>. Treat this contact as transitioning; defer outreach.
```

### Apify cost reporting

The Apify response includes a `usageTotalUsd` field on the run metadata when using `run-sync-get-dataset-items`. Capture it for the run record so cost is visible per verification run.

## Acceptance criteria

The workflow is done when:

1. A webhook hit with `?companyId=rec83lbbxLTPi84zv` (Pfizer) returns within 5 minutes for ~50 contacts.
2. Each verified contact has all 6 new fields populated.
3. `LinkedIn Verified Live` field reads as a clean human-readable summary that Ellie can scan.
4. The Enrichment Runs table has a new row tagged `Run Type: linkedin_verification` with counts and Apify cost.
5. At least one contact in the Pfizer cohort returns `Stale Mismatch` status (Apollo data drift is guaranteed at 50-contact scale) and the live fields differ visibly from the stored Apollo fields.
6. The original `Title`, `Company Name`, `Tenure at Company (months)` fields are unchanged after verification. Only the new `LinkedIn Live *` fields are written.

## Out of scope for this build

- Re-running Apollo on stale contacts. The verification workflow does not re-enrich; it only verifies.
- Updating the `Contact Tier` based on verification results. The tier was set at sourcing time and stays unless re-sourced.
- Notifying anyone about stale contacts. Just write the fields; downstream views in Airtable can filter on `LinkedIn Verification Status = Stale Mismatch` or `Open to Work`.

## Related files

- **Sourcing workflow** (the one this complements): https://instig8.app.n8n.cloud/workflow/0gWOTnVnVs8y1S7L
- **Segment criteria**: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`
- **Publication signal analysis** (companion context on data lineage): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/publication-signal-analysis-2026-05-22.md`
- **Pfizer contact audit** (showing existing tier output): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/audit-pfizer-contacts-2026-05-22.md`

## Build order recommendation

1. Add the 6 new Airtable fields first via the Airtable MCP. Confirm field IDs before writing workflow code.
2. Build per-company webhook trigger (option #2 above).
3. Wire Read Target Contacts → Filter → Build Apify Batch → Apify HTTP call.
4. Add Compare Live vs Stored Code node with the schemas documented above.
5. Add Patch Contacts HTTP node.
6. Test on Pfizer (`recordId rec83lbbxLTPi84zv`) — it has 58 contacts already in the table, so this gives a real population.
7. Confirm Enrichment Run record + per-contact field updates land.
8. Iterate on the summary string format with Nick before considering done.

The hard parts: Apify URL match rate is ~47% in the sourcing workflow (some LinkedIn profiles don't scrape). Build defensively for partial matches. Expect to handle the "Not Found" path for half the contacts in any given batch.
