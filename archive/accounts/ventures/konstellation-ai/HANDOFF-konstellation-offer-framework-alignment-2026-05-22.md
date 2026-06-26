# HANDOFF — Konstellation Offer Framework Alignment (2026-05-22)

Long brainstorming session between Nick and Boris that produced the Konstellation offer framework, the first prospect email instantiating it, and a partner-onboarding email for Will Rosellini. The framework is now locked at the design level; execution starts with Shawn Boom (faith business) as the first dogfood test.

> **REVISED 2026-05-27.** The "final architecture (locked)" section below is **superseded**. Current architecture lives in `reference/catalog.md` (five-layer model, read bottom-up: Assets → Systems → Clusters → Constellations → Trajectory). The alignment-arc narrative above is preserved as historical record. The locked-architecture section has been updated inline to reflect current state.

## Why this handoff matters

The alignment that emerged in this session took ~12 turns of iterative pushback. A future session that re-derives the framework from a flat prompt will likely produce a generic agency model, not what landed here. This doc captures the *path* of alignment so a future Boris can pick up where this one left off without re-litigating decisions Nick has already made.

## How alignment formed (the arc)

1. **Diagnosis first.** Nick opened wanting "a system for delivering work in a delivery cadence." Boris's first move was to read what already existed (System Registry manual + weekly client update template + build OS doc + studio thesis) before asking anything. This established that Nick had inventory and recap layers, was missing the scope-contract layer between them.

2. **Reframed the engagement model.** When Nick described "DFY vs DWY," Boris pushed back: DWY-as-client-choice doesn't work because most clients are operationally incapable of receiving a system. Reframed DWY as a destination reached through a gated Adoption Track, not a starting mode. **Nick's reaction: "this is the load-bearing insight."** Locked it in.

3. **Surfaced the bleed.** Nick described eating handoff/strategy/training hours. Boris named the three bleed points (pre-build, mid-build, post-build) and the consulting world's standard plays (productized Diagnostic, readiness gate, advisory hours line item, adoption track). Nick accepted the productized Diagnostic as the right shape.

4. **Platform/instance rule emerged.** Nick said "do we hand off the core systems too?" Boris's answer: **platform never transfers, regardless of mode.** Even DWY only transfers the bespoke layer. This already existed in the System Registry's platform-vs-instance distinction; Nick extended it into the offer model.

5. **Naming hierarchy iteratively sharpened.**
   - Started with: System Catalog → Systems
   - Nick added Constellation as a grouping layer
   - Boris proposed naming for the 8 Constellations using a marketing visual Nick had drafted (Strategy / R&D / Creative / Canon / RevOps / Development / Infrastructure / Service)
   - Nick pushed back: those names are 20th-century functional buckets, not agentic-native primitives. Asked Boris to derive the catalog from first principles.
   - Boris derived 8 functional primitives by asking "what does any organization fundamentally do to exist and grow": **Canon, Compass, Signal, Forge, Voice, Pulse, Guard, Garden.** Single-word verbs. Nick: *"I have never been able to get an AI or human to see everything the way you're seeing this now."*

6. **Cluster layer emerged from a test.** Nick asked "where does my existing RevOps stack live in this taxonomy?" Boris showed it decomposes across 5 Constellations (Signal + Compass + Voice + Pulse + Canon). That surfaced the need for a buyer-facing bundle layer. Boris initially called it "Plays" — Nick rejected because "Play" already means campaign in his vocabulary. Boris proposed "Cluster" (real astronomical term, gravitationally bound group of stars) — locked.

7. **Sky/perception philosophical anchor.** Nick said "the constellations we see are interpretations that change as the perceiver changes." This became §0 of the design doc and the entire sales narrative for Will. Most clients will never adopt the new telescope, which is *why* Operated is the default and not a failure mode.

8. **Output mode iteration.** When publishing artifacts for Google Docs, Boris first wrote rigid plain-text with `===` underlines and "Label: value" table conversions. Nick: *"this looks robotic. Why can't we get text like you wrote for the Will email?"* Boris rewrote the converter to use CAPS headers without decorations and tables collapsed to single-line bullets with `...` separators.

