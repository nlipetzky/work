# Apify Actors for B2B Enrichment

Reference compiled 2026-05-07 from Apify Store API. All actors use pay-per-event pricing unless noted.

---

## 1. LinkedIn Company Scraping

### harvestapi/linkedin-company (RECOMMENDED)
- **Title:** LinkedIn Company Details Scraper (No Cookies) -- Bulk
- **URL:** https://apify.com/harvestapi/linkedin-company
- **Runs:** 5.1M+ | **Users:** 6,144 | **Rating:** 3.77/5 (6 reviews)
- **Auth:** No cookies or login required
- **Returns:** Company name, address, phone numbers, website, employee count, industry, about section, HQ location, specialties, founded year
- **Pricing:** $0.004/company (FREE-BRONZE tier), discounts at SILVER+ tiers. Actor start fee: $0.00005
- **Notes:** Highest volume LinkedIn company actor. Supports bulk URL input and name-based search. Some reviews note occasional rate limiting on very large batches.

### harvestapi/linkedin-company-search
- **Title:** LinkedIn Company Search Scraper -- No Cookies
- **URL:** https://apify.com/harvestapi/linkedin-company-search
- **Runs:** 251K+ | **Users:** 1,775
- **Auth:** No cookies required
- **Returns:** Company search results by keyword/filters (useful for discovery before detail scraping)
- **Use case:** Find company LinkedIn URLs by name/industry before feeding to the detail scraper

---

## 2. LinkedIn Profile Scraping

### dev_fusion/Linkedin-Profile-Scraper (RECOMMENDED -- highest volume)
- **Title:** Mass LinkedIn Profile Scraper with Email (No Cookies)
- **URL:** https://apify.com/dev_fusion/Linkedin-Profile-Scraper
- **Runs:** 18.6M+ | **Users:** 57,292 | **Rating:** 4.77/5 (125 reviews)
- **Auth:** No cookies or login required
- **Returns:** Full profile: verified email, phone number, work history, education, skills, certifications, languages, headline, summary, location
- **Pricing:** $0.01/result (pay-per-event, dataset item)
- **Notes:** By far the most popular LinkedIn profile actor. Email included in base price. High concurrency support.

### harvestapi/linkedin-profile-scraper (RECOMMENDED -- best value)
- **Title:** LinkedIn Profile Scraper + Email -- No Cookies
- **URL:** https://apify.com/harvestapi/linkedin-profile-scraper
- **Runs:** 7.9M+ | **Users:** 23,950 | **Rating:** 4.76/5 (24 reviews)
- **Auth:** No cookies or login required
- **Returns:** Complete work experience, education history, skills, certifications, profile details
- **Pricing:** $0.004/profile (without email) or $0.01/profile (with email search). That is $4/1K profiles without email, $10/1K with email.
- **Notes:** Best value if you don't need email for every profile. Two pricing tiers let you optimize cost.

### anchor/linkedin-profile-enrichment (RECOMMENDED -- integration-friendly)
- **Title:** LinkedIn Profile Scraper for Cheap Lead Enrichment
- **URL:** https://apify.com/anchor/linkedin-profile-enrichment
- **Runs:** 668K+ | **Users:** 6,178 | **Rating:** 4.70/5 (20 reviews)
- **Auth:** No cookies required
- **Returns:** Live LinkedIn profile data from URLs. Works with both people and company profiles.
- **Pricing:** Pay-per-event (pricing not exposed via API -- check store page)
- **Notes:** Explicitly built for enrichment pipelines. Native N8N, Make, Zapier integrations. CSV upload supported. Markets itself as "cheap" enrichment.

---

## 3. LinkedIn "Open to Work" / Profile Status Detection

### bestscrapers/fresh-linkedin-profile-data
- **Title:** Fresh LinkedIn Profile Data
- **URL:** https://apify.com/bestscrapers/fresh-linkedin-profile-data
- **Runs:** 83K+ | **Users:** 465 | **Rating:** 5.0/5 (3 reviews)
- **Auth:** No cookies or login required
- **Returns:** Detailed profile information from public LinkedIn URLs -- explicitly designed to return "fresh" (real-time) data
- **Pricing:** Pay-per-event (check store page)
- **Notes:** Newer actor, smaller user base but perfect rating. Best bet for detecting current profile status since it emphasizes real-time data. For "Open to Work" badge detection specifically, note that LinkedIn only exposes this to logged-in users on some profiles -- no cookie-free actor can guarantee this field.

