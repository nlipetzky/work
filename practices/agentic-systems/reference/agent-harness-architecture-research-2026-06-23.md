# Agent harness architecture — research synthesis (2026-06-23)

Deep-research pass (6 angles, 24 sources fetched, 112 claims → top 25 adversarially
verified 3-vote, 24 confirmed / 1 killed). Primary sources: Anthropic (Building
Effective Agents, multi-agent research system, Agent SDK, context-engineering +
cookbook, memory tool), OpenAI (Practical Guide to Building Agents), Cognition/Devin,
LangChain/LangGraph. Feeds the system-building meta-system (`system-building-method.md`,
`system-anatomy.md`) and the artifact-governance engine.

## Headline

The best-engineered harnesses are NOT autonomous chat loops. They are mostly
deterministic, code-driven workflows that call an LLM as a function and reserve
open-ended agency only where a task genuinely needs flexibility at scale. This
validates our meta-system posture as the *canonical recommended* pattern, not a
lesser one.

## Confirmed findings (all high-confidence unless noted)

1. **Deterministic, code-driven control loop with the LLM as a called function is
   first-class.** Anthropic: workflows = "LLMs orchestrated through predefined code
   paths"; recommend workflows for well-defined tasks (predictability + consistency);
   agents trade latency/cost for flexibility. → validates our driver/control loop.
   (anthropic.com/research/building-effective-agents)

2. **Evaluator-optimizer is the canonical artifact loop:** one call generates, another
   evaluates against criteria and feeds back in a loop; best when criteria are clear
   and iterative refinement adds value. → our produce → review-against-standard loop.
   (building-effective-agents)

3. **Verification is ranked by robustness: rules-based first, LLM-judge second.**
   "Best feedback = clearly defined rules + which rules failed and why"; code linting
   is exemplary; LLM-as-judge is "generally not very robust" with "heavy latency
   tradeoffs." Loop = gather-context → take-action → verify-work. → run deterministic
   schema/validity/lint checks FIRST and gate; reserve LLM-judge for fuzzy quality only.
   (anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

4. **Orchestrator-worker multi-agent beats single-agent for READ/research work:** lead
   decomposes → parallel subagents, each its own isolated context window → returns a
   condensed 1-2k-token summary → lead compiles. Use isolated context per worker.
   (multi-agent-research-system; langchain context-engineering) [3-0 / 2-1]

5. **Confine WRITE actions to a single thread; multi-agent is fragile + expensive.**
   ~4x tokens (agents) to ~15x (multi-agent) vs chat; only pays off for high-value,
   read-heavy, parallelizable work. Decompose-then-merge breaks on conflicting implicit
   decisions. Share full traces, not isolated messages. Two independent vendors
   (Cognition/Devin + Anthropic) converge. → our system BUILDS artifacts (writes):
   keep artifact generation single-threaded in the driver; subagents only for parallel
   research, passing full context. (cognition.com/blog/dont-build-multi-agents,
   /multi-agents-working; multi-agent-research-system)

6. **Context is a finite, decaying resource ("context rot").** Recall drops as tokens
   rise (all models); unmanaged long runs hit a hard API stop mid-task. → never assume
   a whole build session fits one window; budget context per stage.
   (effective-context-engineering-for-ai-agents; Claude cookbook) [3-0 / 2-1]

7. **Context engineering = explicit driver stages: write, select, compress, isolate.**
   Long-horizon techniques: compaction (summarize transcript + reinit), structured
   note-taking/memory (persist outside the window, pull on demand), multi-agent
   isolation. Combining them keeps context bounded and lets sessions complete. → the
   DRIVER sequences context ops as code stages; the LLM does not self-manage context.
   (effective-context-engineering; langchain; cookbook)

8. **Three distinct, composable primitives:** compaction (lossy, whole-transcript),
   tool-result clearing (surgical — drops only tool_result payloads, keeps the
   tool_use record), memory tool (persistent client-side files across sessions). →
   canon_artifacts = our durable memory/checkpoint; clear bulky intermediate query
   outputs; compaction at stage handoffs. (cookbook; memory-tool docs)

9. **Long-running drivers need durable execution:** errors compound, restarts are
   expensive → retry logic, regular checkpoints, resume-from-failure, idempotency.
   Corroborated by Inngest, LangGraph, Azure Durable Task. → checkpoint each artifact
   stage into canon_artifacts as a governed, idempotent write; resume at the last good
   artifact. (multi-agent-research-system)

## Mapping to our build-system

- **Driver / control loop** → deterministic workflow, LLM as called function (1). Per
  build, route to an autonomous agent loop ONLY for genuinely open-ended sub-tasks (1).
- **Verification loop** → evaluator-optimizer (2); rules-based checks first and gate,
  LLM-judge only for fuzzy dimensions (3).
- **Writes** → artifact generation single-threaded; subagents only for parallel
  research, full-context (4, 5).
- **Context handling** → explicit driver stages (select/compress/isolate/write) with
  per-stage budgets (6, 7); canon_artifacts as durable memory; tool-result clearing for
  bulky outputs; compaction at handoffs (8).
- **State / checkpointing** → each artifact stage = a governed, idempotent write into
  canon_artifacts; resume from last good artifact (9). Candidate substrate: Inngest
  (already in our stack) for durable orchestration.
- **Human-confirm** → oversight step on governed promotion (placement = operator decision).

## Operator decisions (genuinely yours, flagged by the research)

A. **The per-artifact quality-standard schema.** Rules-based verification beats
   LLM-judge, but how do you author a machine-checkable standard at system-creation for
   a fuzzy artifact (a system design, an architecture doc)? Hardest unresolved piece.
B. **Where and how many human-confirm checkpoints** — every governed write, only final
   promotion, or stage boundaries. Autonomy/throughput vs safety.
C. **The routing rule** — how the meta-system decides, per build, deterministic driver
   vs autonomous agent loop. Anthropic gives the principle, not a procedure.
D. **Durable-execution substrate** — Postgres-checkpoint-as-truth (canon_artifacts)
   alone, vs a dedicated engine (Inngest / Temporal / LangGraph). You already run Inngest.

## Caveats

Core source (Building Effective Agents) is Dec 2024; context/multi-agent/SDK posts are
mid-late 2025; Cognition's pro-multi-agent update ~Jan 2026. Several "today/not yet"
hedges are current-tech limits, not laws. Three claims passed 2-1 (200K hard-stop
framing; LangChain paraphrase; decompose-then-merge fragility scoped to write/merge).
Token multipliers (4x/15x) are Anthropic-internal approximations. One claim killed
(0-3): the over-broad "multi-agent is categorically fragile" — the writes-only scoped
version survived instead.
