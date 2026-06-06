---
constellation: Guard
slug: guard
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recznBzUl8KxaSzaH
binding: bidirectional — this file is the authority on what Guard is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-05
---

# Guard — Constellation

Definitive artifact for the Guard constellation. If anything else disagrees with this file about what
Guard is, this file wins. Constellation #7 of the eight.

## What Guard is

Guard keeps the business safe from the harm an autonomous, AI-driven business can do to itself. The
catalog name says "compliance," but for an agentic org Guard is broader than regulation: it is the
guardrails on autonomy. When agents act on the business's behalf at scale — sending in an expert's
name, moving money, handling data — the risk surface explodes, and a mistake propagates as fast and as
wide as the work does.

Here is the non-obvious part: Guard is not defensive overhead, it is what *unlocks* autonomy. You can
only let agents act without a human checking every step if there are guardrails that keep them inside
the lines. Without Guard, the faster the business runs, the bigger the eventual blowup, so you are
forced to either stay slow (a human approves everything) or take unbounded risk. Guard is what makes
"fast and safe" possible at the same time, which for an agentic studio is the whole game.

For this studio specifically, the existential risk is the SME credibility model: the business rents an
expert's credibility, and one false or off-brand thing said in their name burns exactly what it was
renting. So Guard's highest-stakes job is voice/identity fidelity — never let an agent say something
the expert wouldn't stand behind.

The capability is not "block things" or "add approvals everywhere." Its essence is protecting without
strangling: guardrails that catch real harm without gating every action on a human (which would defeat
autonomy), and both halves of safety — preventive (stop the bad action before it happens) and
detective (catch the violation or drift after, before it causes damage).

Boundary: Guard bounds; it does not act. It does not build (Forge), decide strategy (Compass), or do
the work. It is cross-cutting — every constellation's actions pass through Guard's guardrails. Guard is
the horizontal counterpart to Canon: Canon is the foundation everything stands on, Guard is the
boundary everything acts within.

## What good looks like

We know Guard is delivering value when:
- Agents act autonomously and the business stays inside the lines — nothing that violates a rule, a
  regulation, or the brand goes out without being caught.
- The expert/SME is never misrepresented: nothing in their name is something they wouldn't stand
  behind.
- Sensitive data and secrets don't leak; privacy and regulatory rules are honored automatically.
- Commitments the business makes are ones it can keep.
- Guardrails catch the real risks without gating every action on a human — the business moves fast and
  safe; autonomy scales.
- When something does slip, it's caught and surfaced quickly, not discovered after the damage.

You feel Guard's absence when you can't let agents act without checking everything yourself (so
autonomy doesn't scale), when something off-brand or non-compliant goes out, when an expert is
misrepresented, when sensitive data leaks, or when a violation is found only after it caused harm.

## Systems (operational — live status in the base)

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| Guard Policy | Core | Partial | agents stay in the lines; expert never misrepresented |
| Guard Oversight | Core | Missing | nothing slips unnoticed; caught before damage |
| Guard Data Protection | Supporting | Partial | no leaks; privacy honored |

**Headline gap: Guard Oversight (Missing, Core)** — the detective/audit watch. Guard has some
preventive gates (the "Approved to send" checkbox, copy-draft source-discipline) but no systematic
oversight catching violations and drift before damage. Back on the keep-live pattern: the missing Core
is the live/watch system. The near-term priority, though, sits inside Guard Policy: **voice fidelity**,
because misrepresenting an SME is the existential risk to the credibility model.

## Dependencies

- **Guard depends on** Compass (policy/risk intent — Policy wired to `compass-intent`) and Canon (the
  rules, the expert voice models, what's sensitive; wired to `canon-context-service`).
- **Consumed by every acting system.** Voice's sends pass Guard's gates, Pulse's commitments, Signal's
  data handling, all of it. Guard is cross-cutting, consumed everywhere.

## Open questions

1. **Voice fidelity guard.** The most acute near-term Guard build: a check that nothing leaving in an
   expert's name violates their voice model. Lives in Guard Policy, leans on Voice's voice models and
   copy-draft's source-discipline. Likely the first Guard system to harden.
2. **How much is Generic.** Data Protection is largely standard security practice (buy/adopt); only the
   agent-access controls over the Canon corpus are bespoke. Don't over-build the commodity parts.
