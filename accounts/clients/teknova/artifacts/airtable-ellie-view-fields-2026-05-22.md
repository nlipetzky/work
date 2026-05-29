# Ellie's filtered view — recommended fields

Base: appYBYH3aOHhTODAw (RevOps Surface)
Scope: hide enrichment plumbing, provider raw fields, internal scoring components, and SF sync internals. Show only what Ellie needs to (a) review/approve a contact for send, (b) understand the why, (c) act on signals.

Filtering principle: Ellie sees verdicts, not the math. She sees reasons, not run IDs. She sees the company/person, not the pipeline.

---

## Companies (87 → 32 fields)

Identity
- Company Name
- Domain
- Company LinkedIn URL
- HQ City
- HQ State
- HQ Country
- Stock Ticker

Size + shape
- Employee Count
- Employee Range
- Revenue Range
- Founded Year
- Industry

Why we're targeting
- AAV Segment
- Ellie Segment Override
- Most Advanced Phase
- Delivery Vehicle
- Lead Indication
- Trial Count
- Most Recent Trial Date
- Active Recruiting
- Trigger

Status / governance
- Outreach Eligible
- Verification Verdict
- Lifecycle State
- Current Customer
- SF Has Open Opp
- SF Has Closed Won
- SF Account Ownership

Talking points / signals
- Last Funding Date
- Last Funding Amount USD
- Press Mentions 12mo Count
- Conference Attendance 12mo Count
- Active Signals Count
- Latest AAV Event Date

Ellie workspace
- Ellie Note
- Contacts (linked records)
- Company Events (linked records)

Hide everything else, including: all 200+ explorium_* fields, Supabase ID, Classification Run ID/Version/Date/Notes/Source, Enrichment Status, Discovery Sources/Confidence, Fit Score, Playbook Fit Score, Company Score, Segment Score, all SF sync timestamps and raw payloads, Deep Enrichment Raw, NAICS Code, SEC CIK, Parent/Ultimate Parent IDs, Vector Evidence Clause, Canonical Status, Subsidiary Status, Rejection Reason, Translated Body lookups, Enrichment Provider, Enrichment Runs link.

---

## Contacts (133 → 28 fields)

Identity
- Full Name
- Title
- Email
- LinkedIn URL
- Mobile Phone
- Company (linked)
- Company Name
- Company Domain
- State/Region
- Country

Why they qualify
- Contact Tier
- Contact Tier Reason
- Cohort Tier
- Cohort Tier Reason
- Seniority
- Function
- Tenure at Company (months)
- Tenure in Role (months)

Deliverability (verdicts only)
- Email Tier
- Email Verified Status
- Delivery Path

Suppression / state
- Known Status
- Role Status
- DNC / Opt-Out (Email)
- Email Hard-Bounced
- Email Active Cadence Elsewhere
- LinkedIn DNC
- LinkedIn Active Cadence Elsewhere

Signals + talking points
- Recent Role Change Date
- Recent Promotion Date
- Recent Publication
- Most Recent LinkedIn Post
- LinkedIn Headline

Outreach state
- Last Per-Contact BD Outcome
- Per-Contact BD Follow-up Window Opens

Hide everything else, including: all explorium_fetched_* and explorium_profile_* fields, explorium_contacts_*, Raw Provider Payloads, Supabase ID, Person Key, all numeric scores (Contact Score, Fit Score, ICP Score, Signal Score, Email Confidence, Source Confirmation Count), ICP Score Reason, DMU Tier, Gate Level, Seniority Level, Email Tier Reason / LinkedIn Tier / LinkedIn Tier Reason / Phone Tier / Phone Tier Reason, Cohort Quality Framework Version, Email Provider Source, Employment Verification Status, Employer Match Confirmed, LinkedIn URL Valid / Active Profile / Last Active / Connection Possible, Phone Verified / Phone DNC, Suppression Flags Checked At, Last Enriched At, Last modified time, Modified, SF Contact ID, SF Entity Type, Recent Web Engagement Date, Email Identity Confirmed, the two "DELETE" legacy columns, Email Opt Out - DELETE, Hard Bounced - DELETE, Contact Events link.

---

## Open calls to make

1. **SF identifiers** — kept off for Ellie (SF Account Ownership stays, SF Contact ID/SF Entity Type off). Flip if Ellie needs to deep-link back to SF.
2. **Scores** — I hid all numeric scores in favor of the tier verdicts + reasons. If Ellie wants to sort by Contact Score or Fit Score, add those two back.
3. **Recent Publication / Most Recent LinkedIn Post** — kept on as talking-point fuel. These can be noisy on multilineText fields; consider a richText summary column instead.
4. **Ellie Segment Override + Ellie Note** — on for Companies. There is no equivalent on Contacts. Worth adding "Ellie Note" to Contacts so she has a place to write per-person feedback inside the view.
