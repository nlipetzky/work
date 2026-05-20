# Enrichment Spec: aav-gene-therapy-ellie-outreach

**Client:** Teknova
**Play:** aav-gene-therapy-ellie-outreach
**Date:** 2026-05-07
**Consumer:** the RevOps enrichment agent (Claude Code session in `clients/teknova/revops/`)

You are enriching a list of candidate companies and contacts for the AAV gene therapy Ellie outreach play. The segment criteria doc (`revops-segment-aav-gene-therapy-ellie-outreach.md`) already defined who qualifies. Your job is to populate every field on every record so Ellie can look at one row and decide to send without checking another system.

Read this document literally. Each field is a procedure. Follow it in order. Do not improvise sources, skip verification steps, or infer values you cannot confirm.

---

## Cost tracking and spend approval

Every enrichment run costs money. Track it.

### Before any run

1. **Check current credit balances** on every paid provider you plan to use. Check the provider's dashboard or API -- do not trust cached numbers from memory or prior sessions.
2. **Estimate the cost** of the planned run: number of records x credits per record per provider.
3. **If estimated spend exceeds $5 (or the credit equivalent), stop and get Nick's approval before proceeding.** Present: which providers, how many credits each, estimated total cost, what you get for it.
4. **If estimated spend is under $5, proceed but still report the estimate before running.**

### During the run

5. Track credits consumed per provider as you go. If actual consumption exceeds the estimate by more than 20%, pause and report.

### After every run

