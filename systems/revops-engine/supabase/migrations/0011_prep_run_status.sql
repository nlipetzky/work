-- 0011_prep_run_status.sql — run-progress observability for the play-prep funnel.
--
-- One row per (run_id, stage). A run is the five-stage prep funnel (stage1 -> classify -> dedup ->
-- route -> contacts_screen) tied together by a single run_id minted at kickoff. Stages flip
-- pending -> running -> done|error and carry per-stage counts + a live sub-step message. This is the
-- run-side mirror of the data-observability that already exists in staging; the projection-ui Runs
-- page tails it to show the work move.
--
-- Owned equivalent of Deepline's `session start --steps` / `--update --status` / `session status
-- --message`. Written by the runners via the Supabase Management API (postgres role, bypasses RLS);
-- read by projection-ui via the service-role key (bypasses RLS). No anon/authenticated access.

create table if not exists public.prep_run_status (
  run_id      uuid        not null,
  batch_id    text        not null,
  entity      text        not null,                       -- companies | contacts
  stage       text        not null,                       -- stage1 | classify | dedup | route | contacts_screen
  stage_order smallint    not null,
  status      text        not null default 'pending'
              check (status in ('pending','running','done','error')),
  counts      jsonb       not null default '{}'::jsonb,
  message     text,
  started_at  timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (run_id, stage)
);

create index if not exists prep_run_status_batch_idx
  on public.prep_run_status (batch_id, run_id);

-- Surface the active/most-recent run quickly (latest activity first).
create index if not exists prep_run_status_updated_idx
  on public.prep_run_status (updated_at desc);

alter table public.prep_run_status enable row level security;
-- Intentionally no policies: only the postgres (Management API) and service-role keys touch this table,
-- and both bypass RLS. anon/authenticated get nothing.
