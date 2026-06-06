---
constellation: Garden
slug: garden
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recjZAdbQiGBJNKyI
binding: bidirectional — this file is the authority on what Garden is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-05
---

# Garden — Constellation

Definitive artifact for the Garden constellation. If anything else disagrees with this file about what
Garden is, this file wins. Constellation #8 of the eight.

## What Garden is

Garden grows what the business already has: existing clients, partners, champions, and owned assets.
Where Signal and Voice go out and win new, Garden turns the already-won into compounding value. It is
the tending of the book of business so it deepens and expands rather than quietly leaking.

For an owned-asset studio, Garden is close to the whole thesis. The cheapest, highest-margin,
most-reliable growth is from what you already have: existing clients expand, retain, and refer.
Acquisition without Garden is a leaky bucket, winning logos and losing them, never compounding. The
studio's model is to compound relationships and owned assets over time, and Garden is the engine that
does the compounding. Without it, relationships decay, clients churn, expansion is missed, and the
business has to re-acquire constantly instead of growing what it has.

The capability is not "account management" as a job title or "send a check-in email." Its essence is
vigilance at scale over things that don't ask for attention until they're already lost. A client about
to churn, a partner going cold, an expansion that was ripe and passed: none of these raise their hand.
Garden is the discipline of noticing the state of every existing relationship and asset, and acting
before decay, across a book too large to hold in a person's head.

Boundary: Garden grows what exists. It does not find new opportunities outside (Signal), nor build new
capability (Forge). It directs communication to existing relationships but Voice executes it. And the
renewal *transaction* is Pulse; the relationship health that earns the renewal is Garden.

## What good looks like

We know Garden is delivering value when:
- Existing clients expand: revenue per account grows over time, not just holds flat until churn.
- No relationship that matters goes cold by neglect; each gets tended before it decays.
- Churn and lapse are rare and never a surprise — you see a relationship cooling and act before it's
  lost.
- Happy clients and experts become a source of new opportunity (referrals, advocacy) that feeds back
  to Signal.
- You can see the state of the whole book at a glance: who's healthy, who's at risk, where expansion
  is ripe, which relationship is overdue for a touch.

You feel Garden's absence when clients churn and you didn't see it coming, when expansion sits
unnoticed, when a partner or champion goes cold because nobody kept it warm, when growth depends
entirely on new acquisition, or when relationships live in someone's head and decay when attention
moves on.

## Systems (operational — live status in the base)

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| CRM + Motions (Cultivation) | Core | Partial | nothing goes cold; each relationship is progressed |
| Garden Expansion | Core | Partial | existing clients expand; revenue per account grows |
| Garden Health | Core | Missing | churn never a surprise; whole-book visibility |

Live coverage and emit contracts on the System rows. **Headline gap: Garden Health (Missing, Core)** —
the decay-watch. Garden can cultivate (CRM + Motions is the most-built system in the whole org) and
expand manually, but nothing watches the book for cooling relationships, churn risk, and ripe
expansion before they're lost.

**CRM + Motions resolves here.** It is Garden's Cultivation system: the relationship state machine and
the daily-touch motions that keep existing relationships warm and progress them toward outcomes. It
*consumes* Voice (to communicate) and Canon (for context); it is a Garden system, not a Voice or
operator-os one. The earlier open question is closed. Full system docs: `systems/canon-crm-feed/`.

## A note on the pattern

Garden's missing Core (Health) puts the count at **five of six on the keep-live pattern**: the missing
system is the live/watch one in Canon (Currency), Compass (Course-Correction), Signal (Monitoring),
Voice (Listening), and Garden (Health). Only Pulse departed (greenfield + mostly Generic). The
"stay-live" layer is the org's systemic gap.

## Dependencies

- **Garden depends on** Canon (relationship + account context), Voice (CRM + Motions sends touches via
  `voice-delivery`), and Pulse (Garden Health reads commercial state from `pulse-ledger`).
- **Consumed by** Pulse (healthy accounts renew), Signal (referrals/advocacy feed new opportunity),
  and Compass (book health informs what to do next).

## Open questions

1. **Owned-asset growth.** "Grows what exists" also covers the studio's owned properties (audience,
   lead-gen assets). Decide whether audience growth is a Garden system or is grown via Voice (content)
   + Signal (audience as a source). Left out of this decomposition deliberately until decided.
2. **Referral/advocacy.** Folded into Cultivation as a relationship move for now; split out if the
   SME-portfolio referral motion grows enough to warrant its own system.
