# Prep-Plan Artifact Schema (v0)

The prep-plan is the **approvable proposal** the planner emits and the executor consumes. It is the
contract between "the agent decided" and "the agent acted." It is a markdown file in the play
folder: `accounts/clients/<client>/plays/<play>/prep-plans/<batch_id>-prep-plan.md`.

**Blocking rule:** the executor runs nothing until every required section below is present and the
approval line says go. A missing section = no-run. (Borrowed from DeepLine's complete-or-no-run
approval contract.)

Two principles this schema encodes:
- **Verification mandate** — every value the client will see carries a *verification state*, not
  just a value. "Filled" is never "trusted." A verdict resting on an unverified field is itself
  `NEEDS_REVIEW` until the field is verified.
- **Same context as the human** — the header links the exact criteria + guidance the planner read.

---

## Field vocabulary (shared by all sections)

**Verification state** (per field the client sees):
- `verified-fresh` — REAL per `lib/validity.ts` **and** validated (mechanical) or criteria/
  source-cite checked (semantic) **and** a fresh `<field>_verified_at` stamp.
- `unverified` — present but not checked (no fresh stamp / unvalidated source / never criteria-checked).
- `missing` — empty or placeholder per `lib/validity.ts`.

**Criterion result:** `pass | fail | n/a`, each with `confidence: HIGH|MED|LOW` and an
`evidence` string (the value + its source-cite that justified the call).

**Overall verdict:** `IN | OUT | NARROW | NEEDS_REVIEW | DEDUP→<canonical> | HIERARCHY`.

---

## Required sections

### 1. Header
- `batch_id`, `entity` (companies|contacts), `play`, row count.
- Verbatim links to the criteria + guidance the planner read (proves same-context):
  `playbook_file_path`, `guidance_file_path` (off `staging_batch_meta`).
