# Spec: Companies Relationship Classifier (replaces binary dedup)

**Date:** 2026-06-02
**Owner:** Automation practice (Boris)
**Status:** Draft, awaiting review
**Replaces:** Current binary dedup workflow (NOZ4tx25dHCdu1N6) which only writes Lifecycle State = "duplicate"
**Base:** RevOps Surface (appYBYH3aOHhTODAw) → Companies (tblnj3YlOI3thjrXp)

---

## What this replaces

The current dedup workflow classifies every record as either "duplicate" or "not duplicate." That's wrong for the actual problem because record pairs fall into eight relationship states, not two. Subsidiaries, acquired entities, and divisions get falsely flagged or falsely missed.

This spec defines a relationship classifier that uses your existing schema fields (Parent Company, Subsidiary Status, Ultimate Parent) plus a small number of new fields. It follows the Account Hierarchy / Corporate Family Tree pattern used by Salesforce, Dun & Bradstreet, ZoomInfo, and every major B2B CRM since the early 2000s.

---

## New schema fields (add to Companies)

### Relationship Verdict
- **Type:** singleSelect
- **Options:** `exact_duplicate`, `related_entity`, `distinct`, `unreviewed`, `incomplete`
- **Default:** `unreviewed`
- **Purpose:** The classifier's output. Filterable. Drives downstream merge/review decisions.
- **Set by:** The Companies Relationship Classifier workflow.

### Canonical Record
- **Type:** multipleRecordLinks → Companies (self-link, single record)
- **Purpose:** When verdict is `exact_duplicate` or `related_entity`, links to the older / canonical record this one matches against. Lets operators see "this is the second instance of X" without losing the trail.
- **Set by:** The classifier workflow.

### Relationship Detected At
- **Type:** dateTime
- **Purpose:** Audit trail. When the classifier last evaluated this record.
- **Set by:** The classifier workflow.

### Relationship Confidence
- **Type:** singleSelect
- **Options:** `high`, `medium`, `low`
- **Purpose:** How sure the classifier is. Drives whether the verdict can be auto-applied or needs human review.
- **Set by:** The classifier workflow.

