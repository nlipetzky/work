# ngAbs Clay Table Build Plan

**Goal:** A Clay workbook that fully implements the Teknova ngAbs Outreach Playbook v1, end to end, producing a contact list that can ship to outreach without manual rework.

**Current state:** One company-qualification table with 420 rows, partial modality classifier, partial job-postings signal, no contact layer, no CRM check, no LinkedIn verification.

This plan takes the current table to playbook-complete in seven steps. Do them in order.

---

## Step 1: Fix the company table

Resolve the issues already identified before adding anything new.

1. **Kill `Mfg & Process Job Openings`.** Keep `Lab & Process Job Openings`. One column, named for what it captures. The new one is the right scope (PD + bench + mfg roles, not mfg-only).
2. **Rewrite the job-postings source.** Current source under-reports on real CDMOs (Seagen, Curia, Hovione return zero). Switch to Apollo's `apollo_organizations_job_postings` endpoint or layer a second source (LinkedIn jobs via Apify) and take the union. Acceptance test: Genentech, Regeneron, Lilly, BMS, Seagen must each return >= 5 postings.
3. **Capture per-posting fields.** Each posting needs: title, city, state, country, posted-date, role-family. Role-family is a classifier output: upstream / downstream / formulation / cell line / MSAT / QC / other.
4. **Turn auto-run on for every downstream column.** The 5 most-recently-classified rows (Recursion, BlueRock, Allogene, Exelixis, Summit) skipped enrichment. That's a settings bug, not a logic bug.
5. **Tighten the classifier prompt for computational-only shops.** Add: "If the company's antibody work is exclusively in-silico, AI-prediction, or computational with no internal wet-lab discovery, return verdict=no with role=not applicable." Re-run on Insilico to confirm it flips from unclear to no.

---

## Step 2: Add Gap 1 (wet-lab verification) properly

Two columns + one formula.

**Column: `NA Wet-Lab Sites (AI Research)`**
AI research column. Per-row prompt:

> Determine whether {{Name}} ({{Domain}}) operates a physical wet-lab, process development, or GMP manufacturing facility in the United States, Canada, or Mexico. Check the company website (look for /about, /facilities, /locations, /contact pages), recent press releases, and FDA establishment registration. For each NA address found, tag what happens there: R&D wet-lab, process development, GMP manufacturing, QC, sales/admin only, or unclear. Return JSON: {verdict: yes|no|unclear, na_sites: [{city, state, country, activity, source_url}], reasoning: ""}. If the only NA presence is sales, admin, or HQ shell and all wet work is overseas, return verdict=no.

**Column: `NA Bench/Mfg Postings (180d)`**
Derived from the fixed job column in Step 1. Formula counts postings where country in (US/Canada/Mexico) AND role-family in (upstream, downstream, formulation, cell line, MSAT, QC) AND posted within last 180 days.

**Column: `G3 Verdict`**
Formula combining the two:

| AI verdict | NA bench postings | G3 Verdict |
|---|---|---|
| yes | any | confirmed |
| unclear | >= 1 | confirmed |
| unclear | 0 | needs review |
| no | >= 2 | needs review |
| no | 0 or 1 | excluded |

---

## Step 3: Structure the modality taxonomy

Replace the free-text `Modality Types` with a multi-select column using a fixed vocabulary:

- ADC
- bispecific antibody
- bispecific ADC
- multispecific antibody
- trispecific antibody
- Fc-fusion
- antibody fragment (scFv / Fab / VHH / BiTE)
- immunocytokine / radioimmunoconjugate
- other

Add a `Modality Priority` formula column:
- **high** if any of {bispecific ADC, multispecific antibody, trispecific antibody, ADC, bispecific antibody}
- **adjacent** if only {Fc-fusion, antibody fragment, immunocytokine, other}
- **none** if empty or `no` verdict

This carries the playbook's Section 2.4 priority distinction (Hovione = adjacent, Seagen = high).

---

## Step 4: Lock the Company Qualified gate

Single boolean formula column: `Company Qualified`. True when all of:

- `Has ngAbs Program` = yes
- `Confidence` = high
- `G3 Verdict` = confirmed
- `Role` != not applicable
- `Modality Priority` in (high, adjacent)

This is the gate. Only rows where `Company Qualified = true` flow to the contact-sourcing table.

---

## Step 5: Add the contact-sourcing table

New table in the same workbook. Source: Send Table Data from the company table, filtered to `Company Qualified = true`.

