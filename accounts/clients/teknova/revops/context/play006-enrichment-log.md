# PLAY-006 Enrichment Log

Accumulated session-by-session enrichment results. Each batch appends an entry. This file is the source material for the client report.

---

## Batch 0 (POC) -- 2026-05-08 morning

**Session stats:** 3 companies processed, 4 contacts found, 4 emails verified
**Credits consumed:** Explorium 27, Hunter 0 (key not configured at time of POC)
**Credits remaining:** Explorium 1,676, Hunter ~7,469

### Per-company results

#### Latus Bio (latusbio.com) -- enrichment_complete
- **Headcount:** 11-50 | **HQ:** Philadelphia, PA | **Stage:** preclinical
- **Contacts found:** 1 | **Contacts verified:** 1 | **Emails verified:** 1
- Jang-Ho Cha -- CSO & CMO -- c_suite_small_biotech -- Explorium valid (j.cha@latus.bio)
- **Gaps/Notes:** Only 1 VP+ contact. Company is 11-50 employees. Thin but real.

#### Myrtelle (myrtellegtx.com) -- enrichment_complete
- **Headcount:** 11-50 | **HQ:** Wakefield, MA | **Stage:** Phase 1/2
- **Contacts found:** 3 | **Contacts verified:** 2 (1 Finance excluded) | **Emails verified:** 2
- Debaditya Bhattacharya, PhD -- VP CMC Dev & External Mfg -- cmc -- Explorium valid
- Joshua Merritt, PhD -- SVP Head of Technical Operations -- manufacturing -- Explorium valid
- **Excluded contacts:** VP Finance (excluded function)
- **Gaps/Notes:** Single-source discovery (Perplexity only) still produced 2 solid contacts. Bhattacharya transitioned consultant→VP at same company Jul 2025.

#### Apertura Gene Therapy (aperturagtx.com) -- enrichment_complete
- **Headcount:** 11-50 | **HQ:** New York, NY | **Stage:** preclinical
- **Contacts found:** 1 | **Contacts verified:** 1 | **Emails verified:** 1
- Jorge Santiago-Ortiz, PhD -- VP CMC & Regulatory Affairs -- cmc -- Explorium valid
- **Gaps/Notes:** Domain correction: Supabase had `aperturatx.com`, real domain is `aperturagtx.com`. Wrong domain would have silently broken email finding. Broad/Harvard spinout, Deerfield-backed.

### Batch notes
- First test of Clay-free stack. Explorium + Exa + Hunter waterfall validated.
- `enrich-prospects` contacts enrichment costs 5 credits/contact. Optimization: skip this, use Hunter directly (1 credit) after getting name from profiles (1 credit).

---

## Batch 1 -- 2026-05-08 ~11:00am

**Session stats:** 10 companies processed, 11 contacts found, 9 emails verified
**Credits consumed:** Explorium ~20, Hunter ~18
**Credits remaining:** Explorium ~1,650, Hunter ~7,450

### Per-company results

#### Jaguar Gene Therapy -- enrichment_complete
- **Contacts found:** 2 | **Emails verified:** 2
- Robert Mancino -- SVP Tech Ops -- manufacturing -- Hunter verified
- Newton -- SVP Dev Ops -- manufacturing -- Hunter verified
- **Gaps/Notes:** Mancino returned to Jaguar Feb 2025 after stint at Advanced Medicine Partners.

#### Odylia Therapeutics -- enrichment_complete
- **Contacts found:** 1 | **Emails verified:** 1
- Ashley Winslow -- CEO/CSO -- c_suite_small_biotech -- Hunter verified
- **Gaps/Notes:** 1-10 employees. Thin but CEO/CSO is the decision maker at this size.