6. **Report a cost summary:**
   - Provider name, credits consumed, credits remaining
   - Total estimated dollar cost (use the provider's published per-credit pricing)
   - What the spend produced (records enriched, fields populated, records disqualified)
7. **Update the operations inventory** (`clients/teknova/artifacts/teknova-operations-inventory.md`) with the new credit balances.
8. **Update the provider status memory** with new balances and verification date.

### The $5 rule

Any single action or batch of actions estimated to cost more than $5 in provider credits requires Nick's explicit approval before execution. This is not a suggestion. Do not bundle multiple sub-$5 actions to avoid the threshold. If you're about to run Clay on 40 companies and Hunter on 80 contacts in the same session, the total estimated cost is what matters, not each provider individually.

Free sources (clinicaltrials.gov, PubMed, Google News, conference lists, company websites) have no cost and no approval requirement.

**Subscription services (Exa, Perplexity) are not free.** They have usage limits, rate limits, and token/query caps even on subscription plans. Do not treat "subscription" as "unlimited" or "$0." Track usage and report it. If a subscription service has a known query or token cap, document it in the operations inventory and monitor against it.

---

## Execution order

Enrich companies first, contacts second. Within each, follow the field order in this document. The order is intentional: early fields produce disqualifications that prevent wasted work on later fields.

**Company-level sequence:**
1. `company_domain` and `company_name` (identity)
2. `company_status` (if defunct or acquired, stop -- do not enrich further)
3. `modality`, `modality_confirmed`, `modality_source` (if not AAV-confirmed, stop -- hold for review)
4. Remaining company fields (type, headcount, geography, stage, subsidiary, signals)

**Contact-level sequence:**
1. `current_employer_match` (if false, stop -- disqualify the contact)
2. `role_status` (if not active, stop -- disqualify)
3. `linkedin_url` (must verify before trusting any LinkedIn-derived field)
4. Name, title, function, seniority (derived from verified LinkedIn)
5. Email fields (only after employment and function are confirmed)
6. Relationship-state fields (Salesforce, cadence, opt-out)
7. Why-now signals (last, because they're optional and expensive)

---

## Company-level fields

### company_domain
- **Required**
- **Procedure:**
  1. If the record already has a domain, navigate to it. Confirm it loads the company's main website (not an investor-relations subdomain, not a Crunchbase page, not a redirect to a parent company).
  2. If the domain redirects to a different company's site, set `company_status = acquired` and stop enriching this company.
  3. If the record has no domain, search Google for the company name. Use the primary website domain from the top result. Do not use LinkedIn URLs, Crunchbase URLs, or SEC filing URLs as the domain.
  4. Store the bare domain with no protocol. Example: `rocketpharma.com`, not `https://www.rocketpharma.com`.

### company_name
- **Required**
- **Procedure:**
  1. Navigate to the company's website (using `company_domain`). Read the company name as it appears in the site header or About page.
  2. Use that exact name. If the company styles itself in a specific way (e.g., "bluebird bio" lowercase), preserve that casing. Otherwise, use title case.
  3. Strip all of the following if present: legal suffixes ("Inc.", "LLC", "Ltd."), internal accounting tags ("- Prepay and Add", "- NC"), ALL CAPS rendering.
  4. If the Salesforce or source record has a different name, overwrite it with the website name. The website is authoritative.
- **Failure condition:** If you cannot find a company website and cannot determine the correct name, flag the record as `enrichment_incomplete` with `missing: company_name`.

### company_status
- **Required**
- **Procedure:**
  1. You already navigated to `company_domain` in the previous step. If the domain redirected to a parent or acquirer, set `company_status = acquired`.
  2. Check the company's LinkedIn page. If it says "This page is no longer active or monitored," set `company_status = defunct`.
  3. Search Google News for the company name + "acquired" or "ceased operations" or "shut down." If results confirm closure or acquisition within the last 24 months, set the appropriate status.
  4. Known defunct/acquired companies in this play (do not enrich these): Astellas Gene Therapies (acquired by Astellas), Audentes Therapeutics (acquired by Astellas), AveXis (acquired by Novartis), Aavantibio (leadership moved to Solid Biosciences).
  5. If none of the above triggered, set `company_status = active`.
- **If `acquired` or `defunct`:** stop enriching this company. Set `enrichment_status = disqualified`, `enrichment_failed_check = company_status`. Move to the next company.
- **Format:** `active` | `acquired` | `defunct`

### modality
- **Required. This is the most important field in the spec. Getting it wrong means pitching AAV to a peptide company.**
- **Procedure:**
  1. Navigate to the company's website. Look for pages titled "Pipeline," "Platform," "Technology," "Programs," "Therapeutic Areas," or "About."
  2. Search those pages for the literal strings: "AAV", "adeno-associated virus", "adeno-associated viral vector", "AAV gene therapy", "AAV-based."
  3. If found: read the context. Confirm the company is developing, manufacturing, or contract-manufacturing AAV-based gene therapies. The word "gene therapy" alone is not enough -- the vector must be AAV specifically.
  4. If the company works on multiple modalities, list all of them. Example: `AAV gene therapy, allogeneic cell therapy`. AAV must be explicitly named as one of them.
  5. If the website does not mention AAV: check the company's LinkedIn "About" section for the same strings. Check press releases from the last 12 months.
  6. If AAV is still not confirmed after all three sources: set `modality_confirmed = false`. Do not guess. Do not infer from broad categories like "gene therapy" or "cell and gene therapy" or "biologics."
  7. Companies that use lentiviral vectors, RNA editing, non-viral delivery, peptides, small molecules, autologous cell therapy without AAV, or epigenetic reprogramming are NOT AAV companies even if they appear under "gene therapy" tagging.
- **Format:** primary modality first. Examples: `AAV gene therapy` | `AAV gene therapy, allogeneic cell therapy` | `CDMO: AAV, lentiviral`

### modality_confirmed
- **Required**
- **Procedure:**
  1. If the modality field was populated from the company's own website or a press release less than 12 months old, and the text explicitly names AAV: set `true`.
  2. If the modality classification came from a third-party database (Clay, Apollo, LinkedIn tags), keyword inference, or any source other than the company's own materials: set `false`.
  3. If `false`: the record is held for manual review. Set `enrichment_status = held_for_review`, `enrichment_failed_check = modality_confirmed`. Do not enrich contacts at this company until modality is manually confirmed.
- **Format:** `true` | `false`

### modality_source
- **Required**
- **Procedure:**
  1. Record the URL where you confirmed the modality. If it was the company's pipeline page, store that URL.
  2. If it was a press release, store the press release URL.
  3. If you checked multiple sources, store the primary one (the one that had the clearest AAV confirmation).
  4. Include the access date. Example: `https://rocketpharma.com/pipeline, accessed 2026-05-07`
- **Format:** URL + access date, or citation string

### company_type_primary
- **Required**
- **Procedure:**
  1. Read the company's About page and LinkedIn description.
  2. If the company develops its own therapies (has its own pipeline, its own clinical programs): set `biopharma`.
  3. If the company primarily provides contract development and manufacturing services to other companies: set `cdmo`.
  4. If the company does both: classify based on what appears to be the primary business. If genuinely 50/50, default to `biopharma`.
- **Format:** `biopharma` | `cdmo`

### headcount
- **Required**
- **Procedure:**
  1. Check the company's LinkedIn page for employee count.
  2. If LinkedIn shows an exact number, store it as an integer.
  3. If LinkedIn is unavailable, check the company's careers page, most recent SEC filing, or press release.
  4. If you can only find a range, store the bucket.
  5. Do not use qualitative descriptions ("small", "mid-size", "large").
- **Format:** integer (e.g., `347`) or bucket: `1-50` | `51-200` | `201-500` | `501-1000` | `1001-2000` | `2000+`

### hq_country
- **Required**
- **Procedure:**
  1. Find the company's headquarters location on their website or LinkedIn page.
  2. If headquartered in the US or Canada: store the ISO code.
  3. If headquartered anywhere else: this company should not be in the list. Set `enrichment_status = disqualified`, `enrichment_failed_check = hq_country`. Do not enrich further.
  4. Do not guess country from phone number or timezone. Do not accept a LinkedIn-listed country without verifying against the company website.
- **Format:** `US` | `CA`

### hq_state
- **Required**
- **Procedure:**
  1. From the same source as `hq_country`, find the state or province.
  2. Store the two-letter abbreviation.
  3. Do not use metro-area names. "San Francisco Bay Area" is not a state. The state is `CA`.
- **Format:** two-letter abbreviation. Example: `CA`, `MA`, `ON`, `BC`

### clinical_stage
- **Required**
- **Procedure:**
  1. Search clinicaltrials.gov for the company name + "AAV" or the company's known AAV program name.
  2. If clinical trials are registered, use the most advanced phase of any AAV program.
  3. If no clinicaltrials.gov results: check the company's pipeline page for stated clinical stage.
  4. If neither source: check recent press releases or investor presentations for stage language ("IND-enabling", "preparing for Phase 1", etc.).
  5. If the company's most advanced AAV program is Phase 3 or later: this fails the segment hard filter. Set `enrichment_status = disqualified`, `enrichment_failed_check = clinical_stage`.
- **Format:** one of: `preclinical` | `IND-enabling` | `Phase 1` | `Phase 1/2` | `Phase 2` | `Phase 3+`

### pipeline_indication
- **Optional but high value for copy personalization**
- **Procedure:**
  1. From the pipeline page or clinicaltrials.gov results, identify the specific disease or therapeutic area of the lead AAV program.
  2. Use the specific indication name, not a category. "Duchenne muscular dystrophy" not "rare disease." "Inherited retinal dystrophy" not "ophthalmology."
  3. If the company has not disclosed a specific indication, leave blank.
- **Format:** plain text or blank

### subsidiary_flag
- **Required**
- **Procedure:**
  1. Check whether the company is a wholly-owned subsidiary of a top-20 global pharma company (Pfizer, Roche, Novartis, J&J, Merck, AbbVie, Sanofi, AstraZeneca, GSK, Lilly, BMS, Amgen, Gilead, Regeneron, Bayer, Novo Nordisk, Takeda, Biogen, Vertex, Moderna).
  2. If yes: set `subsidiary_flag = true` and populate `subsidiary_parent`.
  3. A `true` flag does NOT automatically disqualify. The disqualification rule is: the subsidiary is excluded IF it operates under the parent's GMP supply chain (meaning it doesn't own its own reagent purchasing decisions). If the subsidiary operates independently with its own CMC infrastructure, it stays.
  4. If you cannot determine whether the subsidiary operates independently: set `subsidiary_flag = true`, populate `subsidiary_parent`, and set `enrichment_status = held_for_review`, `enrichment_failed_check = subsidiary_independence`. This requires manual confirmation.
- **Important:** the rule is NOT "remove all enterprise accounts." That was complaint #8. Large companies are allowed. Only wholly-owned subsidiaries of top-20 pharma that don't own their own purchasing are excluded.
- **Format:** `true` | `false`

### subsidiary_parent
- **Required if subsidiary_flag is true**
- **Procedure:** store the parent company name.
- **Format:** company name. Example: `Novartis`

---

## Contact-level fields

### current_employer_match
- **Required. This is the second most important field after modality.**
- **Procedure:**
  1. Open the contact's LinkedIn profile.
  2. Read their current position. Does the listed employer match the company record you're enriching?
  3. Match means: the LinkedIn employer name is the same company (accounting for name variations like "Rocket Pharmaceuticals" vs "Rocket Pharma"). Use the domain as the tiebreaker if names differ slightly.
  4. If the contact's LinkedIn shows a DIFFERENT current employer: set `current_employer_match = false`. This means the contact left the company. Set `enrichment_status = disqualified`, `enrichment_failed_check = current_employer_match`. Do not enrich further.
  5. If the contact has no LinkedIn profile or no current position listed: set `current_employer_match = false` and disqualify. Do not guess.
- **Do not:** tag a contact as matching based on their AAV experience at a previous employer. The match is about where they work RIGHT NOW.
- **Format:** `true` | `false`

### role_status
- **Required**
- **Procedure:**
  1. On the same LinkedIn profile, check for any of these signals:
     - An end date set on their current role
     - The "Open to Work" badge or banner
     - "Retiring" or "Retired" in the headline or about section
     - No current position listed at all
     - Most recent role change was more than 6 months ago and no new employer is listed
  2. If ANY of the above are present: set `role_status` to the appropriate value and disqualify the record. Set `enrichment_status = disqualified`, `enrichment_failed_check = role_status`.
  3. If none are present and the contact has a current, active position: set `role_status = active`.
  4. If you cannot access the LinkedIn profile: set `role_status = unknown`. This does not auto-disqualify but contributes to the active-employment-rate threshold.
- **Format:** `active` | `ended` | `open_to_work` | `retired` | `unknown`

### linkedin_url
- **Required. Must be verified before any other LinkedIn-derived field is trusted.**
- **Procedure:**
  1. Search LinkedIn for the contact's full name AND the company name.
  2. From the search results, select the profile where BOTH the name matches AND the current employer matches the company record.
  3. Open the profile. Confirm the name and current employer one more time on the profile page itself (search results can be stale).
  4. If the profile matches: store the full URL.
  5. If you cannot find a matching profile: leave `linkedin_url` blank. All LinkedIn-derived fields (`title`, `tenure_months`, `role_status`, `function_classification`, `seniority`) become `unknown` or blank.
  6. Do not accept a Salesforce Navigator URL without verifying it matches.
  7. Do not accept a URL that matches the name but shows a different current employer.
- **Format:** full URL. Example: `https://www.linkedin.com/in/jane-doe-12345/`

### first_name
- **Required**
- **Procedure:**
  1. Read the first name from the verified LinkedIn profile.
  2. Strip any post-nominal credentials: PhD, RN, BSN, MD, PMP, MBA, MS, MSc, DrPH, PharmD, or any other letters-after-name pattern.
  3. If the first name is a single initial ("J.", "M."), the record fails enrichment. Set `enrichment_status = enrichment_incomplete`, `enrichment_failed_check = first_name`.
  4. Store in proper case.
- **Format:** proper case, no credentials, no initials. Example: `Melissa`

### last_name
- **Required**
- **Procedure:**
  1. Read the last name from the verified LinkedIn profile.
  2. Strip any post-nominal credentials appended to the last name (e.g., "Cunningham RN" becomes "Cunningham").
  3. If the last name is a single initial, the record fails enrichment.
  4. Store in proper case.
- **Format:** proper case, no credentials. Example: `Cunningham`

### title
- **Required**
- **Procedure:**
  1. Read the title from the contact's CURRENT position on the verified LinkedIn profile.
  2. Do not use titles from previous positions. Do not use the LinkedIn "headline" if it differs from the actual current position title.
  3. Store as listed.
- **Format:** as displayed. Example: `VP, Process Development` | `Director of Manufacturing`

### function_classification
- **Required**
- **Procedure:**
  1. Read the contact's title and LinkedIn profile description for their current role.
  2. Classify into one of these categories based on what the person ACTUALLY DOES:
     - `process_dev`: role involves developing, optimizing, or scaling manufacturing processes for biologics/gene therapy. Title keywords: "process development", "process science", "upstream", "downstream", "purification."
     - `manufacturing`: role involves running production, managing manufacturing operations. Title keywords: "manufacturing", "production", "GMP operations."
     - `cmc`: role involves chemistry, manufacturing, and controls oversight. Title keywords: "CMC", "technical operations" (when clearly CMC-scoped).
     - `cso`: the contact is the Chief Scientific Officer at a company with fewer than 200 employees (per `headcount` field). CSOs at small biotechs often own the CMC function.
     - `other_excluded`: the role does not fit any of the above. This includes: R&D without process focus, clinical development, regulatory affairs, quality control, commercial, business development, legal, HR, IT, finance, marketing, sales, talent acquisition, program management.
  3. If the title is ambiguous (e.g., "Director of Operations"), read the LinkedIn description. If the description mentions process development, manufacturing, or CMC work, classify accordingly. If it's clearly general operations, set `other_excluded`.
  4. Do not classify agronomy, agricultural science, plant biology, or veterinary roles as any category other than `other_excluded`.
  5. Do not classify patient-facing clinical roles (nursing, clinical trial coordination on the patient side) as anything other than `other_excluded`.
  6. If `other_excluded`: disqualify the record. Set `enrichment_status = disqualified`, `enrichment_failed_check = function_classification`.
- **Format:** `process_dev` | `manufacturing` | `cmc` | `cso` | `other_excluded`

### seniority
- **Required**
- **Procedure:**
  1. Map the title to a seniority level using these rules:
     - Title contains "Senior Scientist", "Scientist II/III", "Associate Director" or equivalent: `senior_scientist` (below threshold -- does not disqualify, but is secondary contact only)
     - Title contains "Director" (not "Senior Director", not "Associate Director"): `director`
     - Title contains "Senior Director": `senior_director`
     - Title contains "Head of": `head_of`
     - Title contains "VP" or "Vice President" (not "SVP" or "Senior VP"): `vp`
     - Title contains "SVP" or "Senior Vice President": `svp`
     - Title is "CSO" or "Chief Scientific Officer" AND `headcount` < 200: `c_suite_small_biotech`
  2. Apply the VP cap rule: if `headcount` > 500 AND `company_type_primary` != `cdmo` AND seniority is `vp` or `svp` or `c_suite_small_biotech`: disqualify. Set `enrichment_status = disqualified`, `enrichment_failed_check = seniority_vp_cap`. This prevents burning high-level relationships at large biopharma that BD owns.
  3. If seniority is below `senior_scientist` (e.g., "Research Associate", "Lab Technician"): disqualify. Set `enrichment_failed_check = seniority_too_junior`.
- **Format:** `senior_scientist` | `director` | `senior_director` | `head_of` | `vp` | `svp` | `c_suite_small_biotech`

### tenure_months
- **Required**
- **Procedure:**
  1. On the verified LinkedIn profile, find the start date of the current position.
  2. Calculate the number of months from that start date to today.
  3. If no start date is listed: set `unknown`.
  4. Note: tenure under 3 months is a risk flag (too new to own buying decisions) but does not auto-disqualify. Tenure over 12 months is a positive signal (stability, likely still in role on send day).
- **Format:** integer or `unknown`

### email
- **Required**
- **Procedure:**
  1. Use Hunter (primary email provider for this play) to find the contact's corporate email at the company domain.
  2. If Hunter returns an email: verify it with Hunter's verification endpoint.
  3. If Hunter finds nothing: try the company's standard email pattern (first.last@domain, flast@domain, etc.) and verify.
  4. The email domain MUST match `company_domain` or a known alias of the company. If the only email found is at a different domain, do not use it.
  5. If the only email found is a personal domain (gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, me.com, aol.com, protonmail.com): do NOT use it. Leave the field blank and flag as `enrichment_incomplete` with `enrichment_failed_check = email_personal_only`.
  6. If no email can be found or verified: leave blank and flag `enrichment_incomplete` with `enrichment_failed_check = email_missing`.
- **Format:** lowercase. Example: `jane.doe@rocketpharma.com`

### email_verification_status
- **Required when email is populated**
- **Procedure:**
  1. Record the exact result from the verification provider.
  2. Include the provider name in parentheses.
  3. `catch_all` means the domain accepts all addresses -- the email may or may not be real. Flag but do not disqualify.
  4. `invalid` means the verification provider says the address does not exist. Do not use the email. Treat as if no email was found.
- **Format:** `verified (Hunter)` | `catch_all (Hunter)` | `unverifiable (Hunter)` | `invalid (Hunter)`

### email_domain_match
- **Required**
- **Procedure:**
  1. Extract the domain from the email address.
  2. Compare it to `company_domain`.
  3. If they match (or are known aliases of each other): set `true`.
  4. If they do not match: set `false`. This signals the "Carrie scenario" -- LinkedIn says Company A, email is at Company B. Flag for review.
- **Format:** `true` | `false`

---

## Why-now signal fields

All optional. Populate after all required fields are complete. These are used for copy personalization and send prioritization. Do not spend provider credits on signals for records that have already been disqualified.

### funding_event
- **Procedure:**
  1. Search Crunchbase for the company name. Check for funding rounds announced in the last 45 days.
  2. If Crunchbase has no data: search Google News for "[company name] funding" or "[company name] raises."
  3. If a round is found: record the series, amount, and date.
  4. "Well-funded" or "venture-backed" is not a signal. You need the specific round.
- **Format:** `Series B, $35M, 2026-04-15` or blank

### ind_or_stage_advance
- **Procedure:**
  1. Search clinicaltrials.gov for any new registrations or status changes in the last 60 days for this company's AAV programs.
  2. Search Google News for "[company name] IND" or "[company name] Phase" announcements in the last 60 days.
  3. If found: record the specific event and date.
- **Format:** `IND filed, 2026-03-20` | `Phase 1 initiated, 2026-02-01` or blank

### leadership_hire
- **Procedure:**
  1. Check the company's LinkedIn page for recent hires in the "People" section. Filter for process development, manufacturing, CMC, or vector production leadership roles.
  2. Also check for open job postings in these functions on the company's careers page or LinkedIn jobs.
  3. Only record hires/postings in the last 60 days.
- **Format:** `Hired VP Manufacturing, 2026-04-01` | `Open role: Director Process Development` or blank

### conference_presence
- **Procedure:**
  1. Search published attendee, speaker, and sponsor lists for: Interphex, BPI West, Advanced Therapies Week (these are the currently anchored events for this play).
  2. Search for the contact's name OR the company name on those lists.
  3. Only record presence from the last 90 days.
- **Format:** `Speaker, Interphex 2026` | `Attendee, BPI West 2026` or blank

### recent_publication
- **Procedure:**
  1. Search PubMed and Google Scholar for the contact's name + AAV-related terms ("AAV", "viral vector", "gene therapy manufacturing", "downstream processing", "purification", "formulation").
  2. Only include publications from the last 12 months.
  3. Record the title, venue, and date.
- **Format:** title + venue + date, or blank

---

## Relationship-state fields

These fields prevent sending into active BD conversations, opted-out contacts, or overlapping cadences. All required.

### salesforce_engagement_status
- **Required**
- **Procedure:**
  1. Query Salesforce for activity records involving the contact's email address, or any contact at the same company domain, in the last 6 months.
  2. Look for: logged meetings, scheduled meetings, active email threads, open opportunities.
  3. Classify:
     - Activity in the last 6 months: `engaged_last_6mo` -- disqualify. This is the "Rocket rule."
     - Activity between 6 months and 2 years ago, none since: `lapsed_6mo_to_2yr` -- eligible for re-engagement.
     - Activity more than 2 years ago: `lapsed_2yr_plus` -- eligible.
     - No activity records found: `no_record` -- eligible, but flag as low-confidence. The Salesforce message-ID sync is known to be unreliable; absence of evidence is not evidence of absence.
     - Cannot query Salesforce: `unknown` -- flag for manual check before send.
  4. If `engaged_last_6mo`: disqualify. Set `enrichment_status = disqualified`, `enrichment_failed_check = salesforce_engagement_status`.
- **Format:** `engaged_last_6mo` | `lapsed_6mo_to_2yr` | `lapsed_2yr_plus` | `no_record` | `unknown`

### active_cadence_enrollment
- **Required**
- **Procedure:**
  1. Check the outreach platform for any active cadence/sequence that includes this contact's email address.
  2. If enrolled in another cadence: store the cadence name. Disqualify. Set `enrichment_failed_check = active_cadence_enrollment`.
  3. If not enrolled in any active cadence: set `none`.
- **Format:** `none` | cadence name (e.g., `PluriFreeze Q2 2026`)

### opt_out_status
- **Required**
- **Procedure:**
  1. Check Salesforce for the contact's opt-out flags: hard_bounced, do_not_contact, email_opt_out, known_status.
  2. Check the outreach platform for the same.
  3. If ANY opt-out flag is set, classify:
     - Email hard-bounced: `bounced`
     - Do-not-contact flag: `dnc`
     - Email opt-out: `opted_out`
     - Known status (BD owns this relationship): `known`
  4. If multiple flags, use the most restrictive (dnc > bounced > opted_out > known).
  5. If no flags: `clear`.
  6. If not `clear`: disqualify. Set `enrichment_failed_check = opt_out_status`.
- **Format:** `clear` | `opted_out` | `bounced` | `dnc` | `known`

### existing_customer
- **Required**
- **Procedure:**
  1. Query Salesforce for opportunity records at this company's domain.
  2. If there is a currently active opportunity or the company is tagged as an active customer: `current_customer`.
  3. If there are closed/won opportunities in the past but no current activity: `historical_customer`.
  4. If no opportunity records exist: `never`.
  5. This field does not auto-disqualify. Current customers may still be valid targets for new product lines. But the information must be surfaced so Ellie can make the call.
- **Format:** `current_customer` | `historical_customer` | `never`

---

## Scoring

After all fields are populated and before the completeness gate runs, compute a score for each company and each contact. The score is a single numeric value that reflects how many qualifying signals the record carries. It determines send priority (highest-score contacts get sent first) and provides a meaningful quality metric for the client report.

### Company score

Compute by summing the points for each signal present on the company record:

| Signal field | Condition | Points |
|-------------|-----------|--------|
| `modality_confirmed` | `true` | +5 (base -- required to pass the gate, but worth points because it's verified, not just tagged) |
| `funding_event` | populated (not blank) | +3 |
| `ind_or_stage_advance` | populated | +3 |
| `leadership_hire` | populated | +3 |
| `conference_presence` | populated | +2 |
| `recent_publication` | populated | +2 |
| `clinical_stage` | `IND-enabling` or `Phase 1` | +2 (closest to the offer's sweet spot) |
| `clinical_stage` | `Phase 1/2` or `Phase 2` | +1 |
| `clinical_stage` | `preclinical` | +0 |

**Procedure:**
1. Start at 0.
2. Add points for each signal present.
3. Store the result in `company_score` on the company record.
4. Maximum possible: 20. A company with no signals beyond confirmed modality scores 5.

### Contact score

Compute by combining the company score with contact-level signals:

| Signal | Condition | Points |
|--------|-----------|--------|
| Company score | inherited | (value of `company_score`) |
| `tenure_months` | > 12 | +2 |
| `tenure_months` | 3-12 | +1 |
| `tenure_months` | < 3 or `unknown` | +0 |
| `email_verification_status` | starts with `verified` | +1 |
| `seniority` | `director` or `senior_director` or `head_of` | +2 (primary buyer level) |
| `seniority` | `vp` or `svp` | +1 |
| `seniority` | `c_suite_small_biotech` | +1 |
| `seniority` | `senior_scientist` | +0 |

**Procedure:**
1. Start with the contact's company's `company_score`.
2. Add contact-level points.
3. Store the result in `contact_score` on the contact record.
4. Maximum possible: 26 (20 company + 6 contact). A contact at a no-signal company with no tenure data and unverified email scores 5.

### Using scores

- Sort cadence-ready contacts by `contact_score` descending. Highest-score contacts get sent first.
- The client report includes the score distribution: median, min, max, and what percentage of shipped contacts score above 10 (a company with at least one why-now signal + a contact with verified email and 12+ months tenure).
- Scores are NOT a gate. A contact that passes the 9-check gate ships regardless of score. Scores determine priority and provide a quality signal for the client report.

---

## Enrichment completeness gate

After enriching all fields, evaluate each record against these 9 checks in order. Stop at the first failure.

| Check | Field | Pass condition | Fail action |
|-------|-------|----------------|-------------|
| 1 | all required fields | every required field is populated | `enrichment_incomplete`, name the missing fields |
| 2 | `modality_confirmed` | `true` | `held_for_review` |
| 3 | `current_employer_match` | `true` | `disqualified` |
| 4 | `role_status` | `active` | `disqualified` |
| 5 | `email` | present, corporate domain | `enrichment_incomplete` |
| 6 | `email_domain_match` | `true` | `held_for_review` |
| 7 | `opt_out_status` | `clear` | `disqualified` |
| 8 | `active_cadence_enrollment` | `none` | `disqualified` |
| 9 | `company_status` | `active` | `disqualified` |

Write the result to `enrichment_status`. If disqualified or held, write the check name to `enrichment_failed_check`.

---

## Post-enrichment quality report

After all records are enriched, compute these metrics and report them. These are diagnostic -- they inform Nick's decision on whether to ship, not a gate that blocks shipping.

**Always report both tables. A report that only covers contacts is incomplete. The list is companies AND contacts.**

### Company metrics

| Metric | How to compute |
|--------|----------------|
| Total companies in play | count of companies in `play_company_membership` |
| Companies active | count where `company_status = active` |
| Companies disqualified | count where `enrichment_status = disqualified`, grouped by `enrichment_failed_check` |
| Companies held for review | count where `enrichment_status = held_for_review` |
| Modality confirmed | (companies with `modality_confirmed = true`) / (active companies) |
| Company score distribution | min, median, max of `company_score` across active companies |
| Companies with 0 contacts | count of active companies with no enrichment-complete contacts |

### Contact metrics

| Metric | How to compute |
|--------|----------------|
| Total contacts in play | count of contacts in `play_contact_membership` |
| Contacts enrichment-complete | count where `enrichment_status` is `enrichment_complete` or `cadence_ready` |
| Contacts disqualified | count, grouped by `enrichment_failed_check` |
| Contacts incomplete | count, grouped by missing field |
| Email coverage | (contacts with email populated) / (enrichment-complete contacts) |
| Email verified rate | (contacts with `email_verification_status` starting with "verified") / (contacts with email) |
| LinkedIn coverage | (contacts with `linkedin_url` populated) / (enrichment-complete contacts) |
| Active employment rate | (contacts with `role_status = active` AND `tenure_months != unknown`) / (enrichment-complete contacts) |
| Freshness | (contacts with enrichment timestamp within 90 days) / (enrichment-complete contacts) |
| Contact score distribution | min, median, max of `contact_score` across enrichment-complete contacts |
| Contacts scoring above 10 | count and percentage |

Report both tables. Nick decides whether to ship.

---

## Enrichment session log

After every batch, append a structured entry to `clients/teknova/revops/context/play006-enrichment-log.md`. This log accumulates across sessions and is the source material for the client report. Do not skip this step.

### Entry format

```markdown
## Batch [N] -- [date] [time]

**Session stats:** [X] companies processed, [Y] contacts found, [Z] emails verified
**Credits consumed:** Explorium [N], Hunter [N]
**Credits remaining:** Explorium [N], Hunter [N]

### Per-company results

#### [Company Name] ([domain]) -- [enrichment_complete | enrichment_incomplete]
- **Headcount:** [N] | **HQ:** [city, state] | **Stage:** [clinical stage]
- **Contacts found:** [N] | **Contacts verified:** [N] | **Emails verified:** [N]
- [Contact Name] -- [Title] -- [function_classification] -- [email status]
- [Contact Name] -- [Title] -- [function_classification] -- [email status]
- **Excluded contacts:** [Name (reason), Name (reason)]
- **Gaps/Notes:** [why contacts were thin, Explorium gaps, fallback attempts, notable findings]

(Repeat per company)

### Batch notes
- [Any cross-company observations, provider issues, data quality patterns]
```

### What to capture

- **Every company outcome with a reason.** "Enrichment_incomplete: 1-10 employees, Explorium returned 0 prospects" is useful. "Enrichment_incomplete" alone is not.
- **Every excluded contact with the exclusion reason.** "Opus Genetics: 3 found, all excluded (Accounting, Finance, Medical Affairs)" tells the client you found people but they weren't the right people.
- **Provider gaps by name.** "Lacerta: Explorium returned 0 prospects despite 51-200 headcount. Fallback to Exa web search found 2 ICP candidates (Payel Chaudhuri Sr Dir AAV Manufacturing, Gary Todd VP Head of Technologies)." This shows the effort.
- **Notable contact backgrounds.** "Kelly (Atsena SVP CMC): Sanofi Genzyme + Biogen gene therapy ops pedigree" or "Nolan (Taysha CEO): led Zolgensma launch at AveXis." This is the context Jenn cares about.
- **Data quality flags.** "Albright (Affinia CSO): constructed email calbright@affiniatx.com was invalid. Left blank." Honesty about gaps builds more trust than hiding them.

### How this feeds the client report

When Nick is ready to present to the client, a separate step reads the full enrichment log and compiles it into a Google Doc with:
- Executive summary (TAM, companies qualified, contacts verified)
- Per-company narratives built from the log entries (why this company, who we found, what signals exist)
- Exclusion audit (every company and contact that was cut, with reasons -- this is the "overwhelming detail" that proves rigor)
- Data quality transparency (provider gaps, email failures, coverage rates -- presented as evidence of thoroughness, not as problems)
- Score distribution and what the scores mean

The log is the raw material. The report is the narrative. Don't try to write the report during enrichment -- just capture the log entries accurately.

---

## Handoff to cadence

After enrichment is complete and the quality report is generated:

1. **Mark records.** Set `enrichment_status = cadence_ready` on every record that passed the 9-check gate. This is immediate. Do not propose additional passes, refreshes, or optimization steps. The gate passed. The records are done.
2. **Enter cadence.** Cadence-ready records go directly into the outreach cadence. The 9-check gate IS the approval -- no per-contact human review step. Records that are `enrichment_incomplete` stay incomplete and go on the sourcing backlog for the next wave. They are not a reason to delay shipping the records that passed.
3. **Generate client report.** Produce a shareable document (Google Doc or equivalent) that shows the client the full rigor behind the list:
   - Total addressable market: how many companies exist, how they were found, which providers surfaced them
   - Classification decisions: which companies qualified, which were cut and why (specific per-company reasons)
   - Contact quality: how contacts were verified, what percentage were disqualified and for what reasons (stale employment, wrong function, wrong modality)
   - Quality metrics: the diagnostic table from the post-enrichment quality report
   - Per-field provenance: where every data point came from and when it was last verified
   - The goal is to overwhelm with detail -- show the client exactly how much work went into ensuring every contact is the right person at the right company with the right role
4. **Monitor cadence outcomes.** Track bounces, replies, and opt-outs. These feed back into the enrichment spec and segment criteria for the next play:
   - Bounces expose email verification gaps -- tighten the spec
   - Wrong-person replies expose classification gaps -- tighten the spec
   - Positive replies validate the targeting -- note what worked

This is not optional. Every play ends with Ellie's review, not with enrichment-complete status.

---

## What this document does NOT cover

- **Who qualifies for the segment** -- see `revops-segment-aav-gene-therapy-ellie-outreach.md`
- **What's being pitched** -- see `revops-offer-aav-gene-therapy-ellie-outreach.md`
- **Copy, tone, or sequence design** -- separate artifact
- **Database column mapping** -- this spec names fields by their semantic purpose. The enrichment agent maps them to whatever database columns exist per the migration.
