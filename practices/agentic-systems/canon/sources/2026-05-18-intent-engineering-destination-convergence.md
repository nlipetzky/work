# Source-of-record: intent engineering — destination + convergence (2026-05-18)

## What happened

Nick noticed Teknova's `Definition Maturity` read `stable` while the system is still being built. He rejected "definition of done" (a living system never finishes) but said the "aspirational destination could be articulated," and that the real need is to know "whether or not we're building toward that" — "the context that establishes the temporal elements that the structured database should be following." He flagged it as a recognized concern to solve, deliberately not to be rabbit-holed now.

## The reasoning

Two distinct things had been conflated into one field, and a third was missing entirely.

- `Definition Maturity` (emerging/forming/stable) is **epistemic** — how settled our understanding of *what the system is*.
- What Nick is reaching for is **trajectory** — where the system is pointed and whether it is converging on that. Orthogonal to definition maturity: a definition can be stable while the build is barely started, or emerging while operating.

The agent's original `stable` value was wrong for an instructive reason: "we have described it well" was treated as "its definition is settled," but the currency layer is an unbuilt, definition-altering capability — so the definition is still moving (`forming`).

The missing primitive — **intent engineering**: a registry holds **state** (what is — Assets, the snapshot) and **backlog** (what we'll do — Roadmap), but not **intent**: what the system is becoming and whether it is closing the gap. Intent has two parts:

1. **Aspirational state** — a written description of the system operating as intended in steady state. Not a done-date; "what good looks like." Living and revisable (consistent with the emergent-systems primitive).
2. **Convergence** — the honest read of whether current trajectory + roadmap actually close the gap to that aspirational state, or whether work is happening but drifting.

Key insight: a roadmap proves there is work; it does NOT prove the work points at the destination. Every roadmap item can complete and the system still not arrive, because the destination was never pinned as the thing the roadmap is checked against. The missing artifact is the articulated destination; the missing signal is gap-to-destination. This is the run-vs-build / build≠verified≠run family extended into a *vector*: not just what state a thing is in, but what it is converging toward and whether it is.

## Disposition (deferred, by Nick)

Immediate factual fix applied: Teknova `Definition Maturity` → `forming`. The structural solution (where aspirational state and convergence live, and whether convergence ever becomes a structured field vs stays an eyeballed read against a destination doc) is a recognized, named, deliberately-deferred concern — capture now, solve when reality forces it, do not anticipatorily model. Destination context for Teknova already exists scattered across the snapshot (current state) and the v0 design/roadmap (the work); what is unpinned is the articulated *target* the work is converging on.
