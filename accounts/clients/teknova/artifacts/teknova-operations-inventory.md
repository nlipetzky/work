# Teknova Operations Inventory

**Last updated:** 2026-05-08 (Batch 4 final -- all 4 enrichment batches complete, 54 companies, 222 contacts)
**Purpose:** Single source of truth for every system, workflow, sync path, artifact, and provider serving the Teknova engagement. Any practice session working on Teknova reads this before building anything new.

---

## Data systems

| System | Type | Identifier | What it holds |
|--------|------|-----------|---------------|
| Supabase (revops-engine-dev) | Database | Project `mrmnyscurmkfppicqqhk` | Companies, contacts, enrichment data, scores, play memberships. Authoritative for enrichment-spec fields. |
| Airtable (Teknova Outreach) | Client-facing base | `appFoLY6hjroyA2KW` | Companies table (`tblmd04rMsw3GE3pK`), contacts table. Where Ellie and Jenn work. Receives data from Supabase and SF via sync workflows. |
| Airtable (SF Mirrors) | Mirror base | `app5wdHwgM1SPNxcx` | `ME_Account_Mirror`, `ME_Contact_Mirror`, `ME_Lead_Mirror`, `ME_Opportunity_Mirror`. Populated by Airtable's native SF connector. Read by the SF enrichment workflow. |
| Salesforce | CRM | Instance: `teknova.my.salesforce.com` | Accounts, contacts, leads, opportunities, activities. Source of truth for relationship state and BD engagement. |
| NotebookLM | Context store | Notebook: "Teknova Events" | 8+ months of meeting transcripts, emails, documents. Queried by Nick, pasted into `clients/teknova/sources/`. |

---

## Active workflows (n8n)

All workflows run on instig8 (`https://instig8.app.n8n.cloud/`). Teknova project: `TfzE1Ve7GCz0XRpa`.

| Workflow | ID | Schedule | What it does | Reads from | Writes to | Credentials |
|----------|-----|----------|-------------|-----------|----------|-------------|
| Teknova -- Companies SF Enrichment | `9lHIriKSBaYId9Xd` | Daily 06:00 CT + manual | Populates 11 SF-derived fields on companies (engagement status, account owner, activity summary, opp stage, customer status). AI-generated 2-4 sentence activity summary per matched company. | Airtable SF mirrors + live SF SOQL | Airtable Teknova Outreach Companies table | Airtable PAT `pJ4oVKlLQLrvp3Z9`, SF OAuth `qZN3s8Z20hEgdTdj`, Anthropic `k6pMUap0iM92iLvi` |
| SF Account Sync | `nYnpliJqX2fGHcC2` | Webhook + Schedule (3 min) | Reads Sync Queue table, patches SF Account records, verifies write, marks queue row synced/failed | Airtable sync queue in `app5wdHwgM1SPNxcx` | Salesforce Accounts | Airtable PAT, SF OAuth |
| SF Lead_Contact Sync | `TaFA7YOoT0H0BHMg` | Webhook | Same pattern for SF Lead/Contact upserts | Airtable sync queue | Salesforce Leads/Contacts | Airtable PAT, SF OAuth |
| Supabase → Airtable Enrichment Sync | **Not yet built** | Planned: daily 07:00 CT + manual | Syncs enrichment-spec fields (scores, modality, signals, provenance, enrichment status) from Supabase to Airtable. Handoff written. | Supabase `public.companies` + `public.contacts` | Airtable Teknova Outreach (both tables) | Supabase service key, Airtable PAT |

### Inactive workflows (do not use)

| Workflow | Why inactive |
|----------|-------------|
| Two 73-node "Salesforce to Airtable Sync" workflows | Superseded by Airtable's native SF connector. Do not reactivate. |

### Infrastructure dependencies

- **Airtable native SF connector** populates the mirror tables in `app5wdHwgM1SPNxcx`. Not an n8n workflow. Sync schedule is set in Airtable on each table's sync settings. If mirrors go stale, the SF enrichment workflow's derived fields (Last Contacted Date, Active SF Opportunity, etc.) also go stale.
- **SF OAuth credential** (`qZN3s8Z20hEgdTdj`) is shared across all SF-touching workflows. If it expires, all three break.

