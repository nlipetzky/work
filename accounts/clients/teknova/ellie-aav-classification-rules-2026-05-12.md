# AAV classification rules — review and approve

**For:** Ellie
**From:** Nick
**Date:** 2026-05-12

These are the rules our system used to produce the AAV discovery list you just received. Two paths from here:

- **Approve** — the rules stay as they are, future runs use the same logic, the list you see is the list you get.
- **Adjust** — mark up this doc (or reply with edits), and the next run reflects your changes. Everything past the first pass is iteration.

The point of this doc is for you to own the rules. We execute them cleanly; you decide what they are.

---

## How a company gets classified

Every company in the list got one of three labels. Here's how the system assigned them.

### Surfaced (32 companies)

A company is marked **Surfaced** when its clinicaltrials.gov trial conditions match at least one indication from the **canonical AAV indications list** below, AND none of its trial conditions match a **disease-AAV term**.

These are high-confidence AAV. The list to scan first.

### Borderline (65 companies)

A company is marked **Borderline** when its trial conditions don't match anything in the canonical list AND don't match a disease-AAV term either. The system has no evidence either way, so it parks the company here for your judgment.

This is where your time should go. Some of these are real AAV companies whose lead indication isn't in our canonical list yet (we'd add it). Some aren't AAV at all.

### Rejected (6 companies, not in the list you received)

A company is **Rejected** when its trial conditions match a disease-AAV term AND don't match any canonical AAV indication. These are autoimmune-disease trials where "AAV" stands for ANCA-Associated Vasculitis, not the vector.

The 6 we rejected on this run:

| Company | Matched term |
|---|---|
| InflaRx GmbH | Granulomatosis With Polyangiitis, Microscopic Polyangiitis |
| Cartesian Therapeutics | ANCA-Associated Vasculitis |
| Sana Biotechnology | Anti-Neutrophil Cytoplasmic Antibody, Microscopic Polyangiitis |
| Vifor Fresenius Medical Care Renal Pharma | ANCA-Associated Vasculitis |
| NovelMed Therapeutics | Anti-Neutrophil Cytoplasmic Antibody |
| Alpine Immune Sciences | Anti-Neutrophil Cytoplasmic Antibody |

If any of these should have been kept, say so.

---

## The rule values (these are what you're approving or adjusting)

### Canonical AAV indications

A company surfaces as AAV if its trial conditions contain any of these (case-insensitive substring match):

```
Hemophilia A
Hemophilia B
Ornithine Transcarbamylase Deficiency
Wilson Disease
Glycogen Storage Disease Type Ia
Von Gierke
Duchenne Muscular Dystrophy
Friedreich's Ataxia
Gaucher Disease
Spinal Muscular Atrophy
Mucopolysaccharidosis (any subtype)
Sanfilippo Syndrome
Leber Congenital Amaurosis
Retinitis Pigmentosa
RPE65
Choroideremia
Pompe Disease
Aromatic L-amino acid decarboxylase (AADC) deficiency
Crigler-Najjar
Methylmalonic Acidemia
Phenylketonuria
Hunter Syndrome
Hurler Syndrome
Niemann-Pick
Arrhythmogenic Right Ventricular Cardiomyopathy
Hypertrophic Cardiomyopathy
Heart Failure
Angelman Syndrome
Congenital Adrenal Hyperplasia
```

29 indications. If there's a known AAV-treated indication missing from this list, the companies pursuing it will land in Borderline instead of Surfaced. Easiest example to spot: scan the Borderline list for indications you know are AAV territory and tell us to add them here.

### Disease-AAV exclusion terms

A company gets rejected if its trial conditions contain any of these:

```
ANCA-Associated Vasculitis
Anti-Neutrophil Cytoplasmic Antibody
Granulomatosis With Polyangiitis
Microscopic Polyangiitis
Eosinophilic Granulomatosis with Polyangiitis
AAV-Vasculitis
ANCA Vasculitis
```

Known limitation of this list: companies that write their conditions with slightly different spellings (no hyphen, extra space, etc.) slip past these and end up in Borderline. In this run, that includes Amgen, Novartis Pharmaceuticals, Tanabe Pharma, Fate Therapeutics, and Nkarta — all running ANCA-Vasculitis trials but using vocabulary variants the rule didn't catch. If you flag them in your review, we expand this list and re-run.