#### Affinia Therapeutics -- enrichment_complete
- **Contacts found:** 2 | **Emails verified:** 1
- Rob May -- SVP Tech Ops/CTO -- manufacturing -- Hunter verified. AveXis/Amgen manufacturing background.
- Charles Albright -- CSO -- cso -- NO EMAIL (constructed calbright@affiniatx.com was invalid)
- **Gaps/Notes:** Albright is former Editas CSO. High-value contact but no deliverable email found.

#### Atsena Therapeutics -- enrichment_complete
- **Contacts found:** 3 | **Emails verified:** 3
- Kelly -- SVP CMC -- cmc -- Hunter verified. Deep gene therapy ops pedigree (Sanofi Genzyme, Biogen).
- Mouillesseaux -- VP CMC -- cmc -- Hunter verified. Prior VP Viral Vector at StrideBio.
- Shannon Boye -- Founder/CSO -- cso -- Hunter verified. UF professor simultaneously (non-primary role).

#### REGENXBIO Inc -- enrichment_complete
- **Contacts found:** 1 | **Emails verified:** 1
- Ye Liu -- VP Gene Therapy Research -- process_dev -- Hunter verified. At REGENXBIO since 2017, deep AAV vector expertise.
- **Gaps/Notes:** 201-500 employees. 4 pages of Explorium prospects searched. Pages 1-4 returned Legal, IT, Clinical, Regulatory, HR, Translational Science. No manufacturing/PD contacts surfaced. Ye Liu was the only ICP match.

#### Taysha Gene Therapies -- enrichment_complete
- **Contacts found:** 2 | **Emails verified:** 2
- RA Nolan -- CEO -- c_suite_small_biotech -- Hunter verified. Led Zolgensma launch at AveXis.
- Andy Lorenc -- VP Engineering and Operations -- manufacturing -- Hunter verified. Prior Dynavax Sr Dir Tech Ops.

#### Ambulero -- enrichment_incomplete
- **Contacts found:** 0
- **Gaps/Notes:** 1-10 employees. Explorium returned 0 prospects. Too small for VP-level contacts in any database.

#### Opus Genetics -- enrichment_incomplete
- **Contacts found:** 0 ICP matches
- **Excluded contacts:** 3 found (Accounting, Finance, Medical Affairs -- all excluded by function filter)
- **Gaps/Notes:** Company has contacts but none in process dev/manufacturing/CMC.

#### PTC Therapeutics -- enrichment_incomplete
- **Contacts found:** 0 ICP matches
- **Gaps/Notes:** 1,001-5,000 employees. Likely exceeds 2,000 ICP cap. 4 pages of Explorium prospects returned Legal, IT, Clinical Ops, Clinical Dev only. Manufacturing/PD contacts buried too deep or not indexed.

#### Lacerta Therapeutics -- enrichment_incomplete
- **Contacts found:** 0 from Explorium (gap)
- **Gaps/Notes:** 51-200 employees but Explorium returned 0 prospects on both attempts. Exa web search found 2 prime ICP candidates: Payel Chaudhuri (Sr Dir AAV Manufacturing) and Gary Todd (VP Head of Technologies). Need Apify verification before email spend. Lacerta email pattern confirmed: {first}{l}@lacertatx.com (garyt@lacertatx.com verified via Hunter domain search).

### Batch notes
- 6/10 companies produced ICP contacts. 4 gaps: too small (Ambulero), wrong functions only (Opus), too large (PTC), Explorium coverage gap (Lacerta).
- CHECK constraint on `company_type_primary` requires lowercase `biopharma`/`cdmo`. Agent hit this again despite it being documented. Added all CHECK values to CLAUDE.md quick reference.
- Hunter email finding: 9/11 success rate. The 2 failures were Albright (no email at domain) and the constructed pattern attempt.

---

## Batch 2 -- 2026-05-08 ~12:00pm

**Session stats:** 10 companies processed (8 enriched, 2 disqualified), 13 contacts found, 11 emails verified
**Credits consumed:** Explorium ~34 (16 wasted on failed enrich-prospects batch + ~13 profiles + ~5 enrich-business), Hunter 11
**Credits remaining:** Explorium ~1,616, Hunter ~7,438