9. **Shawn email got a "taste" added.** Initial draft was "wait for the doc." Nick pushed for substance. Boris added a structural-diagnosis paragraph using Shawn's own numbers (7%/50% logo concentration, 17% MQL-to-SQL, comp redesign in flight) and his own quote ("we haven't designed our organization to scale up") back to him.

## The architecture (current as of 2026-05-27)

This section was revised 2026-05-27. Original layer model superseded. See `reference/catalog.md` for the source of truth. Summary of changes from the 2026-05-22 lock:
- Slot dropped from the catalog as a layer (it is delivery cadence, not architecture)
- Assets elevated to atomic deliverable (the inventory unit)
- Systems redefined as bundles of Assets ... the SKU, the smallest thing a client can buy
- Clusters reframed as sales bundles only (legacy buyer lens; not an integration architecture)
- Constellations reframed as integration architecture (Systems that share data, infrastructure, and operating logic; the agentic lens; deeper than Clusters, not parallel to them)
- Trajectory expanded to include responsibility allocation between Konstellation and the client for each deliverable

**Naming:**
- **Konstellation** — the studio/brand (Nick + Will Rosellini, Konstellation AI)
- **Konstellation Catalog** — the menu of offerable systems, five layers, read bottom-up
- **Assets** — atomic deliverables (workflow, database, context engineering spec, content/context docs, Surface). The inventory unit; how work is costed and reused. Tracked in Airtable base `apppQjlZiktpbO4aX`.
- **Systems** — coherent bundles of Assets sold as a single unit. The SKU. What Will quotes.
- **Clusters** — sales bundles of Systems organized by a legacy functional category buyers recognize (RevOps, Customer Expansion, etc.). Not an integration architecture.
- **Constellations** (8) — integration architecture across Systems that share data, infrastructure, and operating logic. The agentic-company lens:
  - **Canon** — knows what the business knows
  - **Compass** — decides what the business does next
  - **Signal** — finds opportunities outside the business
  - **Forge** — builds new capabilities and content
  - **Voice** — speaks and listens on the business's behalf
  - **Pulse** — moves transactions and operations
  - **Guard** — protects compliance, security, reliability
  - **Garden** — grows existing relationships and assets
- **Trajectory** — per-client sequenced plan of Systems over 6–12 months **and** the responsibility-allocation contract between Konstellation and the client for each deliverable. Output of the Survey.
- **Delivery slot** — the weekly Asset bundle shipping against a Trajectory. Cadence, not a catalog layer.

**Engagement modes:**
- **GTM Survey** — paid, time-boxed (~2 wks) productized Diagnostic. Outputs: system design, readiness score, data architecture audit, recommended Trajectory, cost-comparison. **First revenue event in any engagement.**
- **Operated** (default) — DFY. Most clients land here and stay here. Platform never transfers.
- **Adoption Track** (gated add-on) — milestone-driven program to transfer bespoke layer to a named steward. Real possibility of not completing. Calibrated, not all-or-nothing.
- **Owned** (destination) — DWY, only reached by completing Adoption Track. Even then, platform stays with Konstellation.
- **Implementation Bootcamp** (rare premium) — for prospects who want capability transfer. Coaching rates, capped hours, default posture is refuse and redirect to Operated.

**Not Constellations:** Agent Hub (orchestration layer), Infrastructure (platform substrate). Both stay with Konstellation always.

**Cadence rule:** Pricing determines cadence. Retainer tier sets weekly delivery slots per week. Solo Cluster / Multi-Cluster / Full-Sky tiers (placeholder names; real numbers TBD by Will).

## What's open

- **Pricing.** All numbers are placeholders. Will lands these.
- **Real System names** inside each Constellation. Doc uses placeholder names; Nick refines against actual inventory.
- **GTM Survey explainer doc.** Nick committed to drafting this over the weekend (referenced in the Shawn email). Should be productized (reusable across all future prospects), not Shawn-specific. Suggested structure already in prior turn.
- **gws auth scopes.** `gws` CLI is installed and authenticated as nick@instig8.ai, but all 8 scopes are `.readonly`. Re-auth with write scopes needed for direct Google Docs publishing. Manual paste-into-Docs workflow used for this round.
- **Google Doc URLs.** Nick is pasting 4 plain-text files into Docs. URLs come back; Boris wires them into the Will email before Nick sends.
- **Send sequence:** Will email first, Shawn email 10–15 min later, so Will has read the framework before being cc'd into a prospect thread.

