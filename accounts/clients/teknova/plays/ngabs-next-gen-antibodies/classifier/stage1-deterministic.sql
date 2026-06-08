-- ngAbs Stage-1 deterministic classification (play-specific rule set).
-- The generic classifier runner substitutes {{STAGING_TABLE}} with staging.companies_<batch_id>.
--
-- DESIGN PRINCIPLE (learned from real data, 2026-06-08):
-- 1. The structured `biotech_modality_types` field is an UNVERIFIED enrichment. It can be wrong
--    (ImmunityBio: "immunocytokines" but gold = OUT, an IL-15 Fc-fusion) and it can overclaim
--    (Kashiv: "bispecific" but gold = OUT, mAb-only). A positive in-scope signal is therefore
--    NEVER auto-trusted into an IN verdict here.
-- 2. A CDMO's description/modality lists what it SERVICES, not what it IS. A CDMO mentioning AAV,
--    ADC, etc. (SK pharmteco lists gene therapy) must not be auto-classified. CDMOs are inherently
--    a judgment call (full-service IN vs fill-finish NARROW vs no-relevant-work OUT).
--
-- So Stage 1 auto-decides DEVELOPERS ONLY, and only the SAFE negatives:
--   * clean hard negatives (AAV / CAR / PEGylated-enzyme in the company's OWN description), and
--   * fusion-protein-only and antibody-fragment-only (no co-occurring in-scope modality).
-- Everything else -> prep_verdict NULL for the semantic pass (in-scope claims, all CDMOs,
-- modality=none, and any modality-vs-gold conflict), which reads the self-description + SME note
-- and routes unverified deciding fields to the research lane for source-cite verification.
--
-- Signal sources kept NARROW (the 316-col export carries cross-company noise):
--   structured: biotech_modality_types, biotech_role
--   self-description: company_focus / explorium_company_focus, explorium_business_description,
--                     explorium_company_product_development
-- Explicitly NOT used: lookalike_*, keywords_indicator, naics_description.

alter table {{STAGING_TABLE}} add column if not exists prep_verdict     text;
alter table {{STAGING_TABLE}} add column if not exists prep_criteria    jsonb;
alter table {{STAGING_TABLE}} add column if not exists prep_confidence  text;
alter table {{STAGING_TABLE}} add column if not exists prep_rationale   text;
alter table {{STAGING_TABLE}} add column if not exists prep_stage       text;
alter table {{STAGING_TABLE}} add column if not exists prep_evidence    text;

with sig as (
  select id,
    lower(coalesce(biotech_modality_types,'')) as m,
    lower(coalesce(biotech_role,''))           as role,
    lower(concat_ws(' ', company_focus, explorium_company_focus,
          explorium_business_description, explorium_company_product_development)) as d
  from {{STAGING_TABLE}}
),
flags as (
  select id, m, role, d,
    (m ~ '(bispecific|multispecific|\madc\M|adcs|antibody oligonucleotide|oligonucleotide conjugate|\maoc\M|radio-?conjugate|radioimmunoconjugate|\mrdc\M|immunocytokine)') as inscope_claim,
    (m ~ '(fc-?fusion|fusion protein)')                  as m_fusion,
    (m ~ '(antibody fragment|\mfragments?\M)')           as m_fragment,
    (m = '' or m = 'none')                               as m_none,
    (role ~ '(cdmo|\mcmo\M|service provider|manufactur|contract develop)') as role_cdmo,
    (d ~ '(\maav\M|adeno-?associated|viral vector|gene therapy)')          as neg_aav,
    (d ~ '(\mcar-?t\M|chimeric antigen receptor|car t-?cell)')             as neg_car,
    (d ~ '(pegylated|peg-ylated)')                                         as neg_peg
  from sig
),
decided as (
  select *,
    -- auto-OUT only for developers (never CDMOs), only on safe non-qualifying signals
    ((not role_cdmo) and (
        neg_aav or neg_car or neg_peg
        or (m_fusion   and not inscope_claim and not m_fragment)   -- N1 fusion-only
        or (m_fragment and not inscope_claim and not m_fusion)     -- C3 fragment-only
    )) as auto_out
  from flags
)
update {{STAGING_TABLE}} s set
  prep_criteria = jsonb_build_object('inscope_claim',f.inscope_claim,'modality_fusion',f.m_fusion,
    'modality_fragment',f.m_fragment,'modality_none',f.m_none,'role_cdmo',f.role_cdmo,
    'N4_aav',f.neg_aav,'N3_car',f.neg_car,'N2_peg',f.neg_peg),
  prep_verdict    = case when f.auto_out then 'OUT' else null end,
  prep_confidence = case when f.auto_out then 'HIGH' else null end,
  prep_stage      = case when f.auto_out then 'sql'  else 'residual' end,
  prep_evidence = nullif(concat_ws('; ',
    case when f.auto_out and f.neg_aav then 'N4:AAV(self-desc)' end,
    case when f.auto_out and f.neg_car then 'N3:CAR(self-desc)' end,
    case when f.auto_out and f.neg_peg then 'N2:PEG(self-desc)' end,
    case when f.auto_out and f.m_fusion   and not f.inscope_claim and not f.m_fragment then 'N1:fusion-only' end,
    case when f.auto_out and f.m_fragment and not f.inscope_claim and not f.m_fusion   then 'C3:fragment-only' end,
    case when not f.auto_out and f.inscope_claim then 'in-scope CLAIM->verify' end,
    case when not f.auto_out and f.role_cdmo then 'CDMO->IN-vs-NARROW' end,
    case when not f.auto_out and f.m_none then 'modality=none->read desc' end), ''),
  prep_rationale = case
    when f.auto_out and f.neg_aav then 'AAV in own description (N4) -> OUT'
    when f.auto_out and f.neg_car then 'CAR in own description (N3) -> OUT'
    when f.auto_out and f.neg_peg then 'PEGylated in own description (N2) -> OUT'
    when f.auto_out and f.m_fusion   then 'fusion-protein-only (N1) -> OUT'
    when f.auto_out and f.m_fragment then 'antibody-fragment-only (C3) -> OUT'
    else 'needs semantic verification (in-scope claim / CDMO / modality=none)' end
from decided f
where s.id = f.id
  and (s.prep_verdict is null or s.prep_stage = 'residual');
