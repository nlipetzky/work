# NotebookLM extraction — AAV gene therapy / Ellie outreach

**Source notebook:** Teknova Events (`6a18ae7c-f596-4dc7-80f2-3c1e0b72575a`, 25 sources)
**Date:** 2026-05-06
**Conversation ID:** 8526cf72-f564-43a1-95f9-06dc815ccbfc

Five required offer-extract queries run against the notebook. Below are the distilled findings used to populate `offer-aav-gene-therapy-ellie-outreach.md`.

---

## 1. Offer history

**Programs / packaged offerings**
- **RUO+ Pathway** — bridge for programs transitioning to Phase 1. Process buffers in 1–25L small-batch formats, made in same facility/equipment as GMP production, bypasses 6-month industry lead times.
- **Express-Tek Service** — rapid-turnaround audit-ready buffers with full traceability, sterility validation on every lot, GMP-level documentation, marketed as "GMP-level documentation at RUO pricing."

**Products / SKUs**
- 17 standard buffer types running through validated systems every batch.
- 6 months of safety stock maintained on standard buffers.
- New: **200L WFI quality water** — bulk water for manufacturing, "a lot cheaper" than alternatives. (Sasha proposed this as a campaign hook in a recent meeting; not AAV-specific.)

**Pricing**
- Express-Tek: GMP-level documentation at RUO pricing.
- 200L WFI water: positioned on price advantage.
- Historical AAV deal sizes (internal): Aera $98,118, Interius $32,637.

---

## 2. Why-now triggers

**Regulatory / FDA**
- "Last quarter" Phase 1 GT team got FDA pushback demanding sterility assurance data for all process buffers.
- Internal stat: 73% of GT teams discover critical documentation gaps within 60 days of IND filing.

**Supply chain**
- Mega-suppliers require 6-month lead times for GMP buffers.
- Even when buffers are in-hand, standard suppliers require 8-week turnaround for batch records / FDA documentation.

**Per-prospect signals (live in the RevOps engine)**
- Funding rounds (P1 priority) — ArsenalBio called out by Jenn after $35M raise.
- IND filings, clinical-stage advancements (P1).
- Leadership hires (P1).
- Publications, clinical trial milestones, conference activity (P2).

**Conference anchors**
- Interphex (recently attended).
- BPI West (Inform Connect, San Diego) — attendee lists scraped, used for post-event campaigns.
- Advanced Therapies Week (Terrapinn, San Diego) — top-tier contact source.
- Active play pattern: post-conference recap → "definitive guide" mapping pain points to Teknova solutions.

**Named AAV target accounts** (database/signals): ArsenalBio, Latus Bio, Kriya, Taysha, Beacon, Atsena, AAVantgarde, SpliceBio, Purespring, XyloCor.

---

## 3. Proof

**Anonymized timeline rescues**
- **4-month IND rescue:** AAV therapy startup avoided 4-month IND delay by switching to RUO+ buffers 90 days before filing.
- **3-week sterility save:** Phase 1 GT biotech's existing supplier couldn't provide batch records 3 weeks before IND; Teknova stepped in.
- **8-week → same-day documentation:** Phase 1 GT team got FDA pushback on sterility data; supplier needed 8 weeks, Teknova would have had it same day.

**Quantitative**
- 200+ successful IND packages supported.
- 17 buffer types through validated systems, every batch.
- 6 months safety stock → zero-stockout guarantee.

**Named accounts (internal only — not yet cleared for external use)**
- Historical wins: Aera, Interius (deal sizes above).
- Active outreach lists include: Janssen R&D, Beam Therapeutics, Sigilon Therapeutics, Orca Biosystems, Children's National Hospital.

---

## 4. Audience pain

**Important gap:** notebook contains *no transcripts of sales calls or direct customer quotes from AAV/GT CMC leaders*. All transcripts are internal Teknova/Konstellation operational meetings. Verbatim customer language is unavailable from this source.

**Pain points as the internal team articulates them**
- "Gene therapy teams discover too late their RUO reagents won't pass audit."
- Documentation gaps: missing evidence of sterility, endotoxin, lot consistency for every reagent touching the vector.
- Supply: 6-month GMP buffer lead times and 8-week documentation turnaround derail clinical timelines.
- Switching friction (Ellie paraphrasing BD): "BD too is like hey we're way overpriced that's why... but there are other areas it would take XYZ for me to transition from this current vendor right to you. And maybe that is Fisher Scientific they just make it so easy. they do their own prime membership."

---

## 5. Boundaries

**Not in the notebook explicitly:** Teknova does NOT state in writing that they don't do plasmid production, viral vector manufacturing, fill-finish, drug substance, or regulatory filings on the customer's behalf. (Inferred from product scope — to confirm with Jenn before locking out-of-scope copy.)

**Explicit commercial scope**
- Geography: US and Canada only. Outside-NA contacts excluded from databases and campaigns.
- Stage: RUO → GMP transition, IND-prep through Phase 1/2. RUO+ is sized for Phase 1 (1–25L batches).

