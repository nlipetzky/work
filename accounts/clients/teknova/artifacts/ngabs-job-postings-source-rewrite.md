# Rewriting the Job Postings Source

**Problem:** Current `Lab & Process Job Openings` column returns zero for Seagen, Curia, Hovione, Piramal. These are real, actively-hiring CDMOs. The source has coverage gaps.

**Cause:** Almost certainly one of (probably all of):
1. Single source (Apollo or similar) with patchy biotech coverage
2. Searching by domain when the company has merged or moved (Seagen -> Pfizer ATS)
3. Keyword filter applied at search time that's too narrow
4. Location filter applied at search time that misses NA postings at internationally-HQ'd companies

**Fix:** Replace the single column with a five-column stack. Pull broad from multiple sources, classify narrow with AI after.

---

## The five-column stack

### Column A: `Apollo Job Postings (raw)`

Action: **Apollo -> Organization Job Postings** enrichment.

Input: Company name + Domain (use both, not just domain).
Output: array of {title, location, posted_date, url}.

Settings:
- No keyword filter
- No location filter
- Pull all open postings, max 50

### Column B: `LinkedIn Jobs (raw)`

Action: **Apify -> LinkedIn Jobs Scraper** (search the Apify store for "linkedin jobs scraper"; `bebity/linkedin-jobs-scraper-no-cookies` or equivalent works).

Input: Company name (LinkedIn search resolves company entity).
Output: array of {title, location, posted_date, url}.

Settings:
- Time filter: last 30 days (LinkedIn's max for the free actor is usually 90)
- No keyword filter at search time

`Only run if`: Column A returned fewer than 5 postings. This saves credits when Apollo already has good coverage.

### Column C: `Postings Merged`

Action: **Formula** column.

Logic: concatenate Column A and Column B arrays, dedupe on `title + location`. If you prefer AI for the dedupe (handles "Sr Scientist, Process Dev" == "Senior Scientist, Process Development"), use a small Use AI column instead.

### Column D: `Postings Classified`

Action: **Use AI** column.

Per-row prompt:

> Given this list of job postings for {{Name}}: {{Postings Merged}}.
>
> For each posting, return JSON: {title, location, posted_date, url, role_family, na_location, within_180d}.
>
> role_family is one of: upstream, downstream, formulation, cell_line, msat, qc, analytical, conjugation, other_lab, non_lab.
> Bench scientist, process engineer, manufacturing associate, fill/finish, GMP suite, cleanroom roles map to other_lab if you can't place them more specifically.
> Sales, marketing, IT, HR, legal, regulatory, finance, project management, business development roles map to non_lab.
>
> na_location is true if location is in United States, Canada, or Mexico (including remote roles tagged with a NA timezone).
>
> within_180d is true if posted_date is within 180 days of today ({{today}}).
>
> Return the full array.

Output: enriched array.

### Column E: `NA Bench/Mfg Postings (180d)`

Action: **Formula** column.

Logic: count postings in Column D where `role_family != non_lab` AND `na_location = true` AND `within_180d = true`.

This is the integer that flows into the G3 Verdict from the build plan.

---

## Acceptance test before bulk-running

Run the full stack on these five companies. They are all confirmed actively hiring in NA bench/PD/mfg roles as of 2026-06. Each must return >= 5 in Column E.

| Company | Domain | Expected min |
|---|---|---|
| Genentech | gene.com | 20+ |
| Regeneron | regeneron.com | 30+ |
| Eli Lilly | lilly.com | 50+ |
| Bristol-Myers Squibb | bms.com | 40+ |
| Seagen (Pfizer Oncology) | pfizer.com OR seagen.com | 10+ |

If any of these return zero, the stack is broken. Most likely failure point: the Apify actor isn't returning results because the LinkedIn company URL didn't resolve. Fix by adding the LinkedIn company URL as an explicit input alongside the company name.

If Seagen specifically fails, manually set the input domain for that row to `pfizer.com` and re-test. Acquisitions break domain-keyed enrichment systematically; you may need a small Use AI column upstream that says "if this company has been acquired, return the parent company domain instead" and feed that to Apollo.

---

## What this costs

- Column A: ~1 Apollo credit per row, free if on a paid plan with org enrichments included.
- Column B: Apify actor, ~$0.001-0.01 per run depending on actor. ~$2-4 across 420 rows.
- Column C: free (formula).
- Column D: ~$0.01 per row in AI credits. ~$4 across 420 rows.
- Column E: free (formula).

Total: ~$10 in credits to add reliable job-postings signal across the full table. The validation run on 5 companies is ~$0.20.

---

## Why this works when the current setup doesn't

The current column tries to do search + filter + classify in one shot. Every step is brittle:

- Search misses when domain or company name doesn't resolve cleanly.
- Filter at search time excludes postings whose titles don't exactly match the keyword.
- Classification has to be done by humans reading the output.

The five-column stack separates the concerns:

- Pull broadest possible postings from two independent sources.
- Merge + dedupe explicitly.
- Classify each posting against the playbook's role-family vocabulary with AI (handles title variation).
- Count with a formula.

If a posting is missed, you can trace whether Apollo or LinkedIn was the gap. If a posting is mis-classified, you fix the prompt, not the search. The system is debuggable.
