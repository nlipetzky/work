# Client Guidance — mRNA Therapeutics

**Play:** mRNA Therapeutics · **Client:** Teknova
**Type:** Living document. Post-criteria guidance from the client SME, distilled for engine + operator use.
**Sources:** `Teknova_mRNA_Outreach_Playbook_v1 2026.06.10.md` (Ellie, 2026-06-10) — the base criteria.
**Relationship to criteria:** This document refines and, where they conflict, overrides the base playbook.

> **STATUS — first feedback round landed 2026-06-11.** The play began from the v1 playbook only (no
> client-labeled ground truth). The first round of client-SME scope calls came back 2026-06-11 (in response
> to a discovery pilot) and is captured in §0 below. There is still no per-company gold-label CSV or
> acquired-company list — those accrue as the SME reviews screened passes.

> **For the AI:** apply the rules below as scope filters when qualifying mRNA companies and contacts. Where
> this conflicts with the base playbook, this wins. Every rule traces to a client source so it can be
> re-verified.

## 0. Client decisions (source: client SME via operator, 2026-06-11)

These four verdicts came back in response to the first discovery pilot. They refine the playbook and are the
current iteration (treat as prior-iteration learnings, not eternal law — flag rule-vs-evidence conflicts).

1. **Oligonucleotide-only = OUT; LNP/delivery = IN.** RNA that is not *messenger* RNA does not qualify:
   siRNA / ASO / antisense / RNA-editing / antibody-oligonucleotide-conjugate (AOC) platforms are OUT even
   when they describe themselves as "RNA therapeutics" (worked examples flagged by the pilot: oligo/editing
   platforms). LNP / lipid-nanoparticle / delivery-technology companies are **IN** as targets even when they
   do not run their own mRNA program, provided they run physical formulation wet labs (worked examples:
   LNP-delivery firms surfaced in the pilot).
2. **Reagent / IVT-enzyme makers = KEEP and FLAG (do not drop).** IVT-enzyme / nucleotide / transfection-
   reagent producers stay in the list but are flagged as `competitor_flag` for human review rather than
   auto-excluded. An existing-Teknova-account flag still overrides the "competitor" read (playbook §4
   G4/G5). The SME did not provide a named existing-account list, so these route to review, not resolution.
3. **Large diversified pharma = KEEP and FLAG.** Big diversified players that carry an mRNA program stay in
   the list but are flagged `large_diversified_flag` for human review (they may be existing accounts or
   handled by direct sales).
4. **Ranking IS wanted.** This **reverses the playbook §4 "deterministic gates, not scores" line.** The
   soft-signal layer in `revops-segment-mrna-therapeutics.md` is retained as the prioritization/ranking
   layer on top of the gates.

5. **No company-size cutoff for this play** (operator, 2026-06-11). The playbook §3.1 "no hard cutoff" +
   the keep-and-flag-large-pharma call (§0.3) **supersede the standing engagement ICP's 50–2,000 /
   large-pharma filter for `mrna-therapeutics` only.** The engagement ICP is untouched for other plays.
   Large players are flagged (`large_diversified_flag`), not excluded. Headcount is enriched/recorded but
   does not gate.
6. **Acquired/renamed entities resolve to the live parent, THEN screen** (operator, 2026-06-11). A written
   normalize rule, not a per-row question: detect "now part of X" / domain-redirect / defunct-standalone,
   resolve to the live operating entity, then apply gates + size rule + flags to that entity. Record both
   names (labeled transform, reviewable on the surface).

**Existing-customer / active-deal / last-activity = READ THE AIRTABLE SF MIRROR** (operator, 2026-06-11):
base `app5wdHwgM1SPNxcx`, mirror-labelled tables (`ME_Account_Mirror`, `ME_Opportunity_Mirror`,
`ME_Contact_Mirror`, `ME_Lead_Mirror`) are a live native Salesforce sync. This is the source for the §5.3
6-month suppression and the existing-customer override — it is NOT an unavailable gap (an earlier draft
wrongly said so). Remaining contact-screen gap is LinkedIn verification (§5.2) only.

## 1. Qualification scope — what counts as in-scope mRNA work *(source: playbook §1, §2, §4 G1)*

- **Require an active messenger-RNA therapeutic program:** conventional mRNA, saRNA, circRNA, or an
  mRNA-based vaccine/immunotherapy. "RNA therapeutics" alone is not enough — confirm **messenger** RNA.
- Trigger terms to treat as in-scope: `mRNA`, `messenger RNA`, `self-amplifying RNA`, `saRNA`, `circRNA`,
  `circular RNA`, `in vitro transcription` / `IVT`, `LNP` *when tied to an mRNA payload*.
- The company must run **physical wet labs** doing mRNA process work (plasmid prep, IVT, purification,
  LNP formulation, QC) — §4 G3.

## 2. Negative checks — vocabulary that must NOT qualify on its own *(source: playbook §2 exclusions)*

| Pattern | Why it's out |
|---|---|
| Non-mRNA modality only (antibody-only, small-molecule-only, AAV/gene-therapy with no RNA, diagnostics-only) | Wrong modality (§2) |
| siRNA / ASO / oligonucleotide-only, no mRNA program | Different chemistry and workflow (§2); in-scope only if an mRNA program co-occurs |
| Discovery-only / purely computational/AI RNA-design, no wet lab | No reagent consumption (§2, G3) |
| Distributor, pure research-tool reseller, or reagent-irrelevant CRO | No PD/manufacturing-volume consumption (§2) |

## 3. Role nuance *(source: playbook §2)*

- **CDMO/CMO:** qualify **only** when an mRNA or LNP manufacturing line is **explicit** (not generic
  biologics).
- **LNP / delivery-technology:** fit only if it runs physical formulation wet labs on mRNA payloads, not
  pure IP/licensing.
- **IVT-enzyme / nucleotide / capping-reagent producer:** treat as a buyer **only** where it runs in-house
  formulation/QC labs. The **existing-account flag overrides the "reagent-maker = competitor" inference**
  (§4 G4/G5) — billing history beats scraped data.
- **Academic / non-profit translational center:** in-scope but lower priority (longer procurement cycles).

## 4. Contact screening carries two deferred hard gates *(source: playbook §5.2, §5.3)*

- **LinkedIn verification (§5.2):** when a profile exists, the most recent position must match the record's
  employer + title. Not required when absent (`linkedin_verified = null`). Data not in staging today.
- **CRM 6-month suppression (§5.3, HARD RULE):** suppress any contact OR account with logged activity in the
  trailing 180 days. Data not in staging today. **No contact is `qualified` (deliverable) until this runs.**

## 5. Open items to resolve with the client SME (route via Hermes)

- ~~Gate-only vs soft-scoring~~ — RESOLVED 2026-06-11: ranking wanted (§0.4).
- ~~Oligo / LNP / competitor / large-pharma scope~~ — RESOLVED 2026-06-11 (§0.1–0.3).
- **Existing-customer / active-deal suppression list** — STILL OPEN. The load-bearing delivery blocker; also
  what would let competitor and large-diversified flags resolve instead of routing to review.
- Title tiering / narrow the first wave to one function (e.g. PD-led), or run all three personas?
- Named-reference proof for mRNA specifically (for copy, downstream).

---
*To be maintained as a living document via the expert-liaison (Hermes) projection method: every added line
traces to a dated client source; nothing is the operator's invention.*
