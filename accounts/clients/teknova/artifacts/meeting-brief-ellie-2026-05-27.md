# Meeting Brief — Ellie (30 min, 2026-05-27)

**Purpose:** Address Ellie's comments on the 2026-05-22 AAV list. Lock the next sprint priority.

---

## The reframe to walk in with

Ellie's comments are mostly cohort-level signal, not per-contact nitpicking. That's a useful read — she's giving you criteria refinements you can encode, not asking you to hand-curate each row. Treat the meeting as criteria-tuning, not as defending the list.

---

## Her comments, grouped by what they really mean

### Criteria refinements (encode for next run)

- **North America-only manufacturing rule binds at the subsidiary level too.** Disqualifies: AskBio France SAS, Brain Neurotherapy Bio (AskBio/Bayer/Viralgen Spain), NGGT (Suzhou China), Novotech (Sydney AU). Action: add a "manufacturing footprint" filter that resolves to the operating site, not the legal entity address.
- **Terminated trials don't count as active programs.** Baxalta NCT01687608 cited but terminated. Action: add a "trial status active" filter to the signal capture.
- **Corporate lineage must resolve to the operating company.** Baxalta → wrong lineage entirely; Brain Neurotherapy Bio → Bayer subsidiary. Action: the domain resolver already handles this for enrichment; need to push it into the signal-capture rollup too.
- **Stage matters for reagent demand.** Excision is preclinical = small reagent need; "keep but low priority." Action: add a stage-weighted scoring field so Ellie can sort lists by buyer maturity.

### Segmentation insight (worth surfacing)

- **Forge Biologics should be a CDMO play track, not a sponsor track.** Different sales motion, different copy. Action: confirm with Ellie whether to spin off a CDMO sub-segment for AAV.
- **Pfizer AAV is dead except for Chesterfield ARD analytical team (Lerch, Powers).** Action: this is named-account targeting at the team level — outside the cohort outbound model. Note as ABM carve-out if she wants it pursued.

### Data hygiene (system should handle, not Ellie)

- Sarepta appears twice. Taysha appears twice. Dedupe.
- NGGT Suzhou vs NGGT INC. — implicit duplicate scrap.

### Open questions to confirm

- Gyroscope Therapeutics: contacts now at Novartis post-acquisition. Confirm scrap or redirect.
- NGGT Suzhou: explicit scrap intent.
- Sarepta / Taysha canonical row.

---

## The strategic question to surface (the real point of the meeting)

The list scrubbed down to 24 keepers from 50. That's not a system failure — it's the modality. AAV at the North America-active-clinical-stage-with-process-dev-buyer intersection is a small population globally.

**Calibrated question to ask Ellie:** "These criteria refinements will tighten the AAV list further, but the population is what it is. Do you want me to spend next sprint refining AAV again, or test a different modality with broader population characteristics? Your call."

Possible alternatives to name if she asks:
- Cell therapy autologous (CAR-T, TIL)
- Cell therapy allogeneic
- Lentiviral / retroviral vectors
- mRNA / LNP delivery

---

## What to decide in the meeting

1. Confirm the four criteria refinements above for encoding
2. Confirm the dedup intent on Sarepta / Taysha / NGGT
3. Decide: refine AAV next sprint, OR pivot to a different modality
4. If pivot: name the modality and lock ICP scope by EOD Friday (per the Jenn email)
5. Note any Pfizer Chesterfield ARD lead — that's a separate named-account ask

---

## What not to do

- Don't defend individual list rows. The structural-criteria framing handles those.
- Don't promise to scrub AAV harder if she pushes for "more AAV leads." The honest answer: the population is small; either accept that volume or pivot.
- Don't take new asks verbally without restating them: "let me make sure I have this right — you want X by Y. I'll confirm in writing after the meeting."

---

## One sentence to keep in your pocket

"The criteria refinements I'll encode for next run. The bigger question is whether next sprint stays on AAV or tests a different modality where the criteria you've defined will produce more volume."
