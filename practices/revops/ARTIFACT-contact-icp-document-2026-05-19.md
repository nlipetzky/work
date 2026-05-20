# Artifact sketch (v0) — Contact ICP Document

**Status:** v0 sketch for iteration. Owner system: `expert-liaison` (human-facing control surface). Not locked. Lock the sections + the binding contract before any workflow change.

## What it is

A plain-language document the domain expert (Ellie) reads to understand *who ends up on a contact list for a target company*, and edits to change it — directly, or via Nick from meetings/email. It is the authored human source of the contact-layer ICP/persona logic that today lives only as `personaResidual` + seniority/department/min-score consumed by the Anthropic scorer.

## Ownership boundary (landmine — hold this)

- **Contact-grain.** Defines *who at a target company*. It is NOT the canonical segment artifact, which is **account-grain** (*which companies are targets*), owned by a separate process and **never re-authored**. This document *references* the segment artifact for account context; it never absorbs or rewrites it. Keep the two layers distinct or the owned segment artifact desyncs.

## Two faces, one source (canon: human-adaptive in, engine-standardized out)

- **Human-facing**: this document. Adaptive, narrative, Ellie's. Plain language, no schema, no provider names.
- **Engine-facing projection**: deterministically derived from this doc — the `personaResidual` prose + `personaSeniority[]` + `personaDepartment[]` + `personaMinScore` the scorer already consumes at runtime.
- The translation between the two **is expert-liaison's job**, not an agent loosely re-reading the doc each run.

## The binding contract (non-negotiable — this is what makes it real, not inert)

A document Ellie edits does not influence the list. This loop does:

1. Ellie reads/edits this document (or Nick captures her input here from a meeting/email).
2. `expert-liaison` runs a **deterministic derive** → the engine projection above. Defined mapping, not interpretation.
3. The projection is **version-stamped** (e.g. `contact-icp v3 2026-05-21`).
4. Every contact the scorer judges carries that ICP version (same pattern as `Classification Version` for L2).
5. Ellie's influence is therefore **verifiable**: edit → version bumps → affected contacts re-score under the new version → a diff shows what changed and why.

Without steps 2–4 this is the inert-doc trap. The doc + enforced derive + version + provenance is the system; the doc alone is not.

## Sections Ellie actually reads and edits

1. **Who we want (plain statement)** — the ICP in her words. The narrative form of `personaResidual`. Human-owned.
2. **Must-have / disqualifying rules** — explicit include/exclude (function ownership of process dev / manufacturing / CMC; exclude legal, IT, pure M&A, etc.).
3. **Seniority & function scope** — the structured dials in plain terms (which seniority levels; which functions). Maps to `personaSeniority[]` / `personaDepartment[]`.
4. **Edge cases & judgment calls** — the nuanced rules only a domain expert makes (e.g. "CSO at <200-employee company qualifies"; "exclude VP+ at large non-CDMOs"). This is the highest-value section — it's the expert judgment the engine can't infer.
5. **Strictness** — how tight the bar is and what "borderline" means, in plain terms. Maps to `personaMinScore`.
6. **Change log** — every edit, who made it (Ellie direct / via Nick / meeting / email), date. Each entry corresponds to a version bump.

## What the engine consumes (derived, do not hand-edit downstream)

`{ personaResidual: <prose from §1+§2+§4>, personaSeniority: [§3], personaDepartment: [§3], personaMinScore: <§5> }`, version-stamped. This replaces hand-maintained Persona Rules as the *authored* source; the table/engine config becomes a *derived projection*, not a separately-edited thing.

## v1 scope (anti-sprawl)

- Author this doc from the **existing** good `personaResidual` (it already works — don't reinvent the ICP).
- Define the deterministic doc→projection mapping + the version stamp + writing the version onto scored contacts.
- Do **NOT** re-author the canonical segment artifact. Do **NOT** hand-mutate the live Persona Rules table in this step — that's the build ticket, gated and verified, not a sketch action.

## Open iteration questions

1. Does Ellie edit this doc directly, or only via Nick (meeting/email → Nick updates it)? Changes the editing UX, not the binding loop.
2. One contact ICP doc per play, scoped — confirm (consistent with "client/play is a dimension, never a table per client").
3. Where does the deterministic derive run — a step in expert-liaison, or a gate before Build Sourcing Plan? (Both are valid; pick before building.)
