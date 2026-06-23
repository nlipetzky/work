# Worked example — demand-needs-extract

A compact end-to-end pass so the skill's output shape is unambiguous. Drawn from real
demand-side material (CIPO-play CMO intake signal + the Konstellation CRM Learnings table).
Person names appear only in provenance, never in the synthesized claim.

## Stage 2 — observations (shape)

```
OBS-01
  verbatim: "patents are a cost, a headache, complexity"
  provenance: CMO intake, signal-00-strategy-cmo-2026-06-10, founder-buyer report (via expert)
  grade: B   (expert-believes — founder asserting buyer pain; confirm against buyer transcripts)
  tag: pain

OBS-02
  verbatim: "I want all of this insight, but I can't afford it" + "even if you gave me
            the reports, I wouldn't know what to do with them"
  provenance: CMO intake, signal-00, buyer posture as reported
  grade: B
  tag: pain   (implies: the ongoing relationship, not a one-shot report, is the thing)

OBS-03
  verbatim: "manage your outside counsel, lower your costs, increase the intelligence"
  provenance: CMO intake, signal-00, value framing the expert believes wins
  grade: B
  tag: language-resonance

OBS-04
  verbatim: "I don't think a full black box model would work here... I also need her doing
            head of marketing things, not learning AI"
  provenance: Learnings rec4QA1662WdbDhEI, buyer (discovery call), Status=Raw
  grade: A
  tag: objection   (autonomy-vs-dependency tension)

OBS-05
  verbatim: "you build it and hand you results" / rejected "vibe coding" and co-build committees
  provenance: Learnings recDVtaGRMpo7JedL, buyer, Status=Raw
  grade: A
  tag: language-resonance
```

## Stage 3 — patterns (shape)

```
PAT-01  "The buyer wants the outcome delivered, not a tool to learn."
  supported_by: OBS-02, OBS-04, OBS-05
  grade: A (mixed B/A)
  status: confirmed (3+ independent moments)
  tests: confirms the expert-believes hypothesis that the ongoing relationship > one-shot report

PAT-02  "Cost/affordability is the live objection, framed as 'I can't afford the insight.'"
  supported_by: OBS-01, OBS-02
  grade: B
  status: provisional (expert-reported; confirm against buyer transcripts)

PAT-03  "Winning value frame = lower cost + manage outside counsel + raise intelligence."
  supported_by: OBS-03
  grade: B
  status: provisional
```

## Stage 4 — draft engine inputs (how patterns map)

- **Offer.headline** <- PAT-01 + PAT-03 (outcome = managed-intelligence relationship, not a
  report; lower cost, manage counsel).
- **Offer.audience.pain** <- PAT-02 (cost/complexity of patents) — graded B, marked
  "confirm against buyer transcripts."
- **Offer.proof** <- the expert's verifiable credential (first US AI medical-device approval
  is the KAI-play example; CIPO play uses the equivalent CIPO credential). Mark gap where
  proof is not yet buyer-verifiable.
- **Segment.hard-filters** <- who has the PAT-01/PAT-02 pain: companies with a patent
  portfolio they treat as cost/complexity, with outside counsel spend, post-revenue.
- **Proof/copy constraints** <- only grade-`A` patterns are quotable as buyer voice
  (PAT-01). Grade-`B` frames (PAT-02, PAT-03) inform positioning but are not quoted until
  a buyer says them. `expert-believes` lines are refused as cold copy until confirmed.

## The discipline that makes it usable

Every line in every draft artifact carries a `grounded in: PAT-xx` trace. A reviewer can
walk any offer claim back to a pattern, back to an observation, back to a verbatim quote
in a named conversation. That traceability is the product — a draft offer no one can audit
is worth nothing.
