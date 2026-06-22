# HANDOFF: RevOps Strategist Orchestrator (new skill)

**Date:** 2026-06-09
**From:** Boris (current session) → next session
**Where work continues:** `/Users/nplmini/code/work/practices/revops/skills/<skill-name>/`

---

## What this is

A new skill that orchestrates the existing input-production skills into a coherent strategic-layer workflow. Walks an operator through producing the complete input bundle the RevOps engine needs to run a play. Inspired by Deepline's upstream-input contract (see `/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-upstream-inputs.md`).

The skill is the strategic discipline. Not an autonomous engine. An operator (Kepler-shaped) runs it. Migrates to `/Users/nplmini/code/work/systems/play-prep-engine/` if and when it becomes autonomous; do not pre-design that.

---

## Where it lives, and why

**Path:** `/Users/nplmini/code/work/practices/revops/skills/<skill-name>/`

**Reasoning** (Boris call, 2026-06-09):
- The consumer of this orchestrator's output is the RevOps engine at `/Users/nplmini/code/work/systems/revops-engine/`. Whoever owns the consumer's input contract owns the orchestrator.
- The work crosses sales-and-gtm and revops, but the load-bearing artifacts (segment, sub-segment, ICP titles, channel, volume) are revops. ~60/40 split.
- Not `capabilities/` ... folder isn't materialized, and capabilities earn their place when a pattern is proven reusable across practices, not on first attempt.
- Not `practices/agentic-systems/` ... Boris reviews and orchestrates other practices; does not absorb their craft.
- Not `practices/sales-and-gtm/` ... the input contract belongs to the engine, and the orchestrator should live next to the contract it serves.

---

## Naming

Nick's framing: "something close to lead gen strategist or outreach strategist."

The existing skill-folder convention is verb-noun or noun-noun, lowercase-hyphenated:
- `offer-extract`
- `segment-criteria`
- `copy-draft`

A persona-flavored name like `lead-gen-strategist/` breaks that convention but is closer to how Nick is thinking about the role this skill plays.

**Candidates to choose from in the next session:**

| Name | Convention fit | Posture |
|---|---|---|
| `lead-gen-strategist` | breaks convention | persona-flavored, matches Nick's framing |
| `outreach-strategist` | breaks convention | narrower (implies the message-sending step) |
| `play-prep` | fits convention | matches existing memory ref to a play-prep agent design |
| `play-strategist` | hybrid | persona-flavored but more abstract |
| `revops-play-orchestrator` | fits convention | clear but verbose |
| `lead-gen-plan` | fits convention | output-named (the plan is the artifact) |

**Recommendation (Boris):** start with `lead-gen-strategist`. Nick named it. Convention can absorb one persona-flavored skill, and the persona framing matches how the operator will actually use it (a strategist they're consulting, not a transformer they're piping data through).

**Decide name in next session before creating folder.**

---

## What the skill needs to produce

The strategic input bundle for the RevOps engine. Use Deepline's 11-input contract as the reference taxonomy (see `deepline-upstream-inputs.md` Section 2):

| # | Input | Existing skill | Status |
|---|---|---|---|
| 1 | Offer definition | `offer-extract` | shipped |
| 2 | Segment definition | `segment-criteria` | shipped |
| 3 | Hard disqualifiers | `segment-criteria` (embedded) | shipped |
| 4 | Sub-segment tagging | `segment-criteria` (embedded) | shipped |
| 5 | Title / persona tiers | (none yet ... currently inlined in segment-criteria output) | gap |
| 6 | Sender identity + credential | (none yet) | gap |
| 7 | Proof points / cold copy constraints | `creative-brief` (queued, not built) | gap |
| 8 | Channel selection | (none yet) | gap |
| 9 | Volume target | (none yet) | gap |
| 10 | Personalization rule + hook sources | `creative-brief` (queued) | gap |
| 11 | Cold copy / sequence | `copy-draft` | shipped |

The orchestrator's job is to enforce that all 11 inputs are produced or explicitly deferred, in the right order, with the right hand-offs to Hermes (expert-liaison) and Polaris (engagement-governance) where applicable.

