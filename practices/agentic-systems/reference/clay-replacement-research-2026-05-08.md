# Can We Drop Clay? Research Summary

**Date:** 2026-05-08
**Source:** Perplexity deep research with 50 citations
**Question:** Can we replicate Clay's capabilities using direct provider APIs + Claude Code + Supabase?

## Answer: Yes, with caveats.

Clay doesn't own data. It aggregates 150+ provider APIs and sequences requests through waterfall enrichment. The data comes from the same providers you can access directly. Clay's value is the orchestration UI and the convenience of not building waterfall logic yourself.

## What Clay actually does under the hood

| Clay feature | Underlying providers |
|-------------|---------------------|
| Company firmographics | HG Insights, Owler, CB Insights, Crunchbase, Clearbit |
| Contact discovery | People Data Labs, Apollo, Lusha, Nimbler, Snov |
| Email finding (waterfall) | Prospeo, DropContact, Hunter, People Data Labs, Apollo, Snov |
| LinkedIn enrichment | Harmonic.ai, scraping proxies |
| Tech stack | BuiltWith |
| Intent signals | Bombora (integration) |

## Your existing stack vs Clay's capabilities

| Capability | Clay's approach | Your replacement | Gap? |
|-----------|----------------|-----------------|------|
| Company firmographics | Aggregates Clearbit, Crunchbase, etc. | **Explorium** -- 97.8% accuracy, beats ZoomInfo (88.3%), Apollo (78.2%), Clearbit (32.9%). $0.015/credit vs Clay's $0.10-0.50/find | **No gap.** Explorium is better. |
| Contact discovery (find people at company) | People Data Labs, Apollo, Lusha in waterfall | **Explorium `fetch-prospects`** + **Apollo** + **People Data Labs API** | **Small gap.** Clay's UI makes filtering easy. You need to build query logic in Claude Code. |
| Email finding | Prospeo -> DropContact -> Hunter -> Apollo -> Snov waterfall | **Hunter** (direct) + **Apollo** (direct) + **Prospeo** (sign up, $0.20/contact) | **No gap.** Waterfall logic is straightforward to build in Claude Code. |
| Email verification | Internal + third-party | **Hunter verification** + **ZeroBounce** (you have this) | **No gap.** |
| LinkedIn enrichment | Harmonic.ai + proxied scraping | **Apify LinkedIn scrapers** -- company scraper ($8/1K requests), profile status checker, Open to Work detection | **No gap.** Apify handles this. |
| Tech stack detection | BuiltWith | **Wappalyzer** ($250/mo for 5K lookups) or **Bloomberry** | **No gap for current needs.** Not relevant to Teknova AAV play. |
| Waterfall orchestration | Built-in UI | **Claude Code** -- sequential API calls with fallback logic, results to Supabase | **No gap.** This is what you've been building. |
| Signal monitoring (intent) | Bombora integration | **Explorium signals** + **Apify scrapers** + free sources (clinicaltrials.gov, job postings) | **Minor gap.** No Bombora equivalent, but your plays use observable signals, not intent data. |

## The real gaps if you drop Clay

1. **Contact discovery UI.** Clay's "Find People at Company" with visual filters is fast for ad-hoc exploration. Replacing it means either People Data Labs API (requires building Boolean queries) or Apollo's database. Solvable but requires Claude Code query translation.

2. **No-code accessibility.** Clay lets non-technical people build enrichment workflows. Your system requires Claude Code. This only matters if someone other than you needs to run enrichment.

3. **Experimentation speed.** Clay's spreadsheet UI makes it easy to test a new provider or filter in minutes. Your system requires writing code. Trade-off: slower iteration, but more control.

## Cost comparison at your scale

For 1,000 contacts (typical Teknova play size):

| Approach | Estimated cost |
|----------|---------------|
| Clay (Launch plan) | $185/mo base + ~1,500 credits = ~$300-400 total |
| Direct APIs | Explorium ~$15 + Hunter ~$50 + Apollo (free tier 10K emails) + Apify ~$8 = ~$75 total |

At 10,000 contacts:
- Clay: $740-1,200 (multiple months + top-ups)
- Direct APIs: ~$4,500-5,000 (but includes providers Clay doesn't offer)

## Key providers to add or investigate

| Provider | What it does | Cost | Why it matters |
|----------|-------------|------|---------------|
| **Prospeo** | Email finding with MX validation, highest-quality first source in waterfall | $0.20/contact | Better first-pass than Hunter for email finding |
| **People Data Labs** | 2.5B person profiles, filtered search API, 200+ attributes | ~$0.20/profile | Replaces Clay's "Find People" feature at API level |
| **DropContact** | Email finding + GDPR-compliant enrichment | Varies | Good waterfall fallback after Prospeo |
| **Databar.ai** | 90+ provider access, visual interface, more transparent than Clay | $49-449/mo | Middle ground if you want some UI without Clay's markup |

## Explorium specifically

Explorium is already inside Clay -- Clay licenses Explorium data. You're paying Clay a markup to access data you can get directly from Explorium at $0.015/credit. Key Explorium capabilities:
- `fetch-businesses` -- free for firmographic discovery (you confirmed this yesterday)
- `fetch-prospects` -- contact discovery by title/function/seniority (costs credits)
- `enrich-business` -- company enrichment (costs credits)
- `enrich-prospects` -- contact enrichment (costs credits)
- MCP integration -- Claude Code can query in natural language

## Apify actors for LinkedIn (untapped)

You have Apify ready but haven't used it. Relevant actors:
- **LinkedIn Company Scraper** -- headcount, industry, specialties, HQ, no login required ($8/1K)
- **LinkedIn Profile Scraper** -- current role, tenure, employment history
- **LinkedIn Open Profile Status** -- detects Open to Work, InMail acceptance
- **Waterfall Contact Enrichment actor** -- pre-built waterfall logic, $0.20/contact
- **Employment Verification actor** -- confirms current employment against LinkedIn

## Recommendation

**Drop Clay for bulk enrichment. Keep it only if you need the UI for ad-hoc exploration.**

Your minimum Clay-free stack:
1. **Explorium** -- company data, contact discovery, signals
2. **Hunter** -- email finding + verification
3. **Apify** -- LinkedIn enrichment, employment verification
4. **Exa** -- semantic web search for discovery
5. **Free sources** -- clinicaltrials.gov, PubMed, Crunchbase, conference lists
6. **Claude Code + Supabase** -- orchestration + database

This covers every field in the Teknova enrichment spec. The waterfall email logic (Prospeo -> Hunter -> Apollo) is ~20 lines of code in Claude Code. The cost savings are 60-75% at your scale.

The one thing to build: a Claude Code agent that accepts "find me VPs of Process Development at these 50 companies" and translates that into Explorium `fetch-prospects` + Apollo API calls. That replaces Clay's contact discovery UI.
