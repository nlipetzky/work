# The System-Building Method (v1)

Status: v1, 2026-06-23. Owner: Boris (agentic-systems), the meta-practice. Co-owners: Nick (sets the
bar, gatekeeps, ratifies), Atlas (operator-os: the why, the trace, what each channel presents).
Supersedes the first cut at `practices/operator-os/reference/system-building-methodology-draft.md`
(its §7 schema detail still applies; read it for the run-layer DDL).

This is how we build every system, universally. It is itself a system and obeys its own lifecycle.

---

## 0. The law (the 2026-06-11 realization, generalized)

You cannot use a chat-session agent as the execution engine. It drifts, overclaims, invents numbers.
**Build the deterministic system first, like software engineers; incorporate AI as a called, verified
component, never the driver.** The field agrees from both sides: software engineering converged on
spec-first build with a review gate at every boundary (Spec-Driven Development); AI engineering
converged on eval-driven development, where verification gates promotion. Three invariants fall out:

1. **Spec before build.** The written artifact is the leverage, not the code.
2. **Deterministic spine, AI as a contracted component** ... lowest architecture rung that holds (§2).
3. **Verification is a gate, run continuously, read from live state** ... never narrated as prose.

## 1. Two lifecycles (do not conflate them)

- **System** = a durable capability that *ensures* a set of activities happen. It has a **maturity
  lifecycle** (§4): concept → live & verified → retired. Long-lived; evolves through many builds.
- **Project** = a *temporary* effort that advances a System from one maturity state to the next, then
  ends. Project management governs the build stages only. One System has many Projects over its life.

So: a concept you mention to Atlas is not yet a system. It enters as a `capture_item`. If it survives
the first gate it gets a spec and becomes a System at `emerging`; a Project builds it; the System
matures. The Project ends; the System persists. (A system *guarantees* the work; it does not
necessarily *do* it ... reliability and automation are separate dials.)

## 2. The constitution (read before any build)

- `operating-doctrine.md` ... the 12 rules every session obeys (recommend-then-ratify; docs lose to
  live state; the surface is the view, counts from a live query never prose; fix the path not the
  instance; done = a verified gate). This is the standing law.
- **The architecture ladder** (cheapest-and-most-reliable first; pick the lowest rung that holds the
  guarantee): (1) deterministic code + DB, no model ... the target for most activities; (2) one
  augmented LLM call; (3) a workflow (predefined code paths orchestrating model calls); (4) an agent
  (model directs its own loop) ... only for open-ended work. **Autonomous ≠ agentic.** Two gates before
  climbing: *is this even an AI problem?* (anything with a checkable right answer is rung 1), and
  *single before multi* (keep writes single-threaded). Detail in the draft §2a.

## 3. The build method (the steps; each produces the artifact that gates the next)

1. **Define (spec).** Write the system's spec in the anatomy format (`system-anatomy.md`): purpose
   (what it *ensures*), ladder to goal → vision, the activities it guarantees, **non-goals**, the
   in/out contract, acceptance criteria. *What, not how.* → artifact: the spec.
2. **Plan (architecture).** Per activity: the lowest rung that holds; code's role, AI's narrow
   judgment, the human's role + channel; the context contract; the trigger + routing. → artifact: the
   plan.
3. **Prove manually.** Run the activity by hand once. Automate only what earned it. → artifact: the
   manual-run evidence.
4. **Build.** Deterministic spine first; AI a called, contracted function inside it. Each task cites
   its spec clause. → artifact: the running code.
5. **Verify (the gate).** Deterministic check where checkable (a SQL count, a schema validator beats an
   LLM-eval); a binary pass/fail eval with a written reason for the judgment parts; run continuously on
   real input. **"Done" = the gate is green, read from live state.** → artifact: the verification +
   its history.
6. **Register + surface.** The system, its activities, assets, and triggers land in canon; the
   `/system` view renders the spec reconciled against live reality, gaps lit. → artifact: the live
   surface.
7. **Iterate.** Promotion up the automation spectrum is *earned* by verification history; demotion
   fires when verification fails.

## 4. The maturity ladder (the states a System occupies; gated)

Stages of work, Gates between them. At each Gate: the **entry artifact** (from §3), the **criteria**,
and a **Go / Kill / Hold / Recycle** decision. Nick is the gatekeeper; the review is a
recommend-then-ratify, not a committee. The ladder is a **funnel, not a tunnel** ... most concepts
should be *killed* cheap at the first gates. The state maps to `systems.status`.

| State (`status`) | Means | Gate to ENTER it | TRL-ish |
| --- | --- | --- | --- |
| *Concept* (no row) | mentioned to Atlas | a `capture_item` exists | 1-2 |
| `emerging` | spec exists, not built | spec written + ratified (Define) | 3 |
| `building` | the Project is running | architecture planned + proven manually | 4-6 |
| `beta` | **live, not yet verified** | validated on real data once | 7-8 |
| `operating` | **live & verified** | verification passing continuously, green on the surface | 9 |
| `paused` | held | a Hold decision | - |
| `archived` | retired | superseded or killed | - |

`beta` is the rung added 2026-06-23. It exists because its absence let "operating" be claimed on an
unverified system. A System sits at `beta` until the verify gate (§3.5) actually passes ... it cannot
be advanced to `operating` by assertion.

## 5. The gate is enforced by the surface, not by good intentions

This is the whole point, and the fix for the wandering. The discipline does not live in the
engineer's memory. It lives in the surface: a System is `operating` only when its verification is
green when read live. The `/system` view shows the maturity state, the triggers (wired vs gap), and
the asset reconciliation, all from live canon. If verification isn't passing, the surface shows `beta`
or a lit gap ... it will not let "done" be narrated. (This is the same property as `run-play.mjs`
reporting WIRED / NOT-WIRED and being unable to narrate a count.)

## 6. References

- `system-anatomy.md` ... the 10-part spec format (the design-doc template).
- `operating-doctrine.md` ... the 12-rule constitution.
- operator-os `system-building-methodology-draft.md` §2a (architecture ladder) + §7 (run-layer schema).
- Anthropic, *Building Effective Agents*; *Effective Context Engineering*; *Demystifying Evals for AI
  Agents*. Cooper, *Stage-Gate*. NASA *Technology Readiness Levels*. Microsoft/GitHub *Spec-Driven
  Development*. 12-Factor Agents; Cognition *Don't Build Multi-Agents*.