### Hard filters NOT applied at this stage

Several criteria that will eventually matter (US/Canada headquarters, company size under 2000 employees, not a wholly-owned subsidiary of top-20 pharma, contact function / seniority for outreach) are not applied here. This stage is about confirming a company actually does AAV gene therapy. Outreach-fit filtering comes after you've verified the AAV classification, so we don't spend enrichment effort on companies that aren't AAV in the first place.

---

## What we'd like back from you

Three things, in order of value:

1. **For each Surfaced row** — quick scan, flag anyone that's not actually AAV. They'd be miscategorized canonical-indication matches (e.g., a company doing peptide therapeutics for Hemophilia A would surface here even though they're not AAV).

2. **For each Borderline row** — AAV / not AAV / not sure. You don't need a paragraph; a single column with your call is plenty.

3. **For the rule lists above** — anything missing, anything that shouldn't be there. Add/remove freely.

Mark up this doc, reply with notes, or annotate the sheet — whichever is easiest for you. Whatever changes you make become the next version of the rules.

---

## What "approve" means

If you reply "looks good" or otherwise signal approval, we treat the rules above as locked for the next run. We continue with enrichment (firmographics, contact sourcing, signal data) on the Surfaced + your-confirmed-Borderline rows.

If you adjust, the new rule values get committed, the workflows re-run against the same 103 captured companies, and you see an updated list reflecting your edits.

Either way, you stay in control of what counts as AAV.

---

## What else would help? — the columns conversation

The rules above govern *who's in the list*. What we surface per row is a separate question, and the schema is open for your input.

### What I'd add next, in priority order

**1. Sample intervention name from clinicaltrials.gov.** Examples: `AAV9-OTC`, `rAAV2-RPE65`, `Adeno-Associated Virus serotype 5 carrying CFTR`. This is the single highest-signal piece of evidence per row — it tells you the serotype, the gene, and the vector type in one string. We already capture it in our pipeline; we just don't write it to the sheet yet. Free to add. I'd argue this should have been in version one.

**2. Most recent trial start date.** Separates companies with an active pipeline from companies whose trials are all 10+ years old (Tacere, Avigen, Ceregene, Neurologix, etc., all in your borderline list — they look like real companies until you realize their last trial started in 2008). Cheap compute from data we already have.

**3. Trial statuses summary.** Recruiting, active, completed, terminated, withdrawn. Quick way to tell if a company has a live program vs a graveyard. Same data, just not written through yet.

**4. Company website + one-line description.** This costs a few cents per row via Exa or similar. Worth it for the borderline rows where you'd otherwise be opening a new browser tab and Googling. Not worth it for the surfaced rows where the trial link is already enough.

**5. Sub-categorization within AAV.** Pipeline pure-play vs Vector platform company vs Big pharma running an AAV program vs Academic spinout vs Discovery-stage. This is a categorical lens that might let you scan a list of 30 surfaced companies and immediately know which ones matter to your offer. But I'd want your input on what categories you actually use mentally before we encode them.

### Three questions for you

**a. What's the one column that, if you had it on every row, would cut your verification time in half?**

This is the most useful single thing you could tell us. Whatever it is, we figure out how to get it.

**b. When you encounter a borderline company and decide AAV / not AAV, what do you actually do?**

Do you go to their website? Look up the CEO's background? Check whether they have a known capsid platform? Search for them on a specific industry directory? Whatever your investigation process is, we should surface that data up front so you don't have to do the lookup yourself.

**c. What sub-categories of AAV company would help you organize this universe?**

You probably already think about AAV companies in groups — by therapeutic area, by capsid platform, by stage, by company type. Tell us how you slice it. We label accordingly so your future lists come pre-sorted by the cuts you actually care about.

### How to give us this input

Reply, mark up this doc, or annotate the sheet — whatever fits. There's no formal format. Even a paragraph of "here's how I think about this" gets us where we need to go.

You don't have to answer every question. But the more you share about what you look at and how you decide, the better the next list gets.
