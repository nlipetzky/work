# Handoff: SF Contact Summary workflow + Ellie's filtered view

Date: 2026-05-22
Audience: Nick (raw material for client update to Jenn / Ellie)
Status: workflow live, view not yet built, opt-out propagation in place

---

## What was built

### 1. SF Contact Summary workflow (n8n)

Workflow ID: TQsQ7iVtgat0LQsB — "Get SF contact history"

Triggered per contact via webhook. For each Airtable contact in the outreach base, the workflow now:

1. Looks up the contact's email in both the **SF Contact mirror** and **SF Lead mirror** (the Schema Map + Data Sync base — full read-only Salesforce mirror Teknova already maintains)
2. If a match exists in either, fetches fresh data from Salesforce (live)
3. Generates a short natural-language summary using Claude (Haiku) explaining the contact's relationship state to Teknova
4. Writes three structured fields back to the RevOps Surface Contacts table

### 2. Fields written to RevOps Surface Contacts

- **SF Contact Summary** (new field, multilineText) — markdown verdict for Ellie
  - Lead line: "Safe to reach out" / "Hold and coordinate with owner" / "DO NOT CONTACT"
  - Plus: SF status (Contact, Lead, both, or unknown), relationship owner, opt-out flags, last activity date
- **DNC / Opt-Out (Email)** (existing checkbox) — flipped to TRUE whenever SF mirror or live SF shows the contact has opted out of email
- **Phone DNC** (existing checkbox) — flipped to TRUE whenever SF shows Do Not Call

Safety: these checkboxes only go from false → true via the workflow. They never flip a true back to false. Manual flags and flags from other systems are preserved.

### 3. Filtered view recommendation for Ellie

Artifact: [/Users/nplmini/code/work/accounts/clients/teknova/artifacts/airtable-ellie-view-fields-2026-05-22.md](/Users/nplmini/code/work/accounts/clients/teknova/artifacts/airtable-ellie-view-fields-2026-05-22.md)

The RevOps Surface Contacts table has 133 fields; Companies has 294. Most are enrichment plumbing Ellie shouldn't see. Recommended filter:
- Contacts: 133 → 28 fields
- Companies: 294 → 32 fields

The recommendation hides scoring internals, raw provider payloads, classification metadata, and the entire Explorium field block. It surfaces tier verdicts + reasons, opt-out flags, owner, recent activity dates, and Ellie's own override/note fields.

**View not yet built in Airtable.** Recommendation locked, build is the next step.

---

## What it changes for Ellie

Before: to know whether a contact was safe to reach out to, Ellie had to log into Salesforce, search the person, scan their activity history, check opt-out flags, and judge who owned the relationship. Per contact.

After: she opens the Airtable view and reads one column. The verdict is there. The opt-out checkbox is there. If she filters by "DO NOT CONTACT" she sees the suppression list in one click.

This is the operationalization of what she asked for on the 5/22 call: "Are they already talking to BD or not? I just want to know."

---

## Test results

Ran on 395 of the 484 contacts currently in the outreach base.

- 1 confirmed true-branch hit: Gauhar Rybarczyk @ AskBio — matched as SF Lead, owner Ashley O'Neil, no opt-outs, verdict "Hold and coordinate with owner"
- ~394 hit the false-branch fallback: "Safe to reach out — net-new contact"
- 0 contacts had DNC flipped by this workflow (because zero overlap exists between the current outreach list and Teknova's existing opt-out population in SF — see below)

---

## Known gaps / next moves

1. **The filtered Airtable view for Ellie is not yet built.** Recommendation is locked, build pending Ellie's sign-off on the field list.
2. **89 of 484 contacts haven't been processed.** Likely queued or skipped, worth confirming via n8n executions log.
3. **DNC propagation is unverified by data.** Cross-checked the 484 outreach contacts against 3,071 SF opt-out records — zero overlap. The logic is correct by inspection but we haven't seen a real flip happen yet. Real overlap will emerge as the outreach list grows.
4. **Activity history (Tasks/Events with subject lines) is not yet pulled.** Ellie asked for "last touch" detail on the call. Currently the workflow shows LastActivityDate but not the subject of the last task or email. Adding this requires a SOQL query node — straightforward, not yet done.
5. **The filtered Ellie view assumes her workflow stays "look at one column."** If she wants to filter or sort by a numeric score, we add those back. Open question.

---

## What to tell the client

Suggested framing for Jenn:

> We finished a piece of the pipeline that automatically tells Ellie, for every contact she's about to reach out to, whether Teknova is already engaged with that person — and flips the opt-out checkbox in her view whenever Salesforce shows the contact opted out. This eliminates a manual SF lookup per contact and prevents accidental outreach to suppressed contacts. The next step is building the simplified Airtable view Ellie asked for so she sees only the columns that matter to her workflow.
