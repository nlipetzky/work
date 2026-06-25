-- Migration: discovery_recipes (the recipe library) + record/confirm RPCs
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The home for recipes AUTHORED by the recipe-authoring agent: given a signal/intent, it composes a new
--   discovery recipe (signal -> qualified-leads pipeline) grounded in the LIVE deepline tool universe
--   (deepline tools search) + the §6 custom authoritative sources, and records it here. Many recipes per
--   engagement, one per signal/intent (keyed by name). This is the agentic leap beyond the single
--   discovery-recipe artifact: the system composes pipelines from an intent, not just one fixed recipe.
--
--   `tools_used` is the provenance: the real deepline tool ids / custom sources each step is grounded in
--   (the anti-fabrication record). Write path = record/confirm_discovery_recipe RPCs (SECURITY DEFINER,
--   service-role-locked).

create extension if not exists pgcrypto;

create table public.discovery_recipes (
  id              uuid primary key default gen_random_uuid(),
  engagement_type text not null,
  engagement_id   text not null,
  name            text not null,                       -- slug / short name of the recipe
  signal          text,                                -- the entry signal (short)
  intent          text,                                -- the free-text intent it was authored from
  content_md      text not null,                       -- the full ordered pipeline
  steps           jsonb not null default '[]'::jsonb,  -- optional structured steps
  tools_used      jsonb not null default '[]'::jsonb,  -- grounded tool ids / custom sources (provenance)
  status          text not null default 'draft' check (status in ('draft','approved','superseded')),
  version         integer not null default 1,
  authored_by     text not null default 'recipe-authoring-agent',
  confirmed_by    text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.discovery_recipes is
  'Recipe library: signal -> qualified-leads pipelines composed by the recipe-authoring agent, grounded in the live deepline tool universe + custom authoritative sources. Written via record/confirm_discovery_recipe RPCs.';

create index discovery_recipes_engagement_idx on public.discovery_recipes (engagement_type, engagement_id);
create index discovery_recipes_name_idx on public.discovery_recipes (engagement_type, engagement_id, name);
create index discovery_recipes_status_idx on public.discovery_recipes (status);

create trigger discovery_recipes_set_updated_at
  before update on public.discovery_recipes
  for each row execute function public.fn_set_updated_at();

alter table public.discovery_recipes enable row level security;
create policy discovery_recipes_service_all
  on public.discovery_recipes for all to service_role using (true) with check (true);

create or replace function public.record_discovery_recipe(
  p_engagement_type text,
  p_engagement_id   text,
  p_name            text,
  p_content_md      text,
  p_signal          text default null,
  p_intent          text default null,
  p_steps           jsonb default '[]'::jsonb,
  p_tools_used      jsonb default '[]'::jsonb,
  p_authored_by     text default 'recipe-authoring-agent',
  p_metadata        jsonb default '{}'::jsonb
)
returns public.discovery_recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     public.discovery_recipes;
  v_version integer;
begin
  update public.discovery_recipes
     set status = 'superseded'
   where engagement_type = p_engagement_type and engagement_id = p_engagement_id
     and name = p_name and status = 'draft';

  select coalesce(max(version), 0) + 1 into v_version
    from public.discovery_recipes
   where engagement_type = p_engagement_type and engagement_id = p_engagement_id and name = p_name;

  insert into public.discovery_recipes (
    engagement_type, engagement_id, name, signal, intent, content_md, steps, tools_used,
    authored_by, metadata, version, status
  ) values (
    p_engagement_type, p_engagement_id, p_name, p_signal, p_intent, p_content_md,
    coalesce(p_steps,'[]'::jsonb), coalesce(p_tools_used,'[]'::jsonb), p_authored_by,
    coalesce(p_metadata,'{}'::jsonb), v_version, 'draft'
  )
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.record_discovery_recipe is
  'Sanctioned write path for an authored recipe. Supersedes prior draft of the same name, versions up. SECURITY DEFINER, service-role only.';

create or replace function public.confirm_discovery_recipe(
  p_recipe_id    uuid,
  p_confirmed_by text
)
returns public.discovery_recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.discovery_recipes;
begin
  update public.discovery_recipes
     set status = 'approved', confirmed_by = p_confirmed_by
   where id = p_recipe_id
  returning * into v_row;
  if v_row.id is null then raise exception 'discovery_recipe % not found', p_recipe_id; end if;
  return v_row;
end;
$$;

comment on function public.confirm_discovery_recipe is
  'Human approval for an authored recipe (draft -> approved). SECURITY DEFINER, service-role only.';

revoke execute on function public.record_discovery_recipe(text,text,text,text,text,text,jsonb,jsonb,text,jsonb) from public, anon, authenticated;
grant  execute on function public.record_discovery_recipe(text,text,text,text,text,text,jsonb,jsonb,text,jsonb) to service_role;
revoke execute on function public.confirm_discovery_recipe(uuid,text) from public, anon, authenticated;
grant  execute on function public.confirm_discovery_recipe(uuid,text) to service_role;