### Pre-batch: Lacerta Therapeutics follow-up

Ran Explorium `match-prospects` for Payel Chaudhuri (Sr Dir AAV Manufacturing) and Gary Todd (VP Head of Technologies) -- 0 matches returned for both. Flagged as Apify follow-up. No credits consumed.

### Per-company results

#### Andelyn Biosciences (andelynbio.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Columbus, OH | **Type:** biopharma
- **Contacts found:** 3 | **Emails verified:** 3
- Rajiv Vaidya -- Head of Manufacturing Science & Technology -- head_of / manufacturing -- Hunter valid (97)
- Andrew Moreo -- Head of Process Development and Preclinical Manufacturing -- head_of / process_dev -- Hunter valid (97)
- Mark Ervin -- Director of Manufacturing -- director / manufacturing -- Hunter valid (98)

#### Rocket Pharmaceuticals (rocketpharma.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Cranbury, NJ | **Type:** biopharma
- **Contacts found:** 3 | **Emails verified:** 3
- Sushmita Roy -- VP Technical Development & CMC Operations -- vp / cmc -- Hunter valid (96)
- Jeff Pawar -- Senior Director of Site Operations -- senior_director / manufacturing -- Hunter valid (98)
- Akram Ramdan -- Associate Director, Manufacturing Science & Technology -- director / manufacturing -- Hunter valid (99)

#### Adverum Biotechnologies (adverum.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Redwood City, CA | **Type:** biopharma
- **Contacts found:** 2 | **Emails verified:** 1
- Anders Chan -- Senior Director, External Manufacturing -- senior_director / manufacturing -- Hunter valid (98)
- Robert Sallee -- Senior Manager External Manufacturing -- director / manufacturing -- NO EMAIL (Hunter returned nothing)

#### Ultragenyx Pharmaceutical (ultragenyx.com) -- enrichment_complete
- **Headcount:** 501-1000 | **HQ:** Novato, CA | **Type:** biopharma | **Large pharma filter applied (tenure >= 60mo)**
- **Contacts found:** 2 | **Emails verified:** 2
- Devang Shah -- Executive Director, Head of CMC Manufacturing -- head_of / cmc -- Hunter accept_all (88) -- 91mo tenure
- Brian Hoadley -- Senior Manager Contract Manufacturing Gene Therapy -- director / manufacturing -- Hunter accept_all (97) -- 87mo tenure
- **Excluded:** Alex Houben (QC role), George Wyman (below large pharma tenure threshold)
- **Gaps:** Rob Johnson (Sr Director Biologics & mRNA Manufacturing) -- corrupt Explorium prospect ID (38 chars vs required 40), could not enrich

#### Forge Biologics (forgebiologics.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Grove City, OH | **Type:** biopharma
- **Contacts found:** 3 | **Emails verified:** 2
- Frank Agbogbo -- VP Process Development -- vp / process_dev -- Hunter valid (96)
- Aga Gascoyne -- Senior Director, GMP Manufacturing -- senior_director / manufacturing -- Hunter valid (99)
- Kiko Montes -- Associate Director Plasmids Manufacturing -- director / manufacturing -- existing record in DB (cmontes@forgebiologics.com), Hunter returned nothing but email preserved

#### Rejuvenate Bio -- enrichment_incomplete
- **Contacts found:** 0
- **Gaps/Notes:** 11-50 employees. Only CEO/CSO surfaced. No process dev/manufacturing roles at director+ level in Explorium. Uses AAV8 liver-tropic vectors (modality confirmed via Exa -- rejuvenatebio.com/platform).

#### Locanabio, Inc -- enrichment_incomplete
- **Contacts found:** 0
- **Gaps/Notes:** RNA splicing platform company using AAV9 for snRNA delivery (confirmed via Exa). No manufacturing/PD titles in Explorium. Platform-focused, likely outsources manufacturing.

