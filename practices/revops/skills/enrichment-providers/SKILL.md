---
name: enrichment-providers
description: Reference for how to use each enrichment provider. Read this before running any enrichment or contact discovery. Maps each enrichment spec field to the provider and API call that populates it. Replaces Clay -- all enrichment runs through direct provider APIs. Triggers when starting any enrichment run, contact sourcing, or company classification.
---

# Enrichment Providers

This document maps every field in the enrichment spec to the provider and tool that populates it. There is no Clay in this stack. Every enrichment operation uses direct provider APIs via MCP tools or HTTP calls.

Read this before running any enrichment. Follow the cost tracking and $5 approval rule from the enrichment spec.

## Provider stack (ordered by role)

### Explorium -- primary for company data AND contact discovery
- **MCP tools available:** `fetch-businesses`, `fetch-businesses-statistics`, `fetch-prospects`, `fetch-prospects-statistics`, `enrich-prospects`, `match-prospects`, `fetch-prospects-events`, `enrich-business`, `match-business`
- **Cost:** `fetch-businesses` and `fetch-businesses-statistics` are FREE. `fetch-prospects` and `enrich-prospects` consume credits. Check balance before running.
- **Credits remaining:** check live before every session. Do not trust cached numbers.

### Hunter -- primary for email finding + verification
- **MCP tools available:** none. Call via HTTP API.
- **API base:** `https://api.hunter.io/v2/`
- **Key endpoints:** `email-finder` (find email by name + domain), `email-verifier` (verify deliverability), `domain-search` (find all emails at a domain)
- **Cost:** 1 credit per successful find. No charge for no-result.
- **API key:** `HUNTER_API_KEY` in `.env`

### Apollo -- fallback for email finding + contact creation
- **MCP tools available:** `apollo_contacts_search`, `apollo_contacts_create`, `apollo_mixed_people_api_search`, `apollo_people_match`, `apollo_people_bulk_match`, `apollo_organizations_enrich`
- **Cost:** 1 credit per email lookup, 8 credits per phone, up to 9 credits per full enrichment
- **Status:** currently exhausted. Use as waterfall fallback only when credits are available.

### Exa -- semantic web search for discovery and verification
- **MCP tools available:** `web_search_exa`, `web_fetch_exa`
- **Cost:** subscription. Track usage but no per-query credit cost.
- **Best for:** finding companies by description ("companies developing AAV gene therapies"), verifying company modality claims, fetching pipeline pages.

### Perplexity -- research queries and list validation
- **MCP tools available:** `perplexity_search`, `perplexity_ask`, `perplexity_research`, `perplexity_reason`
- **Cost:** subscription. Track usage.
- **Best for:** validating discovery lists before classification, researching specific companies, answering "is this company really AAV?"

### Free sources -- no cost, no approval needed
- **clinicaltrials.gov:** fetch via Exa or Perplexity. Authoritative for clinical-stage sponsors.
- **PubMed:** search via Perplexity or direct HTTP. Publications by contact name + AAV terms.
- **Google News:** search via Perplexity. Funding events, IND filings, leadership hires.
- **Conference lists:** search via Exa. Interphex, BPI West, Advanced Therapies Week attendee/speaker lists.
- **Company websites:** fetch via Exa `web_fetch_exa`. Pipeline pages, About pages, team pages.

---

## Field-to-provider mapping

### Company enrichment

