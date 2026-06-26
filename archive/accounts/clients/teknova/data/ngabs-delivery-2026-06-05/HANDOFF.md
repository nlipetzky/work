# ngAbs Delivery — Handoff

**Date:** 2026-06-05
**Client:** Teknova
**Play:** ngAbs (next-generation antibodies — bispecific ADCs, multispecifics, conjugated-antibody subclasses)
**Source-of-truth criteria:** `/Users/nplmini/code/work/accounts/clients/teknova/sources/teknova-ngabs-playbook-v1-2026-05-29.md`
**Working folder (this delivery):** `/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05/`

## Purpose

Take the existing 420-company ngAbs pile, apply the client expert's feedback, fill the highest-value gaps via in-place enrichment, and produce a delivery the client expert (Ellie Oleson, Market Development at Teknova) can review today.

Working principle: **source files are not mutated.** All work happens on copies in this folder.

## What's already done (status as of 2026-06-05)

- **420 companies** sourced and run through the classifier. State distribution:
  - **Site Verdict:** 85 confirmed, 2 needs_review, 35 excluded, 298 pending
  - **Has ngAbs Program:** 122 yes, 253 no, 41 unclear, 4 blank
  - **Role:** 90 CDMO service provider, 64 developer, 246 not applicable, 15 platform company, 1 developer + platform, 4 blank
- **NA Site Verdict is folded into Site Verdict** ("confirmed" already implies NA wet-lab site exists). The standalone `NA Site Verdict` and `NA Sites Detail` columns are blank by design; they are not enrichment gaps.
- **Lab & Process Job Openings** filled for all 420.
- **Contacts roster filled** for 43 of the 85 confirmed; 42 confirmed have no contacts.
- A contacts table exists at `/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Contacts-all.csv` (not yet examined in detail; provided when needed).

## Source files (do not mutate)

| File | Purpose |
|---|---|
| `/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Companies-all.csv` | The 420-company source. 37 columns. |
| `/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Contacts-all.csv` | Contact-side source. Examine when contact enrichment begins. |
| `/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Companies_Ellies feedback_2026.06.05.csv` | Ellie's per-row review notes on 22 of the 85 confirmed companies. |
| `/Users/nplmini/code/work/accounts/clients/teknova/sources/teknova-ngabs-playbook-v1-2026-05-29.md` | The definitive criteria document received from Teknova. **v1 is the only client document.** Do not refer to "v2" — that was an internal draft proposal, not a client artifact. |

## Working files (this folder)

| File | Purpose |
|---|---|
| `HANDOFF.md` (this file) | Self-contained context for any session picking up the work |
| `ngabs-companies-viewer.html` (lives at `/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-companies-viewer.html`) | Standalone browser viewer for the 420 companies. Filter chips for Site Verdict, search, sortable table, click-row-for-drawer. Not a Deepline artifact. Misses 5 of 37 CSV columns in the drawer (Enrich Company, Research company ICP with AI, LinkedIn URL (Confirmed Only), Update People Search, Share); patchable. |

## Client feedback (Ellie Oleson)

Two channels, both captured in full below so a cold session can act on them without re-fetching.

### Channel 1 — Email thread, 2026-06-02 (reply to our first checkpoint)

Ellie's reply addressed two questions:

**Q1 — Acquired-company routing (Seagen / Pfizer):**
> "The ideal goal (from a prospecting angle) would be to keep Seagen if they are still using Seagen emails or shift to Pfizer if they are using Pfizer emails. Unfortunately, I'm finding both emails in Apollo, but many are likely outdated. I see that all correspondence in our CRM with Seagen's location is using Pfizer emails. Can you build this type of screening into the model?"

**Action:** route contacts by email domain. Seagen email → keep as Seagen. Pfizer email → file under Pfizer Oncology. Same logic applies to other acquired companies in the 420.

**Q2 — Tighten Gate G1 to exclude fragment-only:**
> "Let's tighten gate G1 so it requires bispecific/multispecific/ADC and treats standalone fragments as out-of-scope (with the co-occurrence exception). Which would also adjust Section 2.4 to state 'adjacent only when paired,' not independently qualifying."