#### Dyno Therapeutics -- enrichment_incomplete
- **Contacts found:** 0
- **Gaps/Notes:** Capsid engineering / CapsidMap platform. No traditional manufacturing roles in Explorium. Engineering-only team profile.

#### Homology Medicines -- disqualified
- **Reason:** Merged with Q32 Bio (March 2024). All AAV gene therapy programs halted. Now operating as Q32 Bio (autoimmune biologics). No longer an AAV company.
- **company_status:** acquired

#### American Gene Technologies -- disqualified
- **Reason:** Lentiviral-only platform (AGT103-T, LV vectors). Company website explicitly argues against AAV. No AAV programs.
- **modality_confirmed:** false

### Batch notes
- 5/8 enriched companies produced ICP contacts. 3 gaps: small/platform companies (Rejuvenate, Locanabio, Dyno).
- 2 companies disqualified during modality/status verification: Homology (acquired) and AGT (lentiviral-only).
- Explorium enrich-prospects returned empty profiles on first batch (wrong schema path `data[i].profiles` vs `data[i].data`). 16 credits consumed on failed call. Fixed on retry.
- Ultragenyx large pharma filter (>500 employees): applied 60mo tenure minimum. Reduced candidate pool from 7 to 2 viable contacts.
- Lacerta Apify follow-up still open: Payel Chaudhuri and Gary Todd unmatched in Explorium. Apify LinkedIn scraper needed.
- Rob Johnson (Ultragenyx) gap: corrupt Explorium prospect ID cannot be enriched via current stack. Apify or Apollo follow-up if needed.

---

## Batch 3 -- 2026-05-08 ~12:30pm

**Session stats:** 10 companies processed (7 enrichment_complete, 2 enrichment_incomplete, 1 disqualified), 17 contacts written (13 with email, 4 email_missing)
**Credits consumed:** Explorium ~36 (8 enrich-business + ~28 enrich-prospects profiles), Hunter ~15
**Credits remaining:** Explorium ~1,580, Hunter ~7,423

### Per-company results

#### Sarepta Therapeutics (sarepta.com) -- enrichment_complete
- **Headcount:** 1,001-5,000 | **HQ:** Cambridge, MA | **Type:** biopharma | **Large pharma filter applied (tenure >= 60mo)**
- **Contacts found:** 2 (of ~13 ICP candidates; 11 failed 60mo tenure requirement)
- Matthew Provencal -- Director, Manufacturing -- director / manufacturing -- Hunter verified (66mo tenure)
- Austin Raper -- Director, Process Development -- director / process_dev -- Hunter verified (72mo tenure)
- **Excluded:** Ken Hawkins (title changed from Head of Global Manufacturing to VP Strategy & Operations -- function no longer ICP), 10+ others below 60mo tenure threshold
- **Gaps/Notes:** Large pharma filter is the primary constraint here, not contact discovery. Explorium returned rich candidate pool but most are too junior or too new.

#### Solid Biosciences (solidbio.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Waltham, MA | **Type:** biopharma
- **Contacts found:** 3 (2 with email, 1 email_missing)
- Jared Simons -- VP Manufacturing -- vp / manufacturing -- Hunter verified (63mo)
- Ben Wright -- VP Process Development -- vp / process_dev -- Hunter verified (52mo)
- Stewart C. -- Senior Director, Manufacturing -- senior_director / manufacturing -- NO EMAIL (last name truncated by Explorium privacy filter; Hunter domain search returned no match)
- **Disqualified during enrichment:** Louise M. Perry (left company, current employer mismatch), Gonzalo Milet (moved to Voyager Therapeutics, employment_status=ended)
- **Gaps/Notes:** Explorium returned 0 prospects on initial fetch. Contacts found via Exa LinkedIn search + Hunter domain search. Stewart C. last name still unknown.

