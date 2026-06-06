# Motion Spec — Canon CRM

First cut, 2026-06-04. Drafted with Nick. Exit conditions and the `why` blocks are the
load-bearing parts and are meant to be tuned. Nothing here is automated yet.

## What this file is

Under **Approach A**: Airtable holds the *live instances* (where each contact is right now). This
file holds the *definitions and sequencing* the agentic system reads. Airtable is the legible
board; this spec is the state machine. You add or change a motion by editing this file, not by
maintaining a second Airtable table.

## The data model (3 parts)

1. **Contacts** (Airtable table `tblG44S3hYR5j5K2t`) ... who someone is. Identity + Role. Durable.
   Carries no process state.
2. **Motions** (new Airtable table) ... the live instances. One row = one contact running one
   motion. This is the at-a-glance board. A contact can have several rows at once (different cycles).
3. **This spec** ... the motion library + transition rules. What the agentic system reads to know
   how to advance a row, and *why*.

## How to read this spec (alignment)

There is no single system that works with reality. There are two, and a motion is the seam between
them:

- A **rail** moves activities through a process. Deterministic. Reads `entry / repeat_until /
  on_exit`. It knows the sequence.
- A **judgment layer** faces the contact. Humans are unpredictable; no script survives contact with
  one. It reads `goal / why / read / guardrails` so it can call its own plays.

You (the AI) are running drives, not a script. The relationship is a field. Each motion is one
drive to the next scrimmage line ... `repeat_until` is the first-down marker. You do not control
the defense. Your job is to move the ball to *this* motion's line, using judgment aligned to its
`goal` and `why`, then hand off to the next motion. Get the next 10 yards. Then the next. A contact
can have several drives running at once.

**The alignment test:** before any move, you can state why this motion exists and what result it
drives the contact toward. If you cannot, you are executing steps, not aligned ... stop and reread
the motion.

## Motion definition schema (locked)

Every motion in the library carries exactly these fields:

```text
slug          stable id, lowercase-kebab (never changes once referenced)
name          display name
cycle         Partnership | Engagement

# rail (deterministic ... the process system reads these)
entry         observable condition under which a contact enters this motion
repeat_until  observable exit condition (the first-down marker)
on_exit       next motion slug, or a branch: { condition: slug, ... }
waiting_on    default on entry: Us | Them

# alignment (judgment ... the AI reads these to guide an unpredictable human)
goal          the contact-facing result this drive moves them to (the scrimmage line)
why           why this motion exists in the arc; what it unlocks; the cost of skipping it
read          progress vs stall signals in the contact's behavior
guardrails    how to advance without backfiring; what not to do
next_action   default move drafted while looping (AI generates from goal + why + read)
```

Two rules:
- `repeat_until` must be an **observable milestone**, not a feeling. "Bottleneck named and agreed"
  is observable. "They seem warm" is not.
- `goal` is stated as a **contact outcome**, not our internal task.

## Airtable `Motions` table schema (the instance layer)

```text
Contact            link → Contacts        (required)
Cycle              select: Partnership | Engagement     (= old Contacts.Type, moved here)
Motion             select: current motion slug          (options mirror this library)
Waiting On         select: Us | Them                    (moved off Contacts)
Next Action        text                                 (moved off Contacts)
Next Action Date   date                                 (moved off Contacts)
Entered            date                                 (when this motion started → aging)
Status             select: Active | Done | Dropped
Notes              long text                            (optional)
```

The board you wanted = a view filtered to `Status = Active`, grouped by `Waiting On`, sorted by
`Next Action Date`.

## Motion library

### Engagement (buyer → operated retainer)

