---
name: company-discovery
description: Use this skill when building the full universe of companies that match a play's segment criteria, or when expanding an existing company set for a play. Triggers include "find all companies for the X play," "how big is the TAM for [play]," "expand the company list for [play]," "run company discovery for [play]," "who are we missing for [play]," or any request to identify the total addressable market of companies for a specific outbound play. Produces a deduplicated company list at clients/<client>/artifacts/revops-discovery-<play-slug>.csv with overlap flags against the existing database. Do NOT use for: defining who qualifies (use segment-criteria first); enriching or verifying individual company records (use the enrichment spec); sourcing contacts at known companies (that's contact sourcing, not company discovery); defining a client's permanent ICP (this is per-play, not strategic).
---

# Company Discovery

Builds the full universe of companies that match a play's segment criteria. Runs every available provider in parallel, deduplicates on domain, flags overlap with the existing database, and outputs a list the enrichment process consumes.

This is the first execution step after segment criteria are locked. Do not skip it. Starting enrichment from "whatever is already in the database" is how you end up with 46 companies when the real TAM is 200.

## When this skill runs

Preconditions:
- A segment criteria artifact exists for this play (`revops-segment-<play-slug>.md`). If not, run `segment-criteria` first and come back.
- The user has identified the client folder where the artifact should land.

If both preconditions are met, proceed.

## Step 1: Extract search parameters from the segment criteria

Read the segment criteria doc. Pull every hard filter. Translate each one into search parameters:

1. Open `clients/<client>/artifacts/revops-segment-<play-slug>.md`.
2. List every hard filter by name.
3. For each hard filter, write down:
   - The observable signal (this is your search term)
   - The constraint (the value or range that qualifies)
   - Whether this filter is searchable by providers (firmographic and some technographic filters are; demographic filters apply to contacts, not companies)

Company-level hard filters become search parameters. Contact-level hard filters (function, seniority) do not -- those apply during contact sourcing, not company discovery.

Typical company-level filters that translate to search parameters:
- Industry / modality / technology (what the company does)
- Geography (where the company is headquartered)
- Company size / headcount (how big)
- Clinical stage / development phase (how far along)
- Company type (biopharma vs CDMO)

## Step 2: Run provider searches

Run all available providers. Do not serialize -- run them in parallel where possible. Each provider has different strengths; using only one produces a partial market.

### Provider procedures

**Clay (primary -- broadest firmographic coverage)**
1. Build a Clay company search using the hard filters as parameters.
2. Set geography, headcount range, and industry/keyword filters to match the segment criteria.
3. For keyword/modality filters, use the literal strings from the segment criteria's observable signals. Do not paraphrase.
4. Pull all results. Do not cap the search at an arbitrary number.
5. Export: company name, domain, headcount, location, industry tags.

**Exa (semantic web search -- catches what Clay misses)**
1. Build search queries from the segment criteria's observable signals. Use natural language that describes what the company does, not industry codes.
2. Run at least 3 query variations:
   - The modality/technology filter as a descriptive phrase (e.g., "companies developing AAV gene therapies")
   - The modality + geography filter combined (e.g., "AAV gene therapy companies United States")
   - The modality + stage filter combined (e.g., "preclinical AAV gene therapy biotech")
3. For each result, extract: company name, domain, snippet showing why it matched.
4. Exa catches companies that don't self-categorize in Clay's taxonomy -- small biotechs, stealth-mode companies, recently pivoted companies.

**clinicaltrials.gov (free, authoritative for clinical-stage companies)**
1. Search clinicaltrials.gov for interventional studies matching the segment's modality/technology filter.
2. Filter by country to match the geography hard filter.
3. Filter by status: recruiting, not yet recruiting, active not recruiting, enrolling by invitation. Exclude completed, terminated, withdrawn.
4. Extract the sponsor name and sponsor type (industry only -- exclude academic/NIH sponsors unless the segment criteria explicitly include them).
5. Each unique industry sponsor is a candidate company.
6. This source misses preclinical companies (no trial registered yet) but catches every company with an active clinical program.

**Crunchbase / press search (recently funded preclinical companies)**
1. Search for companies that received funding in the last 12 months with industry tags matching the segment's modality filter.
2. Filter by geography and headcount to match segment hard filters.
3. This catches preclinical companies that don't have clinical trials yet but have raised capital to develop programs matching the play's modality.

**Explorium (active -- 1,703 credits as of 2026-05-07)**
1. Use firmographic + technographic search matching the segment hard filters.
2. Strong for company discovery by industry classification and technographic signals.
3. Check current credit balance before running. Report the balance to Nick before spending.

### Cost tracking and spend approval

Before running ANY paid provider:

1. **Check current credit balance** on the provider's dashboard or API. Do not trust memory, cached numbers, or the operations inventory -- those go stale.
2. **Estimate the cost** of the planned search: number of queries x credits per query.
3. **If estimated spend exceeds $5 (or the credit equivalent), stop and get Nick's approval.** Present: which providers, how many credits, estimated cost, what you get for it.
4. If under $5, proceed but report the estimate first.
5. After the run, report: credits consumed, credits remaining, what was found.
6. Update the operations inventory and provider status memory with new balances.

