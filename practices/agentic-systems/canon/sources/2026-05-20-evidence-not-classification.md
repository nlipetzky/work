# 2026-05-20 — Evidence over classification; RevOps Engine value statement

## What surfaced this

A working session on the Teknova AAV play. Nick asked Boris to describe how the engine determines whether a company meets the AAV gene therapy criteria. The first answer pointed at the L2 Classify workflow's verdict fields (`Verification Status = surfaced`). Nick pushed back: that verdict assumes "some omnipotent being changed the status" — it's a derived label, not a determination.

Boris narrowed to "look at two fields: AAV Gene Therapy = Yes/No, Program Active = Yes/No, with evidence next to each." Nick pushed again: those two booleans are still verdicts. The Yes/No is the same trap one layer down — a computed answer somebody had to write. The evidence is the answer. The extracted CT.gov content (trial NCT, intervention name, conditions, study type, status, dates) IS what tells you whether the company does AAV gene therapy. No boolean needed on top.

Boris acknowledged. Then Nick made the bigger point: the success of the entire RevOps Engine relies on the ability to find the right data, extract it, place it in a database, reference it later. Classification is commodity. The value is in:
- finding the needle in the haystack
- describing the needle so we can prove we know what it looks like
- capturing evidence of the needle
- building a complete dossier around the needle

That is the engine's reason for existing. Everything else is mechanism.

Then Nick added a structural correction: the engine is multi-tenant. Vocabulary at the engine layer must be tenant-agnostic. Biotech terms ("modality," "AAV," "gene therapy," "vector," "clinical stage") belong inside Teknova's per-play artifacts, never in engine-level tables, field names, workflow names, or descriptions. The neutral vocabulary is play / target definition / discovery source / evidence / qualifying signal / disqualifying signal / dossier / entity.

## Why it's canon

This is foundational to every client engagement that will ever run on the RevOps platform. It is the engine's value thesis, articulated for the first time in this form:

1. **The work is data, not labels.** Find, describe, capture, enrich. Classification is what comes out of the data when read; not what the data is for.
2. **Verdicts in fields lie.** Evidence in fields is the truth. Anyone reading the row can apply rules and decide; nobody needs an engine to vouch.
3. **Cast wide; the next source matters more than the next classifier.** A play on one source is a prototype.
4. **Pay once, capture everything.** Every paid API call must write every returned field; the deep blob is a fallback, not the primary destination.
5. **Two-layer target model.** Universal target definition (reusable across plays in a category) plus per-play filter (tenant + play-specific). Conflating them destroys reuse.
6. **Tenant-agnostic vocabulary at engine level.** Industry terms live in per-client artifacts only.

This entire collection of insights belongs to the engine layer, not to Teknova. Every future client engagement is a tenant of this same engine and inherits the same principles.

## How the session went sideways before it converged

Earlier in the same session, Boris generated several artifacts that conflated engine-layer and play-layer concerns:

- `DEFINITION-aav-gene-therapy-target-2026-05-20.md` — claimed to define an AAV gene therapy target, but folded in geography, headcount, and SF-suppression filters that are play-specific, not definitional. Wrote this content into a new `Target Definition` field on the Teknova Playbook record.
- `DATA-SOURCES-aav-gene-therapy-target-2026-05-20.md` — same conflation; classified data sources by what they tell us about "qualifying" rather than about a universal target.
- Three new Play Step rows for SF Account Sync, Trade Press Currency Capture, Account Suppression Flag Population — correct content; but the framing inherited the same engine-vs-play conflation.
- The "Verification Status" / "Currency Status" / "Vector Evidence Clause" verdict fields in the existing Companies schema — examples of pre-computed labels that the new principles say should be replaced by evidence columns with view-time filtering.

The session converged when Nick said the quiet part out loud: "Stop computing verdicts. Capture evidence and display it." Then he extended it to: even Yes/No fields next to evidence are still verdicts; the evidence IS the answer.

## What gets written as a result

1. **`practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`** — the canonical principles artifact for the RevOps Engine. Tenant-agnostic. Registered as an Asset linked to the `revops-engine` system in the System Registry.
2. **Canon log entry** (this date) referencing this source file.
3. **Header notes** on the Teknova artifacts created earlier today flagging them as tenant-instances and pointing back to the principles.
4. **Asset registration** in the System Registry.
5. **A follow-up audit** of every place biotech vocabulary leaked into engine-level surfaces (Companies field names, workflow names, status labels) is implied but not in scope for this session.

## Refs

- `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` (the artifact this source-of-record justifies)
- `accounts/clients/teknova/artifacts/DEFINITION-aav-gene-therapy-target-2026-05-20.md` (Teknova-specific, needs the engine-vs-play split applied)
- `accounts/clients/teknova/artifacts/DATA-SOURCES-aav-gene-therapy-target-2026-05-20.md` (same)
- `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` v4 (canonical AAV criteria — read + derive, never re-author)
- Existing canon entries 2026-05-18: "Observable surface is truth"; "Self-describing structure"; "Emergent systems are registered, not gated on completeness" — all relate to this one as the same family of principles.
