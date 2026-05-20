# Offer Schema

The shape of an offer artifact. Skill output conforms to this structure.

**Output path:** `clients/<client>/<practice>/artifacts/offer-<play-slug>.md`

---

## Template

````markdown
# Offer: <play-slug>

**Client:** <client>
**Play:** <play-slug>
**Date:** <YYYY-MM-DD>

---

## Headline

<One sentence: what is being pitched, to whom, why now.>

---

## Audience

The persona/role this offer is pitched to. Not a database segment.

- **Persona:** <title or function>
- **Context:** <where this persona works, what they do, what they own>
- **Pain we address:** <what problem they articulate that the offer solves>

---

## The offer

What is being pitched, in substance.

- **Outcome:** <what the prospect gets, in their language>
- **Mechanism:** <how it gets delivered: program, product, engagement, service>
- **Inclusions:** <what is in the box>
- **Pricing or commercial frame:** <if known>

---

## Why now

Specific triggers and market context that make this play timely. Not "the market is changing." Cite events, regulatory shifts, customer signals, competitive moves.

- **Trigger:** <the specific recent event or condition>
- **Window:** <how long this window stays open>
- **Context:** <broader market frame>

---

## Proof

Verifiable evidence the offer delivers what it claims.

- **Named references:** <customer names where shareable; segment descriptors of comparable specificity if not>
- **Measurable outcomes:** <numbers, percentages, durations>
- **Third-party validation:** <analyst coverage, certifications, awards, press>

---

## The ask

The single next action we want the prospect to take.

- **Primary CTA:** <single action, named clearly>
- **Why this CTA:** <what makes this ask reasonable for the audience at this point>

---

## Out of scope

Explicit boundaries.

- **Not pitched:** <related offers not in this play>
- **Not promised:** <outcomes the offer does not commit to>
- **Not for:** <audience adjacencies that look right but aren't>

---

## Confidence and gaps

- **Assumptions made:** <decisions made without explicit guidance, with reasoning>
- **Decisions against the brief:** <choices that diverge from or extend the brief, with reasoning>
- **Open questions:** <items the user should clarify before this offer ships to copy>
- **Signals not yet observable:** <facts that would sharpen the offer if a new source were available>
````

---

## Field definitions

**Headline.** One sentence. What is being pitched, to whom, why now. If it does not fit in one sentence, the offer is not yet locked. Stop and resolve.

**Persona.** Title or function-level descriptor of who this is pitched to. Not a database query; a human description.

**Outcome vs mechanism.** Outcome is what the prospect gets ("a sharper reagent supply chain"). Mechanism is how it is delivered ("a 30-minute consultation"). The offer description leads with outcome; mechanism is secondary.

**Trigger.** A specific recent event or condition that justifies the play right now. If the trigger would be equally true a year ago, it is not a trigger.

**Named references.** Customer names that can be shared. If references must remain anonymous, name the segment ("a top-three CGT contract manufacturer") with comparable specificity.

**Primary CTA.** Single action. "Reply if interested" is not a CTA. "Book a 20-minute call to walk through your reagent qualification timeline" is. Stacking multiple asks ("reply, book a call, or download the white paper") is a known failure mode and produces zero conversions.

**Out of scope.** Not optional. The boundary section prevents downstream copy from drifting into adjacent territory and forces the offer to declare what it is by saying what it is not.

**Confidence and gaps.** Not optional. Every artifact ends with this section, even if entries are short. An offer with no flagged decisions-against-the-brief is itself a flag.
