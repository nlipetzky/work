# Handoff: apply Ellie's feedback to the AAV operating docs

**Date:** 2026-05-11
**For:** the RevOps practice skill that produced the three AAV operating docs in `accounts/clients/teknova/artifacts/`
**Mission:** fold Ellie Oleson's two rounds of feedback (Apr 17 email + May 9 spreadsheet) into the existing taxonomy and sourcing docs in place. Surgical edits, not rewrites. Once these land, a separate session drafts an email to Ellie that can honestly say "your feedback is encoded in the rules."

## Inputs

**CSV with Ellie's May 9 rejection codes (200 leads, 51 coded):**
`/Users/nplmini/Downloads/Official AAV Campaign List 2026.04.17_with partial feedback edits 2026.05.08.xlsx - Sheet1.csv`

Columns: `shortened feedback notes` (her one-phrase code), `detailed feedback` (her sentence-long reason), Company, First Name, Last Name, Email, Title, LinkedIn URL, State/Region, City.

**Ellie's April 17 email body callouts** (no attached list, the feedback is the email itself):

Companies misclassified as AAV:
- Verve Therapeutics ... GalNAc-LNP delivery, not AAV
- Replay ... synHSV technology, explicitly positioned to disrupt and replace AAV
- Krystal Biotech ... HSV-based redosable gene therapy
- Carmine Therapeutics ... non-viral alternative to AAV
- Bluebird Bio ... lentiviral vector
- American Gene Technologies ... lentiviral
- Toran Therapeutics ... LinkedIn record can't be found, emails actually @aperturagtx (Apertura IS AAV)

Contacts with mismatched identity:
- Blake Albright (Toran) ... LinkedIn profile is Kristen Albright from London
- Ava Haley (Lacerta) ... LinkedIn says 4th grade teacher
- Houston Haws (Bluebird) ... left Bluebird October 2024
- Cyrill Kellerhals (Andelyn) ... email is @northstar, LinkedIn is a construction laborer

## Targets (edit in place, do not create new files)

- `accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md`
- `accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md`
- `accounts/clients/teknova/artifacts/revops-gate-results-aav-gene-therapy-ellie-outreach.md`

## Edits required

### 1. Taxonomy doc

**Re-route table:** add named worked examples to each row. Ellie's callouts are the authoritative real-world examples. Don't replace the table, augment the right column:

- Lentiviral ... Reagent-readiness pitch, viral-vector framing without AAV-specifics. _Worked examples (Apr 17 Ellie callouts): Bluebird Bio, American Gene Technologies._
- Other viral vector (adenovirus, herpes, vaccinia) ... _Worked examples: Replay (synHSV), Krystal Biotech (HSV-based)._
- Non-viral delivery (LNP, electroporation) ... _Worked examples: Verve Therapeutics (GalNAc-LNP), Carmine Therapeutics._

**Add Castle Creek Biosciences** to the re-route table under Autologous cell therapy. Source: CSV ("Not AAV" code on 2 contacts).

**Add archive rule:** "Company defunct or not operating." Edge-case disqualifier. Worked example: Locanabio (defunct since 2023, surfaced in CSV).

**Change log:** add a 2026-05-11 entry crediting Ellie:

| Date | Change | Requested by |
|---|---|---|
| 2026-05-11 | Worked examples added to re-route table from Ellie's Apr 17 review (Bluebird, AGT, Replay, Krystal, Verve, Carmine). Castle Creek added to autologous cell re-route. Defunct-company archive rule added (Locanabio). | Ellie Oleson (Apr 17 email + May 9 spreadsheet) |

### 2. Sourcing rules doc

**Promote the ICP role-exclusion list into the doc** as an explicit rule, not implicit tribal knowledge. Per Teknova CLAUDE.md: exclude Legal, Sales, Talent Acquisition, Marketing, IT, Finance, Regulatory, Program Management, QC. Worked examples from the CSV:

- Regulatory consultant (Kimberly Benton, Rosemarie Logan at Dark Horse Consulting)
- Board chair (Ben Yerxa at Opus Genetics)
- Chief People Officer (Tracy Porter at Taysha)
- Strategic HR / Chief HR (Michelle Smith, Voyager)
- Accountant (Tiana Maraia, Voyager)
- IT support engineer (Barry Lubov, AskBio)

**Add a new "Contact-level qualification gate" section.** The existing doc handles company-level sourcing. Ellie's May 9 rejection codes are mostly contact-level. Three checks, in order:

1. **Employment-current check.** Stored employer must match LinkedIn current employer. If LinkedIn shows a new employer, route the contact to the new employer's classification pass instead of dropping. CSV gives ~18 ready-to-re-route examples (Krithika Murali → Regeneron, Jason Rodriguez → CREATE Medicines, Christopher Klem → enGene, etc.).
2. **Title-verified check.** Stored title must materially match LinkedIn current title. "Process Engineer" stored against a CEO, accountant, board chair, or HR officer is the largest single failure mode in the CSV (19 of 51 rejections). Reject if mismatch, optionally re-enrich.
3. **BD suppression check.** Cross-reference Salesforce activity. Reject if the contact is in an active BD cadence, event campaign, or has been emailed by BD in the last 90 days. CSV shows 7 ready examples (David Knop, Justin Whiteman, Brandt Davidson, Kory Blocker, Akram Ramdan, Alexis Yohmba, Ratnesh Joshi).

Label each check honestly. If a check is rule-defined but automation isn't wired yet (likely true for the SF suppression piece given Phase 3 status), say so: "rule in effect, enforcement pending SF sync."