| Enrichment spec field | Provider | Tool / Method | Notes |
|----------------------|----------|--------------|-------|
| `company_domain` | Exa | `web_search_exa` for company name | verify domain resolves to company site |
| `company_name` | Exa | `web_fetch_exa` on company domain | read name from website, not third-party |
| `company_status` | Exa | `web_fetch_exa` on domain | check if redirects to acquirer; also `web_search_exa` for "[company] acquired" |
| `modality` | Exa | `web_fetch_exa` on pipeline/platform page | search for literal "AAV" strings per enrichment spec procedure |
| `modality_confirmed` | derived | from modality verification | true only if company's own site names AAV |
| `modality_source` | derived | URL from Exa fetch | store the URL where AAV was confirmed |
| `company_type_primary` | Explorium | `enrich-business` | or derive from website About page via Exa |
| `headcount` | Explorium | `fetch-businesses` or `enrich-business` | also available from `fetch-prospects-statistics` |
| `hq_country` | Explorium | `fetch-businesses` | `company_country_code` filter |
| `hq_state` | Explorium | `enrich-business` | or derive from website |
| `clinical_stage` | Free | clinicaltrials.gov via Exa/Perplexity | search for company name + AAV interventional studies |
| `pipeline_indication` | Free | clinicaltrials.gov or company pipeline page via Exa | |
| `subsidiary_flag` | Exa + Perplexity | research query | "is [company] a subsidiary of [top-20 pharma]?" |
| `subsidiary_parent` | derived | from subsidiary research | |
| `funding_event` | Free | Perplexity `perplexity_search` for "[company] funding" | last 45 days |
| `ind_or_stage_advance` | Free | clinicaltrials.gov + Perplexity | last 60 days |
| `leadership_hire` | Explorium | `fetch-prospects-events` with `prospect_changed_company` | or Exa search on LinkedIn company page |
| `conference_presence` | Free | Exa `web_search_exa` for attendee lists | |
| `recent_publication` | Free | Perplexity search PubMed | |

### Contact discovery (replaces Clay "Find People at Company")

**Use Explorium `fetch-prospects` with these filters:**

```
filters:
  business_id: {values: ["<explorium_business_id>"]}  # scope to one company
  job_department: {values: ["r&d", "manufacturing", "c-suite"]}
  job_level: {values: ["director", "senior manager", "vice president", "c-suite"]}
  job_title: {values: ["process development", "viral vector", "CMC", "purification", "manufacturing", "gene therapy"]}
  company_country_code: {values: ["US", "CA"]}
  current_role_months: {gte: 3}  # exclude brand-new hires
  has_email: true  # only return prospects with email
```

**If you don't have the Explorium `business_id`:**
1. First run `match-business` with the company name and domain to get the business ID. FREE (0 credits).
2. Then run `fetch-prospects` filtered to that business ID. FREE (0 credits).

**Important: do NOT use `has_email: true` on `fetch-prospects`.** This filter is too strict at small biotechs (11-50 employees) and returns only 1-3 people. Drop it. Discover contacts without requiring email, then find email separately in the waterfall. More candidates, better coverage.

**If Explorium returns no results for a company:**
Fall back to Apollo `apollo_mixed_people_api_search` filtered by company domain + title keywords. Or fall back to Apify `dev_fusion/Linkedin-Profile-Scraper` if you have a LinkedIn URL for a known contact.

### Explorium credit costs (verified 2026-05-08)

| Operation | Credits per call | Notes |
|-----------|-----------------|-------|
| `match-business` | 0 | Free |
| `fetch-businesses` | 0 | Free |
| `fetch-businesses-statistics` | 0 | Free |
| `fetch-prospects` | 0 | Free |
| `fetch-prospects-statistics` | 0 | Free |
| `fetch-prospects-events` | 0 | Free |
| `enrich-business` | 1 | Firmographics, HQ, headcount range |
| `enrich-prospects` (profiles) | 1 | Role details, work history, education |
| `enrich-prospects` (contacts) | 5 | Professional email, phone numbers. **Expensive.** Consider using Hunter for email instead (1 credit per find). |

**Cost optimization:** Skip `enrich-prospects` with `contacts` enrichment. Use it only as first waterfall step. If the cost of Explorium contacts (5 credits) exceeds Hunter email-finder (1 credit), go to Hunter directly after getting the prospect's name from the profiles enrichment.

**Known issue: `enrich-prospects` response schema.** Profile data is at `data[i].data`, not `data[i].profiles`. Experience array is under `experience`. If you parse `data[i].profiles` you get empty results and waste credits. This was discovered in Batch 2 (2026-05-08) -- 16 credits wasted on a failed parse.

### Contact enrichment

