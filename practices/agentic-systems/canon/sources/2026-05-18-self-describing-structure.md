# Source-of-record: self-describing structure (2026-05-18)

## What happened

We moved the workflow inventory from a markdown file (`REGISTRY.md`) into a structured Airtable base (the System Registry) and froze the markdown as a tombstone. Nick flagged this as a felt regression: it looked like a swing back to the "structured-data SaaS schema" mindset he had deliberately moved away from when we first established the local folder/context architecture. His exact test: "If I pointed a fresh AI folder without any context at this AirTable base, it would crawl it and try to determine what it is and how to use it."

He was right, and the diagnosis sharpened the binding principle already in canon.

## The reasoning

The regression was not the base. Structured data is the correct form for state you need to view, query, join, and reconcile against reality. The regression would have been moving the structure and *leaving its operating context behind* — which is exactly what the first cut did. The base had a clean schema and zero embedded intent.

Two failure modes, named explicitly:

- **SaaS trap:** structure with no embedded intent. A cold agent reverse-engineers a plausible, generic operating model from field names and is confidently wrong.
- **Inert-doc trap:** intent with no structure. An unbound narrative nobody is forced to read drifts into fiction. (This is *why* `REGISTRY.md` was frozen — the failure was lack of binding, not the format.)

These are the same two traps the existing binding-layer canon entries circle (context is inert without enforcement; cold sessions are blind unless the substrate pins truth). The refinement: the resolution is not "pick structure or context." It is **self-describing structure** — the structured surface must carry, *at the point of access*, the context that explains it, and that context must be pinned to the structure bidirectionally so neither can drift unnoticed. Structure and context are not opposed; the error is letting either impersonate the whole system.

## What was built to honor it

- An in-base `Operating Model` table, described as READ-FIRST, with rows covering what the base is, the two traps, the three principles, what `Reconciled = false` means, how to use it, hard rules, and bidirectional pointers.
- Intent embedded at the point of access: table descriptions and key-field descriptions on Systems/Assets/Roadmap carry the operating model inline, not just the type.
- A bound markdown operating manual (`practices/agentic-systems/system-registry-operating-manual.md`) that points at the base and is pointed at by the base, with a same-turn sync rule.

The folder/context architecture was not abandoned. It was promoted: it had been *the registry*; it became *the operating manual for the registry*, in its correct relationship to structured state instead of impersonating it.
