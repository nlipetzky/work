# Modality taxonomy and gate rules: AAV outreach play

**Operating version, in effect from:** 2026-05-11
**Maintained by:** Nick (Teknova RevOps)
**Companion docs:** [sourcing rules](revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md) · [gate results](revops-gate-results-aav-gene-therapy-ellie-outreach.md)

This is the live ruleset the automated workflow uses to classify companies for the AAV outreach play. Companies are evaluated against these rules, classified into one of three outcomes (pass / re-route / archive), and the results land in the companion results doc for review.

**To change anything here:** mark up the doc, message Nick, or note it in the change log at the bottom. Changes take effect on the next workflow run. Nothing in this doc is waiting for approval to act.

---

## What this play is

Reagent-readiness outreach to AAV gene therapy biotechs heading toward IND. The buyer is the process development / CMC owner. The pitch is RUO+ small-batch GMP buffers and Express-Tek audit-ready documentation, compressing the 6-month lead time and 8-week paperwork cycle. Companies that don't do AAV gene therapy are out of scope for this specific play but may fit other plays. Those go to a re-route pool, not the trash.

---

## Modality bucket list

When the workflow looks at a company, it classifies the company's primary therapeutic modality into one of these buckets:

- **AAV** (in scope for this play)
- Lentiviral
- Other viral vector (adenovirus, herpes, vaccinia)
- Peptide therapeutics
- Small molecule
- RNA editing
- mRNA therapeutics
- Autologous cell therapy
- Allogeneic cell therapy
- Non-viral delivery (LNP, electroporation)
- Antibody / biologic
- CRISPR / gene editing without a viral delivery vehicle
- Epigenetic reprogramming
- Vaccine
- Diagnostic / research tools only
- Other (free-text label captured for review)

Why this list: the segment artifact explicitly excludes lentiviral, peptide, small molecule, RNA editing, autologous cell therapy, epigenetic, and non-viral delivery as hard filters. The other buckets are included so we know what we're rejecting and can route intelligently.

---

## What counts as "AAV pass"

A company passes when its public materials (pipeline page, About page, platform page) contain:

1. The literal acronym "AAV" ... required, AND
2. At least one mechanism word: "capsid," "serotype," "transduction," "vector," "viral delivery"

Why strict: companies that don't name AAV specifically usually do something else. The segment artifact already excludes other viral vectors. Loose matching surfaces too many false positives.

---

## Multi-modality platforms

If a company does AAV alongside other modalities, it passes on the AAV signal alone.

Why: the offer is for AAV reagents. If they do AAV at all, there's a buyer for the pitch. Multi-vector CDMOs count if AAV is one of their named services.

---

## Re-route mapping (non-AAV biotechs)

Companies that aren't AAV but are still legitimate biotechs get tagged with their modality and held in an alt-play pool. Current mapping:

| Detected modality | Alt-play / pitch direction |
|---|---|
| Lentiviral | Reagent-readiness pitch, viral-vector framing without AAV-specifics |
| Peptide therapeutics | Tools provider / nextgen antibody play |
| Small molecule | Hold, no current pitch |
| RNA editing | Hold, no current pitch |
| mRNA therapeutics | Hold, possible LNP-reagent angle later |
| Autologous cell therapy | Cell therapy reagent pitch |
| Allogeneic cell therapy | Cell therapy reagent pitch |
| Non-viral delivery | Hold |
| Antibody / biologic | Hold |
| CRISPR / gene editing (non-viral) | Hold |
| Epigenetic | Hold |
| Vaccine | Hold |
| Diagnostic / research tools only | Archive, no fit |

"Hold" means tagged and stored, not pitched. When a fitting play is designed, these get pulled from the pool.

---

## Edge case disqualifiers

These send a company to **archive**, not re-route.

**Wholly-owned subsidiary of a top-20 global pharma.** Example: AveXis under Novartis. Subsidiary CMC supply chains are dictated by the parent.

**All programs are pre-clinical discovery, no clinical track.** No window for the IND-anchored pitch.

**All programs are past Phase II at commercial scale.** Different conversation, different products.

**Headquarters outside US or Canada.** EU and APAC are out of scope for this play.

**Headcount above 2,000 full-time employees and not a CDMO.** Larger biopharma is a BD-relationship sale, not Ellie's outbound.

---

## Source conflict tiebreaker

When data sources disagree about a company's modality, this is the order of trust:

1. The company's own website language (pipeline / About / platform).
2. A web-search-grounded summary (Exa, Perplexity).
3. The paid firmographic database tag (Explorium NAICS / industry).

The lowest-trust source is the database tag. It can tell us "this is a biotech," but it cannot distinguish AAV from peptide.

---

## How Ellie influences this doc

This is a living ruleset, not a one-time decision. Two ways to change it:

1. **React to gate results.** Open the Airtable "Enrichment Runs" table (RevOps Surface base, `appYBYH3aOHhTODAw`), find the most recent run, read the Markdown Report field, mark misclassifications in Notes or directly on the affected Companies rows. The rule that caused the miss gets revised here.
2. **Direct edit.** If a rule is wrong on its face, write the new version in the change log below and the doc gets updated.

See [revops-gate-results-aav-gene-therapy-ellie-outreach.md](revops-gate-results-aav-gene-therapy-ellie-outreach.md) for the run-table field reference and review flow.

---

## Change log

| Date | Change | Requested by |
|---|---|---|
| 2026-05-11 | Initial operating version | Nick |
