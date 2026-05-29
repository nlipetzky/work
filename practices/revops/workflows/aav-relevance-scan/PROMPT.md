# Workflows ticket — AAV Relevance Scan (post-hoc classifier on Company Events)

**Write-owned by:** Workflows builder (or Nick directly — small enough to hand-build)
**Workflow target:** NEW workflow (suggested name: `AAV Relevance Scan`)
**Working scope:** this folder (`practices/revops/workflows/aav-relevance-scan/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows / Nick
**Status:** SPEC. New workflow build.

## Why this exists

Company Events currently holds 2,001 rows on RevOps Surface (`appYBYH3aOHhTODAw / tblnzX2b2kqNGzW6r`):
- 1,608 PubMed publications — fetched without an AAV filter (company-affiliated only, any topic)
- 389 CT.gov clinical_trial_status — AAV-filtered at search time
- 2 Perplexity program_status
- 1 broken target_classification (separate L1 v2 directive in flight)

Reading the 1,608 publication rows by hand to find AAV-relevant ones is not viable. The L1 v2 target_classification chain is in repair and only targets trials anyway, not publications. Solution: a post-hoc AI pass that reads each row's existing evidence and writes a small verdict + plain-English description back to the row.

This is **not** a re-fetch. No new API spend on PubMed/CT.gov. Pure read-from-Airtable → LLM → write-back.

## Goal

For every row in Company Events (publications first; expand to other event types later), the AI reads the captured evidence and writes back two values:

1. **A one-paragraph plain-English description** of what the record is about.
2. **A verdict on whether the record is about AAV gene therapy**: `yes`, `no`, `unclear`, or `error`.

Plus rationale + scanned-at timestamp for auditability.

## Schema additions (Company Events table, `tblnzX2b2kqNGzW6r`)

Add these six fields:

| Field | Type | Notes |
|---|---|---|
| `AAV Description` | multilineText | The AI's one-paragraph plain-English summary. |
| `AAV Verdict` | singleSelect | Options: `yes`, `no`, `unclear`, `error`. Suggested colors: yes=greenLight2, no=grayLight2, unclear=yellowLight2, error=redLight2. |
| `AAV Rationale` | multilineText | One or two sentences naming the specific AAV signals (MeSH terms, AAV serotype in title, etc.). |
| `Activity Status` | singleSelect | Options: `active`, `recent`, `stale`, `ended`, `unknown`. Suggested colors: active=greenLight2, recent=yellowLight2, stale=orangeLight2, ended=grayLight2, unknown=grayLight1. |
| `Activity Rationale` | multilineText | One or two sentences naming the specific dates and status phrases that drove the activity verdict. |
| `AAV Scanned At` | **Last Modified Time** (scoped to AAV output fields) | When the row was last AAV-scanned. Auto-computed by Airtable from changes to `AAV Verdict, AAV Description, AAV Rationale, Activity Status, Activity Rationale`. The scanner does NOT write to this field — Airtable rejects writes to computed fields. Use `{AAV Verdict} = BLANK()` (not `{AAV Scanned At} = BLANK()`) as the idempotency gate in the Airtable Search node. |

`AAV Verdict` and `Activity Status` are independent axes. Filter views like `AAV Verdict = yes AND Activity Status IN (active, recent)` for "real targets right now," or `AAV Verdict = yes AND Activity Status = ended` for "former AAV players to deprioritize."

## Fields to pass to the AI node

Pass these existing fields from the row, in this order, labeled clearly in the prompt:

| Field on Company Events | Field ID | Why it matters |
|---|---|---|
| Event Type | `fld9ClxVEsVaPxevq` | Publication / trial / program-status — drives different decisiveness rules. |
| Title | `fldU7CqFiAiwISnDl` | Highest AAV signal — titles often contain "AAV", "adeno-associated", serotype IDs. |
| Detail | `fldbBKER5RwHshZLr` | For PubMed: journal citation + publication types + abstract. For CT.gov: trial summary JSON. Biggest single field; trust it. |
| Categories / Tags | `fld2fwTyksjMqNZnq` | MeSH terms (Dependovirus, Genetic Therapy, etc.) or play slugs. **Highest single AAV signal** when present. |
| Conditions | `fldV0Gb90pURkm8JX` | Disease/condition strings. |
| Intervention Names | `fldkJUrUhEx5zf9R6` | Trial-only. Often carries the AAV product name. |
| Intervention Type | `fld1JSbnG1yzJvThq` | GENETIC / BIOLOGICAL / DRUG / etc. |
| Provider | `fldJ92czEDveRZ0ss` | `pubmed`, `clinicaltrials.gov`, `perplexity`. |
| **Event Date** | `fldUHXJIiXAauBwHH` | Temporal signal. Trial start date or publication date. |
| **Most Recent Activity Date** | `fldfSn0ohSlsSngYB` | Temporal signal. Trial last-update or publication date. **Primary input for Activity Status.** |
| **Vitality (system label)** | `fldZjpURuYkNNSqi1` | Coarse upstream label from L1 (`active`/`ended`/`dormant`/`unknown`). Tells the model what the source workflow inferred; the model can override with richer evidence. |
| **Signal State (raw)** | `fldWObYfbecQhZUZR` | For trials: the authoritative CT.gov overallStatus enum (RECRUITING, COMPLETED, etc.). **Highest single Activity signal** for trials. |

Plus a `Today is YYYY-MM-DD` anchor wired via `{{ $now.toFormat("yyyy-MM-dd") }}` so the model can compute relative recency.

**Pass through but don't ask the AI to interpret** (for write-back traceability):
- Event ID (`fldxW6uuEcg73Wfkb`), External ID (`fldozCZoy0SN8t5oA`), Source URL (`fldQTIr0X9QJNhFWH`).

## AAV gene therapy — definition the AI should apply

Borrowed from the L1 v2 classifier criteria. AAV gene therapy means:

**Positive signals (any one is strong enough on its own for `yes`):**
- MeSH term `Dependovirus` present in Categories / Tags.
- Title or Intervention Names contains `AAV`, `adeno-associated`, or an AAV serotype identifier (`AAV1`, `AAV2`, ..., `AAV9`, `AAVrh10`, `rAAV`).
- Title or Detail describes an AAV vector delivering a transgene (e.g. "AAV9-SMN1", "AAV-mediated", "AAV vector").
- Known branded AAV products in Intervention Names or Title: Zolgensma (onasemnogene), Luxturna (voretigene), Hemgenix (etranacogene), Roctavian (valoctocogene), Elevidys (delandistrogene), Upstaza (eladocagene), OAV101, GT005, SRP-9001, EDIT-101, BMN-307, ABO-102, AT132, RP-A501, RGX-314, AAV-CRISPR variants.
- Detail explicitly mentions AAV serotype, AAV capsid, or AAV vector engineering.

**Negative signals (push toward `no`):**
- Lentiviral, retroviral, plasmid, mRNA-LNP, ASO, CRISPR ex vivo / electroporation only, oncolytic adenovirus (NOT AAV — different virus family), naked DNA, CAR-T, gene-edited HSC ex vivo.
- Cell therapy without any viral vector mention.
- Pharmacology / antibody / small-molecule / device papers with no gene-delivery component.

**Unclear (use sparingly):**
- "Gene therapy" mentioned with no vector specified AND no MeSH Dependovirus.
- Ambiguous abstracts where the modality isn't named.
- Trials/papers tagged Genetic Therapy MeSH but no AAV indicator.

**Error:**
- Detail field is empty or unreadable. Title is empty. Row is malformed.

## AI prompt template (drop into the LLM node)

The Airtable node upstream emits each row at `$json.fields.<FieldName>`. Below is the prompt with the n8n expression wiring done — paste it verbatim into the LLM node's prompt slot (set the field's type to "expression" so `={{ }}` evaluates).

**Model:** `claude-haiku-4-5-20251001` (downgraded from Sonnet 4.6 after a positive-case smoke test — Sonnet was ~$18 per 2,001-row pass, Haiku is ~$5 for equivalent accuracy on this classification task).

```
You are classifying a single biomedical record for two things: AAV gene therapy relevance AND temporal activity status.

Today is {{ $now.toFormat("yyyy-MM-dd") }}.

RECORD:
- Event Type: {{ $json.fields["Event Type"] || "(empty)" }}
- Provider: {{ $json.fields.Provider || "(empty)" }}
- Title: {{ $json.fields.Title || "(empty)" }}
- Categories / Tags: {{ $json.fields["Categories / Tags"] || "(empty)" }}
- Conditions: {{ $json.fields.Conditions || "(empty)" }}
- Intervention Type: {{ $json.fields["Intervention Type"] || "(empty)" }}
- Intervention Names: {{ $json.fields["Intervention Names"] || "(empty)" }}
- Intervention Detail: {{ $json.fields["Intervention Detail"] || "(empty)" }}
- Study Type: {{ $json.fields["Study Type"] || "(empty)" }}
- Event Date: {{ $json.fields["Event Date"] || "(empty)" }}
- Most Recent Activity Date: {{ $json.fields["Most Recent Activity Date"] || "(empty)" }}
- Vitality (system label): {{ $json.fields.Vitality || "(empty)" }}
- Signal State (raw): {{ $json.fields["Signal State (raw)"] || "(empty)" }}
- Detail (truncated to 4000 chars): {{ ($json.fields.Detail || "").slice(0, 4000) }}

DEFINITION OF AAV GENE THERAPY:
AAV (adeno-associated virus) gene therapy means using an AAV viral vector to deliver a transgene to a patient's cells. This includes any AAV serotype (AAV1–AAV9, AAVrh10, rAAV, engineered capsids), any disease target, any phase. It does NOT include lentiviral vectors, retroviral vectors, oncolytic adenovirus (different virus family, easy to confuse), mRNA-LNP, ASOs, CRISPR delivered ex vivo, plasmid DNA, CAR-T, or pharmacology/antibody/small-molecule work that happens to mention gene therapy in passing.

AAV DECISIVENESS:
If Categories / Tags contains "Dependovirus" OR Title/Detail/Intervention Names/Intervention Detail contains "AAV", "adeno-associated", or an AAV serotype identifier (AAV1, AAV2, AAV3, AAV4, AAV5, AAV6, AAV7, AAV8, AAV9, AAVrh10, rAAV), default to verdict="yes" unless the text explicitly compares AAV against another vector and concludes AAV is NOT what's used. Branded AAV products (Zolgensma, Luxturna, Hemgenix, Roctavian, Elevidys, Upstaza, OAV101, GT005, SRP-9001, EDIT-101, BMN-307, ABO-102, AT132, RP-A501, RGX-314) also score "yes". Reserve "unclear" for cases where modality genuinely isn't named. Never use "unclear" as a hedge when a positive signal is present. Intervention Detail often carries the AAV vector confirmation when Intervention Names contains only a drug code (e.g., "LY3884961"); read it carefully.

DEFINITION OF ACTIVITY STATUS:
Compute relative to today's date above. Use these strict date-math boundaries.

- "active" — Trial: Signal State (raw) is one of RECRUITING, ACTIVE_NOT_RECRUITING, ENROLLING_BY_INVITATION, NOT_YET_RECRUITING. OR Most Recent Activity Date is within the last 18 months AND the abstract mentions ongoing work. Publication: Event Date is within the last 24 months (≤ 2 years before today), regardless of whether the abstract mentions ongoing work. Recently published work is by default current.
- "recent" — Publication 2–5 years old (Event Date is between 2 and 5 years before today, inclusive of 2.0, exclusive of 5.0). OR trial last updated 18–36 months ago with no terminal Signal State.
- "stale" — Publication strictly more than 5 years old (Event Date >5.0 years before today). OR trial last updated >36 months ago with no terminal Signal State.
- "ended" — Trial Signal State (raw) is one of COMPLETED, TERMINATED, WITHDRAWN, SUSPENDED, and Most Recent Activity Date is >12 months ago. OR publication explicitly describes a terminated/halted program.
- "unknown" — Dates missing, or signals contradict (e.g., recent publication describing a years-old completed trial — go with the trial's status if both are present).

ACTIVITY DECISIVENESS:
Prefer Signal State (raw) for trials when present — it is the authoritative status enum from ClinicalTrials.gov. Use Most Recent Activity Date as the tiebreaker. For publications without status enums, lean on Event Date + abstract phrasing. Vitality (system label) is a coarse upstream signal; don't override richer evidence with it.

CONSISTENCY (CRITICAL):
Compute the date math step by step in activity_rationale. Show your work: "Event Date X → Y years before today → bucket Z." The activity_status field value MUST match the bucket your rationale computes. If your rationale concludes "stale", the field must say "stale". If you self-correct mid-rationale (e.g., "Re-evaluation:… this is actually stale"), update the activity_status field to match the corrected conclusion before emitting the JSON. A mismatch between rationale and field is treated as an error. Re-read your activity_status field against your activity_rationale before finalizing output.

OUTPUT FORMAT:
Return raw JSON only. No code fences. No prose before or after. The first character of your response must be { and the last must be }. Output keys in this exact order: verdict, rationale, activity_rationale, activity_status, description.

Key-order rationale: verdict and rationale come first because AAV classification benefits from a snap commitment. activity_rationale precedes activity_status because date math requires deliberation — the model does the arithmetic first, then commits to the bucket with the computation already in hand. This eliminates the autoregressive bias where the model would emit activity_status, then realize mid-rationale it picked wrong, and have no way to go back.

{
  "verdict": "yes" | "no" | "unclear" | "error",
  "rationale": "One or two sentences naming the specific AAV signals that drove the verdict. Cite MeSH terms or substrings from Title/Detail/Intervention Names/Intervention Detail verbatim.",
  "activity_rationale": "Show date math step by step. State Event Date and Most Recent Activity Date verbatim, compute years before today, name the bucket explicitly (active/recent/stale/ended/unknown). If you revise mid-reasoning, end with the final bucket so the next field can commit cleanly.",
  "activity_status": "active" | "recent" | "stale" | "ended" | "unknown",
  "description": "2–3 sentences, under 80 words. State the disease, the modality (AAV serotype + transgene if known), the activity status in plain English, and the key finding (publication) or trial stage/status (trial)."
}
```

### Field-mapping notes (n8n quirks)

- **Field names with spaces or special characters** (`Event Type`, `Categories / Tags`, `Intervention Type`, `Intervention Names`, `Study Type`) — use **bracket notation**: `$json.fields["Event Type"]`. Dot notation breaks on spaces/slashes.
- **Field names without spaces** (`Title`, `Provider`, `Conditions`, `Detail`) — dot notation works fine. Bracket notation also works if you prefer consistency.
- **Empty-field fallback** — `|| "(empty)"` keeps the prompt readable when a row has no Categories / Tags or no Intervention Names (publications won't have intervention fields populated, trials won't have rich Study Type strings). Without the fallback you get literal `undefined` in the prompt, which the model interprets oddly.
- **Detail truncation** — Detail can run 3–8 KB on publications with long abstracts + reference lists. `.slice(0, 4000)` caps it at ~4K chars, keeping the call cheap and within Haiku's effective attention. The first 4K of Detail always contains the journal citation + abstract — that's where the AAV signal lives. References and affiliations sit further down and don't add classification signal.
- **JSON output parsing** — Anthropic node in n8n returns the model output as a string. Pipe it into a Code node that does `JSON.parse($input.first().json.message.content)` with a try/catch that sets `verdict = "error"` and `rationale = "model output was not valid JSON: " + raw.slice(0, 200)` on parse failure.

### Sample row that should score "yes"

The directive author tested the field set against this real record (`recvtcNThFfqXX5t8`, PMID 38200264):
- Title: "AAV2 vector optimization for retinal ganglion cell-targeted delivery of therapeutic genes."
- Categories / Tags includes `Dependovirus`, `Genetic Therapy`, `Genetic Vectors`.
- Detail abstract opens "Recombinant adeno-associated virus (AAV)-2 has significant potential..."
- Provider = `pubmed`.

Any AAV-relevance prompt that doesn't return `verdict: yes` on this row has a bug. Use this PMID as a known-positive smoke test before running the full pass.

### JSON parser (Code node, sits between Anthropic and Airtable Update)

Haiku 4.5 has a stable tic of wrapping JSON output in ` ```json ... ``` ` code fences regardless of how hard the prompt forbids it. Don't fight this in the prompt; strip the fences in a Code node. Smoke-tested against PMID 38200264 — parser handles the fence wrap cleanly and produces a flat object the Airtable Update node consumes directly.

```js
const raw = $input.first().json.content[0].text;

// Strip ```json ... ``` or ``` ... ``` wrappers if Haiku added them
const stripped = raw
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/, '')
  .trim();

let parsed;
try {
  parsed = JSON.parse(stripped);
  // Sanity-check the required keys
  if (!parsed.verdict || !parsed.activity_status || !parsed.rationale || !parsed.activity_rationale || !parsed.description) {
    throw new Error('missing required key(s) in model output');
  }
} catch (e) {
  parsed = {
    verdict: 'error',
    activity_status: 'unknown',
    rationale: 'JSON parse failed: ' + e.message + ' | raw start: ' + raw.slice(0, 200),
    activity_rationale: 'not computed — model output failed validation',
    description: ''
  };
}

return [{ json: parsed }];
```

**Verified output shape** (after parser, ready to map to Airtable fields):

```json
{
  "verdict": "yes",
  "rationale": "The Categories/Tags explicitly includes 'Dependovirus' and the Title contains 'AAV2 vector optimization'. The abstract extensively describes AAV2 vector engineering with therapeutic transgenes (hSIRT1) for retinal ganglion cell delivery, directly matching the definition of AAV gene therapy.",
  "description": "This publication describes AAV2 vector optimization for delivering the hSIRT1 therapeutic gene to retinal ganglion cells to treat optic neuropathies. The engineered vectors incorporate RGC-selective promoters and regulatory elements to achieve high transduction efficiency and selective transgene expression. The vectors demonstrated increased RGC survival in optic nerve crush models, supporting their therapeutic potential."
}
```

Airtable Update node then maps: `verdict` → AAV Verdict, `rationale` → AAV Rationale, `description` → AAV Description, plus `AAV Scanned At = {{ $now.toISO() }}`.

### Caveat on the `Conditions` field for publication rows

In this sample, `Conditions` is populated with grant/funding text (NEI NIH HHS K08 EY030163 etc.) rather than disease conditions. That's a data-quality artifact of the PubMed-capture workflow's field mapping — `Conditions` was designed for CT.gov disease strings and the PubMed builder routed grant agency text there. This is upstream noise, not a problem for the AAV scanner: the model will see "NEI NIH HHS K08 EY030163" and (correctly) not weight it as an AAV signal either way. Worth flagging to the pubmed-capture builder in a separate follow-up.

Model: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — fast, cheap, more than enough capability for this. Cost estimate: ~1.5K input tokens × 2,001 rows × $0.80/M = ~$2.40 total. Output ~250 tokens × 2,001 × $4/M = ~$2.00. Whole pass ≈ **$5**.

## n8n workflow shape

```
[Schedule trigger OR Manual]
  ↓
[Airtable: Search records]
  table = Company Events (tblnzX2b2kqNGzW6r)
  filter = AND({AAV Verdict} = BLANK(), OR({Event Type} = "publication", {Event Type} = "clinical_trial_status"))
  fields returned = the 8 input fields above + Event ID + External ID
  pageSize = 100, paginate fully
  ↓
[Split In Batches: 1 (process serially to keep LLM concurrency sane; bump later)]
  ↓
[Anthropic / OpenAI / Claude node]
  Model: claude-haiku-4-5-20251001
  Prompt: template above with {{ }} fields wired
  Output format: JSON
  ↓
[Code: strip code fences + parse JSON — see "JSON parser" section below]
  ↓
[Airtable: Update record]
  table = Company Events
  recordId = {{ $json.id }}
  fields:
    AAV Description = {{ description }}
    AAV Verdict = {{ verdict }}
    AAV Rationale = {{ rationale }}
    AAV Scanned At = {{ $now }}
  ↓
[Loop back to next batch]
  ↓
[Final: write summary to Enrichment Runs table]
  total scanned, verdict distribution (yes/no/unclear/error counts), run duration
```

## Idempotency

The `AAV Scanned At = BLANK()` filter is the idempotency gate. Re-running the workflow will skip rows already scanned. To force a re-scan after changing the AAV definition, bump a version tag in the prompt and either:
- Clear `AAV Scanned At` on rows older than the bump, OR
- Add an `AAV Definition Version` field and filter on it.

Skip the version field for v1 — easy to add later if the definition shifts.

## Out of scope for this workflow

- No re-fetch from PubMed / CT.gov / Perplexity.
- No new evidence rows. This writes a derived verdict + description back to the existing rows. The underlying evidence stays in Title / Detail / Categories / Tags as it is today.
- No deletion of "no" rows. They stay in the table; you filter at view time (`AAV Verdict = "yes"`).
- No replacement of the broken L1 v2 `target_classification` chain. That's a separate fix already in flight. This is the publications-side analog and can run independently.

## Companion follow-up (separate ticket, not this one)

The PubMed capture workflow should also add an AAV-relevance filter at the `esearch` query step so future runs don't accumulate noise. Suggested PubMed query addition: `(AAV[Title/Abstract] OR adeno-associated[Title/Abstract] OR Dependovirus[MeSH] OR "gene therapy"[MeSH])`. That's a one-line change to the PubMed workflow and would reduce future-write volume by ~60-80% based on the Orchard sample. File a separate small ticket for that — do not bundle.

## Reporting

After the run, Nick / orchestrator can spot-check by Airtable view:
- `AAV Verdict = "yes"` — should match the L1 v2 trial classifier's intuition on the 389 trials and surface any AAV-relevant publications.
- `AAV Verdict = "no"` — should include the Orchard MLD/ADA-SCID papers and other non-AAV company-affiliated work.
- `AAV Verdict = "unclear"` — review these by hand; if there are many, tighten the definition and re-run.

## Did we borrow from the CT.gov approach?

**Yes for the AAV definition** — the positive/negative signal list above is lifted directly from the L1 v2 classifier's tier rules (MeSH Dependovirus, AAV serotype patterns, vector-suffix interventions, branded AAV products).

**No for the query-time filtering approach** — that was specific to CT.gov's Essie query DSL. The equivalent for PubMed is a separate small fix (see "Companion follow-up" above), not part of this post-hoc scanner.