| Enrichment spec field | Provider | Tool / Method |
|----------------------|----------|--------------|
| `first_name`, `last_name` | Explorium | `enrich-prospects` with `profiles` enrichment |
| `title` | Explorium | `enrich-prospects` with `profiles` | current role title |
| `function_classification` | derived | from title, per enrichment spec procedure |
| `seniority` | derived | from title, per enrichment spec mapping |
| `current_employer_match` | Explorium | `enrich-prospects` with `profiles` | compare current employer to company record |
| `role_status` | Explorium | `fetch-prospects-events` | check for `prospect_changed_company` or `prospect_changed_role` events |
| `tenure_months` | Explorium | `enrich-prospects` with `profiles` | calculate from role start date |
| `linkedin_url` | Explorium | `enrich-prospects` with `profiles` | returned in profile data |
| `email` | Explorium | `enrich-prospects` with `contacts` | returns professional emails |
| `email` (waterfall fallback) | Hunter | HTTP call to `email-finder` | name + domain |
| `email` (second fallback) | Apollo | `apollo_people_match` | when credits available |
| `email_verification_status` | Hunter | HTTP call to `email-verifier` | verify whatever email was found |
| `email_domain_match` | derived | compare email domain to company_domain |

### Email waterfall sequence

When finding an email for a contact, follow this order. Stop at the first verified result.

1. **Explorium `enrich-prospects` with `contacts`** -- returns professional email if available. Free if already fetched during discovery.
2. **Hunter `email-finder`** -- call with first_name, last_name, domain. 1 credit per successful find.
3. **Apify `dev_fusion/Linkedin-Profile-Scraper`** -- $0.01/profile, includes email discovery. Use when Explorium and Hunter both return nothing.
4. **Apollo `apollo_people_match`** -- call with name + company. 1 credit. Only when Apollo credits are available.

After finding an email from any source, verify it:
- **Hunter `email-verifier`** -- 1 credit. Returns `verified`, `catch_all`, `unverifiable`, or `invalid`.

If all four sources return nothing: leave email blank, set `enrichment_status = enrichment_incomplete`, `enrichment_failed_check = email_missing`.

### Relationship state fields

| Enrichment spec field | Provider | Tool / Method |
|----------------------|----------|--------------|
| `salesforce_engagement_status` | n8n workflow | SF enrichment writes to Supabase daily |
| `active_cadence_enrollment` | Supabase | query outreach/cadence tables |
| `opt_out_status` | Supabase | derived from SF-synced boolean fields via trigger |
| `existing_customer` | n8n workflow | SF enrichment writes to Supabase daily |

These are NOT populated by enrichment providers. They come from the SF enrichment n8n workflow and Supabase queries. Do not try to populate them from Clay, Explorium, or any external provider.

---

## Apify -- LinkedIn enrichment, job signals, clinical trials

Apify is the web scraping layer. Use it when Explorium doesn't return profile data, when you need LinkedIn-specific fields, or for free-source scraping at scale. No MCP tools -- call via HTTP API.

**API pattern:**
```
POST https://api.apify.com/v2/acts/{actor_id}/runs
Authorization: Bearer {APIFY_API_TOKEN}
Content-Type: application/json
Body: { input JSON specific to each actor }
```
Poll `GET /v2/acts/{actor_id}/runs/{run_id}` until status is `SUCCEEDED`, then fetch results from `GET /v2/datasets/{dataset_id}/items`.

**API token:** `APIFY_API_TOKEN` from `.env.local` (exists in the AOS archive, needs to be added to the current workspace env).

### LinkedIn actors (no cookies required)

| Actor | Slug | Cost/1K | Use for |
|-------|------|---------|---------|
| Company details | `harvestapi/linkedin-company` | $4 | headcount, industry, HQ, specialties, founded year |
| Company search | `harvestapi/linkedin-company-search` | varies | find company LinkedIn URLs by keyword before detail scraping |
| Profile + email | `dev_fusion/Linkedin-Profile-Scraper` | $10 | full profile: work history, education, skills, verified email |
| Profile (no email) | `harvestapi/linkedin-profile-scraper` | $4 | current role, tenure, employment history -- skip email to save cost |
| Profile (enrichment-focused) | `anchor/linkedin-profile-enrichment` | varies | built for enrichment pipelines, n8n integration |