#### Shape Therapeutics (shapetx.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Seattle, WA | **Type:** biopharma | **Previously held_for_review -- confirmed AAV**
- **Contacts found:** 2 (1 with email, 1 email_missing)
- Collin Hauskins -- VP Process Development -- vp / process_dev -- Hunter verified (13mo) -- linkedin.com/in/collinhauskins
- Ken Prentice -- SVP Process Development -- svp / process_dev -- NO EMAIL (Hunter domain search returned no match)
- **Modality verification:** Confirmed AAV via Exa -- uses AAV-packaged guide RNAs, CNS-targeting AAV capsid SHP-DB1, "next-generation AAVs" platform. Changed from held_for_review to enrichment_complete.
- **Gaps/Notes:** Explorium returned 0 prospects initially. Contacts found via Exa web search for AAV vector engineering/process development roles.

#### Tenaya Therapeutics (tenayatherapeutics.com) -- enrichment_incomplete
- **Headcount:** 51-200 | **HQ:** South San Francisco, CA | **Type:** biopharma
- **Contacts found:** 2 | **Emails verified:** 0
- Scott Bertch -- VP Manufacturing -- vp / manufacturing -- NO EMAIL (Hunter domain search returned 0 results for tenayatherapeutics.com)
- Kathy Ivey -- SVP Process Development -- svp / process_dev -- NO EMAIL
- **Reason for incomplete:** Hunter domain search returned no emails. Contacts confirmed employed at Tenaya via Explorium profiles but no email discoverable.
- **Follow-up:** Apify `dev_fusion/Linkedin-Profile-Scraper` on both LinkedIn profiles ($0.01/profile) may surface emails.

#### Capsida Biotherapeutics (capsida.com) -- enrichment_complete
- **Headcount:** 11-50 | **HQ:** Salt Lake City, UT | **Type:** biopharma
- **Contacts found:** 1 | **Emails verified:** 1
- Rob Murphy -- Chief Manufacturing & Quality Officer -- c_suite_small_biotech / manufacturing -- Hunter verified (26mo) (rob.murphy@capsida.com)
- **Gaps/Notes:** Rob Murphy's title contains "Quality" which initially triggered the ICP exclusion filter. Manually rescued -- CMQO at a sub-50 biotech is unambiguously ICP. ICP filter keyword `quality` fires too broadly at small companies.

#### Encoded Therapeutics (encoded.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** South San Francisco, CA | **Type:** biopharma
- **Contacts found:** 1 | **Emails verified:** 1
- Andy Stober -- COO -- c_suite_small_biotech / manufacturing -- Hunter verified (80mo) (astober@encoded.com)

#### Virovek (virovek.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Hayward, CA | **Type:** cdmo
- **Contacts found:** 3 | **Emails verified:** 3
- Anastasiya Smith -- VP Process Development -- vp / process_dev -- Explorium verified (21mo)
- Tsvetelina Pencheva Hoang -- SVP Process Development -- svp / process_dev -- Explorium verified (21mo)
- Tara Shahim -- Director, Process Development -- director / process_dev -- Explorium verified (19mo)

#### Genezen Laboratories (genezen.com) -- enrichment_complete
- **Headcount:** ~215-254 | **HQ:** Lexington, MA | **Type:** cdmo
- **Contacts found:** 3 | **Emails verified:** 3 (catch_all domain)
- Michael Bennett -- Senior Director, Process Development -- senior_director / process_dev -- Hunter domain search (catch_all)
- Garrett Donnelly -- Director, Manufacturing -- director / manufacturing -- Hunter domain search (catch_all)
- Catherine Cerutti -- Director, Manufacturing -- director / manufacturing -- Hunter domain search (catch_all)
- **Gaps/Notes:** Explorium returned no business match for Genezen. Firmographics written manually from Exa research. Email domain is genezen.com (not genezenlabs.com which is in Supabase as domain -- needs correction). Hunter domain search on genezen.com returned all 3.

