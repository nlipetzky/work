# Sourcing rules: AAV outreach play

**Operating version, in effect from:** 2026-05-11
**Maintained by:** Nick (Teknova RevOps)
**Companion docs:** [modality taxonomy](revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md) · [gate results](revops-gate-results-aav-gene-therapy-ellie-outreach.md)

Rules for adding new companies to the AAV outreach play. The taxonomy doc covers what happens to companies once they're in the list. This doc covers what gets into the list in the first place.

**To change anything:** mark up the doc, message Nick, or note it in the change log. Changes apply to the next sourcing run.

---

## Active query strings

These are the search phrases currently in use.

### Web search (Exa, Perplexity)
- "AAV vector capsid engineering"
- "AAV gene therapy clinical pipeline"
- "AAV gene therapy IND filing"
- Any query must include the literal "AAV" plus at least one of: capsid, serotype, vector, transduction, viral delivery.

### Firmographic database (Explorium)
No standalone industry-tag pulls. Database access is used only for verifying a known company name, not for surfacing new candidates. The "gene therapy" tag returned too much noise (peptide and small-molecule biotechs labeled under it).

### Removed from rotation
- "AAV gene therapy companies" (Exa) — too broad, surfaced non-AAV biotechs.
- "viral vector manufacturing" (Exa) — surfaced lentiviral.
- "gene therapy CDMO" (Exa) — surfaced multi-modality CDMOs that don't name AAV.
- "gene therapy" Explorium industry-tag pull — surfaced peptide and small-molecule biotechs.

---

## Source trust ranking

When a candidate company surfaces, this is how much we trust the signal:

1. **Existing Teknova Salesforce accounts tagged as AAV.** Highest. Treat as confirmed.
2. **Company's own website.** High. Pipeline / About / platform pages are the source of truth on modality.
3. **Web-search-grounded summary (Exa, Perplexity).** Medium. Surface candidates here, then verify on the website.
4. **Paid firmographic database industry tag.** Low for AAV specifically. Cannot distinguish AAV from other modalities. Never the sole source for adding to the AAV list.

---

## Auto-add vs. queue for review

Companies sourced under the current rules go through this filter:

- Confirmed by Salesforce tag → auto-add.
- Confirmed by two or more sources (e.g., website + Exa) → auto-add.
- Confirmed by a single source → queued for Ellie's review before enrichment runs.

Why: most legitimate AAV companies show up across multiple sources. Single-source surfacing is where most mistakes happen.

---

## Re-evaluation cadence

Archived and re-routed companies are re-evaluated only when a public signal surfaces: funding round, IND announcement, leadership change, platform pivot. No quarterly sweep. No calendar-based re-checks. Signal-triggered only.

---

## Alt-play pool surfacing

Non-AAV biotechs held in the re-route pool surface in a summary when:

- The pool crosses 50 companies in a single modality bucket, OR
- A new alt-play is being designed and the pool is queried for fit.

Weekly surfacing was rejected as noise. Threshold-based matches when the pool is actually useful.

---

## How Ellie influences this doc

Same as the taxonomy doc: react to the live results in the Airtable "Enrichment Runs" table (RevOps Surface base, `appYBYH3aOHhTODAw`), or mark up the change log directly.

The most common feedback shape: "this query is pulling in companies it shouldn't" or "I'm seeing the same company surface from only one source and getting it wrong." Both translate to rules edits here.

See [revops-gate-results-aav-gene-therapy-ellie-outreach.md](revops-gate-results-aav-gene-therapy-ellie-outreach.md) for the run-table field reference and review flow.

---

## Change log

| Date | Change | Requested by |
|---|---|---|
| 2026-05-11 | Initial operating version | Nick |
