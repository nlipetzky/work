# Artifact discipline (cross-practice canon)

Single source of truth for how every practice handles artifacts. Every practice CLAUDE.md points here. If you are operating in any practice folder, read this first.

## The core insight (load this)

**Artifacts are temporal containers of knowledge that grow through exposure to reality. They are not static documents.**

A goal-aware agentic system creates and updates containers so it gets better at its purpose over time. The artifact taxonomy is not fixed up front. It evolves as reality reveals what needs to exist.

This is the alignment loop:

```
Goal & purpose (defined by practice + engagement)
    ↓
Exposure to reality (transcripts, results, signals, conversations)
    ↓
Containers updated or proposed (artifacts written / iterated)
    ↓
Patterns recognized over time (AI gets sharper)
    ↓
AI names its own gaps (what context would have helped)
    ↓
Humans + systems build what's missing
    ↓
Loop continues; system improves itself
```

Without this loop, the practice produces static documents and stalls. With it, the practice becomes self-improving.

## Three obligations of every operator in every practice

**1. Produce artifacts as the unit of work.** Not chat-message summaries. Not "here's my recommendation." A discrete piece of judgment lands in a named, versioned file with an owner. If you finished a session and produced no artifact, you produced no compounding output.

**2. Collect Learnings from real exposure.** Every real engagement (call, run, conversation, result) produces Learnings. Each Learning is one of three types ... see below. Learnings are the feedback that grows the artifact taxonomy.

**3. Name your own context gaps.** When the work was harder than it should have been because you lacked context, say so explicitly. "I would have done better with an artifact for X." This is a roadmap signal, not a complaint. It tells the system what to build next so the AI is smarter next round.

## The three Learning types

| Type | What it is | What it triggers |
|---|---|---|
| **Update existing artifact** | Generalizable insight that edits a container already in use | Approval → artifact version increments |
| **Propose new artifact** | Recurring pattern with no container yet | Approval → new artifact type added to taxonomy |
| **Context gap** | AI naming what it lacked at extraction/decision time | Roadmap signal → what to build next |

Approval on a Learning is what makes it real. Same gate as artifacts ... see expert-liaison methodology for the loop.

## The example that carries the methodology

A Kepler session (sales-and-gtm) extracted Learnings from a Vanco prospect call. Three Learnings landed:

- *(Update existing)* "Buyers in K-12 payments under-emphasize integration speed when pitched. Tighten the Pitch Sheet section 3."
- *(Propose new)* "Buyer used an intermediary to protect a personal relationship. Recurring pattern. Propose a `Buyer Intermediary` Decision Profile reference."
- *(Context gap)* "I had no Market Profile for K-12 payment processors when extracting. If one existed, I would have caught the funnel-leak pattern and connected it to similar prospects."

The first updates an existing artifact. The second proposes a new artifact type. The third names what the AI itself would have benefited from. All three are valuable; all three feed back into the artifact taxonomy.

## What this means in practice

- **Every practice declares its artifact taxonomy.** What kinds of containers it produces. What each one is for. Who approves them. (See your practice's CLAUDE.md for current taxonomy.)
- **Every practice collects Learnings.** The shape may vary (an Airtable Learnings table, a markdown log, eventually a `canon_learnings` row), but the obligation is constant.
- **Every practice expects the taxonomy to grow.** New artifact types are proposed by experts AND by the AI itself. A static taxonomy is a sign the practice stopped learning.
- **The AI is part of the loop, not just an executor.** When you spot a gap, name it. When you find a pattern, propose a container for it.

## Storage and lifecycle (current state)

- **For now (v0):** Learnings can live in engagement-specific surfaces (per-venture Airtable tables, per-client docs, dated markdown files in `<engagement>/artifacts/`). The shape is per-engagement.
- **Where this is going:** Canon (`canon_engine` Supabase project, registered as System `recggwUTDke8Y7UMe`) will hold the unified `canon_learnings` table alongside `canon_artifacts`. Cross-engagement pattern recognition becomes possible at that point. See `canon-as-artifact-source-of-truth.md` for the v0 design.
- **Approval mechanism:** see `practices/expert-liaison/reference/methodology.md`. Hermes runs the loop. Every Learning routes through the same expert-approval gate as an artifact update.

## What this is NOT

- Not a justification for proposing artifacts speculatively. The trigger is real exposure to reality, not "wouldn't it be nice if we had X."
- Not a way to dodge work. Naming a context gap doesn't excuse producing the best artifact you can with what you have.
- Not optional discipline. The agentic loop requires this. Without it, the practice is producing chat output, not building organizational intelligence.

## Required pointer in every practice CLAUDE.md

Every practice CLAUDE.md should contain a section pointing at this doc with the three obligations summarized. This propagates the discipline without duplicating content. Drift risk lives here; updates here cascade to every practice.
