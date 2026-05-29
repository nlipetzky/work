# HANDOFF: KAI Cluster Enumeration

**Date:** 2026-05-27
**From:** prior session (catalog architecture rewrite)
**To:** Boris (agentic-systems practice)
**Status:** blocked on a vocabulary collision; needs decision before enumeration is possible

## What you're picking up

The Konstellation Catalog was just rewritten into its locked five-layer form (Assets → Systems → Clusters → Constellations, with Trajectory as the per-client overlay). Two docs were updated in place:

- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/DESIGN-offer-framework-2026-05-22.md`
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/HANDOFF-konstellation-offer-framework-alignment-2026-05-22.md`

Both have a **REVISED 2026-05-27** banner at top. Read `reference/catalog.md` for the canonical layer definitions before touching anything.

Your task: **enumerate Cluster contents at the System level.** Right now Cluster compositions in the docs are shorthand at Constellation level ("Signal + Compass + Voice + Pulse + Canon"). Buyers don't buy Constellations; they buy Clusters made of Systems. We need the actual System list per Cluster.

## Why it's blocked

There's a vocabulary collision between the Airtable registry and the Catalog. They're using "System" for two different things:

- **Registry System** (Airtable base `apppQjlZiktpbO4aX`) = a living operating unit. 7 of them today: GTM Engine, Engagement Governance, Konstellation AI, RevOps Engine, Canon, Expert Liaison, Teknova Enrichment. Mix of internal platforms and client instances.
- **Catalog System** = the buyer-facing SKU. The smallest thing a KAI client can buy. Example shape: "AI SDR that knows your offer and books meetings."

The Catalog System layer (the SKU layer) **has never been instantiated**. There is no canonical list of buyer-facing Systems. Without that list, any Cluster enumeration is fabrication.

This is flagged as a Known gap in DESIGN-offer-framework §1.3.

## What needs to happen

Three sequenced steps, in order:

1. **Define the canonical Catalog System SKUs.** Likely 8–15 of them. Each one is a coherent bundle of Assets sold as a unit. Naming convention TBD; should be buyer-legible (action + outcome, not infrastructure jargon). Will needs to be in this conversation since these are the things he quotes.
2. **Reconcile the vocabulary.** Either rename Registry "Systems" to something else (Platforms? Operating Units?), or rename Catalog "Systems" to something else. Don't leave the collision in place. The catalog locked the word "System" for the SKU; the registry predates the lock.
3. **Map Catalog Systems into Clusters.** Two Clusters exist as named buyer bundles today: RevOps Cluster and Customer Expansion Cluster (per existing materials; verify in the design doc). Each Cluster should resolve to an explicit list of Catalog Systems.

## Inputs you'll need

- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/reference/catalog.md` ... canonical five-layer model, read bottom-up
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/reference/locked-decisions.md` ... five locked decisions from the alignment arc; do not re-litigate
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/reference/narrative.md` ... voice rules and astronomical metaphor frame
- `/Users/nplmini/code/work/accounts/ventures/konstellation-ai/DESIGN-offer-framework-2026-05-22.md` ... §1.3 has the gap note, §1.4 has Asset definition
- Airtable base `apppQjlZiktpbO4aX`, Systems table ... the existing 7 Registry Systems for grounding
- NotebookLM `KAI Offers` (id `9597dc22-56db-4291-a59e-4363b700e3f6`) ... transcripts with Will, prospect context, original design doc; query when reference docs come up short

## Constraints

- Pricing stays out. Will commits numbers, not us.
- No new Constellations. The eight are locked.
- Voice rules apply if any of this becomes buyer-facing copy.
- Hold this loosely. The SKU layer is genuinely undecided; do not write the enumeration as final until Will signs off.

## Suggested first move

Before drafting SKUs, walk the existing client work (Teknova, the AI SDR build, the Survey deliverable shape) and ask: "what's the smallest coherent unit a buyer would pay for here?" The answer set is probably 60% of the eventual Catalog System list. Then pressure-test against Will's commercial conversations before locking names.

Could pair productively with the GTM Survey explainer doc still owed to Shawn ... defining the SKUs and explaining the Survey are two sides of the same problem.
