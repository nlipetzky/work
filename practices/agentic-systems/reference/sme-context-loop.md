# SME Context Loop — target architecture

**Status:** vision, 2026-06-09. First instance: Will / CIPO (`patent-portfolio-mgmt`). Generalizes across the SME-partner portfolio.

A closed loop with the expert in it. The system turns expert signal into a list, and turns list results back into sharper expert input. It pivots on one shared object: the **context collection**.

```
[A] expert signal            emails, transcripts, documents (raw SME input)
        │
        ▼
[B] autonomous synthesis     ingest A → draft / iterate the strategic documents
        │                    (authoring = Hermes craft; autonomy = meta-practice)
        ▼
[C] CONTEXT COLLECTION  ◄─────────────────┐   the hub: ICP criteria, data criteria,
        │                                 │   play, offer. first-class, linkable, surfaced.
        ▼                                 │
[D] list building            engine prep funnel consumes C → produces a list
        │                                 │
        ▼                                 │
[E] feedback return  ─────────────────────┘   results + gaps → back to Hermes →
                                              new questions / approvals to the expert → C iterates
```

## The stations

- **[A] Expert signal** — raw SME input in its natural forms. Not an artifact yet.
- **[B] Autonomous synthesis** — ingests A and drafts/iterates the strategic documents. Authoring under the expert's name is **Hermes (expert-liaison) craft**; the autonomy and orchestration are the meta-practice (Boris). Keeps the human approval gate — the expert signs off before anything is load-bearing.
- **[C] Context collection — THE HUB** — the strategic documents as a first-class, linkable, surfaced object: ICP criteria, data criteria, the play, the offer, the sourcing definition, and the run history. Hermes writes *to* it, the engine reads *from* it, the feedback loop writes *back* to it. Today this is scattered: `staging_batch_meta` (flat file-path pointers, populated only by the old pipeline) + the recipe's `inputs[]` (structured but unlinked + unsurfaced) + loose play-folder artifacts. The hub replaces the scatter with one object the batch references.
- **[D] List building** — the revops engine prep funnel. **Built and validated 2026-06-09**: recipe-driven, agent-driven driver, play-agnostic across two plays.
- **[E] Feedback return path** — list-building results (what qualified, what the data revealed, where the ICP was wrong, what's missing) flow back to Hermes, which turns them into new questions and approval asks for the expert, iterating C. This is the leg that closes the loop — and the long-flagged missing **"keep-live"** layer.

## Exists vs net-new

**Exists:** [D] the engine; the Hermes practice + methodology; operator-run strategic-doc skills (`lead-gen-strategist`, `offer-extract`, `segment-criteria`, the SME voice/credibility artifacts) that author some of [C] today, operator-driven.

**Net-new, in build order:**
1. **[C] the context-collection hub** — the keystone. Both sides bolt onto it; design it first. Smallest coherent thing that unblocks the rest. Replaces `staging_batch_meta`'s flat pointers; folds in the sourcing definition and the client/SME feedback; surfaces as a per-batch "Context" panel in projection-ui.
2. **[E] the feedback return path** — closes the loop; the keep-live leg.
3. **[B] autonomy of the synthesis** — hardest and last; authors under the expert's name, so it routes through Hermes and keeps the approval gate.

## Boundary discipline

The expert-facing legs ([B] authoring, [E] approvals) are **Hermes's craft** — Boris orchestrates and owns the engine side, but does not decide how the expert is contacted or how their input becomes an artifact. The **context collection [C] is the shared contract** both sides attach to. See `practices/expert-liaison/`.

## Sequencing note

Design [C] first (brainstorm → spec). It is adjacent to the engine roadmap's Phase 5/6/7 — in particular Phase 7 ("strategic layer that authors the input documents") is the [A]→[B]→[C] arc, and [E] is net-new. Do not spec the whole loop at once.
