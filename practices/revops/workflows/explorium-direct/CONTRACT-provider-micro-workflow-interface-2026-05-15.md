# Contract: provider micro-workflow interface

**Date:** 2026-05-15
**Status:** Structure-only. No Part 2 dependency, no generation-contract dependency. Mechanical.
**Purpose:** The fixed input/output shape every waterfall provider micro-workflow conforms to, so a parent waterfall can call any provider in a capability class interchangeably and never care which one answered.

---

## The core decision: providers are pure and Airtable-unaware

A provider micro-workflow takes inputs, calls one external API, returns one envelope. It does **not** read or write Airtable. It does not know what a record is. The **parent waterfall owns every record write.**

Consequences, all intentional:
- Providers are independently testable in isolation: "what does Explorium return for company X" is one call with no record setup.
- Single write path. The parent is the only thing that mutates the surface, so the state machine's halt invariant has exactly one enforcement point per capability.
- Swapping or adding a provider never touches record-write logic.
- A buggy provider cannot corrupt the surface. The worst it can do is return a `miss` or `error`, which the parent handles.

This is the same single-source discipline applied everywhere else, expressed at the provider layer.

---

## Capability classes

The contract is one shared envelope with a per-class payload. Classes:

`domain_resolution`, `match`, `firmographics`, `deep_enrich`, `find_prospects`, `contact_enrich`, `email_validate`

A provider micro-workflow serves exactly one class. (Clay, which spans classes, is wrapped as one micro-workflow per class it serves, not one workflow for all.)

---

## Input envelope (parent → provider)

```json
{
  "capability": "match",
  "correlation_id": "opaque-string-for-logs-only",
  "provider_config_ref": "tenant-config key selecting this provider's credentials",
  "inputs": { /* class-specific, see payload schemas */ },
  "attempt": { "index": 2, "tried": ["exa", "explorium_autocomplete"] }
}
```

- `correlation_id` is opaque. The provider echoes it back for log correlation. It is **not** a base/table/record id. Providers have no Airtable awareness.
- `provider_config_ref` selects credentials from tenant config. It carries no judgment, no criteria, no Part 2.
- `attempt` is informational (logging, idempotency). The provider does not change behavior based on it.
- `inputs` is the only class-specific part. Everything else is constant across classes.

---

## Output envelope (provider → parent)

```json
{
  "status": "hit",
  "provider": "explorium",
  "correlation_id": "echoed-back",
  "confidence": 0.0,
  "data": { /* class-specific normalized payload */ },
  "raw_ref": "pointer to stored full raw response; never inlined",
  "cost": { "units": 1, "unit_type": "credit" },
  "latency_ms": 0,
  "provider_native_status": "passthrough string, parent does not interpret"
}
```

### `status` enum (fixed, the parent branches only on this)

| Value | Meaning | Parent action |
|---|---|---|
| `hit` | Usable result returned | If `confidence` ≥ tenant threshold: stop waterfall, use it. Else treat as `miss`. |
| `miss` | Provider has no data for this input | Try next provider |
| `error` | Provider call failed (5xx, timeout) | Log, try next provider |
| `rate_limited` | Provider throttled | Log, try next provider; parent may re-queue this provider later |
| `invalid_input` | The input itself is malformed/insufficient | **Stop the whole waterfall.** Do not try more providers. Parent halts the record. |

`invalid_input` is the provider-layer expression of the halt invariant: bad input is a halt, never a default-through. All-providers-`miss` is also a halt (waterfall exhausted), mapped by the parent to the live state value per `STATE-MACHINE-families-1-3-2026-05-15.md` (e.g., `needs_data_quality_review`). The provider never fabricates a result to avoid a miss.

### `confidence`
Normalized 0.0–1.0. Every provider must map its native confidence into this range. **The normalization rubric per provider is the separate confidence-scoring doc's job** (flagged open item, not authored here). This contract only mandates: the field exists, it is 0.0–1.0, and the parent compares it to the tenant-config threshold for the class.

### `raw_ref`
The full raw provider response is persisted by the parent (or a shared raw sink) and referenced by pointer. Never inlined into the envelope. This keeps envelopes small and preserves complete provenance, consistent with the keep-all-captured-data rule and the existing `Deep Enrichment Raw` field pattern.

### `cost` / `latency_ms`
Feed the pipeline quality metrics (match rate, false-match rate, fill rate, cost per matched record) from the research doc. Mandatory so metrics are computable without re-deriving.

---

## Per-class normalized `data` payloads

The parent sees the same shape regardless of provider. Output enums reuse **live Airtable option strings** where a mapping exists, so the projection into the surface needs no translation layer.

| Class | `inputs` | `data` (normalized) |
|---|---|---|
| `domain_resolution` | `{ company_name, hints?: {state, ncts, sponsor_type} }` | `{ domain, resolution_method, evidence_url }` |
| `match` | `{ company_name, domain? }` | `{ business_id, primary_domain, legal_name, country, naics, employee_range, hq_address }` |
| `firmographics` | `{ business_id }` | `{ country, naics, employee_range, primary_domain, hq_address, description }` |
| `deep_enrich` | `{ business_id, categories: [...] }` | `{ technographics?, funding?, competitive_landscape?, signals? }` (only requested categories) |
| `find_prospects` | `{ business_id, titles, seniority, departments }` | `{ candidates: [ { full_name, title, seniority, function, provider_person_id } ] }` |
| `contact_enrich` | `{ provider_person_id? , linkedin_url?, full_name?, company_domain? }` | `{ email, mobile, linkedin_url, employment_history, tenure_months }` |
| `email_validate` | `{ email }` | `{ verdict, deliverable }` where `verdict ∈ verified \| catch-all \| unverifiable \| invalid` |

`email_validate.verdict` is exactly the live `Email Verified Status` option set (`fldjV4B9bGsXwEfi9`: `verified`/`catch-all`/`unverifiable`/`invalid`). `match` country/naics/employee_range/primary_domain map directly onto existing Companies fields. No parallel vocabulary introduced.

Fields a given provider cannot supply are omitted (not nulled, not faked). The parent records partial fill; missing is a real signal, not an error.

---

## Parent waterfall obligations (the other half of the contract)

1. Iterate providers in tenant-config order for the class.
2. First `hit` with `confidence` ≥ threshold wins. Record `provider`, `confidence`, `cost`, `raw_ref`.
3. `miss`/`error`/`rate_limited` → next provider, accumulate the attempt log.
4. `invalid_input` → stop immediately, halt the record per the state machine. Do not consult more providers.
5. All providers exhausted, no qualifying hit → write the exhausted-waterfall halt state. Never fabricate.
6. The parent is the only writer to Airtable. It maps normalized `data` onto the existing fields and writes the coarse outcome + companion stamp per the state machine.
7. The parent persists every provider's `raw_ref` target so no captured data is discarded, even from providers that lost the waterfall.

---

## Out of scope of this contract (stated so it is not silently absorbed)

- The per-provider confidence normalization rubric ... separate confidence-scoring doc.
- Any criteria/Part 2 judgment ... providers are mechanical and never read criteria. Judgment is applied by the parent's verification gate, not by providers.
- The artifact → Classification Rules generation contract ... separate, under your review.
- L3 promotion semantics ... held per your instruction.

---

## Summary

One envelope, fixed `status` enum, per-class normalized payloads that reuse live Airtable vocabulary, providers pure and Airtable-unaware, parent owns all writes and all halt enforcement. Adding a provider to any waterfall is: build one micro-workflow that conforms to this envelope, add it to the tenant-config order. Nothing else changes. No Part 2, no generation contract, no L3 touched.