```text
slug: open   name: Open   cycle: Engagement
entry: Contact identified as a real engagement prospect.
repeat_until: A discovery meeting is held.
on_exit: diagnose
waiting_on: Them
goal: A real working meeting is held ... the contact shows up ready to talk about their business.
why:  You cannot diagnose what you cannot see. This drive converts a name and a flicker of interest
      into actual access. No meeting, no engagement ... everything downstream is vapor until they
      give you real time.
read: Advancing = they propose times, reply fast, ask what to prepare. Stalling = warm words with
      no calendar commitment, repeated reschedules.
guardrails: Don't pitch before the meeting. The ask is small (30 min, their world), not a sale.
      "Interested" is not "booked and held" ... only the latter reaches the line.
next_action: Propose 2-3 specific times for a 30-min download; follow up until booked and held.

slug: diagnose   name: Diagnose   cycle: Engagement
entry: Discovery meeting held.
repeat_until: A single bottleneck is named and the contact agrees it is the one.
on_exit: shape-offer
waiting_on: Us
goal: The contact sees their OWN #1 bottleneck clearly and agrees it's the thing to fix.
why:  Everything downstream only lands if it's aimed at a bottleneck the contact already believes
      is real. Skip this and you sell a solution to a problem they don't own ... the off-model
      custom-software trap. This drive earns the right to make an offer.
read: Advancing = they name symptoms unprompted, correct your map, say "yes, that." Stalling =
      polite agreement with no specifics, or five problems and commitment to none.
guardrails: No solution yet. Don't accept the first complaint as the bottleneck ... pressure until
      one rises above the rest. One bottleneck, agreed, or you haven't reached the line.
next_action: Run the assessment; reflect their current state back; name the single bottleneck and check it lands.

slug: shape-offer   name: Shape Offer   cycle: Engagement
entry: Single bottleneck agreed.
repeat_until: Offer shape agreed AND on-model (managed-agent, not custom software) AND
              decision-maker interest confirmed.
on_exit: propose
waiting_on: Us
goal: The contact agrees on a small, concrete intervention aimed at their bottleneck, with a
      promised result a managed agent can actually deliver.
why:  This is where engagements go off-model. The pull is toward custom software or a big build.
      Alignment is holding the line at the smallest managed-agent move that still shifts the
      bottleneck. If you can't shape it on-model, the engagement isn't ready ... that's signal,
      not failure.
read: Advancing = they get specific about the result they'd pay for, ask "could you do X."
      Stalling = scope creep, asking for a platform/portal, enthusiasm with no decision-maker present.
guardrails: Smallest intervention that moves the bottleneck. On-model or it does not exit. Confirm
      the decision-maker actually wants this before spending effort on a proposal.
next_action: Draft the smallest intervention + the promise; pressure-test on-model; confirm decision-maker interest.

slug: propose   name: Propose   cycle: Engagement
entry: On-model offer shaped and decision-maker interested.
repeat_until: Explicit yes or no.
on_exit: { yes: onboard, no: drop }
waiting_on: Them
goal: The decision-maker gives an explicit yes or no to the retainer.
why:  Proposals die in ambiguity. This drive exists to force a real decision, not to keep a warm
      thread warm. A clean no beats a slow maybe ... it frees the field.
read: Advancing = decision-maker engages with terms, negotiates, asks about start. Stalling =
      champion warm but decision-maker silent, "let me circle back" with no date.
guardrails: Get it in front of the actual decision-maker, not just the champion. Ask for the
      decision. Don't discount to rescue a stall ... that signals the offer was inflated.
next_action: Deliver the proposal to the decision-maker; chase a decision.

slug: onboard   name: Onboard   cycle: Engagement
entry: Proposal accepted.
repeat_until: (terminal / active)
on_exit: null
waiting_on: Us
goal: The retainer is live and you're operating.
why:  The job shifts from winning to delivering. Alignment here = make the first weeks prove the
      promise you sold.
read: (active state)
guardrails: Deliver the specific promise from shape-offer first. Don't expand scope before the
      first result lands.
next_action: Stand up the retainer; begin operating.
```

### Partnership (prospective partner → active co-owned partner, the Will/KAI shape)

