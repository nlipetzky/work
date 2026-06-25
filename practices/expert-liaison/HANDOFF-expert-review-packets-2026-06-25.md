# HANDOFF — Expert review packets: package a collection of asks for one expert without overwhelming them — 2026-06-25

**To start:** `Read and execute this handoff: /Users/nplmini/code/work/practices/expert-liaison/HANDOFF-expert-review-packets-2026-06-25.md`

Owner: **expert-liaison (Hermes)** ... this is expert-interaction CRAFT, not Boris's to design. Boris built the marking/collection substrate (below); Hermes designs how the expert is actually communicated with. Surface: projection-ui /expert-liaison (:4180 launchd, hot-compiles, no 2nd dev server). Canon: `mzzjvoiwughcnmmqzbxv`.

## The need (Nick, this session)
Across surfaces, Nick marks items "this needs to go in front of the subject-matter expert." Those marks must NOT each fire a raw, standalone email at the expert. Instead: Expert Liaison receives the **collection** of items for an expert and **packages them into ONE coherent communication that explains what's going on** ... prioritized, framed, with a clear ask per item ... so the expert is not overwhelmed by a pile of "read this and reply" dumps. "It should know how to share all of that without overwhelming the expert. It should package it up and explain what's going on." This lives in the Expert Liaison system.

## What already exists (the substrate Boris built ... your INPUT)
Marking an item "for the expert" already routes it to Hermes as a DRAFTED `expert_exchanges` row (a queued item, never an auto-send). They pile up per expert in the EL console today as individual asks. Sources of marks:
- `/api/outreach/request-expert-approval` ... outreach copy sequences (`metadata.kind='outreach-copy-approval'`, linked `metadata.sequence_id`) and the offer ladder / canon artifacts (`metadata.kind='artifact-expert-review'`, linked `metadata.artifact_id`). Subject + a per-item body + the rendered content are already composed as a starting point.
- The existing EL gap-artifact asks (the Assembler's `needs` → composed asks) target the same experts.
- `expert_exchanges` (migration 006): `expert_slug`, `subject`, `body`, `artifact_types[]`, `status` (drafted→sent→answered→closed), `response`, `metadata`. RPCs `record_expert_exchange` / `update_expert_exchange` (service-role-locked). The EL console renders these + Mark sent (mailto) + Mark answered.
- `experts` registry: `will-rosellini` (legal/IP + device/biotech), `nick-lipetzky` (marketing). `contact` holds email.

So today: N drafted asks for Will sit in EL as a list. That IS the collection. The gap is the PACKAGING.

## The build
A **review-packet** layer in Expert Liaison:

1. **Collect.** Group the pending (drafted) asks by expert into a packet: "3 items waiting for Will." Pull from `expert_exchanges` where `status='drafted'` for that expert (across all kinds: outreach copy, artifact certification, gap-artifact asks).
2. **Package (the craft ... Hermes owns this).** Compose ONE communication from the packet that:
   - Opens with context: who you are to them, why these are here, the reassurance that nothing acts/sends without their say.
   - Presents each item briefly with its SPECIFIC ask (approve / flag / choose the front-end offer / fill a gap) ... not the full dump; link or attach detail, lead with the decision needed.
   - Prioritizes + sequences so the cognitive load is low (respect [[feedback_economize_reading_load]] and [[feedback_protect_nick_time]] applied to the expert: every ask has a stated purpose; one consolidated touch, not many).
   - Produces a single send (one email body, or a shared doc + a short email), addressed to the expert's `contact.email`.
   This composition should run the proven machine: a deterministic produce → judge loop, AI as a called function, gated by a **Hermes packaging doctrine** you author (the standard for "package expert asks without overwhelming"). No fabrication of the expert's words; this is OUR communication TO them.
3. **Surface (own view in EL).** A "Review packets" section: per expert, the pending collection + a **Package** action → produces the composed draft → Nick/Hermes reads + edits → Send (mailto / however EL sends) → Mark sent (advances all bundled asks to `sent`).
4. **Close the loop (distribute answers back).** When the expert replies, capture per-item outcomes and write each back to its source item's review state: outreach sequences/offer already read their linked exchange's `status`/`response` on the /outreach surface (the "expert sign-off" lanes) ... advancing the exchange to `answered` (and ideally a per-item approved/flagged verdict) is what flips those items to expert-certified. This also closes the open follow-on noted in the outreach build (expert answer → item certified → gate the eventual send-wire on it).

## Design constraints
- Boundary: Boris built the marks + linkage; Hermes designs the packaging doctrine, the composition, and how/when the expert is contacted. Do not let the outreach system dictate the expert communication.
- Reuse the governed-write discipline (RPCs), the read-before-send pattern, and the "asks never live only in chat" rule.
- Don't break the existing per-item asks; the packet is a layer that consumes them.

## Verification
- With 2+ drafted asks for Will (there are already: the offer-ladder cert + the LinkedIn + email copy reviews), the EL "Review packets" view shows them grouped under Will.
- Package → produces ONE coherent draft that explains context and lists each item's specific ask, not a raw concatenation.
- Send advances all bundled asks to sent; a recorded reply flips the linked outreach items' "expert sign-off" lanes to answered/certified on /outreach.

## Scope guard (NOT this build)
The send-wire (System O / actually pushing approved copy to HeyReach); auto-classifying the expert's free-text reply into per-item verdicts (v0 can be Hermes/Nick marking each); multi-expert packets where one item needs two experts (route per required_expertise; start with single-expert packets).
