# Email draft: AAV discovery list to Ellie

**Subject:** New AAV discovery approach — first list from clinical trials
**From:** Nick
**To:** Ellie
**Date drafted:** 2026-05-12
**Status:** DRAFT — Nick to add links and send

---

Hi Ellie,

Wanted to share where we've landed on AAV discovery. The short version: we've replaced the legacy sourcing approach with one built specifically for this segment, and the first list from the new system is ready for your review.

**Why we're changing approach**

The previous sourcing pulled from general firmographic databases tagged "gene therapy" and tried to filter AAV companies out of the noise. That output has been inaccurate. The general databases don't reliably distinguish AAV from other vectors, other modalities, or the autoimmune disease ANCA-Associated Vasculitis (which shares the AAV acronym in clinicaltrials.gov). The signal-to-noise ratio was wrong, and tightening filters on a bad input doesn't fix that.

The new approach is source-first. We start from authoritative sources where AAV companies have to be explicit about what they do, then layer additional sources as we expand. Each source surfaces companies from a different angle, and together they triangulate the canonical AAV universe.

**First source: clinicaltrials.gov**

This list is the first pass. Every AAV-related interventional study, lead industry sponsor extracted, classified against a rule set we want you to own.

- 263 trials processed
- 103 unique industry sponsors
- 32 surfaced as confirmed AAV (canonical indication match)
- 65 borderline (need your judgment)
- 6 rejected automatically as ANCA-Vasculitis false positives

Two attachments:

1. **The list** (Google Sheet) — 97 companies in surfaced + borderline, with the data you'd use to verify each one. [GOOGLE SHEET LINK]
2. **The classification rules** (Google Doc) — what term lists and logic the system used to classify each row. The doc ends with a section asking what additional columns would help you verify faster. [RULES DOC LINK]

**Sources we'll add next**

This is one source. The full canonical pipeline brings in several more, each adding a different signal:

- **USPTO patent filings.** AAV-specific patent classification codes (vectors, capsid engineering). Captures companies investing in the platform but not yet running registered trials.
- **Industry directories.** ARM Atlas, ASGCT exhibitor and member lists. Pre-classified by modality at the directory level, which is much cleaner than firmographic database tags.
- **PubMed scientific literature.** AAV process development, capsid engineering, vector production papers. Surfaces academic spinouts and preclinical companies.
- **Funding and milestone signals.** Recent Series A through IPO announcements for AAV-named companies, IND filings, leadership hires. Adds buying-readiness alongside identification.
- **Existing Teknova accounts already tagged AAV.** Closes the loop on companies you already work with.

Once these are layered in, each company in the universe will be supported by multiple sources rather than one, which gives us confidence rankings and a way to catch what any single source misses.

**What I'd ask of you on this first pass**

1. Scan the surfaced rows — flag anything that's not AAV.
2. Work the borderline rows — AAV / not AAV / not sure, single-column call per row. Use the First Trial Link in the sheet to verify quickly.
3. Mark up the rules doc — missing indications, wrong exclusions, anything to tighten.
4. Tell me about companies we missed.

This list is the AAV verification gate, not the outreach list. Firmographics, contacts, and signal enrichment come after you've confirmed which companies are actually AAV — that way we don't spend enrichment effort on the wrong ones.

— Nick

---

## For Nick — what to do before sending

1. **Upload the CSV to Google Sheets:**
   - File: `accounts/clients/teknova/ellie-aav-discovery-2026-05-12.csv` (97 rows)
   - Google Drive → New → Sheets → File → Import → upload the CSV → "Replace spreadsheet"
   - Name: `AAV Discovery - Ellie Review - 2026-05-12`
   - Quick formatting: freeze row 1, bold header, widen Company column
   - Share → "Anyone with the link can view" (or "comment" for inline annotations) → copy link
   - Paste into email at `[GOOGLE SHEET LINK]`

2. **Upload the rules doc to Google Docs:**
   - File: `accounts/clients/teknova/ellie-aav-classification-rules-2026-05-12.md`
   - Easiest: open Google Docs → New blank doc → paste the markdown content. Quick visual pass to clean up formatting glitches.
   - Name: `AAV Classification Rules - 2026-05-12`
   - Share → "Anyone with the link can comment" → copy link
   - Paste into email at `[RULES DOC LINK]`

3. **Final pass:** read once for tone. Send.

---

## Internal reference (not for Ellie)

- L1 capture workflow: `9gcmEjq1lvOY2jZS`
- L2 classify workflow: `rXKuqfDwqX7TYzxK`
- 263 CT.gov studies → 103 unique sponsors → 32 surfaced / 65 borderline / 6 rejected
- Rules Version: 2026-05-12-v1
- Data lives in Airtable RevOps Surface base; client only sees the Sheet + Doc.