#### BridgeBio Gene Therapy (bridgebio.com) -- enrichment_incomplete
- **Reason:** 501-1,000 employees -- large pharma filter applied (tenure >= 60mo). Single ICP candidate Ben Collman had only 15mo tenure -- fails filter. No qualifying contacts.
- **Contacts found:** 0 qualifying

#### Expression Therapeutics -- disqualified
- **Reason:** Lead program is lentiviral HSC gene therapy for Hemophilia A (not AAV). Company licenses its AAV tech to others but does not operate AAV programs internally. Not an ICP.
- **modality_confirmed:** false

### Batch notes
- 7/10 companies produced ICP contacts. BridgeBio failed large pharma tenure filter (no qualifying contacts). Tenaya enriched but 0 emails found.
- Expression Therapeutics disqualified as lentiviral company. Shape Therapeutics upgraded from held_for_review to enrichment_complete after modality confirmation.
- Large pharma filter (>500 employees, 60mo+ tenure) remains the primary yield killer for large accounts. Sarepta had 13 ICP candidates but only 2 cleared.
- Stewart C. (Solid Bio) and Ken Prentice (Shape) have no email and unknown/partial last name. Apify LinkedIn follow-up is the next step for Tenaya, Stewart, and Ken.
- Capsida CMQO: "quality" keyword in ICP filter excludes C-suite officers with quality in their title at small companies. Filter needs a carve-out for c_suite_small_biotech seniority.
- Genezen domain mismatch: Supabase has genezenlabs.com, real email domain is genezen.com. Correction needed before Airtable push.

---

## Batch 4 (final) -- 2026-05-08 ~1:00pm

**Session stats:** 13 companies processed (12 enrichment_complete, 1 disqualified/acquired), 21 contacts written (13 with email, 8 email_missing)
**Credits consumed:** Explorium 35 (11 enrich-business + 24 enrich-prospects profiles across 2 passes), Hunter 13
**Credits remaining:** Explorium ~1,545, Hunter ~7,410
**Play state after batch:** 54 companies total in play, 222 contacts in play_contact_membership

### Pre-batch items resolved

- **Genezen domain conflict:** UPDATE to genezen.com blocked by 23505 unique constraint -- a separate orphan "Genezen" record (not in PLAY-006) already holds that domain. Genezen Laboratories remains at genezenlabs.com in Supabase. Manual resolution needed before Airtable push. Flagged for Nick.
- **AGTC / Beacon entity situation:** Explorium returned identical business_id for both Applied Genetics Technologies Corp and Beacon Therapeutics. Exa confirmed AGTC was acquired by Syncona (Nov 2022) and relaunched as Beacon Therapeutics (June 2023). Resolution: AGTC marked acquired/disqualified; Beacon enriched as the surviving operating entity.
- **Grace Science -- no Explorium match:** match-business returned null. Exa found the company (10 employees, Menlo Park CA, AAV9 GS-100 Phase 1/2/3). Single contact (Brendan Beahm) found via Andelyn press release and manual verification.

### Per-company results

#### 4D Molecular Therapeutics (4dmt.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Emeryville, CA | **Type:** biopharma
- **Contacts found:** 1 | **Emails found:** 0
- Keenan Bashour -- VP Process Development -- vp / process_dev -- NO EMAIL (Hunter returned no match)
- **Gaps/Notes:** Strong ICP contact but email missing.

#### Abeona Therapeutics (abeonatherapeutics.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Dallas, TX | **Type:** biopharma
- **Contacts found:** 1 | **Emails found:** 0
- Clarisse Benne-Rogat -- Director, Process Development -- director / process_dev -- NO EMAIL
- **Gaps/Notes:** Director-level PD contact confirmed. No email surfaced via Hunter.

