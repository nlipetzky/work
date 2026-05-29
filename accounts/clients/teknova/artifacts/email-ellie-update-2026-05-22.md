**To:** Ellie (cc Sasha, Krista)
**Subject:** Update since Thursday's call... AAV pipeline overview, LinkedIn verification, and Salesforce contact verdict

Hi Ellie,

Big week behind the scenes. Here's the full pipeline as it stands now, what shipped since Thursday, and what's next.

---

## The AAV sourcing and validation pipeline, end to end

Since Monday I've been rebuilding pieces of the pipeline based on your feedback. This is what's running now, stage by stage. The named third-party tools at each stage are doing real paid work continuously.

### Stage 1 — Signal capture from public sources

Two custom queries running against public databases:

- **ClinicalTrials.gov** — 5 separate queries against interventional Phase 1-3 genetic and biological trials, paginated through every result, deduped by NCT ID, with industry sponsors extracted.
- **PubMed** — a structured search combining an AAV-specific term set with company-scoped and author-scoped filters.

The AAV term set covers `AAV`, `adeno-associated`, the MeSH terms `Dependovirus` / `Genetic Therapy` / `Genetic Vectors`, every capsid variant from `AAV1` through `AAVrh10`, `rAAV`, generic `gene therapy`, plus every branded AAV product (Zolgensma, Luxturna, Hemgenix, Roctavian, Elevidys, Beqvez, and their generic names). Bare `AAV` is replaced with phrases like `"AAV vector"` / `"AAV gene"` / `"AAV capsid"` to avoid false matches on `ANCA-Associated Vasculitis` (unrelated autoimmune condition).

Most of Monday and Tuesday went into tuning this query. Current surface: **3,035 AAV-related signal records**.

### Stage 2 — AAV classification

Every captured signal runs through an LLM verification pass (Anthropic Claude Haiku 4.5) with a structured prompt that returns:

- **AAV Verdict** — yes/no on whether the work is truly AAV-related
- **AAV Segment** — gene therapy / production tool / both
- **Activity Status** — active, recent, or stale, based on evidence date
- **AAV Rationale** — long-form reasoning (this populates your `Translated Body` field)

Activity windows: 90-day / 6-month / 12-month for active, 2-5 years for recent, older than 5 years for stale. The current view shows only `Active` companies. We can open it up to `Recent` if you want to expand the universe.

This filter removes the noise from the term-based search. Roughly a third of captured signals get rejected at this stage.

### Stage 3 — Company surface and rollup

Each verified AAV signal rolls up to a company. The rollup produces `AAV Event Count`, `AAV Active Event Count`, `Latest AAV Event Date`, and a derived formula field labeling each company `Active AAV` / `Former AAV` / `Not AAV`. Companies hitting `Active AAV` move forward. Current count: **92 globally, 50 after the US/Canada geography filter**.

### Stage 4 — Company enrichment

The 92 Active AAV companies run through the Companies Enrichment workflow. Each company gets matched against Explorium, pulling **200+ firmographic fields** (employee count, founded year, revenue, funding rounds, locations, ratings, web traffic signals, technology stack, etc.).

A domain resolver (Exa-based, web-grounded) handles subsidiaries, recent acquisitions, and M&A artifacts. So `Brain Neurotherapy Bio` resolves to AskBio firmographics, `Gyroscope Therapeutics` resolves to Novartis (acquired 2022), `Baxalta now part of Shire` resolves to Takeda. The operating company is what matters for outreach, not the legal entity name Apollo happens to have stored.

Current state: 78 of 92 Active AAV companies have full enrichment. The remaining 14 are either disqualified (Chinese biotechs with no clean English web presence) or archived (Explorium has no record).

### Stage 5 — Contact sourcing and ICP gate

For each enriched company, the Contact Sourcing workflow runs Apollo's people search, enriches matches via Apollo and Hunter.io (for email verification), and applies a multi-step ICP filter. Persona criteria for this play:

- Seniority floor: Director and above
- In-scope functions: Tech Ops, Process Development, CMC, Manufacturing, External Manufacturing, Supply Chain
- Title keywords: process development, process science, CMC, viral vector, downstream processing, purification
- Hard exclusions: legal, IT, HR, sales, finance, marketing, regulatory CMC, statistics, patient-facing, non-CMC program management