**Open to Work caveat:** The "Open to Work" badge is visible to recruiters (and sometimes all LinkedIn members) but is NOT part of the public profile API. Cookie-free scrapers generally cannot detect it. If this is critical, you would need a cookie-based approach or LinkedIn Recruiter API access.

---

## 4. Employment Verification

No dedicated Apify actor exists for employment verification. The practical approach:

1. **Use a profile scraper** (dev_fusion or harvestapi) to pull current work experience
2. **Compare the current employer field** against your expected employer
3. **Check the end date** -- if the most recent role has no end date and matches the target company, the person likely still works there

The profile scrapers above return structured employment history with start/end dates, making programmatic verification straightforward.

---

## 5. Waterfall Contact Enrichment (Multi-Provider Email Finding)

### logical_vivacity/scout
- **Title:** Scout -- Lead Enrichment + OSINT
- **URL:** https://apify.com/logical_vivacity/scout
- **Runs:** 65 | **Users:** 18 | **Rating:** unrated
- **Auth:** No API keys required
- **Returns:** Verified dossier from 700+ identity sites: SMTP-validated emails, document mining, sanctions screening, domain-to-team discovery
- **Pricing:** $0.05/person, $0.15/domain (stated in description)
- **Notes:** Very new actor (low run count). Claims waterfall across 700+ sources. Worth testing but not battle-tested. No reviews yet.

### nexgendata/company-enrichment-tool
- **Title:** Company Enrichment -- Domain & Contact Finder
- **URL:** https://apify.com/nexgendata/company-enrichment-tool
- **Runs:** 57 | **Users:** low
- **Notes:** Very new. Company-level enrichment with domain and contact discovery.

**Reality check on waterfall enrichment:** Apify's store doesn't have a mature, high-volume waterfall email finder comparable to Clay's waterfall or Prospeo. For true multi-provider waterfall (Hunter + Dropcontact + Snov.io + ZeroBounce), you're better off:
- Using Clay's built-in waterfall
- Building your own via n8n/Inngest chaining multiple API providers
- Using dev_fusion's profile scraper (includes email) as one node in a waterfall

---

## 6. ClinicalTrials.gov Scraping

### parseforge/clinicaltrials-scraper (RECOMMENDED)
- **Title:** ClinicalTrials Scraper
- **URL:** https://apify.com/parseforge/clinicaltrials-scraper
- **Runs:** 252 | **Users:** 27 | **Rating:** 5.0/5 (1 review)
- **Auth:** No auth required
- **Returns:** Structured trial records -- keyword search, country/location filters, status/phase options, document availability indicators, record limits
- **Pricing:** Pay-per-event (check store page)
- **Notes:** Purpose-built for CT.gov. Supports all the filters you'd need for biotech pipeline intelligence.

### pink_comic/clinicaltrials-gov-search
- **Title:** ClinicalTrials.gov - 576K+ Clinical Trials
- **URL:** https://apify.com/pink_comic/clinicaltrials-gov-search
- **Runs:** 80 | **Users:** low
- **Notes:** Alternative with large dataset emphasis.

### taroyamada/clinical-trials-pipeline-monitor
- **Title:** ClinicalTrials.gov Sponsor Pipeline Scraper
- **URL:** https://apify.com/taroyamada/clinical-trials-pipeline-monitor
- **Runs:** 64
- **Notes:** Specifically designed for sponsor pipeline tracking -- good for competitive intelligence on biotech companies.

### labrat011/clinical-trial-site-contact-finder
- **Title:** Clinical Trial Site Contact Finder
- **URL:** https://apify.com/labrat011/clinical-trial-site-contact-finder
- **Runs:** 19
- **Notes:** Extracts site contact information from trials -- useful for identifying investigators and site personnel.

