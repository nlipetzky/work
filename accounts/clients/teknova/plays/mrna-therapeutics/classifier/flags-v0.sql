-- flags-v0.sql — Flag-and-Resolve v0 (per Boris decisions, 2026-06-11; see
-- practices/agentic-systems/HANDOFF-flag-resolve-system-2026-06-11.md).
-- Writes prep_flags (jsonb array of work-item flags) + prep_attention (scalar roll-up) onto a
-- screened companies staging batch. Runner substitutes {{STAGING_TABLE}}.
--
-- v0 SCOPE: the three known rules (large_player>=2000, missing_domain, oligo-name) + field-coverage
-- data flags (missing description/headcount). Flag-object shape is PROVISIONAL — it locks after the
-- operator reacts to real rows.
--
-- Boris contract honored:
--  * decision-type flags carry a rule_ref and resolve_by_rule; with no rule they would escalate
--    (none here — large_player has a rule). Data/evidence flags resolve by PROCEDURE (status=open
--    here; no resolver agent yet). confidence is telemetry only (null in deterministic v0), never a
--    gate. Every flag discloses its load-bearing rule_ref.
--  * stop-loss on data flags (one waterfall pass then DROP) is stated in the flag detail; the
--    resolver will enforce it.

alter table {{STAGING_TABLE}} add column if not exists prep_flags     jsonb;
alter table {{STAGING_TABLE}} add column if not exists prep_attention text;

with sig as (
  select id,
    coalesce(domain,'')                                  as dom,
    coalesce(description,'')                              as descr,
    coalesce(employee_count,'')                          as emp_raw,
    lower(concat_ws(' ', name, description, keywords))   as blob
  from {{STAGING_TABLE}}
),
cand as (
  select id, emp_raw,
    -- R1 large_player (decision; rule EXISTS -> resolved_by_rule, off the attention list)
    case when emp_raw ~ '^[0-9]+$' and emp_raw::int >= 2000
      then jsonb_build_object('code','large_player','type','decision','severity','note',
        'owner','sme','status','resolved_by_rule',
        'rule_ref','client-guidance.md#0.3 (keep+flag large players)',
        'detail', emp_raw || ' employees >= 2000 threshold','confidence', null) end as f_large,
    -- R2 missing_domain (data; procedure = one waterfall pass then DROP)
    case when dom = ''
      then jsonb_build_object('code','missing_domain','type','data','severity','blocker',
        'owner','research_lane','status','open','rule_ref', null,
        'detail','no domain after enrichment; stop-loss: one waterfall pass then DROP','confidence', null) end as f_dom,
    -- field-coverage: missing description (data, blocker -> classifier cannot screen modality)
    case when descr = ''
      then jsonb_build_object('code','missing_description','type','data','severity','blocker',
        'owner','research_lane','status','open','rule_ref', null,
        'detail','no description; classifier cannot screen modality','confidence', null) end as f_desc,
    -- field-coverage: missing headcount (data, note -> size rule cannot evaluate)
    case when emp_raw !~ '^[0-9]+$'
      then jsonb_build_object('code','missing_headcount','type','data','severity','note',
        'owner','research_lane','status','open','rule_ref', null,
        'detail','no numeric headcount; large_player rule cannot evaluate','confidence', null) end as f_emp,
    -- R3 oligo-name (evidence; rule GOVERNS the OUT, resolution is procedural research)
    case when blob ~ '(oligonucleotide|antisense|\msirna\M|\maso\M)'
           and blob !~ '(\mmrna\M|messenger rna|self-amplifying|\msarna\M|circular rna|\mcircrna\M)'
      then jsonb_build_object('code','unverified_modality_oligo','type','evidence','severity','blocker',
        'owner','research_lane','status','open',
        'rule_ref','client-guidance.md#0.1 (oligonucleotide-only OUT)',
        'detail','oligonucleotide signal, messenger-RNA program unconfirmed; research to confirm OUT vs co-occurring mRNA','confidence', null) end as f_oligo
  from sig
),
agg as (
  select c.id,
    coalesce((select jsonb_agg(x)
              from (values (c.f_large),(c.f_dom),(c.f_desc),(c.f_emp),(c.f_oligo)) v(x)
              where x is not null), '[]'::jsonb) as flags
  from cand c
)
update {{STAGING_TABLE}} s set
  prep_flags = a.flags,
  prep_attention = case
    when a.flags @> '[{"status":"open"}]'::jsonb then 'open'
    when jsonb_array_length(a.flags) > 0          then 'informational'
    else 'clear' end
from agg a where s.id = a.id;
