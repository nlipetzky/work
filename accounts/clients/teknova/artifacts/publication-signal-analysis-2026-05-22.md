# Publication Signals Surface Adjacent Functions, Not the Buyer

**Date:** 2026-05-22
**Author:** Nick + Boris (agentic-systems practice)
**Audience:** Ellie (Teknova)
**Companion docs:**
- `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` (criteria source)
- `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/audit-pfizer-contacts-2026-05-22.md` (earlier Pfizer contact audit)

## Headline

We pulled 18 publication and trial signals that confirm Pfizer is active in AAV gene therapy. Across those 18 signals, **35 individual Pfizer scientists were named as authors**. Of those 35, **zero work in process development, CMC, viral vector production, downstream processing, purification, or manufacturing science**. Every named person sits in an adjacent function.

This isn't a Pfizer quirk. It's structural to how the pharma industry publishes.

## The numbers

All from the Pfizer publication and trial signals pulled in the last 12 months:

| Function | Named authors | Examples |
|---|---|---|
| Analytical R&D (Chesterfield ARD) | 6 | Lerch, Powers, Mariani, Narepekha, Ryan, Sankar |
| Clinical / Medical Affairs | 8 | Rupon, McKay, Wilcox, Biondo, Agathon, Thakkar, Lwoff, Kim |
| Biostatistics / Clinical Ops | 7 | Gallo, Shi, Gundapaneni, Neelakantan, Lobello, Shen, Levy |
| Clinical Pharmacology / Pop-PK / MIDD | 5 | Wojciechowski, Gaitonde, Hughes, Ravva, McIntosh |
| Drug Safety R&D (Groton/Cambridge) | 4 | Casinghino, Tartaro, Lanz, Whiteley |
| Bioanalytical / Biomedicine Design (Andover) | 3 | Neubert, Palandra, Walsh |
| Nonclinical / Safety review | 1 | Rana |
| Rare disease research (peripheral) | 1 | (non-actionable, formerly-with affiliations) |
| **Process Dev / CMC / Manufacturing / Process Science** | **0** | none surfaced |

The published functions account for analytical method development, bioanalytical assay quantification, pharmacokinetic modeling, safety / toxicology studies, clinical trial readouts, biostatistical analysis, and medical-affairs work. The buyer persona Teknova sells to (process operators who own RUO-to-GMP transition for viral vector manufacturing) is absent.

## Why this happens

It's not selection bias in our pipeline. It's the nature of what gets published.

**Process development and CMC work does not publish.** The output of a process development team is a process: batch records, comparability protocols, in-process specifications, and the CMC modules (3.2.S and 3.2.P) of a BLA filing. None of that is public. The work is intentionally proprietary because process know-how is competitive advantage and because regulatory filings are confidential until approval.

**What does publish, in AAV:**

- **Analytical methods.** New LC-MS capsid characterization assays, qPCR for vector genomes, ELISpot for capsid-specific T-cell responses. These get published because methods need peer-reviewed validation and often become industry reference standards.
- **Bioanalytical.** Quantifying drug exposure, neutralizing antibody titers, biomarkers in clinical samples. Published as part of clinical evidence packages.
- **Population pharmacokinetics and MIDD.** Long-term durability modeling, dose-response. Published in clin-pharm journals tied to regulatory submissions.
- **Safety / toxicology.** NHP studies, immunogenicity, hepatic safety. Published because safety transparency is expected for clinicians and regulators.
- **Clinical data.** Phase 1/2/3 readouts, patient-reported outcomes. Published in NEJM, Lancet, EHJ, Lancet Neurology, etc.
- **Biostatistics and clinical operations.** Co-author credit on clinical trial publications.
- **Medical affairs.** Disease epidemiology, seroprevalence, conference proceedings.

Each of these is a real, busy function tied to AAV gene therapy programs. None of them owns process or CMC decisions. They are downstream of the process, or upstream of clinical evidence, or both.

## What this means

### For company sourcing

