-- Migration: artifact_operator_notes (the expert-input channel) + record_operator_note RPC
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The channel for an operator / domain expert to inject context into a governed artifact WITHOUT a
--   chat session ... the seed point of the targeting flywheel. Example: "patents aren't a blocker; watch
--   USPTO PatentsView for filings, resolve to companies, then enrich." The note is durable and is folded
--   into the artifact's drafting source by assemble-targeting-source.mjs, so the next Produce incorporates
--   it. This is how an operator's "I know where that data lives / how to source this" becomes system input
--   the producer reasons from (the human side of the expert-knowledge loop).
--
--   Write path = record_operator_note RPC (SECURITY DEFINER, service-role-locked), same discipline as the
--   other governed writes.

create extension if not exists pgcrypto;

create table public.artifact_operator_notes (
  id              uuid primary key default gen_random_uuid(),
  engagement_type text not null,
  engagement_id   text not null,
  artifact_type   text not null,
  note            text not null,
  author          text not null default 'Nick',
  created_at      timestamptz not null default now()
);

comment on table public.artifact_operator_notes is
  'Operator / expert context injected into a governed artifact (the expert-input channel). Folded into the drafting source so the next Produce incorporates it. Written via record_operator_note RPC.';

create index artifact_operator_notes_target_idx
  on public.artifact_operator_notes (engagement_type, engagement_id, artifact_type, created_at desc);

alter table public.artifact_operator_notes enable row level security;
create policy artifact_operator_notes_service_all
  on public.artifact_operator_notes for all to service_role using (true) with check (true);

create or replace function public.record_operator_note(
  p_engagement_type text,
  p_engagement_id   text,
  p_artifact_type   text,
  p_note            text,
  p_author          text default 'Nick'
)
returns public.artifact_operator_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.artifact_operator_notes;
begin
  insert into public.artifact_operator_notes (engagement_type, engagement_id, artifact_type, note, author)
  values (p_engagement_type, p_engagement_id, p_artifact_type, p_note, coalesce(p_author, 'Nick'))
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.record_operator_note is
  'Sanctioned write path for an operator/expert note on an artifact. SECURITY DEFINER, service-role only.';

revoke execute on function public.record_operator_note(text,text,text,text,text) from public, anon, authenticated;
grant  execute on function public.record_operator_note(text,text,text,text,text) to service_role;