---

## Sync paths

Data flows in specific directions. Do not reverse these without understanding the consequences.

```
Salesforce
  ↓ (Airtable native connector, auto-schedule)
Airtable SF Mirrors (app5wdHwgM1SPNxcx)
  ↓ (SF Enrichment workflow, daily 06:00 CT)
Supabase (mrmnyscurmkfppicqqhk) -- ALL data lands here first
  ↑ (Enrichment agent also writes here during enrichment runs)
  ↓ (Supabase→Airtable sync workflow, daily 07:00 CT)
Airtable Teknova Outreach (appFoLY6hjroyA2KW) -- receives everything from Supabase

Airtable Teknova Outreach
  ↓ (SF Account Sync + SF Lead_Contact Sync, webhook/3-min schedule)
Salesforce -- patches Accounts, Leads, Contacts from sync queue
```

**Key rule:** Supabase is the single source of truth for all data. Airtable Teknova Outreach is the client-facing surface -- it receives data from Supabase only, never from multiple independent writers. Salesforce is the CRM. Data flows: SF → mirrors → Supabase (SF fields), enrichment agent → Supabase (enrichment fields), Supabase → Airtable (one daily sync), Airtable → SF (sync queue writes).

**Planned retarget (pending):** The SF enrichment workflow currently writes directly to Airtable. It will be retargeted to write to Supabase instead, so all data flows through one path. Handoff at `clients/teknova/revops/context/n8n-sf-enrichment-retarget-supabase-2026-05-07.md`. Do not apply until the Supabase→Airtable sync workflow is built and verified.

---

## Enrichment artifacts (per play)

### Play: aav-gene-therapy-ellie-outreach (PLAY-006)

| Artifact | Path | Status |
|----------|------|--------|
| Offer | `clients/teknova/artifacts/revops-offer-aav-gene-therapy-ellie-outreach.md` | Complete |
| Segment criteria | `clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` | Complete |
| Enrichment spec | `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md` | Complete |
| Company discovery | `revops-discovery-aav-gene-therapy-ellie-outreach.csv` | Complete 2026-05-08. 107 total companies (54 existing + 53 net new). 49 net new addressable after discovery-time disqualifications. |
| Discovery summary | `revops-discovery-summary-aav-gene-therapy-ellie-outreach.md` | Complete 2026-05-08. Provider breakdown, disqualification list, next steps. |
| Quality report | `clients/teknova/artifacts/revops-quality-report-play006-2026-05-08.md` | **Current as of 2026-05-08 (final post-enrichment state)** |
| Quality report (prior) | `clients/teknova/artifacts/revops-quality-report-play006-2026-05-07.md` | Superseded -- pre-enrichment baseline |
| Gap analysis | `clients/teknova/artifacts/revops-gap-profile-play006-2026-05-07.md` | Baseline snapshot |
| Company scope CSV | `clients/teknova/artifacts/revops-company-scope-aav-gene-therapy-ellie-outreach.csv` | Pre-enrichment company list |
| Companies migration | `clients/teknova/artifacts/revops-companies-migration-2026-05-07.sql` | Applied |
| Contacts migration | `clients/teknova/artifacts/revops-contacts-migration-2026-05-07.sql` | Applied |
| Spec-to-column mapping | `clients/teknova/artifacts/revops-companies-spec-mapping-2026-05-07.md` | Current, 100% coverage both tables |
| Sourcing targets | `clients/teknova/artifacts/revops-sourcing-targets-play006-2026-05-07.md` | Current |
| Step 1/3 results | `clients/teknova/artifacts/revops-step1-step3-results-2026-05-07.md` | Applied |

### Play state

