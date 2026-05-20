# Explorium Biotech NAICS Taxonomy

**Validated:** 2026-05-11 via Explorium Autocomplete API
**Session:** session_explorium_biotech_naics_2026_05_11
**Used by:** Companies Enrichment workflow (n8n ID: Z6RROKx5omdfvhtn) — IF Biotech? qualify gate

---

## Qualifying NAICS Codes

| Code | Label | Decision |
|------|-------|----------|
| 325414 | Biological Product (except Diagnostic) Manufacturing | INCLUDE — primary (AAV vector mfg, CDMOs) |
| 541714 | Research and Development in Biotechnology (except Nanobiotechnology) | INCLUDE — primary (preclinical biotech) |
| 3254xx | Pharmaceutical and Medicine Manufacturing (parent prefix) | INCLUDE — prefix match catches subclasses |
| 325411 | Medicinal and Botanical Manufacturing | INCLUDE — edge case for some CDMOs |
| 325413 | In-Vitro Diagnostic Substance Manufacturing | INCLUDE — edge case for some CDMOs |
| 541713 | Research and Development in Nanotechnology | EXCLUDE |
| 621511 | Medical Laboratories | EXCLUDE — service labs, not biotech companies |
| 541712 | R&D in Physical, Engineering, Life Sciences (except Biotech) | EXCLUDE — too broad |
| 339112 | Surgical and Medical Instrument Manufacturing | EXCLUDE — devices, not biologics |

## Qualifying Logic (IF Biotech? gate)

Qualification requires **both** conditions:

**Condition 1 — Biotech signal** (either):
- `naics_code` starts with: `325414`, `325413`, `325411`, `541714`, `3254`
- OR `naics_description` contains any of: `biotech`, `biolog`, `gene`, `pharma`, `biopharma`, `biopharmaceutical`, `life science`

**Condition 2 — Geography**:
- `country` contains any of: `united states`, `us`, `usa`, `canada`, `ca`

Records failing either condition receive `Enrichment Status = disqualified_non_biotech` and skip deep enrichment.

## Airtable Fields Required Before First Run

These fields must exist in the Companies table (`tblnj3YlOI3thjrXp`) before running the restructured workflow:

| Field Name | Type | Purpose |
|------------|------|---------|
| NAICS Code | Single line text | Written by qualify gate for auditability |
| Explorium Business ID | Single line text | Explorium's stable business identifier |

## Notes

- `3254xx` prefix catches 325412 (Pharmaceutical Preparation Manufacturing) which does not appear in Explorium Autocomplete results but is a valid subclass used by some biopharma manufacturers.
- The keyword fallback handles cases where Explorium returns a description without a clean NAICS code. Common: early-stage companies indexed from LinkedIn may have "Biotechnology Research" as description with no NAICS code populated.
- For the AAV gene therapy play, 325414 and 541714 cover the overwhelming majority of qualifying companies. The keyword fallback is a safety net, not the primary path.
- CDMOs: Explorium often codes them under 325414 (manufacturing) rather than 541714 (R&D). Both qualify.