The signal pipeline is doing its job. These publications confirm Pfizer is actively running AAV programs and where the activity is (Chesterfield for analytical, Andover for bioanalytical, Groton for safety, Collegeville/Pearl River/Cambridge for clinical). That's exactly what publication signals are good for at the company level. The pattern says "this company is alive in AAV, here's where the work is happening." That's confirmed.

### For contact sourcing

The signal pipeline is not finding the buyer. **Publications consistently surface the wrong cohort for outreach.** Operators who own viral vector process development don't show up on PubMed. They show up on:

- Job postings (capacity-expansion hires)
- Conference attendee lists (Interphex, BPI West, Advanced Therapies Week, Bioprocessing Summit)
- LinkedIn promotion announcements
- Process development team rosters published in BLA approval announcements (rare)
- Direct LinkedIn search on titles like "Director, Process Development" or "VP, Vector Operations"

The Apollo-driven contact workflow we built (`/Users/nplmini/code/work/accounts/clients/teknova/artifacts/audit-pfizer-contacts-2026-05-22.md`) finds the right people because Apollo indexes everyone with a LinkedIn, including the process / CMC operators who don't publish. Pfizer Primary list as of today: 6 directors and senior directors in process development, MSAT, drug product, and process chemistry. None of them appear on a single PubMed paper in the signal pipeline.

### For outreach copy

This is where the publication signals become valuable in a different way. **They're not source material for who to email. They're source material for what to say.**

When Teknova reaches out to a Pfizer process development director, the publications give specific, current, named context to anchor the conversation:

- **For someone in process or CMC at Chesterfield**: "I saw your analytical team published the LC-MS multi-attribute method for AAV capsid characterization in 2025. As you scale BEQVEZ commercial supply, how are you thinking about reagent and buffer lot consistency to keep that method reproducible across batches?"
- **For someone at Andover supporting clinical AAV programs**: "Pfizer's bioanalytical group at Andover just published the dystrophin quantification work from the CIFFREO Phase 3. With that program winding down, where is process and analytical capacity being redirected internally?"
- **For commercial AAV manufacturing (BEQVEZ, giroctocogene)**: "Pfizer is now running two approved or late-stage AAV products with long-term follow-up cohorts to 2040. What's your supply continuity strategy for buffer and process reagents over a 15-year horizon?"

The publication signal becomes the credibility anchor. It tells the prospect Teknova reads what's happening at Pfizer at the program level, not just the marketing-tier "we noticed you do gene therapy" opener.

## Recommended response

Three options, ordered by reversibility:

1. **Use the current setup as-is, with a clear separation of concerns.** Publications fuel company-level qualification and outreach personalization. The Apollo contact workflow finds the buyer persona. The two pipelines stay distinct. Lowest risk. This is what we're doing now and it's working.

2. **Expand the contact persona to include analytical, bioanalytical, and safety functions for select accounts.** These functions ARE Teknova-adjacent (they use process-grade reagents, custom buffers, and reference materials in their methods). The CMC team buys, but the analytical team often specifies and validates. Adding `analytical development`, `bioanalytical`, `analytical research` to `persona_title_include` would catch Lerch, Powers, Neubert, Palandra in our next run. Tradeoff: wider net, more noise, longer outreach lists for Ellie to review. Worth doing only if you want secondary outreach paths into accounts where the CMC team is hard to reach directly.

3. **Build a second signal pipeline targeting where process operators actually surface.** Conference attendee scraping (Interphex, BPI West, Bioprocessing Summit), LinkedIn job posting monitoring for "Process Development Director" / "MSAT Lead" openings, BLA approval announcement parsing for process team names. Higher build cost. Higher ceiling. Most direct route to the actual buyer.

## What Ellie should take from this

The publication pipeline is **good for company signals, bad for contact signals**. The contact workflow we built finds the right people through Apollo, independent of publications. The two should not be combined into a single "score this contact based on publication co-authorship" metric, because the people who get the co-authorship aren't the people who write the PO.

When Ellie sees a publication-driven brief for an account, the value is:

- Confirmation the company is active in AAV
- Site-level intelligence (which Pfizer location is doing what)
- Conversation anchors for outreach copy
- Named context for personalization

The named authors in the brief are mostly **not** the people to email. The right people come from a different pull. The two intersect rarely.