- **Companies in play: 54 total (final).** enrichment_complete: 30 | enrichment_incomplete: 9 | disqualified: 15.
- **Contacts in play: 222 total (final).** cadence_ready: 44 | enrichment_complete: 47 | enrichment_incomplete: 32 | disqualified: 98. Has email: 209. Email missing: 13. All 222 opt_out_status = clear.
- **Contact score:** min 6, median 10.0, avg 9.9, max 16. Score >10: 13 contacts.
- **Company score:** min 0, median 6.0, avg 5.5, max 11. Why-now signals almost entirely unpopulated (0/44 funding, 5/44 IND, 0/44 leadership, 0/44 conference, 3/44 publication).
- **Active companies with 0 contacts: 3** (Ambulero -- too small; Beacon -- Explorium coverage gap; PTC -- too large/deep org chart).
- Company discovery: **complete 2026-05-08**. 107 total universe (54 existing + 49 net new addressable).
- Enrichment POC (Batch 0): **complete 2026-05-08**. Latus Bio, Myrtelle, Apertura. 4 contacts. ~27 Explorium credits.
- Enrichment Batch 1: **complete 2026-05-08**. Jaguar, Odylia, Affinia, Atsena, REGENXBIO, Taysha, Ambulero, Opus, PTC, Lacerta. 6 enrichment_complete, 4 enrichment_incomplete. ~38 provider credits.
- Enrichment Batch 2: **complete 2026-05-08**. Andelyn, Rocket, Adverum, Ultragenyx, Forge, Rejuvenate Bio, Locanabio, Dyno, Homology (disqualified), AGT (disqualified). 5 enrichment_complete, 3 enrichment_incomplete, 2 disqualified. 13 contacts written. ~45 provider credits.
- Enrichment Batch 3: **complete 2026-05-08**. Sarepta, Solid Bio, Shape, Tenaya, Capsida, Encoded, Virovek, Genezen, BridgeBio, Expression (disqualified). 7 enrichment_complete, 2 enrichment_incomplete, 1 disqualified. 17 contacts written. ~51 provider credits.
- Enrichment Batch 4 (final): **complete 2026-05-08**. 4D Molecular, Abeona, Avirmax, Beacon, ElevateBio, Grace Science, Kriya, Lexeo, Neurogene, Ocugen, Passage Bio, Voyager, AGTC (disqualified/acquired). 12 enrichment_complete, 1 disqualified. 21 contacts written (13 with email, 8 email_missing). 35 Explorium + 13 Hunter credits.
- **All enrichment batches complete.** Full quality report: `clients/teknova/artifacts/revops-quality-report-play006-2026-05-08.md`.
- Lacerta Therapeutics: **Apify follow-up required**. Payel Chaudhuri (Sr Dir AAV Mfg) and Gary Todd (VP Head of Technologies) -- Explorium match-prospects returned 0. Use Apify `dev_fusion/Linkedin-Profile-Scraper`. Email pattern: {first}{l}@lacertatx.com.
- Tenaya Therapeutics: **Apify follow-up required**. Scott Bertch (VP Manufacturing) and Kathy Ivey (SVP Process Dev) -- employed confirmed, 0 emails. Apify LinkedIn path.
- Solid Biosciences: **gap**. Stewart C. (Sr Dir Manufacturing) -- last name truncated by Explorium. Apify needed.
- Shape Therapeutics: **gap**. Ken Prentice (SVP Process Dev) -- no email.
- Rob Johnson (Ultragenyx): **gap**. Corrupt Explorium prospect ID (38 chars). Apify or Apollo.
- Beacon Therapeutics: **gap**. 0 contacts. US-based staff sourcing via LinkedIn required.
- Genezen Laboratories: **domain conflict**. Supabase has `genezenlabs.com`; email domain is `genezen.com`. Orphan "Genezen" record blocks UPDATE (unique constraint 23505). Manual DBA resolution needed before Airtable push.
- **Next priority: why-now signal fill** (see `play006-next-sessions.md` item 2). 41 of 44 active companies have 0 signals. Signal fill lifts contact scores to 10-18 band. Then: Apify follow-up for 5 named missing-email contacts, Supabase→Airtable sync workflow build.

---

## Provider stack

