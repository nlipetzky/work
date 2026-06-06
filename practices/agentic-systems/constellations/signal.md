---
constellation: Signal
slug: signal
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recASV9599DlYex3p
binding: bidirectional — this file is the authority on what Signal is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-05
---

# Signal — Constellation

Definitive artifact for the Signal constellation. If anything else disagrees with this file about what
Signal is, this file wins. Constellation #3 of the eight.

## What Signal is

Signal is how the business sees outward. It is the business's sense for opportunity in the world
beyond its own walls: the prospects who could buy, the people worth bringing in, the partners, the
market shifts, the moments worth riding. Where Canon knows what the business already knows, Signal
finds what it doesn't yet know but should.

For a studio that sells services and grows ventures, Signal is the top of every funnel. Without it,
pipeline depends on the founder's network and whatever inbound luck arrives, and the business runs on
opportunities it stumbled into rather than ones it went and found. It is also how the business stays
ahead: it sees the wave before it breaks instead of reacting after competitors already moved.

The capability is not "watch the world" or "collect external data." The outside is infinite and almost
all of it is noise. An opportunity is a tiny, time-sensitive subset that fits *this* business right
now. So Signal is two hard things: cutting that noise down to the actionable few (signal from noise,
which requires knowing what the business does and wants), and catching them while they are still
opportunities. A lead surfaced after the moment passed, or a market shift noticed once it's obvious,
is not Signal. Signal is the right openings, surfaced in time.

Boundary: Signal finds. It does not decide which opportunities to pursue (Compass), reach out to them
(Voice), close them (Pulse), or remember what it found (Canon stores it). Signal and Compass form a
loop: Signal surfaces, Compass decides what to chase, which sharpens what Signal looks for next.

## What good looks like

We know Signal is delivering value when:
- The business always has more qualified opportunities than it can pursue. The constraint is capacity,
  not leads.
- An opportunity surfaces while it's still actionable (intent showing now, a trend on the way up), not
  after it's passed.
- What gets surfaced actually fits what the business does and wants. High signal-to-noise; few false
  positives burning attention.
- The business sees a shift in its market before it's obvious, and before competitors react.
- You can point Signal at a new segment, partner type, or channel and it starts surfacing relevant
  opportunities, without a bespoke rebuild each time.

You feel Signal's absence when pipeline depends on the founder's personal network or random inbound,
when opportunities are noticed too late to act, when the team drowns in irrelevant leads, or when the
business is surprised by a market move everyone outside already saw coming.

## Systems (operational — live status in the base)

Three systems sharing the external-opportunity pipeline (candidate records, enrichment, scores,
criteria — today the RevOps Surface base + the companies/contacts enrichment stores).

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| Signal Targeting | Supporting | Partial | what's surfaced fits; point-it-at-a-new-segment |
| Signal Prospecting | Core | Partial | more qualified opportunities than we can pursue |
| Signal Monitoring | Core | Missing | surfaced while actionable; sees shifts early |

Live coverage, emit contracts, and gap tracking live on the System rows. **Headline gap: Signal
Monitoring (Missing, Core)** — the timing dimension. Signal can source and qualify, but is weak at
catching opportunities while still actionable and seeing shifts early. Secondary: Prospecting is
Partial because it isn't configurable — every new segment is a hand-build.

Note: Signal Prospecting is where much of the current "RevOps" work actually lives (Companies
enrichment, contact sourcing, discovery/event capture, verification). Those assets reassign here when
the RevOps *cluster* is unwound. This is the method starting to dissolve the RevOps question: "RevOps"
is a buyer-facing cluster that draws systems from Signal (source/qualify), Voice (outreach), and
Compass (the play), not a single thing.

## A pattern worth naming

Across the three constellations defined so far, the Missing Core system is always the **keep-it-live**
one: Canon → Currency, Compass → Course-Correction, Signal → Monitoring. The studio has built the
do-it-once systems (capture, plan, source) and is missing the stay-current systems (keep true, re-
decide, catch-in-time). That recurrence is itself a finding for Compass to weigh: the highest-leverage
build across the whole org may be the "stay live" layer, not any single constellation.

## Dependencies

- **Signal depends on Compass** (Targeting derives from intent — what to look for) and **Canon** (knows
  what the business does and has already seen; wired to `canon-context-service`).
- **Consumed by** Compass (opportunities to weigh) and Voice (reaches out to what Signal found). Signal
  also feeds Canon: what it finds gets remembered.

## Open questions

1. **Configurability of Prospecting.** Today it's hand-built per segment (Teknova AAV). Making it
   point-and-go for a new segment is most of the Partial → Have work.
2. **RevOps cluster unwind.** Reassign the existing RevOps sourcing/enrichment/verification assets to
   `signal-prospecting` (and outreach assets to Voice) when the cluster is decomposed.
