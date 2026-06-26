# Design brief: Demand-Context Console (v0 UI)

For: Claude Design (claude.ai/design). Owner: Nick. Source spec:
`registry/signal/demand-context/system.md`. This is the v0 surface of the demand-context system
(the spec's "Context panel"). Manual-first: it helps the operator run the extraction by hand.

**One-liner:** Turn prospect-call transcripts into an evidenced offer, ICP, and cold copy — where
every conclusion traces back to a real quote.

**Goal:** Give the operator a fast, reliable surface to run the loop `signal → observation →
pattern → consuming artifact`, with verbatim + provenance + evidence grade preserved at every step.

**Audience:** A solo operator (Nick) running it by hand, v0. Optimize for fast capture and
traceability over polish.

## Data model (4 objects)
- **Capture Event** — an ingested transcript. Fields: source, prospect/company, date, status.
- **Observation** — a verbatim quote from a transcript + its source (capture event) + an **Evidence
  Grade** (`Asserted` / `Single-prospect` / `Multi-prospect-confirmed`).
- **Pattern** — a named cluster of observations (a recurring pain or buying trigger); shows its
  supporting observations and how many distinct prospects back it.
- **Consuming Artifact** — the **Offer**, the **ICP**, or the **Cold Copy**, generated from
  patterns; every line links back to the patterns/quotes that support it.

## Screens
1. **Dashboard** — counts (capture events / observations / patterns / artifacts) + a "% of artifact
   claims traceable to evidence" metric.
2. **Capture Events** — list of transcripts with provenance + status; click to open the workspace.
3. **Extraction Workspace** (the core screen) — transcript text on the left; observations on the
   right. Select text in the transcript → it becomes an observation with the verbatim preserved,
   source auto-attached, and an evidence-grade selector. Keyboard-friendly.
4. **Patterns** — group observations into named patterns; each shows its observations + aggregate
   evidence strength.
5. **Artifacts** — Offer / ICP / Cold Copy, each field showing its supporting patterns/quotes
   (click to trace). Editable, with an "approved" toggle.

## Non-negotiable rules (from the spec's guardrails)
- The verbatim quote is never lost or paraphrased.
- Every claim in an artifact links to at least one observation.
- Low-confidence observations are graded low, never deleted.

## Visual language
Match the existing projection-ui trust surface: dark/near-black background, ink-slate palette, one
cool accent for active state, small status dots for evidence grade (gray → blue → green as
confidence rises), terse labels, monospace for IDs and quotes. Information-first internal console,
not a marketing page. (Optional: point Claude Design at the `systems/projection-ui` repo to inherit
the exact design system.)

## Tech
React / Next.js (matches projection-ui). For the prototype, realistic mock data; later it reads/writes
the demand-context tables (observation store + capture-event log, both to-build per the spec).

---

## Paste-ready Claude Design prompt

(The prompt below is self-contained — it works without uploads. Optionally also point Claude Design
at the `systems/projection-ui` repo for exact style.)

Build a web app called the **Demand Context Console** — a tool for turning sales/prospect call
transcripts into an evidenced marketing offer, ideal-customer profile (ICP), and cold-outreach copy,
where every conclusion traces back to a real quote.

Audience: a solo operator (me) running this by hand. Prioritize fast capture and traceability over
polish.

Core data flow — `signal → observation → pattern → artifact`:
- A **Capture Event** is an ingested transcript (fields: source, prospect/company, date, status).
- An **Observation** is a verbatim quote pulled from a transcript, with its source (which capture
  event) and an **Evidence Grade**: one of `Asserted`, `Single-prospect`, `Multi-prospect-confirmed`.
- A **Pattern** is a named cluster of observations — a recurring pain or buying trigger — showing
  its supporting observations and how many distinct prospects back it.
- A **Consuming Artifact** is the **Offer**, the **ICP**, or the **Cold Copy**, generated from
  patterns; every line links back to the patterns/quotes that support it.

Screens:
1. **Dashboard** — counts (capture events, observations, patterns, artifacts) and a "% of artifact
   claims traceable to evidence" metric.
2. **Capture Events** — list of transcripts with provenance and status; click to open the workspace.
3. **Extraction Workspace** (core screen) — transcript text on the left; observations I'm capturing
   on the right. I select text in the transcript and it becomes an observation with the verbatim
   quote preserved, source auto-attached, and an evidence-grade selector. Fast and keyboard-friendly.
4. **Patterns** — group observations into named patterns; each pattern shows its observations and an
   aggregate evidence strength.
5. **Artifacts** — the Offer / ICP / Cold Copy, each field showing its supporting patterns/quotes
   (click to trace). Editable, with an "approved" toggle.

Non-negotiable rules: the verbatim quote is never lost or paraphrased; every claim in an artifact
must link to at least one observation; low-confidence observations are graded low, never deleted.

Visual style: a dark, data-dense "trust surface" — near-black background, ink/slate palette, one cool
accent for the active state, small status dots for evidence grade (gray → blue → green as confidence
rises), terse labels, monospace for IDs and quotes. Calm and information-first, like an internal ops
console, not a marketing site.

Use realistic mock data — 3 to 4 prospect transcripts about IP-strategy / patent-portfolio pain — so
the full flow is demonstrable end to end. Build it as a React / Next.js app.
