# Directive — PubMed Capture: AAV-relevance filter at the search step (2026-05-20)

> **⚠ CANCELLED — 2026-05-20, same day issued.** Superseded by `practices/revops/workflows/publication-classifier/PROMPT.md`. Nick reversed posture: filtering at the source defeats casting wide. Publications stay unfiltered; a separate **publication-classifier** workflow reads every publication event row and writes one `target_classification` event per PMID. The 1,608 existing rows become classifier input, not noise to tag. Do **NOT** execute the spec below. Kept for diff visibility.

---


**From:** Boris (orchestrator)
**To:** Workflows builder
**Workflow:** PubMed Publication Capture (the workflow that just shipped — get its n8n ID from the registry or your build notes; consult the L1 ticket's connection block in `practices/revops/workflows/CLAUDE.md` for n8n REST access)
**Working scope:** `practices/revops/workflows/pubmed-capture/`
**Status:** Workflow is live and writing. Out-of-scope rows are accumulating fast. Apply this fix before the next run.

## Observation that drove this directive

Company Events on RevOps Surface (`appYBYH3aOHhTODAw / tblnzX2b2kqNGzW6r`) currently holds **2,001 rows**. 1,608 (80%) are `Provider = pubmed` publications. Sampled the latest 20: all are Orchard Therapeutics papers covering MLD, ADA-SCID, asthma, chronic granulomatous disease. Orchard does **lentiviral HSC gene therapy, not AAV**. None of the 20 sampled are AAV-related. The PubMed workflow is currently fetching every publication associated with each Companies row, no topic filter applied.

Surface answer to "are these AAV gene therapy publications?": **no**. Surface answer to "are they Companies-affiliated publications?": yes. Different question, different filter required. Apply the missing filter.

## Yes — borrow the L1 v2 approach. Adapt, don't copy.

What translates from L1 v2:
- **Cast wide on synonyms.** L1 used 5 query terms in parallel. PubMed lets you OR them into one query, so the union compresses to a single search per company.
- **MeSH-anchor where MeSH exists.** L1's classifier discovered `Dependovirus` MeSH = 0 hit rate in their sampled trials — but that's because CT.gov MeSH backfilling is sparse. PubMed's MeSH indexing is denser and more reliable; Dependovirus + Genetic Therapy + Genetic Vectors MeSH terms catch a lot.
- **Free-text fallback for everything MeSH misses.** Brand names, serotypes, vector suffixes — same pattern as L1's broadened CT.gov search.
- **Source-level filter to narrow modality.** L1 used Essie `AREA[InterventionType](GENETIC OR BIOLOGICAL)`. PubMed equivalent: publication-type filter to keep clinical/research and drop letters/editorials.

What does NOT translate:
- The **parallel-multi-call architecture**. L1 needed 5 parallel calls because CT.gov free-text was single-substring. PubMed `esearch` accepts a full boolean query in one call. Keep it one call per company.
- The **classifier event-row pattern**. PubMed publications are evidence, not verdicts. One event row per publication. No per-publication `target_classification` row.

## Required query shape

For each Companies row, build a single PubMed `esearch` query:

```
(<company name>[Affiliation] OR <company name>[Investigator])
AND
(
  AAV[Title/Abstract] OR "adeno-associated"[Title/Abstract]
  OR Dependovirus[MeSH Terms]
  OR "Genetic Therapy"[MeSH Terms]
  OR "Genetic Vectors"[MeSH Terms]
  OR AAV1[Title/Abstract] OR AAV2[Title/Abstract] OR AAV3[Title/Abstract]
  OR AAV4[Title/Abstract] OR AAV5[Title/Abstract] OR AAV6[Title/Abstract]
  OR AAV7[Title/Abstract] OR AAV8[Title/Abstract] OR AAV9[Title/Abstract]
  OR AAVrh10[Title/Abstract] OR rAAV[Title/Abstract]
  OR "gene therapy"[Title/Abstract]
  OR Zolgensma[Title/Abstract] OR LUXTURNA[Title/Abstract]
  OR "onasemnogene abeparvovec"[Title/Abstract]
  OR "voretigene neparvovec"[Title/Abstract]
)
AND
("Journal Article"[Publication Type] OR "Clinical Trial"[Publication Type] OR "Review"[Publication Type])
```

Use `usehistory=y` on the `esearch` call so the downstream `efetch` pulls the result set via WebEnv/QueryKey — that's the standard E-utilities batching pattern and prevents URL-length issues with long queries.

## What stays the same

- One event row per matched PMID. Provider = `pubmed`. External ID = PMID. Event ID = `<company> — publication — <PMID>`.
- Dual-target write per the original PROMPT (Company Events for company-affiliated, Contact Events for author-attributed). Keep that.
- Detail field carries title + journal + pubdate + publication types + abstract (+ MeSH headings + keywords) — full evidence capture per engine Principle 6.
- Raw Payload carries the full E-utilities response for each PMID.

## Cleanup of the 1,608 existing PubMed rows

Do **not** bulk-delete them — that violates evidence-capture principles and loses cited references that may still be useful. Instead:

1. Add `Categories / Tags` value `"out-of-scope: pre-aav-filter"` to all existing rows where `Provider = pubmed` AND `Created Time < <the timestamp of your next post-fix run>`. This marks the noise without erasing it.
2. After the AAV filter ships, the next workflow run will write fresh rows. Any PMID that the new query still hits gets a normal row (and an upsert collapses to the existing row if Event ID matches, dropping the out-of-scope tag — that's correct behavior because the PMID re-qualified).
3. Operator views on RevOps Surface should filter `Categories / Tags NOT CONTAINS "out-of-scope"` to hide noise.

## Output contract — unchanged

References only. After the post-fix run, report:
- new workflow versionId
- new execution ID
- per-node runData counts
- per-node credentials verbatim
- 3 Airtable rows from Company Events written by the new run: External ID (PMID), Event ID, Detail (first 500 chars), Categories / Tags
- count of pre-existing rows tagged `out-of-scope: pre-aav-filter`

## Out of scope for this directive

- Do not activate or change schedule cadence.
- Do not edit the L1 workflow.
- Do not delete any rows.
- Branded-name list is conservative — if you find evidence a major AAV product is missing (Hemgenix, Roctavian, Elevidys, Beqvez, etc.), add it and note the addition in your report.
- Author-anchored Contact Events writes — keep the existing dual-target design; just AND the AAV filter into the author query the same way.

The CT.gov approach in L1 v2 is the philosophical template. The PubMed implementation is simpler (one query per company, not five parallel) because PubMed's query language is more expressive. Match the philosophy. Don't copy the architecture.
