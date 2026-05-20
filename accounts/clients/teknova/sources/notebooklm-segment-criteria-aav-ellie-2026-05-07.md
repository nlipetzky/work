# NotebookLM extraction — segment criteria for AAV / Ellie outreach

**Source notebook:** Teknova Events (`6a18ae7c-f596-4dc7-80f2-3c1e0b72575a`)
**Date:** 2026-05-07
**Conversation ID:** 8526cf72-f564-43a1-95f9-06dc815ccbfc
**Purpose:** Five required segment-criteria queries to feed `revops-segment-aav-gene-therapy-ellie-outreach.md`. This pass is criteria-focused; the offer-extract pass on 2026-05-06 covers offer history, why-now, proof, audience pain, and product boundaries.

---

## Q1 — Disqualifier history

**Geographic.** US and Canada only. International contacts/companies are excluded; outside-NA records were "distorting our data" (Mika, Ellie working session).

**Roles / functions.**
- Excluded by negative-keyword scrub (>70 keywords) on title: Legal, Sales, Talent Acquisition, Marketing, Regulatory, IT.
- Regulatory is "explicitly banned from outreach."
- VPs excluded at large biopharma (AstraZeneca, AbbVie named); VPs kept at small/mid biotech.
- Patient-facing clinical staff excluded — Ellie: "you're dealing directly with patients and you're not actually working on making the sauce."
- Agronomy / agriculture / plant science excluded — not a fit for human cell and gene therapy manufacturing.

**Modality mismatches (named).**
- **Altimmune** — peptide and small-molecule focused, not AAV.
- **Alchus** — non-viral vector delivery.
- **Aspen Neuroscience** — autologous cell therapy, not AAV.

**Contact-vs-company mismatch.** Contact's LinkedIn history shows AAV experience but their current employer does not do AAV → disqualified for this play. Ellie: "if they're working for this company maybe they did AAV in the past but they're not now if this company doesn't do it so it wouldn't make sense to reach out to them with an AAV message."

**Active BD engagement (the "Rocket" rule).**
- Excluded if Salesforce shows a meeting with BD this week, regular ongoing meetings, or contact CC'd on active sales threads.
- **Rocket Pharmaceuticals** flagged by name: "we're in there pretty good already."
- Lapsed contacts (>2 years no activity) are KEPT for re-engagement, not excluded.

**Stale employment / record hygiene.**
- Tenure changes 6mo–3yr ago → exclude.
- LinkedIn shows end date on current role, "open to work," or "retiring" → exclude.
- Company defunct (e.g. "stopped in 2023") → exclude.

**Cross-cadence overlap.** Contact already enrolled in another active cadence (e.g. PluriFreeze / allogeneic / cryo) → hold from this play. Mika: "they'd be on both our lists and we'd be like 'Hey, our allogeneic thing. Hey, our gene therapy thing.'"

---

## Q2 — ICP language (verbatim)

**Company.**
- Ellie: "smaller biotech, I would say under 200 employees" (core target).
- Ellie: open to "those under 50 employees, getting newbies even just to get an introduction in."
- Ellie segments three buckets: "CDMO versus the actual drug company and then our therapeutic company." CDMO messaging differs because they're "doing it on the much larger scale."
- Ellie: ensure the contact's "most recent position is a company that performs AAV."

**Person.**
- Ellie: "the chief scientific officer" at smaller biotechs.
- Ellie on titles: "Anything with viral vector downstream processing purification are going to be the two big ones."
- Jenn: target is anyone in "process development or clinical manufacturing."

**Lifecycle moment.**
- Ellie: "all the way from the R&D phase into right when they actually are ready to go clinical."
- Playbook email copy: "advancing toward IND" / "Moving {company}'s gene therapy program from RUO to GMP" / "Before {company} locks in reagent suppliers for IND."
- Jenn on funding signal: "validate whether or not that company is doing well, if they have money to spend with us potentially."

---

## Q3 — Burned / over-fished audiences

