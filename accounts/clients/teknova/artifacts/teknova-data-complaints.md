# Teknova feedback on delivered data and lists

Source: NotebookLM "Teknova Events" notebook. Feb 2026 through May 2026.

Complaints from Jenn Henry, Ellie Oleson, and Mika Choudhary on lists, contacts, persona fit, and outreach data we delivered. Most caught after they saw it; internal pre-catches noted.

---

## Individual complaints

### 1. Over-filtering crushed list to 132 records
Jenn Henry, Apr 9, 2026: "I just spent $80,000 to build this thing and I found 132 f****** people to talk to. That's not going to work. if that's the case like we got to shut this down."
- Artifact: Pearl master contact view
- Wrong: enrichment + quality gates choked ~26,000 contacts down to 132 execution-ready
- Caught: after

### 2. Wrong-modality companies on AAV list
Ellie Oleson, Apr 9-10, 2026: "55 of the 65 I looked through didn't even work on AAV... some of these companies don't even work on AAV... they're peptide and small molecule focused. And let's see, Alchus, they don't use AAV... Aspen neuroscience They use autologous cell therapy, not AAV."
- Artifact: AAV Gene Therapy play list (Pearl)
- Wrong: companies tagged as AAV that actually focus on peptides, small molecules, or autologous cell therapy
- Caught: after (Ellie hand-researched before sending)

### 3. Contact-level tag overrode current company reality
Ellie Oleson, Apr 10, 2026: "if they're working for this company maybe they did AAV in the past but they're not now if this company doesn't do it so it wouldn't make sense to reach out to them with an AAV message"
- Artifact: AAV contact list (Pearl)
- Wrong: contacts tagged AAV based on historical experience / LinkedIn skills, not current employer's modality
- Caught: after

