# Konstellation CIPO — Context Artifact Registry

The context this venture's agents act *from*. Based on Nick's advisory-board
registry v1.0, integrated into the studio OS. This file is the index and the law
for what each artifact is, who owns it, and whether it's built.

## Source of truth: canon_engine (read this first)

The authoritative store for approved artifacts is **`canon_engine.public.canon_artifacts`**
(Supabase project `mzzjvoiwughcnmmqzbxv`). Its schema is built for exactly this:
`engagement_type`/`engagement_id` (`venture`/`konstellation-cipo`), `artifact_type`
(the slugs below), `content_md`, `version`, `status`, `approver`/`approval_channel`/
`approval_date` (governed writes = the Canon Governance Protocol, artifact #9),
`supersedes_id` (versioning), `path` (the filesystem mirror). `canon_artifact_bindings`
records which engine/agent consumes which artifact version.

- **These markdown files are the drafting surface and the `path` mirror, NOT the
  source of truth.** Author and iterate here; the DB is authoritative once promoted.
- **Promotion (file → canon_artifacts) is a governed write.** Per the canon_engine
  `_ai_context` contract, agent writes are restricted to `agent_sessions` and
  `capture_items`; writing `canon_artifacts` is outside permitted writes and
  requires Nick's explicit authorization. Only `approved` artifacts get promoted...
  a `gap` or `draft` does not.
- Net: draft in files → Nick approves → governed promote into `canon_artifacts`
  (source of truth) → engines/Vega query the DB at runtime; the file remains as mirror.

## How it maps to the OS

Three layers, three owning agents, one author per artifact (others read, never write):

| Layer | Owner agent | Lives in | Forked or shared |
|---|---|---|---|
| Canon (intent + governance) | studio canon + Nick (no Canon-agent persona yet) | `context/canon/` + inherits studio | shared base, venture extends |
| RevOps (reality) | revops practice | `context/revops/` | forked per venture |
| Creative (expression) | Vega (`capabilities/agents/creative-director/`) | `context/creative/` | forked per venture |

## The fork, resolved (hybrid)

Canon is **inherited then extended**, not duplicated:

- **Studio-level Canon (inherited by every entity):** `reference/studio-thesis.md`,
  `practices/agentic-systems/reference/` operating doctrine. CIPO does not restate these.
- **Venture-level Canon (CIPO extends):** its own Founding Thesis and Non-Goals,
  because CIPO is a genuinely different business than KAI or the studio (different
  partner, legal/IP vs agentic systems). Lives in `context/canon/`.
- **RevOps + Creative:** fully forked per venture, here in `context/`.

Flip rule: if CIPO should inherit the studio thesis wholesale instead of writing
its own, delete `context/canon/founding-thesis.md` and point it at the studio doc.

## Spine first (build these 11, let the rest accrete)

An artifact built before it's needed is a guess. These 11 are the floor for the
website. The other 22 are listed below but not filed until their absence costs
something.

Canon: founding-thesis, non-goals, tradeoff-hierarchy, faithfulness-constraints
RevOps: customer-problem-model, value-proposition-canon, mechanism-of-action,
icp-and-disqualifiers, offer-architecture-and-pricing
Creative: voice-codex, controlled-lexicon

## Full registry (33)

Status: `spine` = scaffolded now · `deferred` = indexed, file when needed · `gap` = blocked on a business answer (the CIPO offering).

CANON (`context/canon/`)
1. Founding Thesis / Worldview — spine
2. Strategic Intent — deferred
3. Operating Doctrine — deferred (inherits studio)
4. Non-Goals and Negative Space — spine
5. Tradeoff Hierarchy — spine
6. Faithfulness Constraints — spine
7. Decision Rights Map — deferred
8. Ambiguity and Escalation Protocol — deferred
9. Canon Governance Protocol — deferred

REVOPS (`context/revops/`)
10. Category Definition — deferred
11. Competitive Map and Differentiation — deferred
12. Customer Problem Model — spine
13. Worldview Gap — deferred (Creative consumes)
14. ICP and Disqualifiers — spine
15. Value Proposition Canon — spine
16. Mechanism of Action — spine
17. Outcome Definitions — deferred
18. Proof Model — deferred
19. Offer Architecture and Pricing Logic — spine
20. Engagement and Delivery Model — deferred
21. Scope Boundaries — deferred
22. Qualification Logic — deferred
23. Product / Capability Definition — deferred
24. Factual Substrate — deferred
25. Customer State and Memory Model — deferred
26. Objection Model — deferred

CREATIVE (`context/creative/`)
27. Origin Narrative — deferred
28. Strategic Narrative — deferred
29. Transformation Narrative — deferred
30. Voice Codex — spine
31. Controlled Lexicon — spine
32. Messaging Hierarchy — deferred
33. Aesthetic System — deferred

## How this feeds the website

Vega (creative director) reads this whole registry as truth, then directs the build
via `website-conversion-design` → output is the site in `~/code/konstellation-cipo-site/`.
`context/website-spec.md` is the build target, downstream of these artifacts.
Customer-facing outputs (copy, pages) are generated FROM these artifacts and are not
themselves artifacts.

## The one thing blocking content
The CIPO offering is not yet defined with Will. Every `gap`-marked artifact waits on
that business answer. Architecture is done; the offering is yours + Will's (via Hermes).
