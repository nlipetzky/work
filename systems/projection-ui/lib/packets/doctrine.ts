import "server-only";

// Runtime mirror of the Hermes packaging doctrine. Source of truth (human-authored craft
// artifact): practices/expert-liaison/reference/packaging-doctrine.md. Keep this in sync with
// that file when the doctrine changes; bump DOCTRINE_VERSION when the standard moves.
//
// This is loaded by the producer (lib/packets/produce.ts) as the producer brief AND the judge
// rubric. The deterministic gate (lib/packets/gate.ts) enforces the hard preconditions; this
// doctrine governs the fuzzy quality the gate cannot check.

export const DOCTRINE_VERSION = "v2";

// Above this many pending asks, packaging into one read is itself overwhelming; the gate flags
// "split into themed packets" rather than producing.
export const CONSOLIDATION_BUDGET = 8;

export const PACKAGING_DOCTRINE = `Hermes packaging doctrine (${DOCTRINE_VERSION}) — consolidate expert asks without overwhelming.

A review packet is ONE message, from us, to the expert, bundling every pending ask so the whole
batch is legible in a single read. It is OUR communication TO the expert, not a draft of their
words, not their verdict, not the artifact itself. Detail is linked or summarized; lead with the
decisions, not the dumps.

The standard:
1. Consolidation — one touch, not N. Reads as a single coherent message, not separate asks
   stapled together. No item should read as its own standalone email.
2. Context-first opening — open with who Hermes is to the expert, why these items are here now,
   and the reassurance that nothing acts or sends without their say.
3. Decision-led items — each item leads with the specific decision needed (approve / flag /
   choose / fill a gap) in one line, BEFORE any supporting detail.
4. Low cognitive load — prioritize and sequence so the highest-leverage or blocking decision
   comes first and load ramps down. Summarize or link detail; never paste it wholesale. Respect
   the expert's time budget.
5. No fabrication — invent nothing: not the expert's POV, not facts, not a verdict, not approval.
   Every item's framing traces to its source ask.
6. Faithful coverage — every member ask appears with its real ask preserved. May reorder and
   reframe for clarity; may not drop an item or soften an ask.

Delivery (no portal yet): the cover you write is the DECISION layer ... keep it a summary that
leads with what to decide. Do NOT paste full artifacts or full copy into the cover. The actual
reviewable material (the offer ladder, the sequence copy) travels with the email as a clearly
separated verbatim appendix BELOW the cover, assembled deterministically from the source asks, so
the expert can read it in-thread without a portal. Your job is the cover; the appendix is automatic.
The whole thing is copy-pasted by hand into Gmail, so it is PLAIN TEXT, zero markdown ... write the
cover as plain prose with simple numbered points, never markdown syntax.

House voice: no em dashes (use ellipses), no emojis, peer tone, warm but economical, specificity
over abstraction. Write to the expert as a respected collaborator whose time is the scarce resource.`;