## Files created/modified this session

- `/Users/nplmini/code/work/practices/agentic-systems/DESIGN-offer-framework-2026-05-22.md` — the design doc itself
- `/Users/nplmini/code/work/practices/agentic-systems/DESIGN-offer-framework-2026-05-22-plain.txt` — plain-text paste-ready version
- `/Users/nplmini/code/work/practices/agentic-systems/system-registry-operating-manual-plain.txt` — plain-text version of companion doc
- `/Users/nplmini/code/work/practices/agentic-systems/reference/weekly-client-update-template-plain.txt` — plain-text version
- `/Users/nplmini/code/work/practices/agentic-systems/reference/build-operating-system-plain.txt` — plain-text version
- `/Users/nplmini/code/work/practices/agentic-systems/artifacts/email-will-offer-framework-2026-05-22.md` — partner-onboarding email
- `/Users/nplmini/code/work/practices/agentic-systems/artifacts/email-shawn-next-step-survey-2026-05-22.md` — prospect follow-up email with structural-diagnosis taste paragraph

## Working notes — how Nick gives feedback (preserve for future sessions)

- **Pushes back when output is too conservative.** When Boris flagged "you can only sell 1-2 Constellations today, the rest is vapor," Nick: "do not worry about whether or not you've seen the evidence. Know that I have the systems and the credibility." Lesson: trust Nick's inventory; don't gate the catalog on what Boris has seen in conversation.
- **Pushes back when naming is 20th-century.** When Boris proposed Constellation names mapping to Marketing/Sales/Service/HR/Finance, Nick: "tell me what those catalog items should be" *as an agentic-native taxonomy, not a value-chain.* Lesson: derive from first principles when Nick says the obvious mapping doesn't fit.
- **Pushes back on robotic output.** Plain-text conversions, table-as-config formatting, decorative underlines all got rejected. Lesson: voice matches the email Boris wrote for Will — CAPS headers no decorations, prose flow, em-dashes as ellipses.
- **Pushes back when Boris explains too much.** "Don't get hung up on the catalog." "Don't overthink." Lesson: when Nick says he likes something, stop iterating and move forward.
- **Wants clean SKU names with metaphor as wrapper, not decoration.** "Operated" not "In Orbit." The narrative ("you're in our orbit") wraps around the clean SKU; doesn't replace it.
- **Konstellation AI is a real business co-founded with Will Rosellini.** Domain: konstellationai.com. Will is sales/commercial lead, Nick is build lead. Will sells, Nick builds.
- **First-name sign-offs. No "let me know if you have questions." No em dashes. No emojis.**

## First instantiation status (Shawn / faith business)

- Original meeting: education/school side. Shawn pivoted to faith via text on 2026-05-22.
- Same operator, different business unit. Framework handles via per-business-unit Survey scoping.
- v1 Trajectory hypothesis (in design doc §7): Customer Expansion Cluster targeting top 50 accounts. Garden + Canon + Voice.
- Engagement Mode: Operated. Shawn explicitly said his team can't take it on; head of marketing capped on hours; Adoption Track unlikely to succeed and named upfront.
- Will introduced in the Shawn email as the commercial lead. Asked for a 30-minute three-way kickoff next week.

## What to do in the next session

In order:

1. Read this handoff + `DESIGN-offer-framework-2026-05-22.md` first.
2. Wire Google Doc URLs into the Will email when Nick supplies them.
3. Draft the GTM Survey productized explainer doc (not Shawn-specific).
4. If Shawn responds, prep Will to lead the kickoff. The first move on any prospect is "which business unit are we surveying."
5. After Shawn's Survey executes, harvest the gaps and produce framework v0.1.

## Resume pointer

Next artifact in the queue: **GTM Survey explainer doc**. Nick committed to this in the Shawn email. Should produce a reusable productized one-pager that lives in the catalog and gets handed to every future prospect. Suggested coverage in the prior turn of this session.

The framework's reliability comes from execution, not design. Run it on Shawn, fix what breaks, then formalize v0.1.