**PluriFreeze (allogeneic / cryopreservation cadence).**
- Halted by Ellie mid-flight after 124 enrolled. Reason: niche product mismatched to broader contact set.
- Ellie: "I didn't want to waste people on pluristics. These look like good contacts, but this is not the right feature to be selling to them, and I don't want to blow it."
- Tone failure: "too sales pitchy" — drove the pivot to AAV with consultative voice-of-customer framing.

**Cross-tagging risk (allogeneic ↔ gene therapy).** Same contacts surfacing on both cryo and AAV lists. Mika: would "end up with us spamming them."

**Deliverability damage from prior sends.**
- 20%+ bounce / spam rate on initial cadences.
- Of 46 AAV targets manually screened: 26 rejected pre-send, 16 of those because the contact was no longer in role (6mo–3yr gap).

**Over-fished by BD (already big customers).** Jenn: "Rocket, Encoded, Kriya — all of those, we've got pretty good connections in terms of already infiltrating the ranks there." On the AAV list, "80% of those are already big customers of ours."

**Open event campaigns running concurrently.** Ellie has 4+ open event-driven campaigns — net-new AAV outreach must not double-tap contacts already in those.

---

## Q4 — Past response patterns

**Empirical reply data is unavailable.** Salesforce message-ID / reply-to sync is broken; replies cannot be reliably mapped back to cadences. Sasha has explicitly asked for "tracking on what messages are resonating with folks" — the system does not yet provide it.

**Anecdotal positives.**
- LinkedIn connection rates with Ellie are strong. Jenn: Ellie is "a lovely human who has a science background and isn't overtly salesy." Lean into a science-credible, consultative voice.
- Ellie's voice-of-customer framing (asking about pain, not pitching product) is the working tone.

**Conference-lead behavior.** High-intent event leads bypass Ellie's cadences and go direct to BD. Cold outreach pattern is distinct from event follow-up.

**Implication for criteria.** Cannot build a lookalike from past responders. Build the segment from declared ICP language + supply-chain / IND-window signals. Treat the first AAV waves as the empirical baseline.

---

## Q5 — Named accounts to avoid

**Modality mismatches (do-not-contact for THIS play, may be valid for others).**
- Altimmune, Alchus, Aspen Neuroscience.

**BD already engaged (cold-suppress pending re-eligibility check).**
- Rocket Pharmaceuticals, Encoded, Kriya.

**Large biopharma — VPs only excluded, lower seniority allowed.**
- AstraZeneca, AbbVie (named).

**Defunct.**
- Unnamed company that "stopped in 2023" (per Ellie's review notes).

**Pharma-owned biotech subsidiaries (treat as large biopharma — surfaced 2026-05-07 Clay pass).**
- AskBio (Bayer AG), AveXis (Novartis), Forge Biologics (Ajinomoto Bio-Pharma), Prevail Therapeutics (Eli Lilly), Spark Therapeutics (Roche), Adverum, Akouos.

**Non-AAV gene therapy variants (Supabase tagged AAV but Clay reveals different platform — surfaced 2026-05-07 Clay pass).**
- American Gene Technologies (lentivirus), ElevateBio (multi-modality CDMO), Expression Therapeutics (gene+cell), Genezen (multi-vector CDMO), Locanabio (RNA-targeting), Rejuvenate Bio (epigenetic), Shape Therapeutics (RNA editing primary).

**Acquired / operationally abandoned (auto-suppress pending manual confirmation — surfaced 2026-05-07 Clay pass).**
- Aavantibio (leadership at Solid Biosciences), Astellas Gene Therapies (page no longer monitored), Audentes Therapeutics (resolves to Astellas), AveXis (resolves to Novartis), Sio Gene Therapies (no Clay data — softer signal).

**Name-formatting (record hygiene, not exclusion).**
- "Children's National Hospital - Prepay and Add" — strip suffix before any merge field.
- "Beam Therapeutics Inc- NC" — strip state.
- "SIGILON THERAPEUTICS", "ORCA BIOSYSTEMS" — title-case before merge.
