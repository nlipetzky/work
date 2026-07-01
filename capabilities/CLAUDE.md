# capabilities/

Shared building blocks usable by more than one system. NOT business logic, NOT runtime ownership, NOT semantic policy. Capabilities are infrastructure or doctrine that systems compose; they don't own anything that runs.

## The promotion rubric

Move something into `capabilities/` only if it answers yes to all four:

1. Used by 2+ systems?
2. Stable upstream contract (interface won't churn per-consumer)?
3. No system-specific assumptions baked in?
4. Placement test ... if every system rebuilt this, would it duplicate?

If any answer is no, leave it in the system that needs it. Premature promotion is the failure mode.

## Good candidates

- Shared schema primitives, event envelopes, identity fragments.
- Shared client/transport substrate (e.g. the Inngest client; a base Supabase client; common auth helpers).
- Shared AI skill patterns that are not system-specific.
- Studio-wide doctrine, conventions, operator standards.
- Shared observability hooks.

## Bad candidates (these go inside their owning system)

- RevOps scoring logic. Lives in `systems/revops-engine/`.
- Canon asset ingestion rules. Lives in `systems/canon-engine/`.
- Projection panel view models. Live in `systems/projection-ui/`.
- A catch-all "shared adapters" folder ... that becomes the real app and the rubric is gone.

## Current inventory

- `inngest/` ... shared Inngest client + serving contract. Used by projection-ui (endpoint) and every system that defines functions or sends events. Live.
- `doctrine/` ... studio-wide doctrine and operator conventions. To be populated as patterns crystallize.
- `schemas/` ... shared JSON-Schema primitives and event envelopes. To be populated as system schemas converge on shared fragments.
- `agents/` ... reusable agent personas / system prompts that are not system-specific. To be populated; most agents start as folder-personas under `practices/` and only promote here when ≥2 systems reuse them.
- `skills/` ... shared SKILL.md packages reusable across systems. To be populated; most skills live in their owning system's `skills/` folder first.
- `supabase-observability/` ... shared Supabase observability hooks/clients. To be populated; the candidate is the common readiness checks + audit hooks both canon-engine and revops-engine want.

## Adding to capabilities/

Don't pre-create empty folders to "look professional." Add the folder when the second system needs the thing. The empty-folder pattern surfaces as a "no purpose paragraph" gap in the auto-generated `INDEX.md` ... which is a signal, not a goal.