| Provider | Purpose | Credit state | Pricing | Last checked |
|----------|---------|-------------|---------|-------------|
| Hunter | Email finding + verification | ~7,410 credits (~7,423 - 13 Batch 4). **Verify live before next session.** API key in `clients/teknova/revops/.env`. | 1 credit per successful find. | 2026-05-08 |
| LinkedIn (via Clay) | Tenure, current-employer alignment, role status | Uses Clay credits | Same as Clay | -- |
| clinicaltrials.gov | IND filings, clinical stage, trial sponsors | Free | $0 | -- |
| PubMed / Google Scholar | Recent publications | Free | $0 | -- |
| Conference lists | Interphex, BPI West, Advanced Therapies Week attendance | Free | $0 | -- |
| Perplexity | Research queries, company verification | Subscription | $0 per query | 2026-05-07 |
| Exa | Semantic web search for company discovery | Subscription | $0 per query (subscription) | 2026-05-08 |
| Apollo | Contact/company enrichment | **Exhausted** | N/A | 2026-04-08 |
| Explorium | Firmographic + technographic discovery | **Active** -- ~1,545 credits estimated remaining (~1,580 - 35 Batch 4 = ~1,545). **Verify live before next session.** Expires Apr 2027. | `match-business`: 0 credits (FREE). `fetch-businesses`: 0 credits (FREE). `fetch-businesses-statistics`: 0 credits (FREE). `fetch-prospects`: 0 credits (FREE). `fetch-prospects-events`: 0 credits (FREE). `enrich-business` (firmographics): 1 credit/company. `enrich-prospects` (profiles): 1 credit/contact. `enrich-prospects` (contacts): 5 credits/contact. Dollar rate unconfirmed -- verify on dashboard before large runs. | 2026-05-08 |

### Provider sequencing (per enrichment spec)

1. **Exa `web_fetch_exa`** -- modality verification on company domain/pipeline page. FREE. Kills non-AAV false positives before any credit spend.
2. **Explorium `match-business`** -- get business ID. FREE.
3. **Explorium `enrich-business` (firmographics)** -- headcount range, HQ, company type. 1 credit/company.
4. **Explorium `fetch-prospects`** -- contact discovery filtered by business_id, department, seniority, has_email. FREE.
5. **Explorium `enrich-prospects` (profiles + contacts)** -- full profile + professional email. 1 + 5 = 6 credits/contact.
6. **Explorium `fetch-prospects-events`** -- job change detection. FREE.
7. **Hunter `email-verifier`** -- verify emails from Explorium. 1 credit/email. API key: `HUNTER_API_KEY` in `clients/teknova/revops/.env`. Confirmed present 2026-05-08.

---

## RevOps practice context files

| File | Purpose |
|------|---------|
| `clients/teknova/revops/CLAUDE.md` | RevOps session instructions. Enrichment system definition, provider stack, sequencing. |
| `clients/teknova/revops/context/n8n-sf-enrichment-workflow-2026-05-07.md` | SF enrichment workflow handoff from n8n practice. |
| `clients/teknova/revops/context/n8n-supabase-airtable-sync-handoff-2026-05-07.md` | Supabase→Airtable sync workflow handoff to n8n practice. Not yet built. |
| `clients/teknova/revops/context/company-table-data-requirements-2026-05-07.md` | Jenn/Ellie's stated requirements for what they need to see per company. |
| `clients/teknova/revops/context/play006-next-sessions.md` | Pending work for next RevOps sessions (signal fill, company discovery, client report, sourcing wave 2). |
| `clients/teknova/artifacts/teknova-data-complaints.md` | 25 specific data quality complaints from Jenn, Ellie, and Mika. Every enrichment anti-pattern traces back to one of these. |

---

## Keeping this file current

This inventory must be updated when any of the following happen:
- A new workflow is built, activated, or deactivated
- A provider's credit state changes materially
- A new play is started (add it to the enrichment artifacts section)
- A sync path is added or changed
- A migration is applied that changes the schema
- Play state changes (contacts ship, company discovery runs, etc.)

If you are in a session that does any of the above and you do not update this file, you are leaving the next session blind.