**The $5 rule applies to the total session spend across all providers, not each provider individually.** If Clay costs $3 and Explorium costs $4 in the same discovery run, that's $7 total and requires approval.

Free sources (clinicaltrials.gov, PubMed, Google News, conference lists, Crunchbase public search) have no cost and no approval requirement.

An agent previously reported Explorium as "exhausted" for a month when it had 1,703 credits available. Stale credit data wastes time and blocks work that could have been done. Always verify live.

## Step 3: Deduplicate on domain

All provider results converge into one list. Deduplicate:

1. Normalize all domains: strip protocol, strip www., strip trailing slashes, lowercase. `https://www.RocketPharma.com/` becomes `rocketpharma.com`.
2. Merge records with the same domain. Keep the richest version of each field (longest company name, most complete location, etc.).
3. For each merged record, track which providers surfaced it. A company found by 3 providers is higher confidence than one found by 1.
4. If two domains resolve to the same company (e.g., `rocketpharma.com` and `rocketpharmaceuticals.com`), merge them. Use the domain that the company's own website resolves to as the canonical.

## Step 4: Flag overlap with existing database

1. Query the database for all companies currently in the `companies` table.
2. Match on domain (primary key for dedup).
3. Flag each discovery result as:
   - `existing` -- domain already in the database
   - `new` -- domain not in the database
4. For `existing` companies, note whether they are already in the current play's membership (`play_company_membership`) or just in the database but not assigned to this play.

## Step 5: Validate the list before classification

Before spending credits on Clay or any paid classification tool, run the deduplicated list through a free validation pass. Upload the CSV to Perplexity (or paste the company names) and ask it to confirm:

1. Which companies are genuinely in the segment's modality (e.g., "which of these are AAV gene therapy companies vs. other modalities?")
2. Which are therapy sponsors vs. CDMOs vs. platform/enabler companies
3. Which have geography issues (non-US/CA HQ)
4. Which are acquired, defunct, or subsidiaries of large pharma
5. Any that look like false positives from keyword matching

This takes 2-3 minutes and costs nothing. It catches garbage before you spend Clay credits classifying companies that obviously don't belong. It also gives Nick a readable summary he can review before approving the classification spend.

The validation does NOT replace Clay classification -- it's a pre-filter. Companies that pass the Perplexity check still need Clay to populate the spec fields (modality_confirmed, modality_source, headcount, etc.). But companies that Perplexity flags as obvious non-matches can be labeled `disqualified` at discovery time without spending a Clay credit.

## Step 6: Apply known disqualifiers before output

Some disqualifiers from the segment criteria can be applied at discovery time without enrichment:

1. Check the segment criteria's disqualifier list for company-level disqualifiers that are deterministic (acquired companies, known non-matches from prior plays, named exclusions).
2. If the client's CLAUDE.md has a named-accounts-to-exclude list, apply it.
3. Mark disqualified records in the output but do not remove them. The output should show the full universe with disqualification flags so Nick can see the total before and after.

## Step 7: Write the output

Write two files:

**Discovery list (CSV):**
Path: `clients/<client>/artifacts/revops-discovery-<play-slug>.csv`

Columns:
- `company_name`
- `domain` (canonical, deduplicated)
- `headcount` (if available from discovery)
- `hq_country`
- `hq_state` (if available)
- `sources` (pipe-separated list of providers that surfaced this company: `clay|exa|clinicaltrials`)
- `source_count` (integer, number of providers)
- `overlap_status` (`existing_in_play` | `existing_not_in_play` | `new`)
- `disqualified` (`true` | `false`)
- `disqualification_reason` (if applicable)

Sort by: `source_count` descending (highest-confidence companies first), then `overlap_status` (`new` first).

**Discovery summary (markdown):**
Path: `clients/<client>/artifacts/revops-discovery-summary-<play-slug>.md`

Contents:
- Total companies found (before dedup)
- Total after dedup
- Breakdown by provider (how many each provider found, how many were unique to that provider)
- Overlap: how many already in database, how many new
- Disqualified at discovery: how many, top reasons
- Net new addressable companies
- Estimated contact pool (net new companies x 2-3 contacts per company, per segment criteria function/seniority filters)

## Common failure modes

- **Running only one provider.** Clay alone misses small biotechs that don't categorize cleanly. clinicaltrials.gov alone misses preclinical companies. Exa alone returns noisy results. Use all available providers.
- **Capping search results.** "Top 50 results" is not a TAM. Pull everything that matches the filters. The dedup step handles volume.
- **Skipping the overlap check.** Without it, you don't know whether the 200 companies you found include the 46 you already have or are 200 net new.
- **Treating discovery results as enriched.** Discovery confirms a company exists and probably matches. It does not confirm modality, clinical stage, or subsidiary status to spec standards. That's the enrichment spec's job. Discovery is coarse; enrichment is precise.
- **Running discovery without locked segment criteria.** The hard filters ARE the search parameters. If the criteria are vague, discovery will return a vague market. Run segment-criteria first.

## References

- `practices/revops/schemas/segment-criteria.md` -- defines the hard filters this skill reads
- The play's enrichment spec (when it exists) -- consumes this skill's output
