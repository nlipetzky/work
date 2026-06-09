# Client Guidance — Next-Gen Antibodies (ngAbs)

**Play:** Next-Gen Antibodies (ngAbs) · **Client:** Teknova
**Type:** Living document. Post-criteria guidance from the client SME, distilled for engine + operator use.
**Sources:** client SME email thread "ngAbs target list — Qs" (2026-06-02 / 2026-06-03); client SME email + per-company notes CSV "ngAbs Companies feedback" (2026-06-05). Raw sources retained in the engagement record.
**Relationship to criteria:** Refines and, where they conflict, **overrides** the base playbook (`playbook-v1-2026-05-29.md`) — this guidance post-dates it. Read both together.

> **For the AI:** apply the rules below as scope filters when qualifying ngAbs companies and contacts. Where this conflicts with the base playbook, this wins. Every rule is tagged to its client source so it can be re-verified.

## 1. Qualification scope — what counts as in-scope antibody work

**Require bispecific / multispecific / ADC** to qualify. *(source: SME 2026-06-03)*
- Standalone **antibody fragments are out-of-scope** unless they co-occur with an in-scope modality (the "co-occurrence exception").
- Updates base playbook **§2.4**: fragments are *"adjacent only when paired,"* not independently qualifying. (e.g. a fragment-only shop like Hovione does not independently qualify.)

**Conjugated-antibody subclasses are in-scope** even when they never use a literal "ADC" string. *(source: SME notes 2026-06-05)*
They share the ADC reagent profile, so screening on `ADC / bispecific / multispecific` alone systematically mis-parks them.
- **AOC** — antibody oligonucleotide conjugate
- **RDC** — radioimmunoconjugate / radioconjugate
- **Immunocytokine**
- Trigger terms to treat as in-scope: `AOC`, `antibody oligonucleotide conjugate`, `radioconjugate`, `RDC`, `immunocytokine`.
- Without this, AOC companies (Avidity, Tallac, Denali's conjugates) get wrongly dropped.

## 2. Negative checks — antibody-adjacent vocabulary that must NOT qualify

These trip a keyword screen but are out of scope. Each needs an explicit negative check. *(source: SME notes 2026-06-05)*

| Pattern | Why it's out | Example flagged by client |
|---|---|---|
| Fusion-protein-only | not bispecific/multispecific/ADC | ImmunityBio — IL-15 superagonist Fc-fusion |
| PEGylated enzyme | no antibody backbone at all | Polaris — PEGylated microbial enzyme |
| CAR cell therapy | "bispecific CAR" ≠ bispecific antibody | Lyell — CD19/CD20 autologous CAR-T |
| AAV gene therapy | antibody-adjacent vocab, product is a vector | Adverum — Ixo-vec encodes aflibercept (Fc-fusion payload) |

## 3. Acquired companies — route by the live email domain *(source: SME 2026-06-03)*

When a target was acquired and its standalone web presence is gone, route each contact by the **email domain actually in use**:
- Keep under the original company if its contacts still use its domain.
- Shift to the acquirer if its contacts use the acquirer's domain.
- Tie-breaker: CRM correspondence at that site shows the live domain (worked example: Seagen → Pfizer; CRM shows Pfizer emails).
- Build this domain-in-use screening into the model — it recurs across acquired companies in the 400-company set.

## 4. Fit nuance — fill-finish / late drug-product CDMOs *(source: SME notes 2026-06-05)*

Sterile fill-finish / packaging-only CDMOs are a **thinner Teknova basket** (formulation buffers / water), not a hard disqualifier but lower priority, and only relevant if they touch **ADC drug product**. Flagged examples: Simtra (sterile fill-finish), PCI Pharma (fill-finish/packaging — narrow, late-stage fit at best).

## 5. Dedup / corporate hierarchy *(source: SME notes 2026-06-05)*

- **LSNE → PCI Pharma Services** (LSNE no longer independent).
- **ProBio = GenScript ProBio** (same company).
- **FUJIFILM Diosynth → FUJIFILM** (acquired / Biotechnologies).
- **SK pharmteco is the parent of KBI Biopharma** — double-count risk.
- **Kashiv BioSciences** appears twice in the source — collapse.

## 6. Client-labeled ground truth

The client SME hand-adjudicated these in the 2026-06-05 CSV. Treat as gold labels for the negative checks and dedup above.

| Company | Verdict | Reason |
|---|---|---|
| ImmunityBio | OUT | fusion-protein-only (IL-15) |
| Polaris Pharmaceuticals | OUT | PEGylated enzyme, no antibody |
| Lyell Immunopharma | OUT | CAR-T, not a bispecific antibody |
| Adverum Biotechnologies | OUT | AAV gene therapy vector |
| Kashiv BioSciences | OUT | mAb-only, no bispecific/multispecific/ADC |
| Simtra BioPharma | NARROW | sterile fill-finish only |
| PCI Pharma Services | NARROW | fill-finish / packaging |
| LSNE | DEDUP → PCI | acquired |
| ProBio | DEDUP → GenScript ProBio | same company |
| FUJIFILM Diosynth | DEDUP → FUJIFILM | acquired |
| SK pharmteco | HIERARCHY | parent of KBI Biopharma |

---
*Distilled from client SME communications via the expert-liaison (Hermes) projection method: every line traces to a dated client source; nothing is the operator's invention. Maintained as a living document as the client clarifies the play.*