The Primary / Secondary / Watch List bucket assignment comes from a residual LLM scoring pass (Claude Haiku) that reads the persona definition and scores each contact 0-100 with rationale. Reasoning is captured next to each contact so you can see why they were tiered.

A 52-contact audit on Pfizer showed **87% of Apollo's raw Pfizer results fail the hard filters** — mostly Senior Associates (below the Director floor), Principal Scientists (bench IC, not operators), or Regulatory CMC (banned per your criteria). The ICP gate is what gets the count down to actual outreach-ready operators.

### Stage 6 — LinkedIn live verification

For every contact, a webhook fires a live Apify pull against the contact's LinkedIn profile (`harvestapi` scraper, ~$0.004 per pull) and writes back:

- **LinkedIn Live Title** / **LinkedIn Live Employer** — current profile values
- **LinkedIn Verification Status** — Match / Mismatch / Open to Work / Not Found / URL Invalid
- **LinkedIn Verified Live** — human-readable summary including headline, tenure, open-to-work flag
- **LinkedIn Last Verified At** — timestamp
- **Mismatch Reason** — when flagged, a sentence explaining exactly what differs

When the company matches but the title is a formatting change or small role shift inside the same company, the workflow auto-corrects the stored title and writes a record into a linked Enrichment Run on the contact. Your data quietly gets better over time, and there's an audit trail per contact.

Practical use: Open to Work and Not Found are contacts to skip. Mismatch with the reason field tells you whether a second look is warranted. Match means you can go.

### Stage 7 — Salesforce sync and contact verdict (new this week)

Two layers here:

**Layer 1: Native two-way mirror.** The Airtable-Salesforce connector keeps a full read-only Salesforce mirror in Airtable. The `Schema Map and DataSync` view exposes all SF contacts and leads with their fields — `2,300+ accounts, 4,173 leads, 3,071 with opt-out flags`.

**Layer 2: SF Contact Summary workflow (new).** For every outreach-eligible contact, a webhook fires that:

1. Looks the contact up in both the SF Contact mirror and SF Lead mirror by email
2. If matched, fetches fresh data live from Salesforce (current owner, opt-out flags, last activity date)
3. Runs a Claude Haiku pass that writes a short verdict to the contact's `SF Contact Summary` field

The verdict reads as one of: `Safe to reach out — net-new contact`, `Hold and coordinate with owner [name]`, or `DO NOT CONTACT`. The reasoning is in the field alongside.

In parallel, the workflow propagates opt-out flags into Airtable directly: `DNC / Opt-Out (Email)` and `Phone DNC` get auto-flipped to true whenever Salesforce shows the contact has opted out. Safety rail: these flags only go false → true. The workflow never reverses a manual flag.

What this means for your workflow: before reaching out to a contact, you open the row and read one field. No more logging into Salesforce per contact to check status. Filter `DO NOT CONTACT` and you see the suppression list in one click.

Tested on **395 of 484** current outreach contacts. One true-branch hit so far: Gauhar Rybarczyk at AskBio matched as a Lead owned by Ashley O'Neil → verdict "Hold and coordinate with owner." 394 hit the net-new fallback (no overlap with Teknova's SF activity yet — expected, since this is a fresh outreach cohort). Zero DNC flips so far, also expected: cross-checked the 484 outreach contacts against Teknova's 3,071 SF opt-out records and found **zero overlap**. The propagation logic is correct by inspection and will fire as the outreach list grows into territory that overlaps with prior SF activity.

---

## The funnel, recapped (with data layer)

Walking the numbers down the pipeline, with the third-party work happening at each stage:

| Stage | Surviving count | Third-party work |
|---|---|---|
| Public signal capture | 3,035 records | PubMed + ClinicalTrials.gov API queries, paginated weekly |
| LLM classification | 92 Active AAV companies | ~2,000+ Anthropic Claude Haiku classification passes |
| US/Canada geography filter | 50 companies | (rule-based, no API) |
| Company enrichment | 78 fully enriched | 92 Explorium firmographic pulls (200+ fields each), Exa domain-resolution calls for subsidiaries/acquisitions |
| Contact sourcing | 395 contacts | Apollo people-search across 50 companies, Hunter.io email verification |
| Persona ICP gate | **89 Primary contacts** | Anthropic Claude Haiku residual scoring per contact |
| LinkedIn live verification | (running per contact) | Apify `harvestapi` LinkedIn pulls, ~$0.004 each |
| Salesforce verdict | 395 of 484 tested | Salesforce live queries + Anthropic Claude Haiku summarization |

