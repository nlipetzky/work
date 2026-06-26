# Hermes packaging doctrine — consolidate expert asks without overwhelming

Version: `v2` (2026-06-25)

> v2 adds the **delivery model** (no portal yet): the composed cover is the decision layer; the
> actual reviewable copy travels as a clearly-separated verbatim appendix below it, and the send
> path is a real Gmail draft (not a dead mailto). See "Delivery" below.

This is the standard the review-packet producer is gated against. It governs how a *collection*
of pending asks for one expert becomes ONE coherent communication. It is the operational
expression of the three pillars (`methodology.md`) and the burden-minimization principle, applied
to the moment where many asks would otherwise hit the expert as a pile.

The producer is a deterministic loop (`lib/packets/`): a hard rules-gate runs first, then the
model produces, then an adversarial judge scores against this doctrine. The model is a called
function, never the driver. This document is the judge's rubric and the producer's brief.

## What a packet IS

One message, from us, to the expert, that bundles every pending ask and makes the whole batch
legible in a single read. It is OUR communication TO the expert ... not a draft of their words,
not their verdict, not the artifact itself. Detail is linked or summarized; the message leads with
the decisions, not the dumps.

## The standard (what the judge scores)

1. **Consolidation.** One touch, not N. The packet reads as a single coherent message, not a
   concatenation of separate asks stapled together. If you can lift any item out and it reads as
   its own standalone email, the framing failed.

2. **Context-first opening.** Open with who Hermes is to the expert, why these items are in front
   of them now, and the reassurance that nothing acts or sends without their say. An expert who
   doesn't know the frame rubber-stamps or stalls (see `learnings.md`, first-contact gap).

3. **Decision-led items.** Each item leads with the *specific decision needed* (approve / flag /
   choose the front-end offer / fill a gap), stated in one line, before any supporting detail. The
   expert should know what they're being asked to decide before they read anything else about it.

4. **Low cognitive load.** Items are prioritized and sequenced so the highest-leverage or
   blocking decision comes first and the load ramps down. Detail is summarized or linked, never
   pasted wholesale. The expert's time budget is respected: a packet they can act on in one sitting
   beats a complete one they defer.

5. **No fabrication.** Nothing is invented ... not the expert's POV, not facts, not a verdict, not
   approval the expert hasn't given. Every item's framing traces to the source ask (its subject,
   body, linked artifact/sequence). Drift here compounds and breaks trust.

6. **Faithful coverage.** Every member ask appears, with its real ask preserved. The packet may
   reorder and reframe for clarity, but it may not drop an item or soften an ask into something the
   source didn't carry.

## The deterministic gate (runs BEFORE the model)

Hard preconditions; if any fail, the producer does not call the model:

- At least one member ask, and every member is still `drafted` (nothing already sent/answered).
- Every member has a non-empty subject and body and an identifiable ask.
- The expert has a `contact.email` on record (we have somewhere to send it).
- Member count is within the consolidation budget (`<= 8`). Above that, packaging into one read
  is itself overwhelming ... the gate flags "split into themed packets" rather than producing.

## Delivery (no portal yet)

The expert has no portal to open, so the reviewable material must travel WITH the email. This
creates a tension with "summarize, don't paste" ... resolved by separating the layers:

- The **cover** (the AI-composed communication) stays the decision layer: leads with what to
  decide, prioritized, low-load. It must NOT paste full artifacts or full copy.
- The **appendix** carries the full reviewable material (the offer ladder, the sequence copy)
  verbatim, assembled deterministically from the source asks, below a clear divider. Read-if-you-
  want; it does not raise the load of the decision layer.

The send path is manual: Nick **copies** the plain-text email and pastes it into his own mail
client to send (the surface has a Copy button + a Mark-sent control). No `mailto:` (no OS mail
handler), no compose URL (truncates), no auto-send. When the expert portal lands later it
supersedes the appendix: the email links to the portal and the verdict writes back directly.

**Plain text is an OS-wide rule for ALL expert-facing bodies, not just packets.** Every ask and
every packet is stored and shown as plain text with zero markdown, because the operator pastes it
by hand. This is enforced deterministically by `toPlainText` (`lib/text/plain.ts`) applied at every
write boundary that composes an expert body (the outreach-approval route, the exchange route, the
packet assembler) ... never left to the model to remember.

## House voice

No em dashes (use ellipses). No emojis. Peer tone, warm but economical. Specificity over
abstraction. Write to the expert as a respected collaborator whose time is the scarce resource.

## Relationship to lineage (downstream)

When the expert replies and an item is marked approved, that approval is the binding signature
the consuming engine references (pillar 2). The packet is where that signature is collected; the
per-item verdict is what flips the linked outreach item to expert-certified on `/outreach`.