```text
slug: align   name: Align   cycle: Partnership
entry: Someone surfaces as a prospective venture partner.
repeat_until: Both sides agree there is a partnership worth forming.
on_exit: define
waiting_on: Us
goal: You and the prospective partner agree, explicitly, that there's a partnership worth forming
      and roughly in what domain.
why:  Partnerships fail when one side is building a partnership and the other thinks they're getting
      free help. This drive surfaces real mutual intent before anyone invests. Skip it and you
      over-invest in someone who was never going to anchor an entity.
read: Advancing = they talk in "we," bring their own ideas for the shared thing, ask about
      structure. Stalling = they keep framing it as you helping them, or stay vague on commitment.
guardrails: Don't formalize before intent is mutual and stated. Don't let one-sided enthusiasm read
      as alignment. Name the domain ... a partnership about "everything" is a partnership about nothing.
next_action: Have the intent conversation; confirm a shared domain and real appetite.

slug: define   name: Define   cycle: Partnership
entry: Mutual intent confirmed.
repeat_until: Partnership terms sketched AND a first opportunity named.
on_exit: form
waiting_on: Us
goal: The shape is sketched ... domain, entity, who anchors what ... and a concrete first
      opportunity is named.
why:  Intent without definition drifts. This drive turns "we should work together" into "here's the
      thing we own and the first move." The first opportunity is the proof the partnership is real,
      not theoretical.
read: Advancing = they engage on entity/ownership specifics, volunteer a first opportunity.
      Stalling = avoidance of structure questions, no concrete opportunity surfaces.
guardrails: Get to a named first opportunity ... abstract partnerships stall here forever. Sketch
      anchoring and ownership now, don't defer to "later."
next_action: Sketch the shared entity and anchoring; identify the first joint opportunity.

slug: form   name: Form   cycle: Partnership
entry: Terms sketched and first opportunity named.
repeat_until: Entity exists OR first joint engagement is live.
on_exit: active-partner
waiting_on: Us
goal: The structure exists (entity/agreement) or the first joint engagement is live.
why:  This is where a partnership becomes load-bearing. Either you've stood up the shared entity or
      you're running a real engagement together. Until something is live, it's still a conversation.
read: Advancing = paperwork moves, the first engagement gets a real prospect, they invest their own
      time and network. Stalling = enthusiasm without action, the first opportunity keeps slipping.
guardrails: Don't over-engineer the entity before there's revenue or a live engagement to justify
      it. The first joint engagement teaches you more than any agreement.
next_action: Stand up entity/agreement; launch the first engagement together.

slug: active-partner   name: Active Partner   cycle: Partnership
entry: Structure stood up / first engagement live.
repeat_until: (terminal / active)
on_exit: null
waiting_on: Us
goal: Co-owned and operating, sourcing and running engagements together (where Will is).
why:  The relationship is now a channel, not a prospect.
read: (active state)
guardrails: Keep feeding the partnership real engagements ... an idle partner relationship decays.
next_action: Operate the partnership; source and run engagements together.
```

## Current records → motion mapping (first cut)

```text
Contact              Cycle         Motion          Waiting On   Notes
RahrBSG / Jari       Engagement    diagnose        Us           awaiting Will's diagnostic
Absolute / Chris     Engagement    diagnose        Us           STUCK: off-model, can't exit to shape-offer
Vanco / Shawn        Engagement    open            Them         book the Faith download
Larry Tweed          Partnership   align           Us           first opportunity = Absolute
Jari (partnership)   Partnership   align           Us           align before the Will meeting
Will                 Partnership   active-partner  Us           (new Contact record, Role = Partner)
```

## To tune together

- Exit conditions and `why` blocks on every motion. These are first-draft.
- Whether Engagement needs a motion between `diagnose` and `shape-offer` for the survey/cluster
  step in the older trajectory notes (download → survey → cluster → retainer).
- The `drop` terminal (lost) ... add as an explicit motion or just `Status = Dropped`?
- How the agentic system detects a `repeat_until` is met (manual flip now; automatable later).