---

## What we found in the LinkedIn verification pass

I ran verification across the AAV contacts and looked at every mismatch. After tuning the comparator to filter company suffix variants and title abbreviation noise, we're down to 16 legitimate mismatches. They split cleanly:

- **6 Gyroscope Therapeutics contacts** who are actually at Novartis (acquisition lag in Apollo).
- **4 contacts stored as NGGT (Suzhou) Biotechnology** who are actually at Vir Biotechnology. Apollo appears to have misattributed the organization.
- **3 contacts stored at AskBio France SAS** who are actually at the US parent (AskBio Inc. / Asklepios BioPharmaceutical). Apollo has the subsidiary.
- **1 contact** moved from Adverum to Lilly (Lilly acquired Adverum).
- **2 real employer changes**... one contact moved from AskBio to Veloxis recently, and one record was outright wrong (Apollo had her at AbbVie but she's been at Merck Sharp & Dohme for 16+ years).

Each is captured in the contact's `Mismatch Reason` field with a one-sentence explanation. Most of the time it's a stored employer that's a pre-acquisition or subsidiary entity, and the person is at the same effective company under a different legal name.

---

## Adjacent finding worth sharing

While auditing the Pfizer publication signals, I went deep on the 35 individual scientists named as authors across 18 AAV publications. **Zero of them work in process development, CMC, viral vector production, downstream processing, purification, or manufacturing science.** Every named person sits in an adjacent function: analytical R&D, clinical/medical affairs, biostatistics, clinical pharmacology, drug safety, bioanalytical.

This isn't a Pfizer quirk. It's structural to how the pharma industry publishes. Process development and CMC work doesn't publish... the output of a process team is a process, batch records, CMC modules. Those are intentionally proprietary. What publishes is the work tied to clinical evidence packages and regulatory filings.

The implication: publications confirm where companies are doing AAV work (great for company-level signal), but they don't surface the operator buyer (bad for contact-level signal). Contact sourcing has to come from Apollo's people-search side, not from publication co-author extraction. Full reasoning at [/Users/nplmini/code/work/accounts/clients/teknova/artifacts/publication-signal-analysis-2026-05-22.md](/Users/nplmini/code/work/accounts/clients/teknova/artifacts/publication-signal-analysis-2026-05-22.md) if you want it.

---

## Still on my list from Thursday

1. **Build the simplified Airtable view for your daily workflow.** The Contacts table has 133 fields and Companies has 294, most of which are enrichment plumbing you shouldn't have to see. Recommendation is locked at 28 fields for Contacts and 32 for Companies — surfacing tier verdicts and reasons, opt-out flags, owner, recent activity dates, and your override / note fields. I'll build it next week pending your sign-off on the field list. Field spec at [/Users/nplmini/code/work/accounts/clients/teknova/artifacts/airtable-ellie-view-fields-2026-05-22.md](/Users/nplmini/code/work/accounts/clients/teknova/artifacts/airtable-ellie-view-fields-2026-05-22.md).
2. **Add last-touch detail to the SF Contact Summary.** Right now the workflow surfaces `LastActivityDate` from Salesforce but not the subject of the most recent task or email. Adding that requires one more SOQL query — straightforward.
3. **Process the remaining 89 contacts.** 395 of 484 outreach contacts have the SF verdict written. The other 89 are queued or skipped — I'll confirm and complete them.
4. **The funnel summary as a shareable artifact.** A clean walk from 3,035 signal records down to outreach-ready contacts, with the third-party work happening at each stage. Goal is something you can hand to Jen or BD to explain why the final number is what it is, and how the pipeline gets there.

I'll have all four ready next week.

---

**Pipeline activity this week**
3,035 signals captured (PubMed + ClinicalTrials.gov) · ~2,000 LLM classifications (Anthropic Claude Haiku) · 92 Explorium company enrichments (200+ fields each) · 395 Apollo contact pulls · Hunter.io email verification across 395 contacts · 49 LinkedIn live verifications via Apify · 395 Salesforce contact-verdict workflows · Salesforce two-way sync running continuously.

Nick
