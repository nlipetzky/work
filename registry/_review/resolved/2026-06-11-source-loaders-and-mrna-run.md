---
type: asset-update
system: signal-prospecting
lifecycle: engineering
evidence: registry/signal/signal-prospecting/system.md (Source loaders asset + Load node)
also:
  - systems/revops-engine/loader/load-apollo-to-staging.mjs
  - systems/revops-engine/loader/load-explorium-to-staging.mjs
proposed: "Confirm the two provider-direct staging loaders as the Load node's reusable implementation; accept the measured mRNA keep-rate (~22%) as the signal that the NA mRNA universe is small."
created: 2026-06-11
---

## What changed this session (sourcing half)

Per operating-doctrine rule 12 (work the registered flow; a missing implementation is a declared gap
to build + register, not a scratch script), the Load node's Apollo/Explorium coverage was a gap —
sourcing had been MCP + hand-assembled CSV. Built two **provider-direct engine loaders**, both
following `load-companies-csv-to-staging.mjs` conventions (play-folder-bound, `staging_batch_meta`,
`--source PROVIDER` stamped, **full faithful capture** of every field with nested fields
JSON-stringified, canonical screener columns guaranteed, `--dedupe-against` by domain):

- **`load-apollo-to-staging.mjs`** — search (`/mixed_companies/search`) + `/organizations/bulk_enrich`
  via `APOLLO_API_KEY`. **VERIFIED:** pulled 140 for batch `mrna_2026_06_11`.
- **`load-explorium-to-staging.mjs`** — `POST /v1/businesses` (mode full) via `EXPLORIUM_API_KEY`,
  with a `--naics` industry filter and a **pre-flight `/v1/credits` check** (fails fast and clearly
  instead of an opaque mid-pull 403). Path-proven on probes; unrun in production because the
  Konstellation Explorium account is credit-depleted (~8 of 12,500 remaining).

Both add the NAICS industry filter the asset note had flagged as required, and the `--source`
provider-naming fix.

## The mRNA production batch (measured)

`mrna_2026_06_11`: 149-company NA mRNA net (NAICS-tightened) → **140 enriched + staged** (48 cols,
full coverage: 140/140 domain, description, headcount), deduped vs the pilot. Screened:
**31 IN / 16 NEEDS_REVIEW / 93 OUT** — keep-rate **~22%**. flags-v0 applied: 117 clear / 15 open /
8 informational; 8 large-players flagged. Real targets surfaced (Maravai, Resilience, Genevant, Exelead).

**Signal for the roadmap:** the NAICS-tightened Apollo net is only ~149, so ~31 qualified is close to
the whole net — the NA mRNA *developer* universe is genuinely small. Reaching ~100 qualified needs a
broader net (looser NAICS) and/or the Explorium net (426, once that account is funded), deduped.

## What approval means

Confirm the two loaders as the Load node's reusable implementation (status operating), and accept the
keep-rate finding as input to whether the mRNA target stays 100 or is reset to the real universe size.
