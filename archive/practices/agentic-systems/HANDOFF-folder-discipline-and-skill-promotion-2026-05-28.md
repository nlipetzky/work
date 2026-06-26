# HANDOFF: Folder Discipline and Skill Promotion Pattern

**Date:** 2026-05-28
**Persona:** Boris (agentic-systems)
**Purpose:** Capture two operating rules Nick worked through this session, and log the first skill produced under the second rule.

---

## What this session was about

Nick brought the KAI internal lead-gen handoff (`accounts/ventures/konstellation-ai/HANDOFF-kai-internal-lead-gen-play-2026-05-27.md`) before starting a fresh Kepler session. The conversation went two layers up: (1) where to launch Claude day-to-day, and (2) where to build reusable systems while doing engagement work.

The KAI handoff itself was reviewed and judged solid. Notes for sharpening are in this doc's "KAI handoff notes" section below; they were not edited into the KAI handoff during this session.

---

## Rule 1: Folder rule (where to launch Claude Code)

**Launch from where the artifacts you're producing live.**

| Work | Launch folder | Operator |
|---|---|---|
| Producing artifacts for a venture (KAI play, copy, Clay output) | `accounts/ventures/<venture>/` | Kepler (or relevant) |
| Producing artifacts for a client engagement | `accounts/clients/<client>/` | Kepler / revops / etc. |
| Editing a practice's own files (SKILL.md, methodology docs, persona) | `practices/<practice>/` | Boris (meta) or the practice's persona |
| Editing the OS itself, reviewing cross-practice work, architecture | `practices/agentic-systems/` | Boris |

Practice CLAUDE.md auto-loads through operator invocation, not through shell location. So location is about ownership of the output, not about activating the right operator.

The common confusion: starting in a practice folder to "use Kepler" and ending up creating engagement artifacts there. Don't. Launch in the engagement folder, invoke the operator on entry.

---

## Rule 2: Bespoke first, system second (the promotion pattern)

When the engagement reveals a need for system-level infrastructure (skills, schemas, workflow templates, database designs), do not try to build the platform in the same session you're doing engagement work. Two modes:

- **Kepler mode (or other engagement operator):** producing bespoke artifacts in the engagement folder. Scrappy, specific, real context.
- **Boris mode:** codifying a pattern into something reusable, in `practices/` or `capabilities/`.

Switch sessions when you switch modes.

### Promotion rule

Don't generalize on the first occurrence. Use it. Notice it. **On the second occurrence of the same shape**, that's the signal to promote it to the practice or capabilities layer.

Premature generalization is what produced the "2 days of methodology before a single prospect" failure already named in the KAI handoff's watch-outs.

### Where reusables live

- **Skills tied to a vendor tool** (Clay, n8n, HeyReach, etc.) ... user-global: `~/.claude/skills/<skill-name>/`. Matches the existing `clay-com` skill pattern. These cross practice boundaries.
- **Skills tied to a practice's craft** (sme-intake-interview, segment-criteria) ... practice-local: `~/code/work/practices/<practice>/skills/`.
- **Cross-practice methodologies** (sme-extraction-methodology, artifact-discipline) ... `~/code/work/practices/agentic-systems/reference/`.
- **Schemas + database designs** ... registered as Systems in the registry; design docs in the owning practice's `reference/`.
- **Workflow templates (Clay blueprints, n8n flows)** ... bespoke instance lives in the engagement; generalized template promoted to `practices/<practice>/reference/` only after second instance.

### The mechanic

While doing engagement work, when you feel the urge to "build the system":
1. Finish the bespoke artifact first.
2. Write a one-line note in the artifact: "this shape might generalize — see also <X>."
3. Move on.
4. Later, in a separate Boris session in `practices/`, scan engagement folders for those notes. Promote what's earned promotion.

Learnings discipline (from `practices/agentic-systems/reference/artifact-discipline.md`) is the existing carrier for these notes. Reinforce it; don't invent a new mechanism.

---

## First skill produced under Rule 2 this session

**Skill:** `clay-sculptor-prompting`
**Path:** `~/.claude/skills/clay-sculptor-prompting/SKILL.md` (user-global; outside the work repo, NOT pushed by this commit)
**Purpose:** Generate paste-ready prompts for Clay.com's Sculptor AI assistant.
**Trigger:** "give me a Sculptor prompt," "build a Clay workbook for X," "scaffold this Clay table with Sculptor," etc.
**Output:** structured ... `## Sculptor prompt` section (dense ≤80-word paragraph) + `## After paste` checklist.
**Boundary:** does NOT handle Clay column setup, HTTP API columns, webhooks, Send Table Data. That stays with `clay-com`.
**Placement reasoning:** sibling to existing `clay-com` skill at user-global. Clay craft isn't sales-and-gtm-exclusive. Skill triggering is description-based, not folder-based, so any operator in any folder can trigger it.

Test loop: use it on real Clay work, refine the skill from reply data (same loop as any artifact).

---

## Open: codify these rules into canon

Rule 1 and Rule 2 currently live only in this handoff. Candidates for promotion to permanent canon:

- `practices/agentic-systems/reference/artifact-discipline.md` ... probably the right home for Rule 2 (promotion pattern). It already covers Learnings discipline.
- A new short reference at `practices/agentic-systems/reference/folder-rule.md` ... for Rule 1, if Boris-as-orchestrator decides it deserves its own page.

Defer to a dedicated Boris session. Do not let the next session expand scope mid-task to write canon docs.

---

## KAI handoff notes (sharpening, not blocking)

Read alongside `accounts/ventures/konstellation-ai/HANDOFF-kai-internal-lead-gen-play-2026-05-27.md`. The KAI handoff is solid; these are tightenings, not corrections.

1. **Recommended next move is two options (A or B).** That means the next Kepler session opens with deliberation, not work. Either pick (lock "Option A: draft copy") or make the pick the first 30-second task. Don't leave the fork open.
2. **Sub-segment open question.** Defaulting to "run flat" is fine. Stop calling it open; call it the default.
3. **Approvals in parallel vs synchronous.** The handoff says approvals run in parallel with launch (line 80). Verify which of the five approval asks actually gate copy going live (FDA phrasing, "90 days" claim). Those are synchronous, not parallel. Mark them.
4. **Hermes is notional.** Reinforce ... cold copy approval = Nick emails Will manually. Don't let Kepler invent a routing layer.

---

## State at end of session

- New skill written and live at user-global: `~/.claude/skills/clay-sculptor-prompting/SKILL.md`
- This handoff written.
- Bulk uncommitted state in `~/code/work/` from prior sessions being committed and pushed with this session's output (single commit, end-of-day catch-up).
- No changes to the KAI handoff itself this session.

## Pickup pointer for next session

If next session is KAI lead gen: launch from `~/code/work/accounts/ventures/konstellation-ai/`, invoke Kepler, read `HANDOFF-kai-internal-lead-gen-play-2026-05-27.md`. Pick Option A or B on entry.

If next session is more Boris work: consider promoting Rule 1 and Rule 2 from this handoff into permanent canon under `practices/agentic-systems/reference/`.
