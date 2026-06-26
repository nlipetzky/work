# HANDOFF: what we are building, and what "done" looks like

Date: 2026-06-23. From: Boris (agentic-systems) + Nick. For: any session that picks up this work.
Purpose: state the mission and the definition of done clearly enough that the work cannot drift back
into wandering. Read `reference/system-building-method.md` (the method) and `reference/operating-doctrine.md`
(the constitution) alongside this.

---

## What we are doing (one paragraph, no hedging)

We are building Nick's operating system ... the agentic systems that run the studio ... not by adding
more features, but by establishing the **discipline** that makes a system real. There is one method to
**define → build → verify → surface** every system, and we apply it universally. The point is that Nick
can **see** exactly what he has (what exists, what runs, what's verified, what's broken) and **trust**
that what the surface says is true. The representation (the `/system` and `/work` surfaces) and the
method (deterministic spine first, AI as a verified component, a gated maturity ladder) are two halves
of one thing: an operating system that is **legible and honest**. That is the only ground autonomy can
be built on. In one line: **make every system knowable and trustworthy by building them all to one
method and surfacing the truth about each ... so they can eventually run themselves.**

## Why (the problem this kills)

The systems drift, the AI overclaims, things break silently, and "done" doesn't mean done. This very
session, a *broken* ingestion system was labeled "operating." An operating system you can't trust is
worse than none ... it lies with a straight face. You cannot make a system **autonomous** until it is
**legible and trustworthy**, so this is the precondition under the vision ("autonomous systems that
accomplish the tasks") and the *how* under every other goal (the INSTIG8 engine, the audience, the
operator OS are all systems that must be built and verified this same way).

## What "done" looks like (the definition of done)

Three levels. All of it is **read live from the surface, never narrated.**

**Method level** ... done = the method is real and enforced, not aspirational:
- `system-building-method.md` is the canonical reference; every build reads it first.
- The maturity ladder is **gate-enforced**: a system cannot sit at `operating` unless its verification
  passes green when read live. "Done" cannot be asserted ... the surface refuses it.

**System level** ... done for any one system:
- It has a **spec** (the anatomy: purpose = what it *ensures*, activities, contract, non-goals,
  acceptance criteria).
- It sits at an **honest maturity state** (`emerging → building → beta → operating`).
- Its **triggers and assets are reconciled against live reality**; gaps are lit, not hidden.
- Its guarantee is **verified continuously** (a deterministic check where checkable, a binary eval for
  the judgment parts), and that verification is what holds it at `operating`.
- It is **surfaced on `/system`** reading live canon.

**Studio level** ... done = the operating system is trustworthy:
- Every active system is on the method at an honest maturity state.
- The autonomy gradient and the maturity ladder are **real, computed from canon, never asserted.**
- Nick can open any system and trust what it tells him.

**First concrete proof of done:** **Canon Ingestion carried `beta → operating` through the method end
to end** ... specced, its broken upstream ingestion located/fixed and verified, triggers + assets
reconciled, green on the surface. When that holds on a real, currently-broken system, the method has
earned itself, and we replicate it across the fleet.

## What this is NOT (non-goals)

- Not building more surfaces or systems for their own sake. Legibility and trust first.
- Not chasing autonomy before a system is legible and verified.
- Not trusting docs, asset records, or session prose over live state. Live is the only ground truth.
- Not me (a chat agent) being the execution engine. Code drives; AI is a called, verified component.

## Where we are right now (honest state, 2026-06-23)

- **The method exists** (`system-building-method.md` v1) and the **constitution** (`operating-doctrine.md`,
  12 rules). The maturity ladder gained a `beta` rung so "operating" can't be claimed unverified.
- **The surfaces exist:** `/system` (the 10-part anatomy + triggers/routing + workspace-ingestion
  panel), `/work` (the spine + run layer), `/demand` (the demand-context console) ... all reading live
  canon in projection-ui (localhost:4180).
- **Canon Ingestion is at `beta`, and its upstream is broken**: the launchd `com.canon-engine.fetch`
  poller errors every run (points at a missing path; real code only in `~/code/ARCHIVE`); data still
  arrives via an unverified path. A downstream transcript-router (mine, launchd, every 5 min) is wired
  and routes new transcripts to Atlas's inbox. Open capture_items filed for the breakage + the INSTIG8
  ingest gap.

## The next move

Run **Canon Ingestion** through the method, end to end, as the first proof:
1. Spec it (anatomy) ... it's largely there; fill non-goals + acceptance criteria.
2. Locate the working ingestion path; fix or rebuild the broken poller into a real home (out of ARCHIVE).
3. Verify the guarantee continuously (transcript + email freshness checks).
4. Reconcile triggers + assets to live; light the remaining gaps.
5. Earn the gate: only then does it move `beta → operating`.

## References

- `reference/system-building-method.md` ... the method (steps + the gated maturity ladder).
- `reference/operating-doctrine.md` ... the 12-rule constitution.
- `reference/system-anatomy.md` ... the 10-part spec format.
- Memory: `canon-ingestion-pipeline` (the broken upstream), `system-building-method-v1`.