**Departure-cluster observation:** Apertura Gene Therapy contributed 7 of the 18 departed contacts in the CSV. Worth a sourcing-level note that companies with departure-cluster signals get a confidence reduction on their contact list, not a re-classification. The company is still correctly tagged AAV.

**AAV vocabulary register (new section in the sourcing doc):** the current sourcing rule's strict pattern matches the literal acronym "AAV" plus a mechanism word. That works on dirty marketing pages but misses the broader vocabulary the industry actually uses across audiences. Add a new section titled "AAV vocabulary register" that documents the term variants and tells the matching logic to be source-aware.

Term variants to enumerate in the section:

- Acronym forms: `AAV`, `rAAV` (recombinant AAV, the engineered form used in gene therapy)
- Full term: `Adeno-Associated Virus`, `Adeno-Associated Viral`
- Serotype patterns: `AAV1`, `AAV2`, `AAV5`, `AAV6`, `AAV8`, `AAV9`, `AAVrh10`, `AAVrh74`, `AAVhu37`, `AAVhu68`, plus the regex form `AAV[0-9rhu]+`
- Mechanism words (strong adjacent signals): capsid, serotype, transduction, tropism, viral vector, packaging cell line, HEK293, baculovirus, Sf9, episomal, tissue-tropic
- Investor / corporate register umbrella terms (weak on their own, strong when paired with a monogenic indication): genetic medicines, one-time gene therapy, durable expression
- Process development / CMC register (Ellie's actual buyer audience): titer, full/empty capsid ratio, affinity chromatography, transient transfection, stable producer cell line, CsCl gradient

Vocabulary by audience (document this in the section so the next person knows why the rule is source-aware):

- **Scientific / academic literature** uses `rAAV` paired with serotypes and capsid engineering language
- **Regulatory filings (CT.gov, FDA, EMA)** use both `AAV` and the full `Adeno-Associated Virus`, often in the same document
- **Investor / corporate marketing** uses umbrella terms; AAV-specific language lives on the technology or pipeline page, not the homepage
- **Process development / CMC** uses technical CMC vocabulary; these are the strongest contact-level signals for reagent-buyer identification

Source-aware matching rules to write into the doc:

- **Website-level signals:** require ANY of (acronym form, full term, serotype pattern) AND ANY of (mechanism word, canonical monogenic indication, capsid-platform language) on the same page. Scrape the technology, pipeline, and platform pages, not just the homepage ... companies like Spark and Lexeo lead with umbrella terms and only name AAV on inner pages.
- **Regulatory signals (CT.gov, IND data):** the intervention-name + indication rule lives in the parallel workflow-validation handoff. Keep it source-specific.
- **Patent signals (future canonical source):** match IPC/CPC codes in the C12N15/86 viral-vector family plus the term list.
- **Industry directory signals (future canonical source):** use the directory's modality category tag first, text search as secondary.

The existing "literal AAV + mechanism word" rule in the sourcing doc is high-precision for one register but narrow. Replace it with the source-aware structure above so future broadening of sources does not require re-discovering this lesson.

**Change log entry:** 2026-05-12, requested by Ellie Oleson (Apr 17 + May 9 feedback) and Nick (AAV vocabulary register observation, 2026-05-12), summarizing what landed.

### 3. Gate results doc

Lighter touch. Two adds:

- Add per-contact fields to the documented Companies/Contacts data model: `Employment Status` (Active / Departed / Unknown), `Employment Verified Date`, `Title Verified` (Y/N), `BD Engagement Status` (Engaged / Clean / Unknown), `Departed Employer` and `Current Employer` (for re-route lookup).
- Add a paragraph in the "How Ellie reviews and gives feedback" section noting that her rejection codes from past list reviews (the May 9 spreadsheet format) are a valid feedback channel and feed directly into sourcing rule edits.

## House style (these matter to Nick)

- No em dashes anywhere. Ellipses ("...") if you need a pause.
- No emojis.
- Match the existing operating doc voice: plain English, each rule has a "how to change this" path, the docs are living and react to data rather than gating on approval.
- Don't change the `Maintained by: Nick (Teknova RevOps)` line. Ellie influences the docs, doesn't own them.
- Each change log entry must credit Ellie by name with the date of her feedback as the trigger.

## What NOT to do

- Don't rewrite the docs. Surgical inserts only.
- Don't add tool names (n8n, Exa, Explorium) beyond what's already in the docs.
- Don't promise features that aren't built. If SF suppression isn't wired, the rule is defined but enforcement is labeled pending.
- Don't add Ellie as a maintainer or change ownership.
- Don't fabricate a new modality bucket if Ellie's CSV doesn't justify it. Castle Creek (autologous cell) is the only company-level new classification this round.

## Definition of done

- Three operating docs updated in place.
- Each has a 2026-05-11 change log entry crediting Ellie's Apr 17 email and May 9 spreadsheet.
- Taxonomy doc names her flagged companies as worked examples in the re-route table.
- Sourcing doc has an explicit role-exclusion list and a contact-level qualification gate section, with CSV examples cited inline.
- Gate results doc has the per-contact data model fields documented.
- No new files created.
- A follow-up session can read the three docs cold and draft an email to Ellie that says "your feedback is in the rules" without it being a lie.

## Open question for the picking-up session

Is the Salesforce activity sync actually live, or still pending Phase 3 delivery? The contact-gate section's BD-suppression rule needs to be honest about which. If Nick can answer in chat, fold the answer in. If not, label as "enforcement pending SF sync" and move on.

## When this handoff is complete

Delete or archive this file. The email-drafting session referenced in `HANDOFF-ellie-progress-email-2026-05-11.md` picks up next, reads the three updated docs, and writes the email.
