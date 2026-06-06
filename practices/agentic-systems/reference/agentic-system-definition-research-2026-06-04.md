# How the best define an agentic system — research synthesis (2026-06-04)

Deep-research pass (Anthropic, OpenAI, LangChain primary sources + practitioner field reports;
18 sources, 88 claims, 25 adversarially verified, 20 confirmed / 5 killed). Feeds the
asset/system/constellation classifier at `system-classification.md`.

## The verified findings

1. **The unit is drawn on a control axis, not a step axis.** Tool/component = an external
   function, no standalone agency. Workflow = LLMs+tools on predefined code paths. Agent = the
   LLM-in-a-loop that directs its own process and decides when the task is done. The agent/non-agent
   line is "who controls execution," never "what are the steps."
   (Anthropic, *Building Effective Agents*; OpenAI, *A Practical Guide to Building Agents*.)

2. **A system is bounded by an outcome / emit contract, not an internal step sequence.** The
   contract = objective, output format, quality bar, task boundaries, stopping condition. Evaluation
   "can't just check if agents followed the correct steps we prescribed... judge whether agents
   achieved the right outcomes." (Anthropic, *Multi-Agent Research System*.) This directly validates
   the registry's existing rule: "registration requires a declared emit contract (Inputs, Outputs,
   Key Metrics)."

3. **The default unit is a single agent.** Add tools before adding agents. OpenAI's tests: 15+
   well-defined tools beat multi-agent networks on speed/reliability. Anthropic: "find the simplest
   solution... optimizing single LLM calls is usually enough." Bias is toward collapsing, not
   proliferating. (OpenAI; Anthropic; LangChain multi-agent docs; Claude.com multi-agent blog.)

4. **The split into a collection is governed by CONTEXT ISOLATION, not by role or work-type.** Split
   one unit into many only when context can be truly isolated. The three named triggers: context
   pollution degrades performance, subtasks run in parallel independently, specialization improves
   tool selection. Outside those, coordination cost exceeds benefit.
   (Claude.com, *Building Multi-Agent Systems*; LangChain.)

5. **Porting a human SOP/role decomposition onto agents is a NAMED anti-pattern.** Splitting by work
   type (planner / implementer / tester / reviewer) creates a "telephone game" where each handoff
   loses fidelity; in one experiment the role-split subagents "spent more tokens on coordination
   than on actual work." This is the verified backing for "don't map the human SOP."
   (Claude.com, *Building Multi-Agent Systems*.)

6. **Agentic-first design is goal-directed and dynamic, only where work is genuinely open-ended.**
   "You can't hardcode a fixed path... a linear, one-shot pipeline cannot handle these tasks."
   Conditional: predictable work is still better served by a prescribed-path workflow. Agency is not
   automatically better. (Anthropic.)

7. **A collection is composition, not a new primitive — and tier membership is RELATIONAL.** The
   same capability can be packaged as a tool, a subagent, or a standalone agent depending on how
   it's wired (LangChain's subagents / handoffs / skills / router patterns; "agents can serve as
   tools for other agents"). What tier a thing is depends on its current role, not its essence.

## What this means for the asset / system / constellation taxonomy

**Validated:**
- Bounding a SYSTEM by its emit contract (Inputs / Outputs / Key Metrics) is exactly right and
  already in the registry. Keep it; it's the load-bearing test.
- "One system : one outcome." If stating the outcome needs an "and" across unrelated outcomes, it's
  a collection. RevOps Engine (enrichment + outreach + surface + sync) = many outcomes = a
  collection, not a system. Confirmed.
- "Don't decompose like a human SOP" is a real, cited failure mode, not a preference.

**Refined:**
- The ASSET-vs-SYSTEM line is the **emit contract**, not "has standalone purpose" and not "has an
  LLM in it." A SYSTEM owns an independent outcome contract and is consumed as a unit. An ASSET is a
  component whose output only has meaning inside one system. **Agency is orthogonal:** a
  deterministic n8n workflow that independently delivers "an enriched cohort" is a SYSTEM; an LLM
  agent loop that is only a sub-step of the CRM is an ASSET. Do not tie "system" to "is agentic."
- The SYSTEM-vs-COLLECTION line gets a hard criterion: **context isolation**, never role.

**Where the literature diverges from the model (handle honestly):**
- **No leading source uses three tiers.** They use two: tools → {workflow | agent} → multi-agent
  system. Their "collection" (multi-agent system) still delivers ONE coordinated outcome.
- **CONSTELLATION is not their "multi-agent system."** A constellation (an engagement, a domain)
  groups MANY outcomes for an organizational purpose. That is a portfolio/ops construct with zero
  support in agent-architecture literature. It is legitimate, but justify it as an operations layer,
  not an architecture one. Do not cite multi-agent research to defend it.
- This implies a possible FOURTH layer: asset → system → (coordinated multi-system toward one
  outcome = the literature's "multi-agent system") → constellation (portfolio grouping). The middle
  layer is unused today; add it only when something needs it.
- **Tiers are promotable, not intrinsic.** Classify by current deployment role. A thing becomes a
  system when it gets its own contract + consumers; it's an asset while it's only a component. This
  is why "systems reclassified as assets" felt slippery — it is supposed to be.

**Do NOT lean on (killed in verification):**
- Orchestrator-worker pattern as the definition of a constellation (refuted 0-3).
- Formal typed "REST for agents" / seven-tuple contract as the system boundary (refuted 0-3 / 1-2).
  The emit-contract idea is sound in substance; the formal vocabulary is one weak preprint.

## Open questions the research leaves on the table
1. Is CONSTELLATION a fourth, organizational tier above "coordinated collection," rather than the
   same thing? (Research says: effectively yes.)
2. Where does a deterministic, non-agentic n8n workflow sit? (Resolved above: emit-contract test,
   agency orthogonal.)
3. Classify by intrinsic nature or current deployment role? (Research says: role.)

Sources: anthropic.com/research/building-effective-agents; anthropic.com/engineering/multi-agent-research-system;
openai *A Practical Guide to Building Agents*; docs.langchain.com/oss/python/langchain/multi-agent;
claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them.
