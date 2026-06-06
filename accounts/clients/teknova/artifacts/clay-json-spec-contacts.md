# Clay → Contacts Spec (Phase 2 People Sourcing + Screening)

**Purpose:** Source, screen, enrich, and verify the buying committee at already-qualified companies, then dispatch fully-screened contacts to the pipeline. Targets Airtable `Contacts` + `Contact Events`.

**Sources:** `phase2-contacts-sourcing-decision.md`, `Teknova ngAbs Outreach Playbook v1 (2026-05-29)`.

---

## Architecture decision (corrected)

Email enrichment + verification run **per person**, and Clay enriches per row. So people must be **rows in Clay**, not an array-in-cell. Use **"Find people at these companies" as a SOURCE** → People table (one row per person). The earlier "push the people array to Supabase and fan out in n8n" approach does NOT work once email enrichment is in Clay.

Net: `clay_contacts_raw` lands **one row per person** (not per company). The router upserts one Contact per landing row... no array fan-out needed.

## Division of labor

**Clay (enrichment + data quality + early screening to save credits):**
1. Find people at these companies (source) → People table, pass through `Company Name` + `Company Domain` + `LinkedIn URL`.
2. **Title screen** (formula/AI column): approved vs excluded keywords (Playbook 4.2). Output `in_scope_title` + reason. Gate downstream columns on this ("Only run if in_scope_title") to short-circuit and save credits.
3. **LinkedIn current-role verify** (the source already returns `latest_experience`): current title maps to approved list AND `latest_experience.company_domain` = the company's domain → `linkedin_verify_status` = verified / stale_mismatch / database_only (Playbook 6.1).
4. **Email enrichment** (waterfall: Prospeo / Findymail / etc.) → `email`.
5. **Email verification** (ZeroBounce / etc.) → `email_status` / deliverability (Playbook 8 requires a real email).
6. HTTP dispatcher per person row → contacts capture webhook.

**n8n router (governance, state, version-controlled logic, CRM):**
- Resolve company by domain → link Contact to Company.
- Upsert Contact — **dedupe on Email (primary), LinkedIn URL (fallback when email is empty)**. LOCKED 2026-06-03. Avoids duplicating SF-sourced contacts that may lack a LinkedIn URL.
- **CRM activity capture** (Playbook 6.2): query Salesforce by email, then name+company fallback; **store the raw `last_activity_date`** on the Contact (needs a `Last CRM Activity Date` field — small schema add). Do NOT compute suppress/eligible here. LOCKED 2026-06-03.
- **Suppression is a send-time gate, not a sourcing decision.** A separate gate in front of the outreach step computes `eligible = (last_activity_date is null OR older than 180 days from today)`. This keeps the 180-day window accurate at send. LOCKED 2026-06-03.
- Set final `status` (qualified / out_of_scope_title / stale_mismatch / suppressed / disqualified) + write to Contacts.
- Discovery Sources union `clay_ngabs`, Supabase ID, Last Enriched At.

Company gates G1-G5 are already satisfied upstream (only qualified companies feed the people source), so they are not re-run here.

## Title screen lists (Playbook 4.2)

**Approved (any current-title substring, word-boundary):**
```
Process Development, Process Sciences, Manufacturing Sciences, MSAT, Tech Transfer,
Bioprocessing, Downstream Processing, Upstream Processing, Drug Substance,
Formulation, Analytical Development, Technical Operations, CMC,
Antibody Engineering, Protein Sciences, Biologics, ADC, Conjugation,
Cell Line Development, Cell Culture, Bioprocess,
CSO, VP R&D, Head of Manufacturing,
Procurement (R&D / GMP / Raw Materials), Strategic Sourcing, Supply Chain (Bioprocess)
```
**Excluded (current-title substring, case-insensitive) — disqualify unless an approved procurement-of-materials term is also present:**
```
User, CX, UX, Business, Sales, Territory, Strategy, Strategic, Forecast, Field, Learning,
Medical Affairs, Global Head, Talent Acquisition, Recruiter, Recruiting, Finance, Advertising,
Quality Assurance, QA, QA/RA, Regulatory, Communications, IT, Information Technology, Technology,
Data Science, Data, Digital, Informatics, Intelligence, Marketing, Market, Support, Patient,
Account Manager, HR, Human Resources, Portfolio, Project Manager, Project Management, Customer,
Consumer, Brand, Analytics, Engagement, Statistics, Franchise, Safety, Change Readiness, Legal,
Counsel, Policy, Product, Accounting, Payer, Payroll, Economics, Collaborations, Biometrics,
Scouting, Reimbursement, Access, Planner, Compliance, Liaison, Thought Leader Liaison, Enablement, Patent
```
Match on word boundaries (don't let "Data" strike "Data-driven Process Scientist" when an approved term is present). Exception: keep "Strategic Sourcing Manager, Raw Materials" etc. ... procurement-of-lab/GMP-materials titles survive the exclusion. When ambiguous: exclude and flag for review.

## Required output fields (Playbook 8) → Contacts columns

| Required | Contacts column | Source |
|---|---|---|
| Full name | Full Name | Clay |
| First name | First Name | Clay |
| Last name | Last Name | Clay |
| Title | Title | Clay (current) |
| Company name | Company Name + Company (linked) | Clay + router resolve |
| Email address | Email + Email Verified Status | Clay enrich + verify |
| LinkedIn URL | LinkedIn URL | Clay (dedupe key) |

All present in the Contacts schema. Status/governance also captured: `Role Status`, `Email Verified Status`, `Known Status`, `Contact Tier`, `DMU Tier`, `Gate Level`, plus `verification_source = database_only` flag when no LinkedIn profile (Playbook 6.1.4).

## Person blob → Contacts mapping (from real Find People output)

| Clay person field | Contacts column |
|---|---|
| url | LinkedIn URL (dedupe fallback) |
| (Clay) email | Email (dedupe primary) |
| first_name / last_name / name | First / Last / Full Name |
| title | Title |
| headline | LinkedIn Headline |
| summary | LinkedIn About |
| structured_location.{city,state,country} | City / State/Region / Country |
| latest_experience.company_domain | Company Domain → resolve Company link |
| latest_experience.company | Company Name |
| latest_experience.start_date | Tenure in Role (months) (compute) |
| experience[1].company | Most Recent Prior Employer |
| picture_url_orig | Photo URL |
| (Clay) email / email_status | Email / Email Verified Status |
| (Clay) in_scope_title, linkedin_verify_status | Role Status / DMU Tier |

## Dispatcher envelope (per person row, key/value Body)

Static: `client=teknova`, `source=clay_ngabs_people`, `entity=contact`. Include all Clay-enriched fields: identity, `company_domain`, `email`, `email_status`, `in_scope_title`, `title_screen_reason`, `linkedin_verify_status`, location, tenure, prior employer, photo. Router maps via autoMapInputData + company resolve.

## Contact Events (Phase 2b)

Contact-level signals (role change, promotion, publication, recent post) → `Contact Events`. Define signal columns in Clay later; extend the router. Not in v1.
