# Contact Discovery: Why Some Companies Returned Zero Contacts

## What we ran

24 AAV gene-therapy companies (the May 22 cull, after the Airtable-comment verdicts) were sent through contact discovery. The system queried Apollo for people at each company's domain and applied the persona rules.

## Result

18 of 24 returned at least one contact. Eli Lilly (73), AbbVie (63), Sarepta (20), Rocket (14), and Sangamo (14) pulled meaningfully. REGENXBIO, BioMarin, Adverum, Atsena, PTC, Opus, Apertura, Taysha, and Abeona returned 2-7 each. Astellas, Neurogene, Passage Bio, and Affinia returned 1.

Six returned zero: IVIEW, Aspa, Sardocor, Benitec, Tern, and Alexion/AstraZeneca.

## Why those six returned zero

Five of the six are early-stage biotechs in the 0-36 employee range (IVIEW, Aspa, Sardocor, Benitec at 36, Tern).

The persona requires all of:

- Title contains one of 13 AAV-CMC strings (drug product, process science, MSAT, CMC, CSO, downstream processing, drug substance, process chemistry, manufacturing science, viral vector, purification, process development, chief scientific officer)
- Seniority is Senior, VP, or Director
- Location is United States or Canada
- Exact target company domain
- Title does not contain Regulatory, QC, QA, Clinical Operations, Program Management, or Biostatistics

At a 9-to-36-person biotech, the population of people who satisfy all five at once is usually empty. A 20-person company simply does not have a Director of Drug Product. The person running process development there is often a Manager or a Senior Scientist. When Apollo does return someone, the exclude list often catches them: Benitec returned one person titled "SVP CMC Regulatory" and the Regulatory exclusion dropped the record.

The eighth, Alexion/AstraZeneca, is the opposite case. 76,100 employees, but flagged borderline at the verification stage and subject to the >500-employee filter (5+ year tenure plus research publication history). That filter is not yet running inside contact discovery, so Alexion sits without a sourced contact.

The headline is that the criteria are tight by design and most of the population they would surface lives at companies above 50 employees. The list of zeros is mostly companies below that line.

## The levers

Three options, ordered by how much each changes the criteria:

1. Hold the line. Keep the persona exactly as written. Accept that small biotechs may return zero contacts, and rely on the larger keepers (Eli Lilly, AbbVie, Sarepta, Rocket, Sangamo, REGENXBIO, BioMarin, etc.) to carry volume. The 6-of-24 zero rate is the cost of the persona's precision.

2. Loosen seniority when company is small. When employee count is under 50, allow Manager and Head titles in addition to Senior, VP, and Director. At a 20-person company, the process-development owner is usually a Manager.

3. Refine the exclude logic. Treat the exclude list as a primary-function check rather than a string match. "SVP CMC Regulatory" reads as a CMC owner with regulatory in the portfolio, not a pure Regulatory hire. The rule could keep them in.

These three combine. Holding the line on persona while doing 2 and 3 would likely move 2-3 of the five small-biotech zeros into a returnable state without compromising the AAV-CMC focus.

## Separate item: per-company sub-targeting

The May 22 verdicts on the keeper companies included targeting instructions the current discovery does not yet honor: IVIEW (NJ HQ), AbbVie (Worcester Bioresearch Center), Prevail (NY process and analytical dev teams), among others. Current discovery filters by company domain and US/Canada, not by city or campus. To enforce these we need a per-company targeting layer.

## What we are asking you to confirm

1. Which of the three persona levers to apply (1, 2, 3, or a combination).
2. Whether to build in the per-company sub-targeting layer now, or hold it for a follow-up pass.
3. For Alexion/AstraZeneca specifically: confirm the >500-employee filter (5+ year tenure, publication history) is the right gate, and we will implement it inside discovery.

Once these are confirmed, we update the rules and re-run the affected subset.