**Action:** G1 must require bispecific/multispecific/ADC. Fragments are out-of-scope unless they co-occur with bispecific/multispecific/ADC work. Section 2.4 language: fragments are adjacent only when paired.

### Channel 2 — Email thread, 2026-06-05 (reply with annotated CSV attached)

Ellie reviewed 22 of the 85 confirmed companies and attached her per-row notes. She also called out two model-training corrections in the email body:

**Training note A — Expand G1 to include other conjugate subclasses:**
> "Antibody Oligonucleotide Conjugates (AOCs), radioimmunoconjugates (RDCs), and immunocytokines are all conjugated-antibody subclasses that share the ADC reagent profile but won't match a literal 'ADC' keyword. If the data engine is screening on the strings 'ADC / bispecific / multispecific' only, it will systematically miss or mis-park AOC companies like Avidity (and Tallac, Denali's conjugates, etc.). Worth adding 'AOC,' 'antibody oligonucleotide conjugate,' 'radioconjugate/RDC,' and 'immunocytokine' as in-scope conjugate signals to Gate 1."

**Action:** add as in-scope G1 signals: AOC, antibody oligonucleotide conjugate, radioconjugate, RDC, immunocytokine.

**Training note B — Vocabulary-trap false positives:**
> "Mismatched due to similar verbiage:
> ImmunityBio — matched on 'fusion protein' / 'Fc' (IL-15 superagonist)
> Polaris — matched on 'conjugate' / 'PEG' (PEGylated enzyme)
> Lyell — matched on 'bispecific' (but it modified 'CAR,' a cell therapy)
> Adverum — matches on 'aflibercept / anti-VEGF / Fc' (but the product is an AAV vector)"

**Action:** classifier needs negative constraints, not just positive keyword matches. The four named companies are hard DQs from the delivery.

### Ellie's per-row notes (her 2026-06-05 CSV)

Of the 22 companies she reviewed, 11 have notes and 11 are clean. Full list with her notes:

| Company | Ellie's verdict | Action |
|---|---|---|
| **ImmunityBio, Inc.** | DQ — IL-15 fusion + CAR-NK + vaccines. No bispecific/multispecific/ADC. Fusion-protein-only out of scope. | Hard exclude |
| **Polaris Pharmaceuticals Inc.** | DQ — PEGylated microbial enzyme. Not an antibody at all. | Hard exclude |
| **Lyell Immunopharma** | DQ — CAR T-cell. The "bispecific" string matched a CAR construct, not antibody. | Hard exclude |
| **Adverum Biotechnologies** | DQ — AAV gene therapy company. Fc-fusion vocabulary tripped matcher. | Hard exclude |
| **Kashiv BioSciences LLC** | DQ — monoclonal antibody work only, no bispecific/multispecific/ADC | Hard exclude (also literal duplicate row exists) |
| **FUJIFILM Diosynth Biotechnologies** | Duplicate — acquired by FUJIFILM; already in list as FUJIFILM Biotechnologies | Consolidate into FUJIFILM Biotechnologies |
| **LSNE Contract Manufacturing** | Duplicate — no longer independent, is PCI Pharma Services | Consolidate into PCI Pharma Services |
| **ProBio** | Duplicate of GenScript ProBio | Consolidate |
| **SK pharmteco** | Parent of KBI Biopharma — risk of double-counting | Decision needed: which entity is the buyer (parent or sub)? |
| **PCI Pharma Services** | Edge — primarily fill-finish/packaging CDMO; Simtra-type narrow/late-stage fit, only if it touches ADC drug product | Keep but tier down |
| **Simtra BioPharma Solutions** | Edge — sterile fill-finish, thinner Teknova basket (formulation buffers/water) | Keep but tier down |
| FUJIFILM Biotechnologies | (no note) | Keep |
| PCI Pharma Services | See above edge note | Keep, tier down |
| Exelixis | (no note) | Keep |
| KBI Biopharma | (no note) — but see SK pharmteco parent issue above | Keep |
| Avidity Biosciences, Inc. | (no note) | Keep (also canonical AOC example for training note A) |
| Abzena | (no note) | Keep |
| Avid Bioservices | (no note) | Keep |
| Bionova Scientific | (no note) | Keep |
| Sino Biological, Inc. | (no note) | Keep |
| GenScript ProBio | (no note) | Keep (canonical for the ProBio dedupe) |
| Immunome, Inc. | (no note) | Keep |

