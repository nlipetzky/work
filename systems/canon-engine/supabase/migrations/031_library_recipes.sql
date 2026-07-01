-- Migration: library_recipes (reusable recipe templates) + graph + stage binding + publish
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: operating-sop / AI-expert-folder (Boris)
-- Purpose:
--   The reusable, library-owned recipe: a named, ordered workflow-template referenced by a SOP stage
--   and adapted per-cohort. Named library_recipes to avoid the different-sense discovery_recipes (015).
--   The body reuses the 018 node/edge shape verbatim so the /operate workflow renderer works unchanged;
--   the dependency-ordering (company->domain->contact->linkedin->employment-verify) lives in the edges.
--   layer=backbone|overlay (the ~90/10 split); overlays reference a backbone via overrides_recipe_id.
--   sop_stage_recipes is the recipe twin of sop_stage_workflows: a stage points at a FROZEN recipe
--   version, so the library iterates to v+1 without mutating any published SOP. publish_recipe_version
--   mirrors publish_activity_version (023): demote-then-promote inside one SECURITY DEFINER body.

-- ─── recipe head (version-pinned, mirrors public.workflows) ──────────────────
create table public.library_recipes (
  recipe_id           text not null,
  version             int not null default 1,
  is_current          boolean not null default true,
  folder_slug         text not null references public.expert_folders(folder_slug),
  name                text not null,
  description         text,
  control_flow        text not null default 'fixed' check (control_flow in ('fixed','agent-driven')),
  layer               text not null default 'backbone' check (layer in ('backbone','overlay')),
  overrides_recipe_id text,                               -- when layer='overlay', the backbone it overlays
  viewbox             jsonb not null default '{}'::jsonb, -- parity with workflows.viewbox for the SVG
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (recipe_id, version)
);

comment on table public.library_recipes is
  'Reusable recipe templates (library-owned ordered workflow-templates referenced by SOP stages). Version-pinned like public.workflows; body in library_recipe_nodes/_edges reuses the 018 shape so the /operate renderer is unchanged. layer=backbone|overlay is the ~90/10 general-vs-domain split.';

create unique index library_recipes_current_uq on public.library_recipes (recipe_id) where is_current;
create index library_recipes_folder_idx on public.library_recipes (folder_slug);

create trigger library_recipes_set_updated_at
  before update on public.library_recipes
  for each row execute function public.fn_set_updated_at();

-- ─── recipe body: nodes + edges (mirror workflow_nodes / workflow_edges) ─────
create table public.library_recipe_nodes (
  recipe_id   text not null,
  version     int  not null,
  node_id     text not null,
  activity_id text,                                       -- loose ref to sop_activities.activity_id
  label       text,
  position    jsonb not null default '{}'::jsonb,         -- {x,y}
  primary key (recipe_id, version, node_id)
);

create table public.library_recipe_edges (
  recipe_id text not null,
  version   int  not null,
  from_node text not null,
  to_node   text not null,
  branch    text check (branch in ('default','edge','fail')),
  label     text
);

create index library_recipe_edges_idx on public.library_recipe_edges (recipe_id, version);

-- ─── stage binding: the recipe twin of sop_stage_workflows ───────────────────
create table public.sop_stage_recipes (
  sop_id         text not null,
  stage_id       text not null,
  recipe_id      text not null,
  recipe_version int  not null,                           -- pins a FROZEN recipe version
  ordinal        int  not null default 0,
  created_at     timestamptz not null default now(),
  primary key (sop_id, stage_id, recipe_id, recipe_version)
);

comment on table public.sop_stage_recipes is
  'Contract: which library recipe a SOP stage references. Loose text refs; recipe_version pins a frozen recipe so library iteration never mutates a published SOP. Sibling to sop_stage_workflows; a stage may use either.';

-- ─── RLS (service-role only, canon convention) ──────────────────────────────
alter table public.library_recipes      enable row level security;
alter table public.library_recipe_nodes enable row level security;
alter table public.library_recipe_edges enable row level security;
alter table public.sop_stage_recipes    enable row level security;
create policy library_recipes_service_all      on public.library_recipes      for all to service_role using (true) with check (true);
create policy library_recipe_nodes_service_all on public.library_recipe_nodes for all to service_role using (true) with check (true);
create policy library_recipe_edges_service_all on public.library_recipe_edges for all to service_role using (true) with check (true);
create policy sop_stage_recipes_service_all    on public.sop_stage_recipes    for all to service_role using (true) with check (true);

-- ─── publish_recipe_version (mirrors publish_activity_version, 023) ──────────
create or replace function public.publish_recipe_version(
  p_recipe_id text,
  p_version   int,
  p_by        text default null
) returns public.library_recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.library_recipes;
begin
  perform 1 from public.library_recipes where recipe_id = p_recipe_id and version = p_version;
  if not found then
    raise exception 'recipe version not found: % v%', p_recipe_id, p_version;
  end if;

  update public.library_recipes
    set is_current = false
    where recipe_id = p_recipe_id and is_current = true and version <> p_version;

  update public.library_recipes
    set is_current = true
    where recipe_id = p_recipe_id and version = p_version
    returning * into r;

  return r;
end;
$$;

revoke all on function public.publish_recipe_version(text, int, text) from public, anon, authenticated;
grant execute on function public.publish_recipe_version(text, int, text) to service_role;

-- ─── convenience view ────────────────────────────────────────────────────────
create or replace view public.v_current_recipes as
  select * from public.library_recipes where is_current;

revoke all on public.v_current_recipes from public, anon, authenticated;
grant select on public.v_current_recipes to service_role;