#### Avirmax (avirmax.com) -- enrichment_complete
- **Headcount:** 11-50 | **HQ:** South San Francisco, CA | **Type:** biopharma
- **Contacts found:** 3 | **Emails found:** 2
- Shengjiang Liu -- President/CEO -- c_suite_small_biotech / cso -- NO EMAIL
- June Song -- Director, Operations -- director / manufacturing -- Hunter valid (june.song@avirmax.com)
- Jianwu Chen -- Senior Scientist -- senior_scientist / process_dev -- Hunter valid (jianwu.chen@avirmax.com)
- **Gaps/Notes:** Explorium returned 0 on first fetch-prospects pass (title filter too restrictive). Second pass without title filter surfaced all 3.

#### Beacon Therapeutics (beacontx.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** London, UK (US ops Waltham, MA) | **Type:** biopharma
- **Contacts found:** 0 via Explorium
- **Gaps/Notes:** Relaunched post-AGTC entity. Explorium data shared with AGTC business_id. No US manufacturing/PD contacts surfaced. Contact sourcing may require a separate LinkedIn pass.

#### ElevateBio (elevate.bio) -- enrichment_complete
- **Headcount:** 501-1000 | **HQ:** Waltham, MA | **Type:** biopharma | **Large pharma filter applied (tenure >= 60mo)**
- **Contacts found:** 1 qualifying (of 4 ICP candidates) | **Emails found:** 0
- Cynthia Porter Riggins -- VP CMC Regulatory Affairs -- vp / cmc -- NO EMAIL (68mo tenure -- passes filter)
- **Failed tenure filter (60mo):** Jeffrey Cram (VP Gene Therapy Dev, 10mo), Adam Hallet (VP Viral Vector Dev, 10mo), Chris Shumway (Director Viral Vector Dev, 20mo)
- **Gaps/Notes:** 3 of 4 ICP candidates too new (all joined ~2024).

#### Grace Science (gracescience.com) -- enrichment_complete
- **Headcount:** ~10 | **HQ:** Menlo Park, CA | **Type:** biopharma | **Manual enrichment (no Explorium match)**
- **Contacts found:** 1 | **Emails found:** 1
- Brendan Beahm -- Executive Director, R&D Operations -- head_of / process_dev -- Manual (brendan@gracescience.com, confirmed via Andelyn press release)
- **Gaps/Notes:** Company too small for Explorium coverage. All firmographics sourced via Exa.

#### Kriya Therapeutics (kriyatx.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Research Triangle Park, NC | **Type:** biopharma
- **Contacts found:** 3 | **Emails found:** 2
- Rich Guerra -- VP Manufacturing -- vp / manufacturing -- Hunter valid (rguerra@kriyatx.com)
- Kristin Marks -- VP Manufacturing Science & Technology -- vp / manufacturing -- NO EMAIL
- Rob Ballard -- Associate Director, Manufacturing -- director / manufacturing -- Hunter valid (rballard@kriyatx.com)
- **Gaps/Notes:** Supabase domain was kriyatherapeutics.com; Explorium confirmed real site is kriyatx.com. Used kriyatx.com for Hunter.

#### Lexeo Therapeutics (lexeotx.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** New York, NY | **Type:** biopharma
- **Contacts found:** 2 | **Emails found:** 1
- Sharon Driscoll -- Director, Operations -- director / manufacturing -- NO EMAIL
- Aileen Rottinger -- Associate Director, Analytical Development -- director / process_dev -- Hunter valid (arottinger@lexeotx.com)
- **Gaps/Notes:** Second fetch-prospects pass (no title filter) required to surface contacts.

#### Neurogene (neurogene.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Austin, TX | **Type:** biopharma
- **Contacts found:** 2 | **Emails found:** 2
- Anju Mahesh -- VP Regulatory Affairs CMC -- vp / cmc -- Hunter valid (anju.mahesh@neurogene.com)
- Craig Hebel -- Head of Manufacturing -- head_of / manufacturing -- Hunter valid (craig.hebel@neurogene.com)