**Summary of row actions on the 85 confirmed:**
- 5 hard DQs (ImmunityBio, Polaris, Lyell, Adverum, Kashiv)
- 4 consolidations (FUJIFILM Diosynth → FUJIFILM, LSNE → PCI, ProBio → GenScript ProBio, second Kashiv row)
- 1 ambiguous (SK pharmteco vs KBI parent — needs Nick or Ellie call)
- 2 tier-downs (PCI, Simtra)
- 11 clean keepers reviewed
- 63 confirmed companies NOT yet reviewed by Ellie. If error rate from her 22-row sample holds (5 DQs out of 22 = 23%), expect ~14 more false positives in the unreviewed 63.

## Open questions to Ellie (none answered yet)

- **SK pharmteco vs KBI Biopharma** — parent or sub as the buyer? Both kept in list creates double-counting risk.
- **Q3, Q4 from the Jun 2 checkpoint reply** — her email was cut off, only Q1 and Q2 are captured above. If there were Q3 and Q4 with substantive content, they were not received.

## Column inventory (37 columns on `ngAbs Companies-all.csv`)

```
Company Name | Triggers | Description | Primary Industry | Size | Type |
Location | HQ_STATE | HQ_CITY | Country | Domain | LinkedIn URL |
Enrich Company | Employee Count | Founded | Follower Count |
Research company ICP with AI | Confidence | Evidence Quote | Role |
Has ngAbs Program | Company Research Narrative | Conference Presence |
Modality Types | Antibody Trials Overview | ngAb Press Mentions (News) |
NA Site Classification | Record ID | Site Verdict |
Lab & Process Job Openings | LinkedIn URL (Confirmed Only) |
Update People Search (Find people Table) - 2026-06-03T17:04:45.167Z |
Contacts | data status | Share | NA Site Verdict | NA Sites Detail
```

## Gap analysis (per-column blanks, across all 420)