**Note:** Several inputs (#5, #7, #8, #9, #10) are gaps. The orchestrator surfaces these gaps as it walks the operator through; building them is downstream work, not blocking the orchestrator's first version.

---

## The skill's shape (rough)

A SKILL.md that:

1. Defines preconditions ... when this skill triggers (e.g., "operator is starting a new play for a client/venture and needs the input bundle").
2. Walks an ordered checklist: which sub-skill to invoke, in what order, with what context.
3. Enforces gates ... e.g., do not move from offer-extract → segment-criteria until the offer is locked in one sentence.
4. Surfaces gaps where no sub-skill exists yet, instead of inventing input content.
5. Produces a top-level "play brief" artifact (or play-state JSON) that points at each individual input artifact, so the RevOps engine can pick up the bundle as one address.

**What it is NOT:**
- Not a meta-skill that absorbs the sub-skills' work. The sub-skills stay where they are and the orchestrator delegates to them.
- Not a system or engine. It runs in conversation, with an operator.
- Not engagement-specific. Source-agnostic, practice-level.

---

## Open questions for the next session

1. **Final skill name.** Pick from candidates above, then create folder.
2. **Does the skill write its own artifact, or just point at the others?** Two options:
   - (a) Writes a top-level `revops-play-brief-<play-slug>.md` artifact that integrates and links each input.
   - (b) Only orchestrates; the individual artifacts (offer, segment, titles, creative-brief, copy) stand alone and the engine reads them directly.
   Recommendation: (a). The engine needs one address. The play-brief artifact IS the contract.
3. **Should it gate the operator from advancing past missing inputs?** E.g., if input #5 (titles) is required but no `icp-titles` skill exists yet, does the orchestrator block, or does it surface the gap and let the operator manually fill?
   Recommendation: surface, don't block. Manual fills are flagged as "operator-filled" in the play-brief metadata so the engine knows the input quality varies.
4. **Where does the play-brief artifact land?** Convention is `accounts/<type>/<name>/artifacts/`. Follow that.
5. **Skill registration.** Per architecture notes, skills register via symlink into `~/.claude/skills/`. Add the new skill to that registry after creation.

---

## What the practice CLAUDE.md needs

`/Users/nplmini/code/work/practices/revops/CLAUDE.md` currently has a persona-style statement but no named persona:

> "You are Nick's RevOps operator. You run plays for B2B clients: from offer design through qualified prospect lists."

Decisions to make:

- **Does revops get a named persona?** Boris flagged this as a gap in the prior turn: "a practice with active artifacts should have a persona." Kepler may already be doing double-duty across sales-and-gtm and revops. Either name a revops persona, or explicitly state Kepler covers both. Don't leave it implicit.
- **The new orchestrator skill should be registered in the practice CLAUDE.md.** Brief description, when to trigger, what artifact it produces.

---

## References

- `/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-upstream-inputs.md` ... the 11-input contract this orchestrator mirrors.
- `/Users/nplmini/code/work/practices/agentic-systems/reference/architecture-notes.md` ... skill registration, artifact path conventions, practice-design rules.
- `/Users/nplmini/code/work/practices/agentic-systems/reference/artifact-discipline.md` ... cross-practice artifact discipline canon.
- `/Users/nplmini/code/work/practices/sales-and-gtm/CLAUDE.md` ... Kepler practice. Confirm hand-off pattern from orchestrator to Kepler's copy/creative skills.
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/artifacts/revops-segment-patent-portfolio-mgmt.md` ... live example of what one input artifact looks like. Use as a reference for shape and discipline.
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/artifacts/revops-icp-titles-patent-portfolio-mgmt.md` ... live example of input #5 (titles) shape.
- Memory ref `project_play_prep_agent.md` ... prior design for a play-prep agent (thin SKILL + planner/executor subagents + sandboxed runners) at `~/.claude/plans/we-are-now-at-glimmering-eich.md`. Confirm whether this new orchestrator inherits from or supersedes that plan.

---

## What to do in the next session

1. Read this handoff.
2. Read `deepline-upstream-inputs.md` (Sections 2 and 7 are the contract).
3. Read the existing skills `offer-extract`, `segment-criteria`, `copy-draft` SKILL.md files to understand the hand-off pattern.
4. Confirm with Nick: skill name, whether it writes a play-brief artifact, gate-vs-surface posture, revops persona decision.
5. Create folder: `/Users/nplmini/code/work/practices/revops/skills/<skill-name>/`.
6. Draft SKILL.md following the existing skill conventions.
7. Update `practices/revops/CLAUDE.md` to register the new skill.
8. Symlink the new skill into `~/.claude/skills/` per the registration pattern.
9. Test against the KAI patent-portfolio play (already partially built ... orchestrator should walk from offer through inputs #1-#11 and surface the gaps cleanly).

Do not build all 11 input skills in this session. Build the orchestrator first; the gap-filling skills are downstream work.