- `generated_by`, `generated_at` (stamped after the run; scripts can't call `now()` for this).

### 2. Guidance interpretation
Each guidance rule → the operation it maps to. For ngAbs the rule set is fixed (criteria IDs below);
for other plays this section is derived from that play's `client-guidance.md`.

### 3. Per-record, per-criterion verdicts
Grouped by overall verdict. One block per record:
- `id`, `name`, `overall_verdict`.
- Per-criterion table: criterion id → result + confidence + evidence + **verification state of the
  field the criterion rests on**.
- `rationale` — one line, why the overall verdict.

**ngAbs criteria IDs** (from `client-guidance.md`):
| id | criterion | in/out effect |
|---|---|---|
| C1 | core modality: bispecific / multispecific / ADC present | pass → qualifies |
| C2 | conjugate subclass: AOC / RDC·radioconjugate / immunocytokine | pass → qualifies (even w/o literal "ADC") |
| C3 | fragment-only without co-occurring in-scope modality | pass → OUT (co-occurrence exception) |
| N1 | fusion-protein-only (no bispecific/multispecific/ADC) | pass → OUT |
| N2 | PEGylated enzyme (no antibody backbone) | pass → OUT |
| N3 | CAR cell therapy ("bispecific CAR" ≠ bispecific antibody) | pass → OUT |
| N4 | AAV gene therapy (vector, antibody-adjacent vocab) | pass → OUT |
| F1 | sterile fill-finish / packaging-only CDMO | pass → NARROW (only if touches ADC drug product) |
| D | dedup / corporate hierarchy collapse | pass → DEDUP→/HIERARCHY |

Verdict derivation: any N* pass → `OUT`. Else C1 or C2 pass → `IN`. C3 pass (and no qualifying
co-occurrence) → `OUT`. F1 pass and no disqualifier → `NARROW`. D pass → `DEDUP→<canonical>` /
`HIERARCHY`. Low confidence or an unverified deciding field → `NEEDS_REVIEW`.

### 4. Dedup / hierarchy actions
The collapses this batch will apply, each with source-cite. (ngAbs known set: LSNE→PCI Pharma;
ProBio=GenScript ProBio; FUJIFILM Diosynth→FUJIFILM; SK pharmteco parent-of KBI; Kashiv ×2 collapse.)

### 5. Acquired-company routing actions (contacts)
Per affected contact: route to original vs acquirer **by the live email domain** (worked example:
Seagen→Pfizer). The deciding field (email domain) and its verification state.

### 6. Gap + enrichment plan
For each IN / NARROW / NEEDS_REVIEW record, the fields that are `missing` or `unverified`, and how
they'll be resolved:
- field → lane (`identity` | `research`) → provider/research-function → required input(s) (the DAG
  dependency: foundational enrichment that must run first).
- `verify_or_fill` — whether this is a verification of a present-but-unverified value or a fill.
- **Cost estimate** — per provider/function, per row, batch total. Hard requirement: the executor
  spends nothing until this is approved.

### 7. Execution operations
The exact ordered on-rails calls the executor will make (loader re-runs, classifier/waterfall runner
invocations with args, staging label writes, the reclassify pass, and the deferred
`promote_staging_batch` left for the Promote button).

### 8. Approval line
`APPROVAL: <go|no-go> — <name>, <date>`. Explicit. The executor checks this string.

---

## Worked example (abridged) — `ngabs_2026_06_05`, companies

```markdown
# Prep Plan — ngabs_2026_06_05 (companies)
batch_id: ngabs_2026_06_05 · entity: companies · play: ngAbs · rows: 82
playbook: .../plays/ngabs-next-gen-antibodies/playbook-v1-2026-05-29.md
guidance:  .../plays/ngabs-next-gen-antibodies/client-guidance.md

## 3. Verdicts (abridged)

### OUT (4 shown)
- ImmunityBio — OUT
  N1 fusion-protein-only: pass HIGH — "IL-15 superagonist Fc-fusion" [cite: SME 2026-06-05 gold] · field: modality=verified-fresh
  rationale: fusion-protein-only; matches client gold label.
- Adverum Biotechnologies — OUT
  N4 AAV: pass HIGH — "Ixo-vec, AAV vector encoding aflibercept" [cite: SME gold] · field: modality=verified-fresh
- Lyell Immunopharma — OUT (N3 CAR-T) · Polaris Pharmaceuticals — OUT (N2 PEGylated enzyme)

### IN (example)
- Avidity Biosciences — IN
  C2 conjugate subclass: pass HIGH — "AOC / antibody oligonucleotide conjugate" [cite: SME 2026-06-05] · field: modality=verified-fresh
  C1 core modality: n/a · N1-N4: fail
  rationale: AOC is in-scope conjugate subclass even without literal "ADC".

### NARROW
- Simtra BioPharma — NARROW
  F1 fill-finish: pass HIGH — "sterile fill-finish only" [cite: SME gold] · field: services=verified-fresh
  rationale: thinner Teknova basket; keep flagged, lower priority.

### NEEDS_REVIEW (verification mandate in action)
- <Company X> — NEEDS_REVIEW
  C1 core modality: pass LOW — "bispecific" found in marketing copy · field: modality=UNVERIFIED (no source-cite)
  rationale: deciding field unverified → route to research lane (modality-evidence function) before a verdict is trusted.

## 4. Dedup
- LSNE → PCI Pharma Services [cite: SME gold] · ProBio = GenScript ProBio · FUJIFILM Diosynth → FUJIFILM
- SK pharmteco HIERARCHY parent-of KBI Biopharma · Kashiv BioSciences ×2 → collapse

## 5. Acquired routing (contacts)
- Seagen contacts → Pfizer where email domain = pfizer.com [cite: SME 2026-06-03] · deciding field: email_domain=verified-fresh

## 6. Gap + enrichment plan
- NEEDS_REVIEW.modality (research lane) → ngAbs modality-evidence function; input: domain (foundational, present); verify_or_fill: verify; est 1 research call/row
- IN.<missing contact email> (identity lane) → Apollo→Explorium; input: name+domain; verify_or_fill: fill; est ~1 credit/hit
- Cost estimate: <n> research calls + <m> identity hits ≈ <total> — APPROVAL GATES THIS.

## 7. Execution operations
1. classifier-runner companies ngabs_2026_06_05 (residual only)
2. waterfall-runner companies ngabs_2026_06_05 --lanes research (verify modality on NEEDS_REVIEW)
3. waterfall-runner contacts  ngabs_2026_06_05 --lanes identity (fill missing emails on IN)
4. apply dedup/hierarchy + acquired-routing labels to staging
5. reclassify pass (records whose modality became verified)
6. [deferred to Promote button] promote_staging_batch(...)

## 8. APPROVAL: <go|no-go> — Nick, <date>
```
