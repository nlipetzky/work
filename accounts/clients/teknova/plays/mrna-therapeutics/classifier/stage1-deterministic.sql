-- mRNA Therapeutics Stage-1 deterministic classification (play-specific rule set).
-- The generic classifier runner substitutes {{STAGING_TABLE}} with staging.companies_<batch_id>.
--
-- DESIGN PRINCIPLE (carried from the ngAbs play, 2026-06-08):
-- 1. The structured `biotech_modality_types` field is an UNVERIFIED enrichment. A positive in-scope
--    signal (mRNA/LNP) is therefore NEVER auto-trusted into an IN verdict here — it goes to the
--    semantic pass for source-cite verification.
-- 2. A CDMO's description/modality lists what it SERVICES, not what it IS. CDMOs are inherently a
--    judgment call (explicit mRNA/LNP line IN vs generic-biologics OUT) and are never auto-decided.
-- 3. "RNA" alone is ambiguous (siRNA/ASO vs messenger RNA). Auto-OUT only fires on a CLEAN
--    oligonucleotide/AAV signal with NO co-occurring messenger-RNA signal.
--
-- So Stage 1 auto-decides DEVELOPERS ONLY, and only the SAFE negatives:
--   * oligonucleotide-only (siRNA / ASO / antisense / oligonucleotide) with no mRNA signal (N2), and
--   * AAV / gene-therapy / viral-vector with no mRNA signal (N1 subset).
-- Everything else -> prep_verdict NULL for the semantic pass: in-scope mRNA claims (verify), all CDMOs,
-- LNP-delivery/IVT-enzyme roles, modality=none, and any modality-vs-evidence conflict.
--
-- Signal sources (Apollo-enriched staging schema, 2026-06-11):
--   keywords (structured-ish tag list), description (Apollo short_description), industry.
-- Explicitly NOT used: revenue, ticker, naics alone (cross-company noise).

alter table {{STAGING_TABLE}} add column if not exists prep_verdict     text;
alter table {{STAGING_TABLE}} add column if not exists prep_criteria    jsonb;
alter table {{STAGING_TABLE}} add column if not exists prep_confidence  text;
alter table {{STAGING_TABLE}} add column if not exists prep_rationale   text;
alter table {{STAGING_TABLE}} add column if not exists prep_stage       text;
alter table {{STAGING_TABLE}} add column if not exists prep_evidence    text;

with sig as (
  select id,
    lower(coalesce(keywords,''))                            as m,
    lower(concat_ws(' ', description, keywords, industry))  as d
  from {{STAGING_TABLE}}
),
flags as (
  select id, m, d,
    -- messenger-RNA in-scope signal (mRNA / saRNA / circRNA / IVT / LNP-for-mRNA) in keywords OR description
    ((m || ' ' || d) ~ '(\mmrna\M|messenger rna|self-amplifying rna|\msarna\M|\msam-?rna\M|circular rna|\mcircrna\M|in vitro transcription|\mivt\M)') as inscope_mrna,
    -- oligonucleotide-only signal (no messenger context)
    (d ~ '(\msirna\M|small interfering rna|antisense|\maso\M|oligonucleotide)') as sig_oligo,
    -- AAV / gene-therapy / viral-vector signal
    (d ~ '(\maav\M|adeno-?associated|viral vector|gene therapy)')              as sig_aav,
    (coalesce(m,'') = '')                                                      as m_none,
    -- CDMO/contract-manufacturing read from the description (Apollo has no clean role field)
    (d ~ '(cdmo|\mcmo\M|service provider|manufactur|contract develop|contract manufactur)') as role_cdmo,
    (d ~ '(lipid nanoparticle|\mlnp\M)')                                       as sig_lnp
  from sig
),
decided as (
  select *,
    -- auto-OUT only for developers (never CDMOs), only on a clean negative with NO mRNA co-occurrence
    ((not role_cdmo) and (not inscope_mrna) and (
        sig_oligo or sig_aav
    )) as auto_out
  from flags
)
update {{STAGING_TABLE}} s set
  prep_criteria = jsonb_build_object('inscope_mrna',f.inscope_mrna,'sig_oligo',f.sig_oligo,
    'sig_aav',f.sig_aav,'sig_lnp',f.sig_lnp,'modality_none',f.m_none,'role_cdmo',f.role_cdmo),
  prep_verdict    = case when f.auto_out then 'OUT' else null end,
  prep_confidence = case when f.auto_out then 'HIGH' else null end,
  prep_stage      = case when f.auto_out then 'sql'  else 'residual' end,
  prep_evidence = nullif(concat_ws('; ',
    case when f.auto_out and f.sig_oligo then 'N2:oligonucleotide-only(no mRNA)' end,
    case when f.auto_out and f.sig_aav   then 'N1:AAV/gene-therapy(no mRNA)' end,
    case when not f.auto_out and f.inscope_mrna then 'mRNA CLAIM->verify' end,
    case when not f.auto_out and f.role_cdmo then 'CDMO->mRNA/LNP-explicit?' end,
    case when not f.auto_out and f.sig_lnp and not f.inscope_mrna then 'LNP signal->mRNA payload?' end,
    case when not f.auto_out and f.m_none then 'modality=none->read desc' end), ''),
  prep_rationale = case
    when f.auto_out and f.sig_oligo then 'oligonucleotide-only, no messenger-RNA program (N2) -> OUT'
    when f.auto_out and f.sig_aav   then 'AAV/gene-therapy, no mRNA program (N1) -> OUT'
    else 'needs semantic verification (mRNA claim / CDMO / LNP / modality=none)' end
from decided f
where s.id = f.id
  and (s.prep_verdict is null or s.prep_stage = 'residual');
