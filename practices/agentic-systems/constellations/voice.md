---
constellation: Voice
slug: voice
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recyVyn5wN9bdMA62
binding: bidirectional — this file is the authority on what Voice is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-05
---

# Voice — Constellation

Definitive artifact for the Voice constellation. If anything else disagrees with this file about what
Voice is, this file wins. Constellation #5 of the eight.

## What Voice is

Voice is how the business communicates with the outside world, in both directions, as itself. It is
the mouth and the ears: the cold outreach, the content, the ghostwritten posts that go out, and the
replies, mentions, and responses that come back. Signal finds the opportunity; Voice is what actually
reaches out and turns the finding into a conversation, then keeps that conversation alive.

For a studio whose edge is selling an expert's credibility and access, Voice is load-bearing twice
over. It is how the business touches its market at scale without the founder writing every message,
and it has to sound like a real, specific person, because the moment it sounds generic or AI-written,
the credibility it was borrowing is spent. Voice is also how relationships stay warm: a business that
can't keep talking goes quiet, and quiet relationships decay.

The capability is not "send messages." Sending is trivial, and a million generic messages is the
opposite of Voice. Voice is two hard things: saying it in the authentic voice of the business or the
specific expert it speaks for, faithfully and at scale (the identity problem), and actually listening
and responding, closing the loop rather than broadcasting (the two-way problem). A Voice that only
speaks is a billboard. A Voice that listens is a relationship.

Boundary: Voice speaks and listens. It does not decide what to say strategically (Compass), find who
to talk to (Signal), remember the conversation (Canon stores it), or move the transaction (Pulse). It
is the communication layer. Signal hands Voice a prospect; Voice has the conversation; Pulse moves the
money.

## What good looks like

We know Voice is delivering value when:
- The business reaches its market at scale and consistently, without the founder personally writing
  every message.
- What goes out sounds like the business, or the specific expert it speaks for. A recipient couldn't
  tell it wasn't hand-written by that person.
- Replies and responses are captured and answered. Nothing said to the business goes unheard;
  conversations actually continue.
- There's one coherent presence across channels (outreach, content, social), not a fragmented set of
  disconnected messages.
- An expert or persona can be spoken-as faithfully, so the business can run many voices (the
  portfolio-of-experts model) without each expert having to write everything themselves.

You feel Voice's absence when outreach sounds generic and gets ignored, when replies pile up
unanswered, when the business goes quiet because nobody had time to write, when messages in someone's
name don't sound like them, or when a great Signal opportunity never gets contacted.

## Systems (operational — live status in the base)

Three systems sharing the communication layer: the personas/voice models, the message content, the
channels, and the conversation threads (today scattered across copy artifacts, HeyReach, the CRM
Events table, and Canon).

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| Voice Authoring | Core | Partial | sounds like the person; speak-as-a-persona faithfully |
| Voice Delivery | Core | Partial | reaches the market at scale, consistently |
| Voice Listening | Core | Missing | nothing unheard; conversations continue |

Live coverage, emit contracts, and gap tracking live on the System rows. **Headline gap: Voice
Listening (Missing, Core)** — the "and listens" half. Voice can author and deliver (speak) but does
not systematically hear and respond.

Note: Voice Delivery (and some of Authoring) is where the current RevOps outreach work lives (HeyReach
campaigns, cold-email cadences, the CRM send mechanism). Those assets reassign here when the RevOps
cluster is unwound — continuing to dissolve "RevOps" into Signal (source) + Voice (reach) + Compass
(the play).

## Dependencies

- **Voice depends on** Compass (what to say, which campaigns), Signal (who to talk to — Delivery wired
  to `signal-prospecting`), and Canon (context about the person, the business's knowledge, and the
  captured replies; wired to `canon-context-service`).
- **Consumed by** Pulse (conversations hand off to transactions) and the relationship layer
  (CRM + Motions uses Voice to progress relationships).

## Open questions

1. **CRM + Motions home.** CRM + Motions does relationship outreach (it speaks as Nick/Will and tracks
   whose-court). The speaking/listening it does is Voice; the relationship-progression (motions toward
   partnership/retainer) is closer to Garden. Likely resolution: CRM + Motions is a Garden system that
   *consumes* Voice, not a Voice system itself. Confirm when Garden is defined.
2. **Voice models as assets.** Each expert/persona's voice model (the SME Voice artifact) is a
   context-engineering Asset of Voice Authoring, reused across messages. Register them as assets when
   the SME portfolio formalizes.
