---
constellation: Canon
slug: canon
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recJW8tnOeVQc2QSe
binding: bidirectional — this file is the authority on what Canon is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-04
---

# Canon — Constellation

Definitive artifact for the Canon constellation. If anything else disagrees with this file about what
Canon is, this file wins. Constellation #1 of the eight (catalog:
`accounts/ventures/konstellation-ai/reference/catalog.md`).

## What Canon is

Canon is the business's memory and current awareness. Every email, meeting, decision, artifact, and
agent session the business produces or receives is captured, structured, and made retrievable, so
that any agent or any human, at the moment of acting, pulls the true current state of the business
instead of a stale document or someone's recollection.

In an AI-run company this is foundational, not a convenience. An agent is only as good as the context
it can reach. Without Canon, every agent starts blind, every operator re-derives what was already
known, and the business leaks what it learned at every handoff: session to session, person to person,
agent to agent. Canon is the floor the other seven constellations stand on. Compass can only decide
well on what Canon knows; Voice can only speak truthfully from it; Signal's findings are worthless if
the business can't remember them.

The capability is not storage. Storage is trivial and every business has it. Canon is two hard things:
keeping the knowledge **true** as reality changes (a dead deal, a reversed decision, a superseded
plan), and making it **retrievable as context** exactly where and when it is needed. A pile of
documents nobody can find, or a database full of last quarter's truth, is not Canon. Canon is
knowledge that stays current and arrives in context.

Boundary: Canon holds and serves what the business knows. It does not decide what to do with that
knowledge (Compass), act on it (Voice), or hunt for what the business does not yet know (Signal). It
is the floor they build on.

## What good looks like

We know Canon is delivering value when:
- Any agent, on any task, pulls the relevant prior context without a human re-explaining it.
- A decision from months ago is findable with its rationale, and you can see what has since
  superseded it.
- When reality changes, the corpus reflects it fast, and no agent or human acts on the stale version.
- A freshly spun agent or a new operator is productive on a task immediately, because the context is
  there, not in someone's head.
- A human and an agent asking the same question get the same true answer.

You feel Canon's absence when people keep re-explaining context to agents, when two parts of the
business act on contradictory versions of the truth, or when a decision gets remade because nobody
could find that it was already made.

## Systems (operational — live status in the base)

Canon decomposes into three systems sharing one substrate: the corpus in Supabase
`mzzjvoiwughcnmmqzbxv` (email_threads, transcripts, canon_docs, chunks, agent_sessions,
canon_artifacts) and one operating logic (raw signal → structured, current, retrievable knowledge).

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| Canon Ingestion | Supporting | Have | nothing is lost; every source lands |
| Canon Context Service | Core | Partial | context arrives where it's needed; same answer for human and agent |
| Canon Currency | Core | Missing | the corpus stays true; nobody acts on stale truth |

Live coverage, emit contracts, and gap tracking live on the System rows in the registry. **Headline
gap: Canon Currency (Missing, Core)** — the difference between "knew" (an archive) and "knows" (a
live, true picture). It is the priority build.

## Dependencies

- **Everything depends on Canon.** Canon comes before the systems that consume it in any Trajectory
  (catalog: "Canon before Voice").
- **Canon depends on** its sources only: Gmail, Drive, the filesystem, Claude Code agent sessions, and
  the studio doctrine log (see Decisions). No upstream constellation.
- **Consumers:** `crm` (CRM + Motions) reads `canon-context-service`; Compass, Voice, expert-liaison,
  RevOps/GTM systems, and operator-os all draw Canon context.

## Authority & deeper docs

- Assessment / current state: `reference/canon-engine-assessment-2026-05-26.md`
- Pending operating manual: `practices/operator-os/reference/canon-system.md`
- Canon as artifact source-of-truth: `reference/canon-as-artifact-source-of-truth.md` (Currency)
- `canon_artifacts` schema: `reference/migrations/2026-05-26-canon-artifacts.sql` (Currency, built / 0 rows)

## Decisions & residual

1. **The two Canons — RESOLVED (2026-06-04): the doctrine log is a source.**
   `practices/agentic-systems/canon/` (canon-log.md + sources) is the studio's doctrine, and Canon
   should know it. It is an input to Canon Ingestion (capture the doctrine into the corpus so the
   business knows its own principles). Wiring it into `canon_docs` is a roadmap item, not yet built.
2. **Old registry row — DONE (2026-06-04).** The pre-decomposition `Canon` System row was deleted;
   its six assets were reassigned (ingestion + Supabase → Canon Ingestion; Voyage embedding → Context
   Service; legacy AOS Inngest → RevOps) and CRM+Motions' dependency rewired to `canon-context-service`.