For each qualified company, run **Find People at Company** with:
- Number of results: 10
- Title include filter: VP, Director, Head of, Principal, Senior Scientist, Manager (broad initial pull; tightened by classifier next step)
- Title exclude filter: skip the obvious noise here, full Section 4.2 exclusion list runs at the classifier step

Then **Send Table Data** to expand the people list into one row per contact in a third table.

Passthrough fields from company table: `Name` (as company_name), `Domain`, `Modality Priority`, `Modality Types`, `Role`, `G3 Verdict`, `HQ_STATE`, `HQ_CITY`.

---

## Step 6: Add contact screening

In the contacts table, three new columns:

**Column: `Title Approved`**
AI classifier column. Per-row prompt:

> Given a contact with current title "{{Title}}" at "{{Company}}", determine if the title matches the Teknova ngAbs approved title list for process development, bioprocessing, manufacturing science, R&D / antibody engineering / CMC, or procurement of GMP/lab materials. Return JSON: {approved: true|false, category: "process_mfg|rnd_science|procurement|excluded", excluded_reason: "" }. Excluded categories include: User, CX, UX, Business, Sales, Territory, Strategy, Strategic, Forecast, Field, Learning, Medical Affairs, Global Head (non-PD), Talent Acquisition, Recruiter, Recruiting, Finance, Advertising, QA, QA/RA, Regulatory, Communications, IT, Information Technology, Data Science, Data, Digital, Informatics, Intelligence, Marketing, Support, Patient, Account Manager, HR, Portfolio, Project Manager, Customer, Consumer, Brand, Analytics, Engagement, Statistics, Franchise, Safety, Legal, Counsel, Policy, Product, Accounting, Payer, Payroll, Economics, Collaborations, Biometrics, Scouting, Reimbursement, Access, Planner, Compliance, Liaison, Thought Leader Liaison, Enablement, Patent. Exception: if title contains an excluded keyword AND also references procurement of lab/GMP materials (e.g., "Strategic Sourcing Manager, Raw Materials"), return approved=true.

**Column: `LinkedIn Match`**
Clay `Enrich Person from LinkedIn Profile` on the contact's LinkedIn URL. Output: `Current Title` and `Current Org`. Formula column `Title Matches` = true if normalized current title approximately matches the database `Title`. Formula column `Company Matches` = true if normalized current org matches the company `Name`. If LinkedIn URL is empty, set both to `unverified` (not a disqualifier per Section 6.1).

**Column: `CRM 180d Suppress`**
HTTP API column hitting the Salesforce REST API with the contact's email (primary) and full name + company (fallback). Returns `most_recent_activity_date` from SF. Formula column `Suppress` = true if `most_recent_activity_date` is within 180 days of today.

If the SF integration isn't built yet, stub this column to always return false and document the gap. Adding it later is a column swap, not a re-architecture.

---

## Step 7: Lock the Contact Qualified gate and ship

Single boolean column: `Contact Qualified`. True when all of:

- `Title Approved` = true
- `LinkedIn Match.Title Matches` in (true, unverified)
- `LinkedIn Match.Company Matches` in (true, unverified)
- `Suppress` = false

Final output columns (Section 8 of playbook):
- Full name, First name, Last name, Title, Company name, Email, LinkedIn URL

Send Table Data from the contacts table, filtered to `Contact Qualified = true`, to a fourth "Outreach Ready" table. That table is what HeyReach or the CRM consumes.

---

## What this gets you

A workbook with four tables:

1. **Companies** -- 420 rows, ngAbs verdict + G3 wet-lab verdict + modality priority
2. **Contacts (raw)** -- people sourced from qualified companies, ~5-10 per company
3. **Contacts (screened)** -- titles classified, LinkedIn verified, CRM-checked
4. **Outreach Ready** -- the deliverable; filtered to fully-qualified contacts with the 7 fields the playbook says go to CRM

Each step has a single owner column and a single gate column. No row reaches outreach without passing every gate. Every exclusion has an auditable reason.

---

## Order of execution

Step 1 first (it's bug-fix work on what's already there). Then validate on the 10 confirmed-qualified rows before adding Step 2. Then 2-4 in one sitting since they're all company-table work. Then 5-7 once the company-side is locked.

Don't bulk-run the classifier on the remaining ~405 rows until Step 4 is locked. Re-running 405 rows is cheap; re-reviewing 405 rows is not.
