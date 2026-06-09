-- patent-portfolio-mgmt Stage-1 deterministic classification (PROVISIONAL motions cut).
-- The generic classifier runner substitutes {{STAGING_TABLE}} with staging.companies_<batch_id>.
--
-- DESIGN: auto-OUT only SAFE negatives -- industries that plainly do not own patentable technology a
-- fractional CIPO would manage, plus IP/law-services firms (which are competitors, not buyers).
-- Everything else -> prep_stage='residual' for the semantic pass, which reads the company
-- self-description against the CIPO fit criteria and honors the verification mandate (no guessed IN).
--
-- Signal sources (columns guaranteed by the loader RENAME + the sourced CSV): industry, plus the
-- free-text company_description / keywords. Provisional: the real ICP comes from the 2026-06-10 intake.

alter table {{STAGING_TABLE}} add column if not exists prep_verdict     text;
alter table {{STAGING_TABLE}} add column if not exists prep_criteria    jsonb;
alter table {{STAGING_TABLE}} add column if not exists prep_confidence  text;
alter table {{STAGING_TABLE}} add column if not exists prep_rationale   text;
alter table {{STAGING_TABLE}} add column if not exists prep_stage       text;
alter table {{STAGING_TABLE}} add column if not exists prep_evidence    text;

with sig as (
  select id,
    lower(coalesce(industry, ''))                          as ind,
    lower(concat_ws(' ', company_description, keywords))   as d
  from {{STAGING_TABLE}}
),
flags as (
  select id, ind, d,
    (ind ~ '(\mlaw\M|legal|attorney|law firm|staffing|recruit|marketing|advertis|public relations|retail|wholesale|hospitality|restaurant|food *(and|&)? *bever|real estate|account(ing|ant)|nonprofit|non-profit|education|e-?learning|consumer goods|apparel|travel|leisure)') as off_industry,
    -- IP-services / patent-prosecution shops are competitors to the CIPO offering, not buyers
    (d ~ '(patent prosecution|ip law firm|patent attorney|intellectual property services|patent filing service)') as ip_services
  from sig
),
decided as (
  select *, (off_industry or ip_services) as auto_out from flags
)
update {{STAGING_TABLE}} s set
  prep_criteria   = jsonb_build_object('off_industry', f.off_industry, 'ip_services_firm', f.ip_services),
  prep_verdict    = case when f.auto_out then 'OUT' else null end,
  prep_confidence = case when f.auto_out then 'HIGH' else null end,
  prep_stage      = case when f.auto_out then 'sql' else 'residual' end,
  prep_evidence   = case
    when f.ip_services then concat('IP-services/competitor signal in description')
    when f.off_industry then concat('off-ICP industry: ', f.ind)
    else null end,
  prep_rationale  = case when f.auto_out
    then 'outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT'
    else 'needs semantic verification (does this company own patentable tech a CIPO would manage?)' end
from decided f
where s.id = f.id
  and (s.prep_verdict is null or s.prep_stage = 'residual');
