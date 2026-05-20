# Email to Ellie

**To:** Ellie Oleson
**Cc:** Jenn Henry, Christa Plon
**Subject:** AAV discovery update + next steps

---

Hi Ellie,

Thanks for the detailed review. Your notes tie directly into what we discussed in our April working session around separating CDMOs from therapeutic developers, and the framing in your latest reply is what makes that distinction workable in the data. Three points from your review are now shaping how the system operates.

## The three-bucket segmentation

You sharpened the April CDMO-versus-drug-company conversation into the operational form we needed: AAV gene therapy, AAV production tool, and both. The "both" category is the one that matters most in practice. Forge Biologics is the clearest case... they manufacture for others and run their own therapeutic pipeline. Two buyers, two messages, one company.

The reason your framing matters is that the public language a CDMO uses and the language an AAV therapeutic biotech uses overlap heavily when the system scans a website. The automated classifier can take a strong first pass at sorting them, but your verdict is what trains it for production.

## Your missing-companies list maps to four patterns

The 18 companies you flagged broke down cleanly:

1. **CDMOs**: Forge, Andelyn, Catalent, Resilience, Charles River / Vigene, ProBio. None of these sponsor clinical trials. They produce AAV for other companies, so the entire production-tool segment is invisible to clinicaltrials.gov as a source. That's why the first list missed them.
2. **Preclinical companies**: Apertura, Capsida pre-trials, Krystal's AAV programs. No registered trials yet, nothing for the trial registry to surface.
3. **Partnered programs**: Capsida and AbbVie. The sponsor name on the trial is the partner, not the AAV biotech.
4. **Recall misses that should have been caught**: Sarepta, Taysha, Atsena, Astellas Gene Therapies, PTC, Passage Bio, Encoded, Abeona, and Alexion's LogicBio acquisition. These have AAV trials and should have been on the first list. Sarepta is the most visible omission given Elevidys is the first FDA-approved AAV gene therapy. We're tracing the gap now.

The first three patterns confirm what was on the roadmap already: clinicaltrials.gov is one source with known blind spots, and the next sourcing layers each catch a different slice. We're starting with the ASGCT exhibitor list because it captures the entire CDMO segment in one curated place.

## Feedback flow inside Airtable

Your note on the rules document tells us the input channel needs to change. We're adding three columns directly on each record: AAV Segment Override, a free-text note, and a reviewed-at date. You'll review where you're already working, click the call per row, and your overrides become authoritative in the system. Same intent as the rules document, no document to maintain.

## What's landing this week

- AAV Segment field on every confirmed AAV record, auto-classified into the three buckets. Known CDMOs default to production tool. Companies with active trial sponsorship default to gene therapy. Forge-style hybrids get both.
- Your 18 companies ingested into the database, pre-segmented per your annotations, and run through the same firmographic enrichment as everything else.
- The review columns described above.
- A written diagnosis on the clinicaltrials.gov recall gap, with the proposed fix.
- A short roadmap of the next four sources (ASGCT, USPTO patent classifications, ARM Atlas, PubMed), in priority order.

For context: the enrichment behind each confirmed AAV company is significantly richer than what was on the first list. Funding history, parent and ultimate-parent structure, key competitors, and a strategic narrative summary are all on every record now. That's outreach personalization material on every row by default.

I'll be running the new batch through over the next day. You'll see the new fields populate on the records we already discussed plus the 18 you sent. When the next pass is ready for review, the AAV Segment Override column is the highest-leverage place to weigh in. A handful of corrections gives the classifier the signal it needs to converge on what you'd call yourself.

Nick
