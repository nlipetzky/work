# Source-of-record: parallel-build concurrency primitive (2026-05-18)

## What happened

Four sessions were working the Teknova AAV pipeline concurrently: a currency-gate session (agentic-systems), an explorium-direct build session, a contact-sourcing ICP livetest session (workflows), and a persona-projection session (agentic-systems Phase B). Each ended cleanly and wrote a self-contained handoff. Individually correct. Nick brought the four handoffs to one session and asked for consolidation "so I don't have issues building in parallel."

The consolidation pass found the four lanes were not parallel-safe as split. They share three mutable assets:

- the criteria artifact (D had bumped it to v5; A's currency work would propose v6 — if A branched from v4 instead of v5, the provenance chain forks),
- two n8n workflows (`rXKuqfDwqX7TYzxK` L2, `2rTMeD7SB3SBNZZE` Step 9 Verify) that B built and A needed to modify — and the MCP edit path wipes credentials, so a second concurrent editor silently breaks the first,
- the Companies Airtable table, where B's smoke left 6 mixed-vintage rows and C's livetest left a different fixture residue (MeiraGTx lone-eligible, 4 reset) — two uncoordinated cleanups racing one cohort run.

None of the four sessions did anything wrong. The desync risk was structural: concurrent writers to shared state with no ownership assignment. The handoffs pinned *state* but not *write-ownership*, so two cold sessions could each correctly conclude they should edit L2.

## Why the fix is ownership, not coordination

The resolution was not "coordinate more" — it was assigning a single writer per contended asset and gating the destructive step (the cohort run) on a single reconciliation owned by one lane. Coordination across stateless sessions does not compose; ownership does. This is the same shape as the observable-surface and binding-layer primitives already in canon: reliability is a property of an enforced structure, not of sessions choosing to be careful.

The C-fix / D-contract overlap was the inverse case worth recording: two lanes converging on the same decision (C empirically rediscovered D's persona-contract invariant 4). That is not a collision — it is a convergence, and the right move is to route it to one owner (Boris) to reconcile, not to let both lanes act.

## The artifact

`practices/agentic-systems/ORCHESTRATION-teknova-parallel-build-2026-05-18.md` — the single-writer lane map a cold session in any lane reads before writing. Engagement-specific instance of the general primitive.