**Solid (don't touch):**
- Domain, LinkedIn URL, Primary Industry, Size, Location, HQ_CITY, Country — 0% blank
- Description, Company Research Narrative — 0% blank
- Site Verdict — 0% blank (and folds NA Site Verdict per above)
- Lab & Process Job Openings — 0% blank

**Real gaps:**

| Column | Blank in 420 | Blank in 85 confirmed | Notes |
|---|---:|---:|---|
| Founded | 113 (26%) | 26 (31%) | Provider-fillable (Apollo / Explorium) |
| Conference Presence | 335 (79%) | 50 / 85 | Web research |
| Antibody Trials Overview | 335 (79%) | 49 / 85 | ClinicalTrials.gov by sponsor |
| ngAb Press Mentions | 336 (80%) | 50 / 85 | Exa / Perplexity / Bloomberry |
| NA Site Classification | 298 (70%) | 32 / 85 | Same providers as NA verification — but note NA Site Verdict is already encoded in Site Verdict |
| Contacts roster | 226 (53%) | 42 / 85 | **Highest-value gap on confirmed set.** Apollo / Crustdata / Explorium person search |
| Employee Count | 3 (~0%) | 1 / 85 | Already mostly filled |
| HQ_STATE | 14 (3%) | — | Mostly filled |

**Note on NA Site Verdict / NA Sites Detail columns:** these are blank on all 420 BY DESIGN. The information they would carry is folded into Site Verdict ("confirmed" = NA site exists). Do not treat as enrichment gaps.

## Priority list for in-place enrichment (proposed, not committed)

This is the working order discussed in the planning session. Nick has not approved any provider run yet.

1. **Apply Ellie's row-level corrections** to a working copy. No provider calls. Free, ~5 min. Drops 5 hard DQs, consolidates 4 duplicates, tier-downs 2. Net: ~76 clean confirmed remain.
2. **Contacts for ~42 confirmed missing them.** Highest-value real enrichment. Apollo / Crustdata / Explorium person search by company domain + title filters per the playbook ICP.
3. **Antibody Trials Overview** for confirmed set (49 missing). ClinicalTrials.gov by sponsor name.
4. **ngAb Press Mentions** for confirmed set (50 missing). Exa or Perplexity search.
5. **Founded year** for confirmed set (26 missing). Apollo / Explorium company enrich. Nice-to-have, weak signal.
6. **Conference Presence** for confirmed set (50 missing). Lowest priority.

## Provider availability (incomplete — to verify with Nick)

- **Hunter** — confirmed toggled on with Nick's own API key in Deepline integrations. Email enrichment via Nick's key, billed direct to Nick by Hunter, no Deepline platform fee observed.
- **Prospeo, Forager, LeadMagic, Dropleads** — bundled free by Deepline (empirically confirmed in billing).
- **Deepline Native Contact** — Deepline first-party data, $0.10 per result, billed in Deepline credits. Can't be overridden.
- **Apollo, Crustdata, Explorium, Apify, Firecrawl, Exa, PDL, Lusha** — UNKNOWN. Need to verify which Nick has plugged in. Determines whether contact enrichment runs on Nick's keys (free to Deepline) or burns Deepline credits.
- **Current Deepline balance:** 23.04 credits (~$2.30) as of 2026-06-05 19:00 CDT.

## Deepline session state (open issue)

A stale Deepline session from earlier today (ID `67d8ac22-aa24-4ea5-a5a1-ff9ba268bfe3`) is still showing "Agent is waiting" in the UI. It was started for the unrelated quickstart demo, plan got reset mid-run, never closed cleanly. Starting a fresh session for the ngAbs work via `deepline session start` would replace it.

## Working conventions

- Source files in `/data/` are not mutated. All work happens on copies in `/data/ngabs-delivery-2026-06-05/`.
- Use absolute paths in all CLI commands.
- Per Nick's preference, lead with diagnosis, no em dashes, no emojis in artifacts, no person names in classifier prompts (Ellie's name is fine in this handoff and in chat context because it's not a system artifact).
- Per Nick's RevOps practice rules: never invent context; if a criterion needs interpretation, surface the question.
- "Hold things loosely" — name judgment calls as judgment calls.

## What's NOT decided yet

- Whether any provider call will run today (Nick has not approved enrichment yet)
- Whether to deliver via Airtable upsert into Teknova Outreach base or as a standalone CSV (Nick: CSV is enough)
- Source expansion (Tallac, Denali's conjugates, other AOC companies surfaced by Ellie's G1 expansion) — out of scope for today per Nick
- Contacts CSV usage — Nick said the contacts table is available but he'll "provide it when needed"

## Next concrete steps when work resumes

1. Confirm provider availability (which API keys Nick has plugged in to Deepline integrations)
2. Get Nick's approval to start a fresh Deepline session covering today's plan
3. Execute step 1 of priority list (Ellie's row corrections on a working copy)
4. Pause for spot-check, then continue down the priority list

## Files this handoff references (absolute paths)

- Source CSVs: `/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Companies-all.csv`, `ngAbs Contacts-all.csv`, `ngAbs Companies_Ellies feedback_2026.06.05.csv`
- Client criteria: `/Users/nplmini/code/work/accounts/clients/teknova/sources/teknova-ngabs-playbook-v1-2026-05-29.md`
- Latest pipeline state from prior session: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/ngabs-pipeline-handoff-2026-06-04.md`
- Segment criteria (derived): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-ngabs.md`
- Offer (derived): `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-offer-ngabs.md`
- Standalone viewer (not Deepline): `/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-companies-viewer.html`
