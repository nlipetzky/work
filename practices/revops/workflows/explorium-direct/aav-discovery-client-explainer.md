# Identifying AAV companies isn't a keyword search

Finding companies that develop AAV (adeno-associated virus) gene therapies looks like it should be straightforward. Scan their websites for "AAV" and you're done. In practice, that approach misses most of the real targets.

## The vocabulary problem

The companies most worth talking to are usually the ones who have already commercialized something. And those are exactly the companies that have moved on from technical vocabulary in their public marketing.

Three examples from one batch this week:

- **Spark Therapeutics** developed Luxturna, the first FDA-approved AAV gene therapy in the United States. Their public site leads with the brand name and indications. The literal string "AAV" barely appears in their navigation, hero copy, or pipeline pages.
- **BioMarin** sells Roctavian, an AAV gene therapy for hemophilia A. Their messaging is product- and patient-focused, not mechanism-focused.
- **Solid Biosciences** develops AAV-based therapies for Duchenne muscular dystrophy. Their public language is "genetic medicines," not "adeno-associated virus serotype-9 vector platform."

A naive keyword scanner reads these sites and concludes: not AAV. The companies most likely to need biotech reagents are the ones a naive system is most likely to miss.

Meanwhile, less-mature AAV companies use varied terminology. "Vector," "capsid," "viral delivery," "gene therapy platform" all appear in different combinations, sometimes alongside CRISPR or mRNA work at the same company. The signal is noisier the earlier in the company's development you look.

## How the system solves this

The discovery pipeline doesn't rely on a single source. Each company moves through layered validation, with the most authoritative evidence winning when sources disagree.

**Clinical trial evidence (most authoritative).** ClinicalTrials.gov is the anchor source. If a company has sponsored an AAV gene therapy trial, that's harder evidence than any marketing copy. The pipeline pulls every AAV-related trial from CT.gov and identifies the sponsoring company. A company doesn't sponsor an AAV trial by accident.

**Firmographic enrichment.** Once a company is identified, the system pulls industry classification, geography, revenue range, headcount, public ticker, and corporate hierarchy from a structured B2B database. This applies the geographic and industry filters defined for the engagement. It also catches edge cases like Swiss-headquartered parent conglomerates that share a name with US operating subsidiaries.

**Website signal (last resort).** For companies without trial evidence, the system scans public pages for AAV vocabulary and exclusion signals (lentiviral, CRISPR, small molecule, autologous cell, etc.). This catches the long tail of pre-clinical or unpublished AAV companies that aren't in the trial database yet.

When evidence sources disagree, the upstream sources win. A company validated by clinical trial sponsorship doesn't get re-litigated by a website scanner. This is why mature commercial-stage companies like Spark and BioMarin stay in the cohort even though their websites have moved past the word "AAV."

## Where it still gets hard

Three patterns the system handles, but not always perfectly:

- **Subsidiaries vs parents.** "Novartis Gene Therapies" is a Bannockburn, Illinois operating unit of Novartis. Search by name in a B2B database often returns the Swiss parent in Basel. The system resolves this with corporate hierarchy data and flags borderline cases for human review rather than archiving them silently.
- **Same-name confusion.** "MavriX Bio" (gene therapy) and "MavriX Data" (analytics) share enough of a name that B2B databases sometimes return the wrong company. The system flags these for verification.
- **Vocabulary-aged-out companies.** Mature AAV companies whose public language has moved on. These are classified as "needs review" and surfaced for human eyes, rather than auto-archived.

## What this means

Every company surfaced by the pipeline comes with a written audit trail explaining how the system reached its decision. What trial evidence was found. What firmographic data was matched. What the website scan returned. What the final routing was, and why. When a company gets archived, the reason is recorded. When a company gets surfaced for review, the reason is recorded.

The work isn't deciding whether a single company is AAV based on a single keyword search. The work is building a system that gets the right answer for the commercial-stage company that doesn't use the word anymore, the subsidiary with the wrong HQ in the database, and the small pre-clinical outfit with no public footprint. That's where the value of the workflow lives.