### 4. Stale employment data
Ellie Oleson, multiple dates:
- Mar 12: "They changed positions over a year ago in February of 2025, but what was listed on the sheet was their old position and their old company."
- Mar 26: "one guy I'm retiring this is it I saw that on his LinkedIn... eight were removed because they were not a good fit and then seven were no longer working there."
- May 6: "there were like 4 off the bat that aren't at that company and haven't been there for 8 months or longer."
- Artifact: Allogeneic, AAV, RB2B campaign lists
- Wrong: contacts at companies they left months/year+ ago, or actively retired
- Caught: after (Ellie's manual LinkedIn screen)

### 5. Credentials scraped as first/last names
Ellie / Mika, Feb 26 email + SF Sync session: "Melissa Cunningham RN, BSN" -> first=BSN, last=Melissa Cunningham RN. "Like it's the PhD first name value... having PhD or MS or like that person with PMP and a million other things in their title that is so unnecessary."
- Artifact: first-campaign CSV uploads
- Wrong: post-nominal credentials (PhD, RN, BSN, MD, PMP) inserted into first/last name fields, breaking personalization
- Caught: after

### 6. Initials-only names
Ellie Oleson, Feb 26 email + SF Sync: "Lack of full last name: 'Chris L.' from Sigilon Therapeutics"
- Artifact: first-campaign CSV uploads
- Wrong: contacts delivered with only initial for first or last name
- Caught: after

### 7. ALL CAPS company names + accounting suffixes
Ellie Oleson, Feb 26 email: "Account/Company Name formatting... 'Children's National Hospital - Prepay and Add'... 'Beam Therapeutics Inc- NC'... avoiding all CAPS such as 'SIGILON THERAPEUTICS' and 'ORCA BIOSYSTEMS'."
- Artifact: initial campaign emails / CSVs
- Wrong: company names in all-caps or with internal accounting/legal suffixes ("Prepay and Add", "- NC")
- Caught: after

### 8. Big Pharma accounts deleted entirely
Mika Choudhary, Mar 26, 2026: "we lost all the big pharma companies somehow... these are the companies that we lost which were the big company AstraZeneca like AbbVie... I think that was a misunderstanding... we just weren't supposed to message VPs at these big companies... but we still want to be able to message people about these companies just at a lower level."
- Artifact: new Pearl database
- Wrong: rule "don't message VPs at enterprise" was misimplemented as "remove all enterprise accounts"
- Caught: after (Mika diff'd old vs new list)

### 9. Duplicates and repeated rows
Mika Choudhary, Mar 26, 2026: "I did notice there was quite a bit of repetition, multiple times, which was even easy to see even right now with Blake McGomery... I found that again there's 509 unique contacts. A lot of duplicate rows."
- Artifact: Allogeneic Pearl view
- Wrong: same contacts populating multiple rows
- Caught: after

### 10. Personal email addresses
Mika Choudhary, Mar 26, 2026: "a lot of them are personal emails. which is a little bit iffy because that's not necessarily seen as best practice. especially when we're doing Teknova outreach."
- Artifact: Allogeneic Pearl view
- Wrong: enrichment substituted personal emails when corporate emails were missing
- Caught: after

### 11. Wrong LinkedIn URLs
Ellie Oleson, Feb 26 email + Mar 12: "LinkedIn Profile URL listed on the excel overrules SF Navigator's 'best guess'." "I'm having to check and match each lead right now because it's not always picking the right one still... I was picking the wrong person entirely, for the match for the LinkedIn profile."
- Artifact: Salesforce leads / initial campaigns
- Wrong: LinkedIn URLs pointed to wrong people; SF was overwriting good URLs with bad guesses
- Caught: after

### 12. International contacts in a US/CA-only campaign
Mika Choudhary, Mar 12, 2026: "we do not need anybody outside of Canada and the US and that's distorting our data right now... I know some of these companies were mislabeled with Canada."
- Artifact: Smart Companies / Pearl
- Wrong: non-US/CA companies and contacts (Singapore among them) included, inflating TAM
- Caught: after

### 13. 20% bounce / spam rate
Ellie Oleson:
- Mar 12: "one of the big questions is these ones that are getting blocked, right, or spam, marked as spam, how can we avoid that?"
- Apr 2: "I'm finding at least 20% are bouncing back and we're getting rejected as spam."
- Artifact: live email campaigns
- Wrong: "verified" emails bouncing or hitting spam
- Caught: after (live deployment)

### 14. Taxonomy too broad: cell therapy not split by autologous vs allogeneic
Mika Choudhary, Mar 12, 2026: "How do I currently confirm that this is cell therapy allogeneic and not just cell therapy?... I'm hesitant that we've actually been sending our campaigns to the wrong people... we can't just have cell therapy as a category. It has to be cell therapy autologous... if you guys have actually made an incorrect report based on not understanding Teknova's product enough."
- Artifact: Allogeneic contact list (1,300 contacts)
- Wrong: tagged "cell therapy" generically, no autologous vs allogeneic split, totally different product fits
- Caught: after

### 15. Same contacts in multiple campaign lists -> spam risk
Mika Choudhary, Mar 26, 2026: "this contact's on both the cryo as well as the gene therapy... the way it's kind of being done right now would basically end up with us spamming them, right? they'd be on both our lists."
- Artifact: Cryo and Gene Therapy Pearl views
- Wrong: contacts duplicated across active campaigns, risk of overlapping cold sends
- Caught: after

### 16. Agronomy / patient-facing roles in cell-therapy lists
Ellie Oleson:
- Mar 26: "agriculture people aren't good cell therapy fit, right?"
- Apr 2: "if it says patients anywhere, like you're dealing directly with patients and you're not actually working on making the sauce."
- Artifact: Pearl / campaign contacts
- Wrong: enrichment pulled agronomy/plant-science roles and patient-facing clinical roles instead of process-development/manufacturing
- Caught: after

### 17. Offer mismatch: PluriFreeze pitched to non-cryo contacts
Ellie Oleson:
- Apr 9: "I didn't want to waste people on PluriFreeze. These look like good contacts, but this is not the right feature to be selling to them because I can't tell that they work with this in any way... I don't want to blow it. They're coming across like an idiot."
- Apr 16: "PluriFreeze was the first one where I felt like it was too sales pitchy."
- Artifact: PluriFreeze Allogeneic campaign list + messaging
- Wrong: cryopreservation-specific pitch sent to contacts not verified to work in cryo
- Caught: after (during execution)

### 18. Nine months in, no usable data
Jenn Henry, Apr 9, 2026: "we've been working on this for nine months. What the f***? why aren't we right?... I can defend that for another April. but then I'm done."
- Artifact: project state overall
- Wrong: time-to-quality on lists is unacceptable
- Caught: after / ongoing

### 19. Foundation mistrust: companies tagged with modalities they don't do
Jenn Henry, Apr 9, 2026: "when the companies are wrong, that's a problem... as soon as you start to scratch the surface on this thing that this thing we think is already built, it's like what the heck? What's going on?"
- Artifact: Pearl company tags
- Wrong: company-modality tags fundamentally unreliable
- Caught: after

### 20. Defunct companies on the list
Ellie Oleson, May 6, 2026: "one company doesn't even exist anymore. It stopped in 2023."
- Artifact: RB2B web-visitor data / recent AAV list
- Wrong: targeting a company out of business since 2023
- Caught: after (Ellie's pre-send scrub)

### 21. Robotic location tokens in copy
Mika Choudhary, SF Sync session: "location was very wonky... 'Hello, I noticed you were in the Los Angeles metropolitan area.' a normal Los Angeles."
- Artifact: campaign messaging drafts
- Wrong: literal/technical region strings (e.g. "Los Angeles metropolitan area") instead of city names
- Caught: after

### 22. Specific named miscategorization: Alchus
Ellie Oleson, Apr 9, 2026: "Alchus, they don't use AAV. They have this thing that's a not a gene therapy requiring viral vectoral delivery."
- Artifact: AAV Gene Therapy list (566 records)
- Wrong: Alchus tagged AAV but does not do AAV
- Caught: after

### 23. Reputation / credibility risk
- Ellie Apr 2: "I don't have confidence so far... It's a lot of time to email the wrong people, right?"
- Jenn Apr 9: "I don't want stuff going out that's going to hurt us harm us from a reputation standpoint or Ellie from as a reputation standpoint."
- Ellie Apr 16: "I don't necessarily want my name on stuff unless I've really reviewed it."
- Artifact: data quality + automated send concept overall
- Wrong: data unreliable enough that sending burns Ellie's name and Teknova's reputation
- Caught: ongoing / systemic

### 24. List arrival lag (internal Teknova bottleneck, but flagged as project quality issue)
Ellie Oleson, Apr 16, 2026: "I'm still waiting from last Friday for that AAV list to be entered into our Salesforce here... it takes when I send them a list, it's taking at least two days typically to three days for it the campaign to get entered on our end."
- Artifact: AAV campaign list handoff
- Wrong: even clean lists sat 2-3 days before campaign launch
- Caught: ongoing

### 25. Total blindness on list size
Mika Choudhary, Mar 12, 2026: "I have no idea right now. I genuinely have no clue if we have five people on that list or a thousand."
- Artifact: Allogeneic target list / Airtable views
- Wrong: views and filters changed without notice; Teknova couldn't see actual list size
- Caught: after

---

## Categories

Patterns that show up more than once.

**A. Wrong-modality / wrong-product targeting at the company level**
Items 2, 3, 14, 19, 22. Companies tagged with modalities they don't actually do (AAV cases dominate); cell therapy not split into autologous vs allogeneic.

**B. Stale or dead employment data**
Items 4, 20. Contacts at companies they left 8 months to 1+ year ago, retired, or at companies that no longer exist.

**C. Wrong-persona role pulls**
Items 16, 17. Agronomy/plant-science, patient-facing clinical, and offer-mismatched contacts (cryo offer to non-cryo people).

**D. Name and identity field hygiene**
Items 5, 6, 11. Credentials scraped into name fields, initial-only names, wrong LinkedIn URLs.

**E. Company-name and copy formatting**
Items 7, 21. ALL CAPS company names, internal accounting suffixes, robotic location tokens in email copy.

**F. List composition errors driven by misapplied rules**
Items 1, 8, 12. Over-filtering to 132, deleting all enterprise accounts, leaving non-US/CA contacts in.

**G. Duplicate / overlapping records across views**
Items 9, 15. Repeated rows within a list; same contact in multiple campaign lists creating spam risk.

**H. Deliverability**
Item 13. 20% bounce/spam.

**I. Personal vs corporate emails**
Item 10.

**J. Trust and credibility (meta-category, repeated explicitly)**
Items 18, 19, 23. Jenn and Ellie's stated loss of confidence in the foundation and the brand risk of sending what's been delivered.

**K. Operational visibility and pace**
Items 24, 25. List size unknown; lists sit days before launch.

---

Notes:
- 25 distinct complaints surfaced. All but a handful caught by Teknova after delivery; no internal pre-catch flagged in the sources.
- Salesforce-internal complaints (CRM tedium, message-ID sync bug, Salesforce as "personal enemy") were excluded from the main list because they target Teknova's own CRM rather than data we delivered. Available on request.
