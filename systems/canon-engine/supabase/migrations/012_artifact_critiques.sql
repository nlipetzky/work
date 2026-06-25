-- Migration: artifact_critiques (the craft-expert review store) + record_artifact_critique RPC
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   A craft-expert critique pass over governed artifacts. The first critic is the Deepline GTM
--   list-builder, which reviews the list-build targeting artifacts for BUILDABILITY against real
--   data-provider reality (searchable filters, enrichment hit-rate/cost, scoring realism, empty-list
--   risk). This is the RevOps CRAFT axis ... distinct from the engagement SME (domain truth) and from
--   the generic govern-artifacts judge (checklist). Knowledge-based by default (the deepline craft
--   docs); subscription_aware flips true when it also used live deepline tools.
--
--   Write path = record_artifact_critique RPC (SECURITY DEFINER, service-role-locked), same discipline
--   as the other governed writes. The critique also feeds back into the artifact's drafting source so a
--   re-Produce optimizes against it, and proposes updates to the doctrine so the standard compounds.

create extension if not exists pgcrypto;

create table public.artifact_critiques (
  id                 uuid primary key default gen_random_uuid(),
  engagement_type    text not null,
  engagement_id      text not null,
  artifact_type      text not null,
  artifact_id        uuid,                                  -- the artifact version critiqued (nullable)
  critic             text not null default 'deepline-list-builder',
  verdict            text not null,                         -- buildable | buildable-with-fixes | not-buildable
  summary            text,
  pushback           jsonb not null default '[]'::jsonb,    -- [{dimension, severity, issue, fix, providers}]
  doctrine_updates   jsonb not null default '[]'::jsonb,    -- proposed additions to the doctrine
  subscription_aware boolean not null default false,        -- did it also use live deepline tools
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

comment on table public.artifact_critiques is
  'Craft-expert critique of governed artifacts (first critic: Deepline GTM list-builder, buildability axis). Written via record_artifact_critique RPC.';

create index artifact_critiques_target_idx on public.artifact_critiques (engagement_type, engagement_id, artifact_type, created_at desc);
create index artifact_critiques_artifact_idx on public.artifact_critiques (artifact_id);

alter table public.artifact_critiques enable row level security;
create policy artifact_critiques_service_all
  on public.artifact_critiques for all to service_role using (true) with check (true);

create or replace function public.record_artifact_critique(
  p_engagement_type    text,
  p_engagement_id      text,
  p_artifact_type      text,
  p_verdict            text,
  p_artifact_id        uuid default null,
  p_critic             text default 'deepline-list-builder',
  p_summary            text default null,
  p_pushback           jsonb default '[]'::jsonb,
  p_doctrine_updates   jsonb default '[]'::jsonb,
  p_subscription_aware boolean default false,
  p_metadata           jsonb default '{}'::jsonb
)
returns public.artifact_critiques
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.artifact_critiques;
begin
  insert into public.artifact_critiques (
    engagement_type, engagement_id, artifact_type, artifact_id, critic, verdict,
    summary, pushback, doctrine_updates, subscription_aware, metadata
  ) values (
    p_engagement_type, p_engagement_id, p_artifact_type, p_artifact_id, p_critic, p_verdict,
    p_summary, coalesce(p_pushback,'[]'::jsonb), coalesce(p_doctrine_updates,'[]'::jsonb),
    p_subscription_aware, coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.record_artifact_critique is
  'Sanctioned write path for a craft-expert critique. SECURITY DEFINER, service-role only.';

revoke execute on function public.record_artifact_critique(text,text,text,text,uuid,text,text,jsonb,jsonb,boolean,jsonb) from public, anon, authenticated;
grant  execute on function public.record_artifact_critique(text,text,text,text,uuid,text,text,jsonb,jsonb,boolean,jsonb) to service_role;
