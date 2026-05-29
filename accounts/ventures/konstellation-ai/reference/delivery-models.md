# Delivery models: how engagement choice is framed with prospects

This is the client-facing translation layer for the Konstellation Offer Framework's Engagement Modes (Operated, Adoption Track, Owned, Implementation Bootcamp). The framework remains the architectural source of truth. This doc gives the role conducting the sales conversation the language to use in the room, and the discipline to stay inside what the architecture supports.

## The two client-facing models

Prospects don't think in Operated / Adoption / Owned. They think in:

- **Build-with-you (BWY).** Konstellation builds the system, operates it on a weekly cadence, and the client consumes the outputs. Continuous engagement. Retainer. The Weekly Client Update is the fulcrum of the relationship.
- **Build-for-you (BFY).** Konstellation builds the system, the client takes ownership and operates it after handoff. Discrete engagement, defined exit, milestone-gated transfer.

These are the only two delivery shapes offered. The prospect picks one. No third option, no hybrid invented in the room.

## Reconciliation with the offer framework

| Client-facing | Framework name | What it actually means |
|---|---|---|
| BWY | Operated | The default. Platform stays with Konstellation. Bespoke layer technically belongs to client but is operated by Konstellation. Weekly cadence. Retainer covers operating time, third-party costs, and the weekly delivery slot. |
| BFY | Operated + Adoption Track → Owned | Not a starting mode. Reached only by completing an Adoption Track ... a milestone-driven program with a named internal operator, weekly handoff sessions, and a real possibility of failing the milestones. If milestones fail, the engagement reverts to BWY by mutual agreement signed at the start. |

**The platform never transfers.** RevOps Engine, Canon platform, Agent Hub orchestration ... these stay with Konstellation under either model. Even a successfully-completed BFY engagement transfers only the bespoke layer. This must be named in the sales conversation, not after.

## The default posture

**BWY is the default.** Most clients land here and stay here. That is the right physics for most organizations, not a failure mode.

BFY exists for the rare client who:

- Has a named internal operator with real hours committed weekly
- Has process clarity and organizational change capacity
- Explicitly wants ownership of the bespoke layer, not just the outcomes
- Is told upfront that the platform doesn't transfer and the engagement reverts to BWY if Adoption milestones fail

These conditions are evaluated by the Diagnostic's Readiness Score. They are not assessed in a meeting from gut feel.

## What the role conducting the conversation owns

1. **Present both models cleanly.** No ambiguity. Sample framing: "We can build-with-you on a continuous retainer, or build-for-you as a discrete engagement with a defined handoff through an Adoption Track. Most clients pick BWY because BFY requires a specific internal capacity that we evaluate honestly in the Diagnostic."

2. **Default to BWY.** If a prospect doesn't insist on BFY, sell BWY. Don't volunteer BFY as an option for a prospect who hasn't asked.

3. **Never commit BFY in a meeting.** If a prospect says "we want to own this," the response: "That's the BFY path. Whether it works for you depends on a few specific conditions ... that's what the Diagnostic diagnoses. Let's run the Diagnostic, and the recommendation will tell us honestly whether BFY is the right play for your situation."

4. **Name the platform exclusion early.** "The bespoke layer we build for your business is yours. The underlying platform stays with us. That's how we keep the engagement affordable; otherwise you'd be paying for our infrastructure stack." Said early, this prevents a renegotiation later.

5. **Anchor delivery cadence in the room.** Both models run on a weekly cadence. The Weekly Client Update is the artifact that controls expectations and demonstrates progress. Name this in the first meeting so prospects know what "engagement" looks like in practice.

## Engagement parameters

The retainer delivers a defined number of bespoke-layer assets per week. The operational wrapper around delivery is fixed and named upfront, not negotiated meeting-by-meeting.

- **One weekly meeting**, 45 minutes, on a predetermined recurring slot. Purpose: review what shipped, surface friction, align on what ships next. Connection and oversight. Not a consulting session, not a scope-expansion meeting, not a working session.
- **One weekly written update**, sent the same day each week. Contents: roadmap status, what shipped, blockers, what's next, anything the client should know.
- **Friction-clearing** is handled ad-hoc as it arises, within reason. Defined Slack/email access for blockers. Not unlimited consulting hours.
- **Asset throughput** is set by the retainer tier. Larger tier = more assets per week. The Diagnostic's Roadmap names which assets fall in which tier.

What the weekly meeting is NOT for:
- Open-ended teaching or explanation of how systems work
- Ad-hoc additions to scope
- Strategy consulting beyond what's in the active roadmap
- Working sessions on net-new work

**Anything bigger than friction-clearing triggers a re-Diagnostic, not a 30-minute detour in the weekly meeting.** This is the discipline that prevents Konstellation's time from becoming the product.

The deliverable is what gets shipped, not the hours that get spent.

## Why this discipline matters

The failure mode this prevents: a BFY-flavored commitment made in a meeting drives a build scoped for handoff to a client who can't actually adopt it. The delivery team is then stuck operating an engagement that wasn't priced or shaped for ongoing operation.

The discipline above prevents that. The default is BWY. BFY is only sold through the Diagnostic, after Readiness diagnosis. If the prospect can't adopt, BWY is sold instead, and expectations were set upfront so nobody is surprised.

## Open questions to resolve

These are not yet locked. Flagged for resolution before they become a problem in a real meeting:

- **BFY pricing posture.** Adoption Track is priced separately from the Operated retainer. What's the rough shape (% of build cost, fixed fee, hourly cap)? The role conducting the conversation doesn't quote, but needs to know if BFY is a 1.5x or 3x premium to BWY so expectations can be managed.
- **Adoption Track duration.** How long does a typical Adoption Track run? 90 days? 6 months? Need a defensible answer for the room.
- **Revert-to-BWY trigger language.** What specific milestones trigger revert? Named upfront in the proposal, but the language needs drafting.
- **The "we want to build internally" prospect.** Framework names Implementation Bootcamp for this rare case. Worth deciding whether to offer this at all in the first 30 conversations or refuse-and-redirect to BWY.
