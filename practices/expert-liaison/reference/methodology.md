# Expert Liaison methodology

How to actually design and run the expert ↔ engine loop. Operator-loadable. Tight by design.

## The one example that carries the methodology

**Ellie at Teknova.** The engine (revops-engine + teknova-enrichment) needs to know which companies are AAV-relevant. Ellie knows. The naive solution: "Ellie, please define AAV criteria." She doesn't, or she does badly, or she does it once and never iterates.

The expert-liaison solution:
1. Catch her real outputs in their natural form ... Airtable verdicts on rows she reviewed.
2. Translate those verdicts into structured criteria refinements ... "she rejected 4 of 6 publication-only rows → tighten the AAV-evidence threshold to exclude publication-only signals."
3. Draft an updated **criteria artifact v4** with the refinement applied. Diff against v3 shown.
4. Route to Ellie in her preferred form (Airtable view + email summary): "approve v4 / push back / clarify."
5. On approval, v4 binds to the engine. Engine outputs reference back: "this came from your v4 criteria."

She never opened n8n. She never wrote a prompt. She made verdicts on rows ... her natural work. The system did the projection. The artifact carries her name. Next time she questions a result, the lineage answers: "v4 criteria, your approval on date X."

That is what expert-liaison does. Everything in this practice is a variation on that loop.

## The moves

**1. Catch the expert's natural output.** Verdict, transcript, email reply, Airtable comment, voice note. Whatever they were going to produce anyway. If you have to ask them to produce something new, you have already failed pillar 3 (burden minimization).

**2. Translate to a named artifact.** Every translation produces an artifact with: a name, a version, an owner, a path. The artifact is the unit of the loop. Not a database row. Not a JSON blob. A readable document the expert can review.

**3. Diff against the prior version.** The approval ask shows what changed. Not the whole artifact every time. Differential approval is faster, more accurate, and lower-burden than full re-reads.

**4. Route the ask in the expert's channel.** Email for Will. Airtable view for Ellie. Slack for someone else. The channel is the interface; the work is the same.

**5. Capture the approval signature.** Approval is a structural event. Date, version, approver. The signature is what makes the artifact the engine's binding contract.

**6. Bind the approved artifact to the engine.** Engines consume the latest approved version. Engine outputs reference the version that produced them.

**7. Surface lineage on every engine output.** "This row was surfaced because criteria v4 (approved by Ellie 2026-05-20) matched." The lineage is the accountability surface.

## Fourth pillar: Learnings + gap-naming (the agentic loop)

The three pillars (translation, accountability surface, minimal-burden interface) cover the production loop ... how a single artifact gets approved and bound. The fourth pillar covers how the artifact *taxonomy itself* grows through exposure to reality.

This is the alignment loop. The AI is not a passive executor; it participates in defining what containers of knowledge need to exist. See `~/code/work/practices/agentic-systems/reference/artifact-discipline.md` for the cross-practice canon.

Every real engagement (call, run, conversation, result) produces Learnings. Each Learning is one of three types:

| Type | Example | What it triggers |
|---|---|---|
| **Update existing artifact** | "Ellie rejected 4 of 6 publication-only rows → tighten AAV-evidence threshold" | Approval routes through pillars 1-3, artifact version increments |
| **Propose new artifact** | "Buyer used an intermediary to protect a personal relationship ... recurring pattern, no container exists" | Approval to add `Buyer Intermediary` to the artifact taxonomy |
| **Context gap** | "I had no Market Profile for K-12 payment processors when extracting; one would have caught the funnel-leak pattern earlier" | Roadmap signal ... what artifact to build next so the AI is smarter |

The third type is load-bearing. It is the AI naming its own limits. Without it, the system can only iterate on artifacts that humans thought to create. With it, the taxonomy grows toward what the work actually demands.

## How Learnings run through the expert-liaison loop

Same shape as artifact approval, one extra step:

1. AI extracts Learnings from real exposure (transcript, run, signal). Each Learning is typed.
2. Hermes routes the Learnings to the expert in their channel, framed as the right kind of ask per type:
   - **Update existing:** "Approve this refinement to artifact X v4 → v5."
   - **Propose new:** "I'm seeing this pattern N times. Approve adding `<artifact-name>` to the taxonomy."
   - **Context gap:** "I lacked an artifact for X. Approve adding it to the roadmap."
3. Approval lands. Each type triggers its downstream action (version increment, new artifact creation, roadmap entry).
4. Lineage links every Learning to the artifact or roadmap entry it produced.

The Learning queue is itself an artifact stream. It is feedback that grows the system, not a side log.

## What this changes about your job

You no longer just translate expert inputs into engine-bound artifacts. You also:
- Extract Learnings from every real engagement, typed by the three-way scheme.
- Make it easy for the expert to approve all three Learning types in their channel.
- Name your own context gaps explicitly. If extracting was harder because you lacked an artifact, say so. The system needs that signal.

