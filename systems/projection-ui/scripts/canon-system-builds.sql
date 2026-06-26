-- canon_engine (mzzjvoiwughcnmmqzbxv) :: system-building system
-- One row per system being built, tracked through the four-move methodology.
-- Applied 2026-06-25 via Supabase MCP apply_migration (no local migrations dir for canon).
-- See practices/agentic-systems/reference/system-building-methodology.md

create table if not exists public.system_builds (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  current_move     int  not null default 1 check (current_move between 1 and 4),
  status           text not null default 'in_flight' check (status in ('in_flight','blocked','done')),
  pending_ask_type text check (pending_ask_type in ('ratify_brief','react_sketch','trust_slice','confirm_capability')),
  pending_ask_text text,
  brief_path       text,
  sketch_path      text,
  system_slug      text,   -- set at Move 4 when the build registers into public.systems
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.system_builds is
  'System-building system: one row per system being built, tracked through the four-move methodology (1 Brief, 2 Sketch, 3 Slice, 4 Grow). pending_ask is the single human-in-the-loop ask for the current move; it surfaces on the /build console, never in chat. Written via the /api/build routes (service role). Gets a public.systems row at Move 4 (system_slug).';

-- Match canon posture: RLS on, no anon policy. The app reads/writes with the service role, which bypasses RLS.
alter table public.system_builds enable row level security;