**Contact exclusions (already locked)**
- VPs at *large* biopharma excluded; VPs at small/mid biotech kept.
- Roles excluded: Legal, Sales, TA, Marketing, Regulatory, IT.
- Manual filter: agronomy contacts, patient-facing roles (not manufacturing).

**Positioning red lines**
- Ellie's tone rule: NOT "here's product A, you should buy this from us." Consultative, "voice of customer," ask about pain points first.
- Explicit campaign mandate: "professional, consultative, value-focused, positioning as a technical resource rather than pushing for immediate action."

**Operational caps**
- Max 500 contacts/day to protect deliverability.
- Limit emails per company domain per day (anti-spam).
- Send Tue/Wed preferred; avoid Mon/Fri.
- Plain-text only, one CTA max.

### Boundaries surfaced from data runs

Boundary cases observed during the 2026-05-07 Clay cleanup pass on PLAY-006 that weren't called out in the original notebook. Each is a class, not a one-off.

**Pharma-owned biotech subsidiaries**
- Rule: A biotech that is a wholly-owned subsidiary of a top-20 pharma is treated as large biopharma for outreach purposes, even if the subsidiary's own headcount is small.
- Evidence (2026-05-07 Clay run): AskBio (Bayer AG), AveXis (Novartis), Forge Biologics (Ajinomoto Bio-Pharma), Prevail Therapeutics (Eli Lilly, also flagged in part 1: Adverum, Akouos), Spark Therapeutics (Roche Group). Surfaced via Clay company description language ("wholly owned subsidiary of...", "a member of the Roche Group").
- Disposition: hold for review. Subsidiary status alone does not auto-exclude (some run as independent operating units with their own CMC supply decisions), but the company moves out of the small/mid bucket and contacts get re-evaluated against the existing "VPs at large biopharma" exclusion.

**Non-AAV gene therapy variants**
- Rule: Companies whose primary modality is something other than AAV gene therapy ... lentiviral, oncolytic virus, RNA-targeting via gene therapy delivery, epigenetic reprogramming, multi-vector CDMOs, gene+cell therapy combinations ... fall outside the PLAY-006 ICP even when Supabase has them tagged "AAV / Gene Therapy."
- Evidence (2026-05-07 Clay run): American Gene Technologies (lentivirus, from part 1), ElevateBio (CDMO across cell, gene-edited, RNA, mRNA), Expression Therapeutics (gene+cell for hematology/oncology), Genezen (multi-vector CDMO: AAV, lentiviral, retroviral), Locanabio (RNA-targeting via snRNA/Cas13d/PUF), Rejuvenate Bio (epigenetic reprogramming), Shape Therapeutics (RNA editing primary, AAV as delivery).
- Disposition: hold for review. The Supabase modality tag is the trigger for inclusion, but Clay's description is the tiebreaker. If Clay describes the platform as something other than AAV gene therapy, the row gets a `modality_flag` in `field_provenance` and Jenn decides per-account whether the buffer use case still applies.

**Acquired or operationally abandoned companies**
- Rule: Companies whose domain now resolves to a parent, whose LinkedIn page is explicitly no longer monitored, or whose recent leadership has departed for an acquirer are treated as acquired/abandoned and removed from active outreach.
- Evidence (2026-05-07 Clay run): Aavantibio (leadership at Solid Biosciences, from part 1), Astellas Gene Therapies (Clay description: "page is no longer active or monitored"), Audentes Therapeutics (audentestx.com resolves to Astellas Gene Therapies), AveXis (avexis.com resolves to Novartis). Sio Gene Therapies returned no Clay data at all ... a softer signal of the same class, worth flagging for manual check.
- Disposition: auto-exclude from outreach pending manual confirmation. The original entity row stays in the database with an `operational_status_flag`, but contacts associated with it are suppressed for PLAY-006 until a human verifies the company is still operating independently.

---

## Source IDs cited (from NotebookLM)

| Source ID | Apparent role |
|-----------|---------------|
| 52297363... | "GxP Readiness for Gene Therapy Process Dev" campaign copy doc (primary) |
| 0b8ca0de... | Strategy meeting transcript (Sasha + Ellie + Agent_8) |
| 9d2775b5... | Working session transcript with Jenn (signals, ArsenalBio) |
| 7136c9c7... | Signal-to-action playbook discussion |
| 342a025c... | Cell Therapy Autologous Journey playbook |
| a00a0b82... | Cell Therapy Autologous Journey playbook (duplicate fragment) |
| 461039d8... | Geography/VP filtering decision transcript |
| 32993908... | Ellie tone preference transcript |
| 527d05df... | Konstellation/Teknova working session email (account list cleanup) |
| 7f89eb80... | PluriFreeze nurture cadence (allogeneic) |
| 78e9bc80... | BPI West Salesforce/Airtable lead routing |
| 2d0e927b... | Manual contact filtering session |