This is what makes the practice (and the OS) self-improving rather than statically configured.

## When translation is faithful vs. when it drifts

**Faithful:**
- Adds only what the expert's input directly implies.
- Preserves the expert's framing and language where they were specific.
- Marks inferences as inferences, not as the expert's words.

**Drifted:**
- Adds content the expert didn't intend.
- Substitutes generic language for the expert's specific phrasing.
- Combines multiple expert inputs into a synthesis the expert didn't validate.

Drift compounds across versions. By v6, the artifact bears the expert's name but no longer reflects their thinking. They lose trust, they disengage, and the loop fails. Conservative projection beats clever projection.

The check: would the expert recognize this as their own thinking, with refinements they would endorse?

## Artifact taxonomy (initial cut, expand as reality demands)

Standard artifact types reused across engagements. Each type has a translation template, an approval-ask shape, and an engine-binding format.

- **Criteria** ... rules an engine applies to data (AAV target criteria, ICP filters, qualification logic).
- **Persona definition** ... who the engine is targeting (role, seniority, function, exclusions).
- **Offer / proposal** ... what's being sold, to whom, at what price (commercial lead approves price, not Hermes).
- **Voice and copy direction** ... the language the engine uses externally (email tone, LinkedIn voice, proposal phrasing).
- **Classification rules** ... how the engine sorts incoming data (tier1/2/3, qualified/disqualified, fit/no-fit).
- **Approval verdicts** ... bulk row-level decisions (Ellie's per-company verdict pattern).

This list expands as new engagements reveal new artifact types. Do not invent types without a real expert input that doesn't fit an existing one.

## The two failure modes to design against

**1. Rubber-stamping.** The expert approves without reading because the ask is too long or too vague. The artifact carries their signature but not their judgment. Engine outputs are then attributed to an expert who didn't actually decide.

Fix: short, specific approval asks with diffs. "Three changes from v3. Approve / push back / clarify each." Not "here is the new 6-page criteria doc."

**2. Drift through synthesis.** The translation step combines multiple expert inputs into a synthesis the expert didn't validate. By v4 the artifact no longer reflects their thinking. They disengage when they notice.

Fix: keep translations conservative. Surface inferences as inferences. When in doubt, route a clarifying question rather than synthesize.

## When a human is both expert and sponsor

Will is both for KAI (commercialization expertise and partnership sponsorship). Same human, two roles, two interface flows:

- **Expert flow (Hermes):** offer iteration, copy refinement, persona definition, pricing instincts.
- **Sponsor flow (engagement-governance):** Trajectory approval, Weekly Slot reports, scope discussions.

Keep the artifacts and the asks separate even when the same email lands in the same inbox. Different artifact types, different approval cadences, different conversations.

## What goes where

- Engagement-specific artifact instances (Ellie's actual criteria doc v4): `accounts/clients/<client>/artifacts/` or `accounts/ventures/<venture>/artifacts/`.
- Translation templates per artifact type: `practices/expert-liaison/reference/` or `practices/expert-liaison/skills/`.
- Translation workflows (n8n): `practices/expert-liaison/workflows/`, registered as Assets under the `expert-liaison` System.

## Paired-but-separate inbound loop: SME extraction

Hermes routes approvals on artifacts that already exist. The methodology for producing those artifacts in the first place ... how an operator extracts pattern, voice, network, hot takes, refusals, and the rest from a domain expert ... lives in cross-practice canon at `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`.

The relationship: SME extraction is the upstream inbound loop. It generates the eleven SME profile artifacts (Identity, Credibility Map, Pattern Library, Hot Takes, War Stories, Network Map, Refusal List, Voice/Vocabulary, Hypotheses/Bias Map, Time Boundaries, Decision-Making Profile) and feeds them into the registry. Hermes consumes from that point forward: routes approvals on each artifact, tracks Exchanges, binds approved versions to engines, captures Learnings that update artifacts over time.

Operators conducting intake (Kepler is the most frequent runner) own the upstream loop. Hermes owns the approval and binding loop. The handoff is the moment an artifact is drafted and registered in the liaison base as Status = draft.

## What this practice does NOT do

- Sponsor-side work (Trajectory, Weekly Slot, scope). That is `engagement-governance`.
- Engine builds (the workflows that consume artifacts). Those live in `revops-engine`, `gtm-engine`, or wherever the engine lives.
- Pricing commitments. Pricing routes through the engagement's commercial lead.
- The intake conversation itself. The operator (Kepler or whichever practice owns the engagement) runs intake against the SME extraction methodology; Hermes picks up at registration and approval.

The line is clean: Hermes builds the loop that lets the expert influence the engine through approved artifacts. The engines themselves, the sponsor-side governance, and the upstream extraction are all someone else's job.
