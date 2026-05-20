# Company table — data fields required for Teknova trust

**Source:** Teknova / Konstellation weekly regroup, 2026-05-07
**Speakers cited:** Jenn Henry, Ellie Oleson, Sasha Laing, Nick Lipetzky

Jenn's framing: "I am less concerned about figuring out the email copy and the journeys... I'm more concerned about making sure that we can say we want to talk to people about AAV... I just want to get to a place [where we know] who we should be talking to" (B62). "We've got a comfortable and accurate level of understanding... we keep talking about Rocket... that is the thing that I still don't feel like we've got solved" (B63).

The company table must carry enough verified, sourced data that Ellie can look at one row and decide to send without checking five other systems.

## 1. Identity & firmographics (clean, deduped)

- **Company name** — no state suffixes (`- NC`), no billing tags (`- Prepay and Add`), no all-caps.
- **Website domain** — primary key for dedup (Nick: "default to the website domain... they have the identical URLs").
- **Employee count / headcount** — drives the ≥50 filter and the small/mid vs large-biopharma VP rule.
- **HQ country / state** — US or Canada only; everything else excluded, not deleted.
- **Company type** — biopharma vs CDMO.

## 2. Modality & pipeline qualification

- **Modality** — AAV gene therapy / allogeneic cell / autologous cell / ADC. Must be authoritative; Ellie had to pre-screen 200 companies manually to confirm "these companies do AAV."
- **Clinical stage** — preclinical / Phase 1 / Phase 2 (drives the RUO+ vs GMP fit).
- **AAV program confirmed** — boolean, with source citation.
- **Pipeline / indication** — what they're developing (so the briefing can name it).

## 3. Why-now signals (per-company)

Jenn on Rocket / Encoded / Krea: "we need better signal on that type of thing" (B26).

- **Funding round** — amount + date (P1).
- **IND filing / clinical-stage advancement** (P1).
- **Leadership or process-dev hiring activity** (P1).
- **Publications** (P2).
- **Conference attendance** — Interphex, BPI West, Advanced Therapies Week (P2).
- **Capacity / facility expansion announcements** (P2).

## 4. Relationship state with Teknova (Salesforce-sourced)

This is where Ellie's "7 already engaged" near-miss sits.

- **Active engagement status** — is BD currently meeting with anyone at this company?
- **Last contacted date** (Ellie: "can we get into the activity portion to see when we've last contacted them?").
- **Known / unknown flag** — existing SF taxonomy.
- **Opt-out / bounced / DNC** — already in the rules; must surface on the company row.
- **Complaint history** — high-value or recurring.
- **Active Salesforce opportunity** — yes/no + stage.
- **Existing customer flag** — currently buying / historical / never.

## 5. Briefing context (so Ellie doesn't have to dig)

- **Auto-generated company summary** — "here's what's going on with Rocket Pharmaceuticals" pulled from SF + signals (Nick B57).
- **Approved-stats provenance** — Sasha (B68): "do we have it trained to use only stats and approved stats in our database?" Anything in copy must trace to a vetted source on the company row, not an LLM fabrication.
- **Field source citation** — which field came from LinkedIn vs Apollo vs Salesforce vs enrichment.

## 6. Data quality / integrity flags

These prevent the "Carrie" scenario Nick called out (B46): LinkedIn says she works at company A, verified email is at company B, tenure says 5y3m at A.

- **Email verification status** + verifying provider.
- **LinkedIn-vs-email-domain consistency** — boolean conflict flag.
- **Tenure in current role** — Ellie's filter: rejected 16 of 46 because they'd been out of role 6mo–3y.
- **Last enrichment / refresh timestamp** — temporal decay matters (Nick B48: "if the fifth play doesn't go out for six months, the data is not going to be great").
- **Record confidence score** — composite, per company.

## 7. Play eligibility (computed)

- **Eligible-for-play[AAV-Ellie-outreach]** — boolean derived from filters above.
- **Exclusion reason** — if false, why (so audit trail exists and Jenn can challenge it).
- **Total addressable in play** vs **currently in cadence** vs **already engaged** — Nick called out the gap (B29: "is 45 the TAM... or is it 200... reason there's only 19 here").

---

## What this fixes

- Jenn stops asking "do we trust this?" because every row carries provenance + freshness + conflict flags.
- Ellie stops doing 30-minute manual spot-checks before each send.
- Sasha's red line on fabricated stats holds, because copy can only reference fields with `approved_stat = true`.
- The Rocket-Pharmaceuticals problem ("right level of information") becomes a one-screen briefing, not a research project.
