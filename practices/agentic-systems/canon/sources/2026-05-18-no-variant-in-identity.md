# Source-of-record: no foreseeable variant axis in the immutable identity (2026-05-18)

## What happened

Teknova's enrichment was registered as `teknova-aav-enrichment`. Nick flagged, before going further, that Teknova's enrichment will cover more than AAV eventually, and floated "we could just rename the system later."

## The reasoning

"Rename later" is precisely what the identity principle forbids being cheap: `System ID` is the immutable join key every Asset / Roadmap / Depends-On reference hangs off. A foreseeable expansion axis baked into the slug (segment here; equally region, product line, channel) guarantees a forbidden rename the moment variant two appears.

The correct model is the platform/instance pattern recursing one level: platform (RevOps Engine) → client engagement (Teknova Enrichment) → segment (AAV). A segment is a *configuration/play* of a system, not a new system. Spawning a system per segment is the legacy-spaghetti failure one level down.

The fix is not "rename later" — it is "rename now, while it is free, then never again." The registry was hours old, a handful of records, nothing joining on the slug string (links are by record ID), so the identity correction cost ~zero now and is unbounded later. Textbook nip-in-the-bud: get the immutable key right before it propagates. No segment structure was built — no second segment exists; structuring ahead of reality is the rigidity rule.

## Disposition

`teknova-aav-enrichment` → `teknova-enrichment`; AAV recorded as current/first segment in context. Manual synced same turn. Generalizes to an identity-design rule: never encode a foreseeable variant axis into an immutable key; model the variant as configuration, structured only when a real second instance exists.