### When to use Apify vs Explorium for profile data

- **Explorium first.** `enrich-prospects` with `profiles` returns role details, work experience, and contacts. If Explorium returns a complete profile, skip Apify.
- **Apify as fallback.** If Explorium returns no profile data or missing fields (tenure, work history), run `harvestapi/linkedin-profile-scraper` at $0.004/profile (without email) to fill gaps.
- **Apify for email finding.** If the Explorium -> Hunter waterfall returns no email, `dev_fusion/Linkedin-Profile-Scraper` at $0.01/profile includes email discovery as a third waterfall step before Apollo.

### Employment verification via Apify

No dedicated actor exists. Use any profile scraper and apply this logic:
1. Pull the profile's current work experience entry
2. If the most recent role has no end date AND the employer matches the company record: `current_employer_match = true`
3. If the most recent role has an end date, or the employer doesn't match: `current_employer_match = false`, disqualify

### Job posting actors (leadership hire signals)

| Actor | Slug | Cost | Use for |
|-------|------|------|---------|
| LinkedIn jobs | `curious_coder/linkedin-jobs-scraper` | per-event | search by company + title keywords for PD/manufacturing/CMC hires |
| Multi-source jobs | `orgupdate/job-posting-scraper` | per-event | Indeed + LinkedIn + Google Jobs in one call |

Filter by title keywords from the enrichment spec: "process development", "manufacturing", "CMC", "viral vector", "gene therapy". A job posting at a target company for these roles = `leadership_hire` signal.

### Clinical trials and publications

| Actor | Slug | Use for |
|-------|------|---------|
| ClinicalTrials.gov | `parseforge/clinicaltrials-scraper` | structured trial search by keyword, country, phase, status |
| CT.gov pipeline monitor | `taroyamada/clinical-trials-pipeline-monitor` | sponsor-level pipeline tracking |
| PubMed | `labrat011/pubmed-scraper` | publication search by author + keyword |

**Note:** For clinicaltrials.gov and PubMed, the free APIs (CT.gov API, NCBI E-utilities) are more reliable for production use. Use Apify actors when you need bulk scraping or structured output that the APIs don't provide easily.

### Website content scraping

| Actor | Slug | Use for |
|-------|------|---------|
| Website crawler | `apify/website-content-crawler` | pipeline pages, team pages, about pages as markdown |

Use this when Exa `web_fetch_exa` returns incomplete content or when you need to crawl multiple pages on a company site (e.g., pipeline page + about page + team page in one run).

### Full Apify reference

See `~/code/work/reference/apify-actors-b2b-enrichment.md` for the complete actor inventory with pricing, run counts, ratings, and alternatives.

---

## Stale employment detection

The enrichment spec's biggest quality gate is catching people who left their company. Two methods:

1. **Explorium `fetch-prospects-events`** with event type `prospect_changed_company`. Pass prospect IDs, check for recent job changes. If an event exists, the contact left -- disqualify.

2. **Explorium `enrich-prospects` with `profiles`** -- check if the current employer in the profile matches the company record. If it doesn't, disqualify.

Run both checks before spending Hunter credits on email finding. No point finding an email for someone who left.

---

## What this replaces

This provider stack replaces Clay entirely for:
- Company classification (Explorium + Exa)
- Contact discovery / "Find People at Company" (Explorium `fetch-prospects`)
- Email finding (Explorium -> Hunter -> Apify -> Apollo waterfall)
- LinkedIn profile data (Explorium `enrich-prospects`, Apify profile scrapers as fallback)
- Employment verification (Explorium events + profile matching, Apify profile scraper as fallback)
- LinkedIn company data (Apify `harvestapi/linkedin-company` when Explorium lacks LinkedIn-specific fields)
- Leadership hire signals (Apify job posting scrapers)
- Clinical trial data (Apify `parseforge/clinicaltrials-scraper` or free CT.gov API)
- Publication data (Apify `labrat011/pubmed-scraper` or free NCBI API)

Clay is not in this stack. Do not reference Clay, Clay credits, Clay tables, or Clay MCP tools in enrichment operations.