### Relationship Notes
- **Type:** multilineText
- **Purpose:** Short audit log of how the verdict was reached (which signals matched, which didn't).
- **Set by:** The classifier workflow.

### Fields the classifier USES but does not create

These already exist on Companies:
- `Domain` (url) and `Domain Normalized` (formula)
- `Company LinkedIn URL` (singleLineText)
- `Company Name` (primary)
- `Parent Company` (singleLineText) — classifier may write this on `related_entity` matches
- `Subsidiary Status` (singleSelect: independent / subsidiary / division / unknown) — classifier may write this
- `Ultimate Parent` (singleLineText) — classifier reads this if populated by Explorium
- `explorium_parent_company_name` / `explorium_ultimate_parent_name` — classifier reads these as supporting signals

---

## Verdict definitions

### exact_duplicate
**Same legal entity, two records. Operator action: merge or mark canonical and discard the other.**

Detected when ALL of:
- Domain Normalized matches an existing record, AND
- Normalized Company Name matches (after suffix-strip + lowercase + trim)

Optional confirming signals (raises confidence to high):
- Company LinkedIn URL matches (normalized)
- HQ City + HQ State match

Confidence:
- `high` — Domain + Name + LinkedIn all match
- `medium` — Domain + Name match, LinkedIn missing or differs
- `low` — Domain matches, Name matches only after aggressive suffix-strip

### related_entity
**Different legal entities under shared corporate umbrella. Operator action: link via Parent Company, keep both.**

Detected when ANY of:
- Domain Normalized matches an existing record BUT Normalized Company Name differs (e.g. `novartis.com` shared by Novartis Pharmaceuticals + Gyroscope Therapeutics + Novartis Gene Therapies)
- Ultimate Parent matches between the two records (one or both populated by Explorium)
- explorium_parent_company_id matches between the two records
- Names share a root token AND one record's name contains the other (e.g., `FUJIFILM` and `FUJIFILM Diosynth Biotechnologies`)

When this verdict fires, classifier ALSO writes:
- `Parent Company` = the canonical record's Company Name (if this record looks like the child)
- `Subsidiary Status` = `subsidiary` (default; operator can correct to `division` if needed)
- Canonical Record link

Confidence:
- `high` — Domain match + Ultimate Parent match
- `medium` — Domain match alone, OR name-root match
- `low` — only soft signals

### distinct
**No relationship detected. Operator action: none.**

Default when no exact_duplicate or related_entity match is found AND the record has enough data to evaluate (Domain present OR Company Name present).

### incomplete
**Not enough data to classify. Operator action: enrich, then re-classify.**

Detected when ALL of:
- Domain is empty
- Company LinkedIn URL is empty
- Company Name is empty or matches no other record's name

Recommendation: flag for the enrichment pipeline. Once enrichment populates Domain or LinkedIn, the classifier should re-run.

### unreviewed
**Default state. Classifier has not yet evaluated this record.**

This is the initial state of any new record. The classifier writes one of the other four verdicts within seconds of record creation.

---

## Classifier workflow logic

```
Webhook (Airtable record-create fires ?recordId=...)
  ↓
Get New Record
  ↓
Normalize From Record
   - normalizedDomain = lower + strip protocol/www/trailing-slash
   - normalizedLinkedIn = lower + strip trailing-slash
   - normalizedName = lower + trim + strip common corp suffixes
   - newRecordId
  ↓
Build Filter (assembles three search formulas)
   - filterByDomain = AND(RECORD_ID() != newId, LEN(normalizedDomain) > 0, {Domain Normalized} = normalizedDomain)
   - filterByLinkedIn = AND(RECORD_ID() != newId, LEN(normalizedLinkedIn) > 0, LOWER({Company LinkedIn URL}) = normalizedLinkedIn)
   - filterByName = AND(RECORD_ID() != newId, LEN(normalizedName) > 0, LOWER(TRIM({Company Name})) CONTAINS normalizedName)
  ↓
Search by Domain (Airtable search, filterByDomain)
Search by LinkedIn (Airtable search, filterByLinkedIn)
Search by Name (Airtable search, filterByName)
  ↓
Classify (Code node)
   - Combine match sets, dedupe by record id
   - For each candidate, score relationship:
       same domain + same name → exact_duplicate
       same domain + different name → related_entity (record is sibling/subsidiary of canonical)
       same LinkedIn → exact_duplicate (LinkedIn is per-legal-entity)
       same Ultimate Parent → related_entity
       partial name match + no domain → related_entity (low confidence)
   - Pick verdict with highest confidence
   - Pick canonical = oldest matching record by createdTime
   - If no matches AND data present → distinct
   - If no matches AND no data → incomplete
  ↓
Write Verdict
   - Update new record:
       Relationship Verdict
       Relationship Confidence
       Relationship Notes
       Relationship Detected At = now
       Canonical Record (if verdict is exact_duplicate or related_entity)
       Parent Company (if verdict is related_entity AND canonical's name is contained in this name)
       Subsidiary Status (if verdict is related_entity, default "subsidiary")
```

---

## Normalization rules

### Domain Normalized (already exists as formula field)
- Lowercase
- Strip `https://`, `http://`
- Strip `www.`
- Strip trailing `/`

### Company Name Normalized (compute in workflow, not a stored field)
- Lowercase
- Trim
- Strip common corp suffixes (case-insensitive, word-boundary):
  - `inc`, `inc.`
  - `llc`
  - `ltd`, `ltd.`, `limited`
  - `corp`, `corp.`, `corporation`
  - `company`, `co.`, `co`
  - `gmbh`
  - `sa`, `s.a.`
  - `ag`
  - `plc`
  - `nv`, `n.v.`
  - `pte`
  - `holdings`, `holding`
  - `group`
  - `therapeutics`, `therapeutic`
  - `biotechnologies`, `biotechnology`, `biotech`
  - `pharmaceuticals`, `pharmaceutical`, `pharma`
  - `labs`, `lab`, `laboratory`, `laboratories`
- Collapse multiple spaces to single

### LinkedIn URL Normalized
- Lowercase
- Strip `https://`, `http://`
- Strip `www.`
- Strip trailing `/`
- Optional: strip URL query parameters

---

## Match scoring matrix

| Domain match | LinkedIn match | Name exact | Name partial | Ultimate Parent match | → Verdict | Confidence |
|---|---|---|---|---|---|---|
| ✓ | ✓ | ✓ | — | — | exact_duplicate | high |
| ✓ | — | ✓ | — | — | exact_duplicate | medium |
| — | ✓ | ✓ | — | — | exact_duplicate | high |
| — | ✓ | — | — | — | exact_duplicate | medium |
| ✓ | — | — | ✓ | — | related_entity | medium |
| ✓ | — | — | — | — | related_entity | medium |
| — | — | — | ✓ | ✓ | related_entity | high |
| — | — | — | — | ✓ | related_entity | medium |
| — | — | — | — | — | distinct | n/a |

Multi-signal matches (e.g., Domain + LinkedIn + Name all match) raise confidence to `high`. Single-signal matches stay at `medium` or `low`.

---

## Edge cases the spec explicitly handles

1. **Acquired entity inheriting parent domain** (Seagen using pfizer.com, Gyroscope using novartis.com, Astellas using tayshagtx.com): Domain matches but Name differs → `related_entity`, NOT `exact_duplicate`. Operator preserves both records, links via Parent.

2. **Subsidiary with own domain but parent-included name** (FUJIFILM Diosynth at fujifilmdiosynth.com vs FUJIFILM Biotechnologies at fujifilm.com): Different domains, but normalized name "fujifilm" is contained in both → `related_entity` via name-root match. Low-medium confidence; flagged for review.

3. **Stub record with name only** (recL3N7tTODOGLedX scenario): No domain, no LinkedIn, only Name. Classifier searches by name. If exact name match exists with a populated record, fires `exact_duplicate` with the populated record as canonical. If no match, marks `incomplete`.

4. **Two records sharing a domain by data error** (recd0pejNsD1Za1V5 and recd5NYczx2BPvfg1 both at biophe.com but RJK Biopharma vs Avirmax Biopharma): Same domain, very different names → `related_entity` with low confidence. Operator reviews to decide if it's a real subsidiary relationship or a data error.

5. **HQ-only addresses without lab footprint matching multiple entities** (Catalent, Patheon, FUJIFILM — large CDMOs): No false positives because the workflow doesn't deduplicate within parent corp groups. Each subsidiary stays distinct unless its domain AND name match an existing record exactly.

---

## What the operator sees

In the Companies table, three new columns appear:
- **Relationship Verdict** — the classifier's call
- **Canonical Record** — link to the matched record (clickable)
- **Relationship Confidence** — high/medium/low

A view called "Needs Review" filters: `Relationship Verdict IN (exact_duplicate, related_entity) AND Relationship Confidence != high`. This is the human review queue.

A view called "Confirmed Duplicates" filters: `Relationship Verdict = exact_duplicate AND Relationship Confidence = high`. These are safe to auto-merge or auto-archive.

A view called "Incomplete" filters: `Relationship Verdict = incomplete`. These get pushed back to the enrichment pipeline.

---

## Open questions before build

1. **Should the classifier auto-merge `exact_duplicate, high` records or only flag them?** Auto-merge is faster but destructive. Flagging is safer but creates a manual queue. Recommendation: flag only for v1; add auto-merge in v2 once classifier accuracy is proven.

2. **What's the scope of "related_entity" auto-writes?** Should the classifier auto-set `Parent Company` and `Subsidiary Status` even at medium confidence? Recommendation: only write Parent Company if a clear hierarchy (Ultimate Parent match, or contained-name pattern) is detected; leave Subsidiary Status blank unless the operator confirms.

3. **How does this interact with the existing state-reconciliation job** that's documented as the sole writer to Lifecycle State? Recommendation: classifier writes only to the new Relationship fields, never to Lifecycle State. State-reconciliation can read Relationship Verdict as input but maintains exclusive write on Lifecycle State.

4. **What about the existing records with Lifecycle State = "duplicate"** from the broken prior workflow? Recommendation: as part of rolling this out, run the classifier in batch over the existing table to populate Relationship Verdict on all rows, then clear Lifecycle State = "duplicate" from any record that came back as something other than exact_duplicate.

5. **Confidence threshold for "incomplete" vs "distinct"?** A record with Domain alone but no matches — distinct or incomplete? Recommendation: distinct. Domain is enough signal that the record is identifiable; absence of matches means it's genuinely new.

---

## Implementation order

1. Add the five new fields to Companies table (Relationship Verdict, Canonical Record, Relationship Detected At, Relationship Confidence, Relationship Notes).
2. Rewrite the n8n workflow to follow the classifier flow above. Replace binary "Mark New As Duplicate" with verdict-write.
3. Build the three Airtable views: Needs Review, Confirmed Duplicates, Incomplete.
4. Backfill: run the classifier in batch over all existing Companies records to populate Relationship Verdict.
5. Add a manual-review SOP for the Needs Review queue.
6. Once the classifier has been running for a few weeks and accuracy is validated, add an auto-merge or auto-archive step for `exact_duplicate, high` records.

---

## Out of scope (for now)

- AI-assisted classification for ambiguous cases. The deterministic rules above handle 90%+ of cases. Add LLM-assist as a fallback ONLY for records where the classifier returns `unreviewed` or low-confidence verdicts.
- Cross-base hierarchy (e.g., linking RevOps Surface Companies to Salesforce Accounts). Separate concern, handled by the existing SF sync workflow.
- Time-based decay (e.g., "this match was made 6 months ago, re-evaluate"). Add later if needed; for now classifier re-runs on each record-update event.
- Multi-parent ownership (joint ventures). Rare in Teknova's segment; defer until a real case appears.