#### Ocugen (ocugen.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Malvern, PA | **Type:** biopharma
- **Contacts found:** 1 | **Emails found:** 0
- Michael Blackton -- VP Manufacturing & Supply -- vp / manufacturing -- NO EMAIL
- **Gaps/Notes:** Hunter returned no match for Blackton.

#### Passage Bio (passagebio.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Philadelphia, PA | **Type:** biopharma
- **Contacts found:** 4 | **Emails found:** 4
- Susan Browne -- CSO -- c_suite_small_biotech / cso -- Hunter valid (sbrowne@passagebio.com)
- Eden Fucci -- SVP, Head of Technical Operations -- svp / manufacturing -- Hunter valid (efucci@passagebio.com)
- Steve Krausert -- VP Supply Chain -- vp / manufacturing -- Hunter valid (skrausert@passagebio.com)
- Bin Lu -- Senior Scientist, Process Development -- senior_scientist / process_dev -- Hunter valid (blu@passagebio.com)
- **Gaps/Notes:** Second fetch-prospects pass required. Best slate in Batch 4: 4 contacts, 4 emails verified.

#### Voyager Therapeutics (voyagertherapeutics.com) -- enrichment_complete
- **Headcount:** 51-200 | **HQ:** Lexington, MA | **Type:** biopharma
- **Contacts found:** 2 | **Emails found:** 2
- Jay Hou -- VP, Vector Engineering -- vp / process_dev -- Hunter valid (jhou@voyagertherapeutics.com)
- Mathieu Nonnenmacher -- VP Gene Therapy -- vp / process_dev -- Hunter valid (mnonnenmacher@voyagertherapeutics.com)
- **Gaps/Notes:** Explorium returned 2 false positives (Milet now at Solid Bio; Collman now at BridgeBio). Both disqualified via employer mismatch.

#### Applied Genetics Technologies Corp (AGTC) -- disqualified
- **Reason:** Acquired by Syncona Ltd (Nov 2022). Relaunched as Beacon Therapeutics (June 2023). No longer an independent operating entity.
- **company_status:** acquired

### Batch notes
- Two fetch-prospects passes required for 3 small biotechs (Avirmax, Lexeo, Passage Bio): first with title filter, then without. Pattern worth standardizing for companies <50 employees.
- Large pharma filter cost 3 ElevateBio contacts (all joined ~2024, 10-20mo tenure). Filter is working correctly.
- Grace Science manual enrichment: Exa for firmographics + press release for contact. Works but is slow (~15 min). No Explorium coverage at 10 employees.
- 8 of 21 contacts written with email_missing. Apify dev_fusion/Linkedin-Profile-Scraper ($0.01/profile) is the recovery path for high-value missing emails.
- Beacon Therapeutics produced 0 contacts. UK HQ limits US-addressable contacts in Explorium. Separate sourcing pass needed.
- Seniority edge: "associate director" maps to director; "vice president" maps to vp. Both confirmed correct per spec.

### Open follow-ups carried forward
- Genezen domain conflict: orphan record blocks domain update. Manual resolution needed before Airtable push.
- Tenaya Therapeutics (Batch 3): Scott Bertch and Kathy Ivey confirmed employed but 0 emails. Apify LinkedIn path.
- Stewart C. (Solid Bio, Batch 3): last name truncated by Explorium. Apify needed.
- Ken Prentice (Shape, Batch 3): no email. Apify needed.
- Lacerta Therapeutics (Batch 1): Payel Chaudhuri and Gary Todd unmatched in Explorium and match-prospects. Apify needed.
- Rob Johnson (Ultragenyx, Batch 2): corrupt Explorium prospect ID (38 chars). Cannot enrich via current stack.
- Beacon Therapeutics: 0 contacts. US staff sourcing via LinkedIn required.
