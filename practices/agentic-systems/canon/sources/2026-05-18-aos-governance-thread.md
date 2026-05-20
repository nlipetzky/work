# Source context — 2026-05-18 AOS / governance / canon thread

Deep-dive backing for the 2026-05-18 canon-log entries. The log holds the terse index; this holds the *why* — the lived reasoning a future session needs before acting on those primitives. Written same-day, same session, as the source-of-record. Not a transcript; the distilled narrative + the decisions and the reasons behind them.

## The arc (how these primitives were paid for)

The session began as Teknova AAV / RevOps execution and became, by its end, the AOS thesis crystallizing. The sequence mattered — each primitive was extracted from a concrete failure, not theorized:

1. **The session opened mis-framed.** The handoff pushed client-meeting choreography; Nick corrected hard: Boris builds the reliable system, does not co-manage the client. First lesson that the *system*, not the engagement, is the object.
2. **The trust collapse.** Nick opened Airtable and couldn't tell what was real — 620 rows where he expected 35, two `Play` values, contradictory status fields. Diagnosis: the system had no trustworthy surface; agent narration ≠ observable truth. This produced the observable-surface-is-truth primitive. It recurred all session (the Pfizer false positive; raw-B vs prose; "deployed" vs "run").
3. **The R5 episode.** The L2 classifier confirmed companies on disease-name match without verifying the cited trial was an AAV product. Pfizer/Ultragenyx were "confirmed" on non-AAV trials. The fix (R5: interventional + canonical condition + therapeutic gene-transfer intervention) was correct, but the deeper lesson was the verify-don't-infer discipline and that the *cited evidence* must be checked against source by hand before trusting the machine.
4. **The Pfizer reframe — the load-bearing correction.** Explorium-Direct, building Verify, found the oracle contradicted itself: Pfizer can't be both Not-confirmed (oracle) and Confirmed (R5 + real data). Resolution: R5 is modality-only; Pfizer IS an AAV company; it's excluded by *size/ICP*, a different gate. This split modality from fit and exposed that the manual oracle had conflated them. It also showed the discipline working: stop and escalate a spec/oracle contradiction rather than build through it.
5. **The mystery rows.** 510 of 631 Companies rows had no provenance. Investigation proved they were a Supabase import (the `Supabase ID` UUIDs resolved in revops-engine-dev). Nick deleted them; the set became 121 (CT.gov + Ellie). Lesson seed: provenance is observability; unlabeled data is untrusted data.
6. **The build-spaghetti rupture.** Nick saw an orphaned smoke-variant workflow in n8n and named the real problem: agentic build generates artifacts faster than ad hoc tracking; no asset lifecycle, no system of record; he has to micromanage every step or it becomes spaghetti. This produced the asset-registry / lifecycle primitives and the build-operating-system.md model (six standard methodologies: environments, IaC/GitOps, release/promotion, namespacing, CMDB, DoD+reconciliation). Teardown and registry-update became completion gates.
7. **Canon Engine.** Nick revealed his prior AOS was built around exactly this and v1 died on an architecture-comprehension gap. We stood up the canon capture loop (append-only ADR/daybook + the "canon this" trigger + Boris-auto-capture as a gate). The boundary memory=operational vs canon=architectural was set.
8. **The governance layer.** A contact-sourcing session was over-constraining on company size and stalling output. Nick: he'd *stopped correcting the size-obsession out of fatigue* because the correction had nowhere durable to live, so every new session re-litigated it. This produced (a) the governance/influence observability layer (which artifact@version governs which workflow + in-force criteria), and (b) the immediate fix: pin "company size is not a gate" where it governs (feedback_company_size_not_a_gate.md). The fatigue *was* the symptom of the missing binding layer.
9. **The binding-layer thesis (the apex).** Nick challenged that the whole folder/memory approach is unreliable — AI doesn't always read context; he must remember which launch folder; not business-scalable. This session itself proved it: a parallel session nearly re-authored the canonical artifact *despite the pin existing*, because adherence depended on it choosing to consult memory. The thesis: **governance is a binding/enforcement problem, not a documentation problem.** Reliability is a property of the binding mechanism, never of the document. Standard patterns: dependency injection (runtime provides context; session doesn't fetch it), Policy Enforcement Point vs Policy Decision Point (gate the agent can't bypass, not a rule it should read), runtime-bound versioned config (proven in-stack: L2 ← Classification Rules, version-stamped per run). Content layer = necessary, weakest, mostly built. Delivery/enforcement layer = the actual AOS.
10. **This entry's own trigger.** Nick observed the terse canon entry loses the why; a future session referencing it has only the snippet. He asked for the entry to lead into deeper context. This is the binding-layer insight applied recursively to canon itself: the index must link to a durable source-of-record, and the link must be a gate, not discretion.

## Why this matters (the business stakes, in Nick's frame)

The governance/binding problem is, in Nick's words, "one of the most remarkable and impactful elements we could solve" — every organization adopting agentic AI hits the same wall: knowledge bases and memory that the agent may or may not load. Solving reliable context binding is the unlock and the business opportunity. AOS / Canon Engine's product is that binding layer, not the knowledge store. v1 failed for lack of this comprehension; the comprehension was formed, expensively, by the failures above.

## Decisions taken (not just observations)

- R5 is modality-only; size/ICP and currency/status are separate downstream gates. Currency is the priority next layer (post-meeting); ICP is trivial/client-trusted; modality is solved.
- Full L2 v4 R5 run deliberately NOT executed — fold into the currency-gate build, run once with both layers.
- Company size is not an upstream hard gate — pinned as a CRITICAL rule; artifact softening flagged as a proposed R-item, not authored (never re-author).
- AOS / Canon Engine: captured as the strategic initiative, central thesis = the binding layer. Deliberately NOT started — starting it unscoped at session end is the exact over-eager behavior the discipline forbids.
- Canon mechanism upgraded: substantive entries must link to a durable source context file (this file is the first), enforced as a completion gate.

## Addendum — the typed context manifest (YAML header) idea

Nick raised, at session close, a YAML-type header declaring an artifact's in-context links so AI knows where to retrieve more (vector or freeform); he found this more comforting than bare file paths, and thought Obsidian would help. Assessment, applying the binding-layer canon recursively:

- **Right as substrate, wrong as delivery.** Deterministic injection requires a machine-readable declaration of what governs/relates to an artifact. The header IS that schema and is necessary. But "so the AI knows where to retrieve" is still discretionary — a map the agent may not consult. Same trap as folder/memory. The header's real role is a *manifest a runtime resolver injects*, not a map the agent reads.
- **Standard pattern + known failure:** a dependency manifest. `package.json` does nothing without `npm`. The header without a resolver/injector is a prettier version of the current unreliable thing. The win is the resolver that enforces the manifest, not the manifest.
- **Obsidian** = operator-facing graph/map (real value for the human's trust and traversal), not a session/workflow injection mechanism. Its comfort must not substitute for the resolver.
- **Design refinement banked:** typed edges, not flat links — `governed_by` / `derives_from` / `supersedes` / `consumed_by_workflow` / `ratified_by`. The resolver needs relationship *type* to decide whether/how to inject (governing criteria → deterministic; background → lazy/vector). The canon `Refs:`/`Source:` split is the seed of this typing; generalize it, don't flatten it.
- Scope: stated, captured, NOT designed now (Nick: don't go down the rabbit hole). Feeds AOS as the manifest-schema input to the binding/resolver layer.

## Pointers

- Terse index: `../canon-log.md` (2026-05-18 entries).
- Operating model: `../../reference/build-operating-system.md`.
- Strategic initiative + central thesis: memory `project_aos_rebuild.md`.
- Enforcement rules: memory `feedback_canon_capture.md`, `feedback_build_asset_lifecycle.md`, `feedback_company_size_not_a_gate.md`.
- Teknova resume: `../../HANDOFF-teknova-revops-currency-gate-2026-05-18.md`.
- Full-session link: deferred to the harness — the session-ID enrichment (`originSessionId`, as memory frontmatter already carries) is the correct home for a whole-transcript pointer; the agent does not fish for it. Until the harness stamps it here, this file is the reliable deep-dive substrate.
