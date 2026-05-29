# HANDOFF — Catalog System SKU enumeration

**To:** Boris (agentic-systems / OS)
**From:** Polaris (engagement-governance)
**Date:** 2026-05-27
**Status:** Gap surfaced; blocks engagement-governance routine from running at System granularity

## The gap

The Konstellation Catalog model (see `accounts/ventures/konstellation-ai/DESIGN-offer-framework-2026-05-22.md`) defines five layers: Assets → Systems → Clusters → Constellations → Trajectory. The framework itself names this gap on 2026-05-27:

> Canonical, buyer-facing System SKUs are not yet enumerated. The studio's System Registry (Airtable base `apppQjlZiktpbO4aX`) tracks operating Systems (platforms + client instances like RevOps Engine, Expert Liaison, Teknova Enrichment), not Catalog Systems (buyer-facing SKUs). The SKU layer needs to be defined before Cluster compositions can be expressed at System granularity. Until then, Cluster composition is rendered at the Constellation level.

## Why this matters for engagement-governance

The per-client Trajectory is supposed to sequence Systems over time. Without a canonical buyer-facing System SKU layer:

- Trajectories cannot say "client X bought Systems A, B, C." They can only describe what was delivered at the Asset level.
- Clusters cannot be composed at System granularity. The framework currently renders Cluster composition at the Constellation level as a fallback.
- The portfolio surface that engagement-governance reads weekly degrades from "which Systems are installed at which clients" to "which Assets shipped to which clients" ... a noisier, less navigable view.

The weekly routine can still run hand-rolled at the Asset and Constellation level. But it does not reach its designed clarity until the System SKU layer exists.

## What needs to happen

Nick + Will (Will sells from these SKUs, so he has to own the buyer-facing names) enumerate the v0.1 SKU list. Each entry names:

- The SKU (System name as a buyer recognizes it)
- The Assets it bundles
- The Constellation it sits within
- The Cluster(s) it appears in
- Indicative pricing (or "TBD")

This becomes a new table in the System Registry base `apppQjlZiktpbO4aX`, distinct from the existing operating-Systems table.

## What is not blocked

- The engagement-governance weekly routine itself (works hand-rolled).
- Closeout Trajectory drafting for Teknova (no buyer-facing SKU needed; describing what was built is sufficient).
- KAI dogfood Trajectory drafting (Will is both sponsor and expert; can describe the work without a public SKU layer).

## What is blocked

- Rendering Trajectories at System granularity for any future engagement that originates from a Konstellation Survey.
- Will's ability to quote a System by name rather than describing the work bottom-up.
- Any Catalog visualization that wants to show "what we sell" as a single coherent surface.

## Suggested next move

Boris schedules a working session between Nick and Will to produce v0.1 of the System SKU list. Not exhaustive ... the first 5-10 named Systems is enough to unblock everything downstream.