### alizarin_refrigerator-owner/clinicaltrials-gov-api---clinical-study-data
- **Title:** ClinicalTrials.gov API - Clinical Study Data
- **URL:** https://apify.com/alizarin_refrigerator-owner/clinicaltrials-gov-api---clinical-study-data
- **Runs:** 160
- **Notes:** Wraps the official CT.gov API. More reliable than scraping but limited to what the API exposes.

---

## 7. PubMed / Academic Publication Search

### labrat011/pubmed-scraper (RECOMMENDED)
- **Title:** PubMed Scraper
- **URL:** https://apify.com/labrat011/pubmed-scraper
- **Runs:** 79 | **Users:** 8 | **Rating:** unrated
- **Auth:** No API key required
- **Returns:** Articles, abstracts, authors, MeSH terms, citations from 35M+ medical citations in PubMed/MEDLINE
- **Pricing:** Pay-per-event (check store page)
- **Notes:** Only dedicated PubMed actor on the store. Low usage but covers the core use case. For production, consider also using the NCBI E-utilities API directly (free, 10 req/sec with API key).

### scrapemint/pubmed-clinical-trials-intelligence
- **Title:** Pharma Research & Clinical Trial Monitor
- **URL:** https://apify.com/scrapemint/pubmed-clinical-trials-intelligence
- **Runs:** 5
- **Notes:** Combined PubMed + CT.gov intelligence. Very new.

---

## 8. Company Website Scraping

### apify/website-content-crawler (RECOMMENDED -- official Apify actor)
- **Title:** Website Content Crawler
- **URL:** https://apify.com/apify/website-content-crawler
- **Runs:** 32M+ | **Users:** 123,385
- **Auth:** No auth required
- **Returns:** Full website text as Markdown. Cleans HTML, downloads files. Built for AI/LLM/RAG pipelines.
- **Pricing:** Compute-unit based (Apify platform CUs)
- **Notes:** The go-to general website crawler. Use it to scrape team pages, pipeline pages, about pages. You'll need post-processing (LLM extraction) to pull structured data from the markdown output. Integrates with LangChain and LlamaIndex.

### 6sigmag/fast-website-content-crawler
- **Title:** Fast Website Content Crawler
- **URL:** https://apify.com/6sigmag/fast-website-content-crawler
- **Runs:** 994K+ | **Users:** 3,783
- **Notes:** Faster alternative to the official crawler. Good for high-volume website scraping.

---

## 9. Job Posting Scraping (Leadership Hire Signals)

### curious_coder/linkedin-jobs-scraper (RECOMMENDED -- highest volume)
- **Title:** LinkedIn Jobs Scraper
- **URL:** https://apify.com/curious_coder/linkedin-jobs-scraper
- **Runs:** 1.9M+ | **Users:** 67,243
- **Auth:** No auth required
- **Returns:** Jobs from LinkedIn search results plus company details. Contact info discovery.
- **Pricing:** Pay-per-event (check store page)
- **Notes:** Dominant LinkedIn jobs actor. Use job title filters for C-suite/VP/Director to detect leadership hires.

### misceres/indeed-scraper (RECOMMENDED for Indeed)
- **Title:** Indeed Scraper
- **URL:** https://apify.com/misceres/indeed-scraper
- **Runs:** 1.4M+ | **Users:** 22,148
- **Auth:** No auth required
- **Returns:** Position, location, description, salary, company info from Indeed job listings
- **Pricing:** Pay-per-event (check store page)
- **Notes:** Longest-running Indeed scraper. High reliability.

### orgupdate/job-posting-scraper (RECOMMENDED -- multi-source)
- **Title:** Job Posting Scraper
- **URL:** https://apify.com/orgupdate/job-posting-scraper
- **Runs:** 480 | **Users:** 145 | **Rating:** 5.0/5 (4 reviews)
- **Auth:** No auth required
- **Returns:** Real-time job postings from Indeed + LinkedIn + Google Jobs in one actor
- **Pricing:** Pay-per-event (check store page)
- **Notes:** Single actor covering 3 sources. Lower volume but consolidates job scraping into one call. Good for leadership hire signal detection.

