-- Migration: prospects (the Prospect spine) + record/advance RPCs
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The destination the flywheel fills: signal-sourced companies that move stage by stage to qualified
--   leads. The signal watch (watch-signals.mjs) lands fresh companies here from FREE authoritative
--   sources (ClinicalTrials.gov now; USPTO PatentsView when a key is configured). The enrichment/execution
--   step (deepline, credit-gated) advances them. One row per (source, source_ref) signal; dedup is the
--   unique key. Write path = record_prospect / advance_prospect RPCs (SECURITY DEFINER, service-role-locked).

create extension if not exists pgcrypto;

create table public.prospects (
  id              uuid primary key default gen_random_uuid(),
  engagement_type text not null,
  engagement_id   text not null,
  recipe_name     text,                                -- which recipe / signal surfaced it
  source          text not null,                       -- 'clinicaltrials' | 'patentsview' | ...
  source_ref      text not null,                       -- nctId / patent id (the dedup key)
  company_name    text not null,
  domain          text,                                -- resolved during enrichment
  signal          jsonb not null default '{}'::jsonb,  -- the raw surfacing signal (trial / patent)
  stage           text not null default 'signal'
                    check (stage in ('signal','resolved','screened','enriched','qualified','disqualified')),
  enrichment      jsonb not null default '{}'::jsonb,
  qualified       boolean,
  verdict         text,                                -- qualified | edge | not
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (engagement_type, engagement_id, source, source_ref)
);

comment on table public.prospects is
  'The Prospect spine: signal-sourced companies moving signal -> qualified. Filled by the signal watch (free authoritative sources), advanced by enrichment. Written via record/advance_prospect RPCs.';

create index prospects_engagement_idx on public.prospects (engagement_type, engagement_id);
create index prospects_stage_idx on public.prospects (engagement_type, engagement_id, stage);
create index prospects_company_idx on public.prospects (engagement_type, engagement_id, company_name);

create trigger prospects_set_updated_at
  before update on public.prospects
  for each row execute function public.fn_set_updated_at();

alter table public.prospects enable row level security;
create policy prospects_service_all
  on public.prospects for all to service_role using (true) with check (true);

-- record a freshly-surfaced signal company (idempotent on the source signal). Returns the inserted row,
-- or null if this signal was already seen.
create or replace function public.record_prospect(
  p_engagement_type text,
  p_engagement_id   text,
  p_source          text,
  p_source_ref      text,
  p_company_name    text,
  p_signal          jsonb default '{}'::jsonb,
  p_recipe_name     text default null,
  p_metadata        jsonb default '{}'::jsonb
)
returns public.prospects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.prospects;
begin
  insert into public.prospects (engagement_type, engagement_id, source, source_ref, company_name, signal, recipe_name, stage, metadata)
  values (p_engagement_type, p_engagement_id, p_source, p_source_ref, p_company_name,
          coalesce(p_signal,'{}'::jsonb), p_recipe_name, 'signal', coalesce(p_metadata,'{}'::jsonb))
  on conflict (engagement_type, engagement_id, source, source_ref) do nothing
  returning * into v_row;
  return v_row;  -- null when the signal already existed
end;
$$;

comment on function public.record_prospect is
  'Land a freshly-surfaced signal company. Idempotent on (source, source_ref); returns null if already seen. SECURITY DEFINER, service-role only.';

-- advance a prospect through the pipeline (enrichment / qualification)
create or replace function public.advance_prospect(
  p_id         uuid,
  p_stage      text default null,
  p_domain     text default null,
  p_enrichment jsonb default null,
  p_verdict    text default null,
  p_qualified  boolean default null
)
returns public.prospects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.prospects;
begin
  update public.prospects set
    stage      = coalesce(p_stage, stage),
    domain     = coalesce(p_domain, domain),
    enrichment = coalesce(p_enrichment, enrichment),
    verdict    = coalesce(p_verdict, verdict),
    qualified  = coalesce(p_qualified, qualified)
  where id = p_id
  returning * into v_row;
  if v_row.id is null then raise exception 'prospect % not found', p_id; end if;
  return v_row;
end;
$$;

comment on function public.advance_prospect is
  'Advance a prospect (stage / domain / enrichment / verdict). SECURITY DEFINER, service-role only.';

revoke execute on function public.record_prospect(text,text,text,text,text,jsonb,text,jsonb) from public, anon, authenticated;
grant  execute on function public.record_prospect(text,text,text,text,text,jsonb,text,jsonb) to service_role;
revoke execute on function public.advance_prospect(uuid,text,text,jsonb,text,boolean) from public, anon, authenticated;
grant  execute on function public.advance_prospect(uuid,text,text,jsonb,text,boolean) to service_role;
