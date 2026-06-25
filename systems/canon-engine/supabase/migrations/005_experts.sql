-- Migration: experts (the expert registry) + upsert_expert RPC
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Structured home for the domain experts whose judgment the Expert Liaison loop curates
--   into Canon. "Who holds each role" — the registry the governance model needs so an
--   artifact's required_expertise (legal/marketing/...) can be matched to the expert who
--   certifies it. Replaces the retired Airtable "Expert Liaison Surface" Experts table as
--   the source of truth. Seeded with Will Rosellini (extracted from that base 2026-06-25).
--
--   Write path is the SECURITY DEFINER RPC upsert_expert (locked to service_role), same
--   discipline as record_source_assessment / propose_artifact.

create extension if not exists pgcrypto;

-- =====================================================================
-- experts
-- =====================================================================
create table public.experts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,                   -- e.g. 'will-rosellini'
  name               text not null,
  core_title         text,
  summary            text,
  authority_vectors  jsonb not null default '[]'::jsonb,     -- [{title, points:[...]}]
  linguistic_dna     text,                                   -- voice rules
  expertise          text[] not null default '{}',           -- roles this expert certifies (matches canon_artifact_manifest.required_expertise vocab: legal/marketing/...)
  source_files       text[] not null default '{}',           -- repo source corpus backing this profile
  contact            jsonb not null default '{}'::jsonb,      -- identity/contact (email, linkedin); empty until known
  provenance         text,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.experts is
  'Expert registry: who holds each domain-expertise role. Source of truth for Expert Liaison; matched to canon_artifact_manifest.required_expertise for certification. Written via upsert_expert RPC.';

create index experts_expertise_idx on public.experts using gin (expertise);

create trigger experts_set_updated_at
  before update on public.experts
  for each row execute function public.fn_set_updated_at();

-- RLS: match canon_engine convention (enabled, service_role permissive).
alter table public.experts enable row level security;
create policy experts_service_all
  on public.experts
  for all to service_role using (true) with check (true);

-- =====================================================================
-- upsert_expert: the sanctioned write path (upsert on slug)
-- =====================================================================
create or replace function public.upsert_expert(
  p_slug              text,
  p_name              text,
  p_core_title        text default null,
  p_summary           text default null,
  p_authority_vectors jsonb default '[]'::jsonb,
  p_linguistic_dna    text default null,
  p_expertise         text[] default '{}',
  p_source_files      text[] default '{}',
  p_contact           jsonb default '{}'::jsonb,
  p_provenance        text default null,
  p_metadata          jsonb default '{}'::jsonb
)
returns public.experts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.experts;
begin
  insert into public.experts (
    slug, name, core_title, summary, authority_vectors, linguistic_dna,
    expertise, source_files, contact, provenance, metadata
  ) values (
    p_slug, p_name, p_core_title, p_summary, coalesce(p_authority_vectors,'[]'::jsonb), p_linguistic_dna,
    coalesce(p_expertise,'{}'), coalesce(p_source_files,'{}'), coalesce(p_contact,'{}'::jsonb), p_provenance, coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict (slug) do update set
    name = excluded.name,
    core_title = excluded.core_title,
    summary = excluded.summary,
    authority_vectors = excluded.authority_vectors,
    linguistic_dna = excluded.linguistic_dna,
    expertise = excluded.expertise,
    source_files = excluded.source_files,
    contact = excluded.contact,
    provenance = excluded.provenance,
    metadata = excluded.metadata,
    updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.upsert_expert is
  'Sanctioned write path for the expert registry (upsert on slug). SECURITY DEFINER, service-role only.';

revoke execute on function public.upsert_expert(text,text,text,text,jsonb,text,text[],text[],jsonb,text,jsonb) from public, anon, authenticated;
grant  execute on function public.upsert_expert(text,text,text,text,jsonb,text,text[],text[],jsonb,text,jsonb) to service_role;
