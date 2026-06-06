---
constellation: Pulse
slug: pulse
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recmMrXOyGGxMLMr5
binding: bidirectional — this file is the authority on what Pulse is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-05
---

# Pulse — Constellation

Definitive artifact for the Pulse constellation. If anything else disagrees with this file about what
Pulse is, this file wins. Constellation #6 of the eight.

## What Pulse is

Pulse is where value actually changes hands. It is the commercial heartbeat: a yes becoming a signed
commitment, the commitment becoming collected money, and recurring revenue continuing to flow. Voice
has the conversation; Pulse moves the transaction. It is the difference between a business with lots
of interest and a business with revenue.

For the studio, Pulse is load-bearing in the obvious way: conversations and pipeline don't pay the
bills, closed and collected deals do. And in a retainer / owned-asset model, the recurring transaction
is the lifeblood. A renewal that lapses unnoticed is silent revenue death. Pulse is where the business
gets paid and stays solvent.

The capability is not "record transactions" (that's accounting) and it is not "send an invoice"
(trivial). Pulse is two hard things: getting across the commitment line (turning a soft yes into a
hard, signed deal without it stalling in terms and friction), and keeping the recurring flow alive and
visible (collecting, renewing, and catching what's about to slip before it's lost) — ideally without a
human chasing every signature and invoice.

Boundary: Pulse moves the transaction. It does not have the sales conversation (Voice), decide what to
sell or to whom (Compass / Signal), build the thing sold (Forge), or grow the account afterward
(Garden). The renewal *transaction* is Pulse; the relationship health that earns the renewal is Garden.

## What good looks like

We know Pulse is delivering value when:
- A yes turns into a signed commitment fast; the gap between "agreed" and "signed" is short and deals
  don't stall at the one-yard line.
- The business gets paid: invoices go out and money comes in on time, with little manual chasing.
- Nothing slips: no uncollected invoice, no lapsed renewal, no committed deal that quietly died.
- Recurring revenue renews on cadence, and you can see what's committed, paid, outstanding, and
  up-for-renewal at a glance.
- The founder isn't personally shepherding every signature and invoice; the transaction moves itself.

You feel Pulse's absence when deals die after the verbal yes because closing was friction, when revenue
is earned but not collected, when a renewal lapses because nobody tracked it, when cash is
unpredictable, or when the founder is the bottleneck on every contract and invoice.

## Systems (operational — live status in the base)

Pulse is the **least-built constellation** — closing, billing, and the ledger are all manual today.
And it **departs from the keep-live pattern** the others showed: this isn't built-do-once /
missing-keep-live; the whole thing is greenfield. The DDD class is what matters most here, because it
says where *not* to build.

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| Pulse Closing | Core | Missing | yes → signed, fast, no stall at the close |
| Pulse Billing | Generic | Missing | gets paid; renewals on cadence |
| Pulse Ledger | Supporting | Missing | nothing slips; full commercial visibility |

**Headline: build Pulse Closing, buy the rest.** Closing is the only Core, studio-specific part (the
multi-quarter Trajectory close, where deals leak after the verbal yes). Billing and Ledger are largely
**Generic** — invoicing, payment, accounting are commodity. Wire up Stripe / QuickBooks / an e-sign
tool; do not sink agentic engineering into them. The one bespoke edge in the Generic systems is the
renewal-slippage watch tied to the retainer model.

## Dependencies

- **Pulse depends on** Voice (the conversation that produced the yes), Compass (the Trajectory being
  sold — Closing wired to `compass-planning`), and Canon (the relationship and terms; wired to
  `canon-context-service`).
- **Consumed by** Compass (actuals feed planning and forecasting) and Garden (renewal health).

## Open questions

1. **Build vs buy line inside Closing.** The Trajectory-to-commitment flow is bespoke, but proposal
   generation and e-signature within it are Generic assets. Draw the line so you build only the part
   that's yours.
2. **Renewal split with Garden.** The renewal transaction is Pulse; the account health that earns it
   is Garden. Confirm the handoff when Garden is defined.