### valig/glassdoor-jobs-scraper
- **Title:** Glassdoor Jobs Scraper
- **URL:** https://apify.com/valig/glassdoor-jobs-scraper
- **Runs:** 6.5K+ | **Users:** 809
- **Notes:** Glassdoor-specific. Also see orgupdate/glassdoor-jobs-scraper (1.3K runs, 513 users).

### george.the.developer/ats-hire-trigger-intent-scraper
- **Title:** ATS Hire-Trigger Intent Scraper
- **URL:** https://apify.com/george.the.developer/ats-hire-trigger-intent-scraper
- **Runs:** 1
- **Notes:** Brand new. Specifically designed for hire-trigger intent signals. Worth watching but not production-ready.

---

## Bonus: LinkedIn Search / Discovery Actors

### harvestapi/linkedin-company-search
- **Runs:** 251K+ | **Users:** 1,775
- **Use case:** Find company LinkedIn URLs by keyword search before detail scraping

### harvestapi/linkedin-post-search
- **Runs:** 1.4M+ | **Users:** 9,979
- **Use case:** Search LinkedIn posts by keyword. Useful for engagement signals.

### harvestapi/linkedin-company-posts
- **Runs:** 959K+ | **Users:** 3,644
- **Pricing:** $0.002/post (FREE tier)
- **Use case:** Extract company posts for content analysis and engagement tracking

---

## Recommended Stack for B2B Biotech Enrichment

| Use Case | Primary Actor | Backup/Alternative |
|---|---|---|
| Company details | `harvestapi/linkedin-company` | -- |
| Company discovery | `harvestapi/linkedin-company-search` | -- |
| Profile enrichment | `dev_fusion/Linkedin-Profile-Scraper` | `harvestapi/linkedin-profile-scraper` |
| Cheap profile (no email) | `harvestapi/linkedin-profile-scraper` @ $0.004 | `anchor/linkedin-profile-enrichment` |
| Employment verification | Profile scraper + logic | -- |
| Email finding | `dev_fusion` (included) or `harvestapi` ($0.01 tier) | Clay waterfall for higher hit rate |
| Clinical trials | `parseforge/clinicaltrials-scraper` | `taroyamada/clinical-trials-pipeline-monitor` |
| PubMed | `labrat011/pubmed-scraper` | Direct NCBI E-utilities API |
| Website content | `apify/website-content-crawler` | `6sigmag/fast-website-content-crawler` |
| LinkedIn jobs | `curious_coder/linkedin-jobs-scraper` | `orgupdate/job-posting-scraper` (multi-source) |
| Indeed jobs | `misceres/indeed-scraper` | `orgupdate/job-posting-scraper` |
| Glassdoor jobs | `valig/glassdoor-jobs-scraper` | `orgupdate/glassdoor-jobs-scraper` |

## Cost Estimates (per 1,000 records)

| Actor | Cost/1K |
|---|---|
| Company details (harvestapi) | $4.00 |
| Profile without email (harvestapi) | $4.00 |
| Profile with email (harvestapi) | $10.00 |
| Profile with email (dev_fusion) | $10.00 |
| Company posts (harvestapi) | $2.00 |
| Scout enrichment (logical_vivacity) | $50.00 (person) / $150.00 (domain) |

## Key Takeaways

1. **No LinkedIn cookies needed** for any recommended actor. The top actors all use public/semi-public endpoints.
2. **HarvestAPI** is the dominant provider across LinkedIn categories -- consistent quality, aggressive pricing.
3. **dev_fusion** wins on profile scraping by sheer volume and reviews (57K users, 125 reviews).
4. **Waterfall email enrichment** is a gap on Apify. Build your own or use Clay.
5. **ClinicalTrials.gov** has reasonable coverage with 5+ actors, but all are low-volume/new.
6. **PubMed** has only one dedicated actor. Consider the free NCBI API as primary, Apify as fallback.
7. **"Open to Work" detection** is not reliably available without LinkedIn cookies/login.
8. **Job posting scraping** is well-covered across LinkedIn, Indeed, and Glassdoor.
