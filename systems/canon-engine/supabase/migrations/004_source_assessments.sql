-- Migration: source_assessments (the curation ledger) + record_source_assessment RPC
-- Date: 2026-06-24
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The Expert Liaison curation loop assesses sources (transcripts, email, docs) for
--   relevance to artifacts under governance, extracts the load-bearing snippet, and
--   feeds it to the Artifact Assembler. Until now that "what was reviewed and what came
--   out" lineage lived only in the agent's memory. This table makes it visible + durable.
--   It is the Expert Liaison system's observability surface (system-anatomy part 8).
--
--   Write path is the SECURITY DEFINER RPC record_source_assessment (mirrors the
--   propose_artifact / confirm_artifact convention: canon writes go through RPCs only).
--   The automated assessor (Expert-Liaison-as-code) will call this RPC; for now the
--   hand-proven CIPO lineage is backfilled through it too.

create extension if not exists pgcrypto;

-- =====================================================================
-- source_assessments
-- =====================================================================
create table public.source_assessments (
  id                uuid primary key default gen_random_uuid(),
  -- the source that was reviewed
  source_type       text not null check (source_type in ('transcript','email','document','chunk')),
  source_id         text not null,                          -- ref into source table (drive-file-id / uuid / message id) -> text, sources are not uniformly uuid
  source_locator    text,                                   -- human-readable: path / title / meeting label
  -- which engagement this assessment was performed for
  engagement_type   text not null check (engagement_type in ('venture','client','practice')),
  engagement_id     text not null,
  -- the assessment
  assessed_at       timestamptz not null default now(),
  assessed_by       text not null,                          -- agent id ('expert-liaison/hermes') or human email
  outcome           text not null check (outcome in ('valuable','not_valuable','insufficient','unclear')),
  reasoning         text,                                   -- why this outcome (feeds the future learning loop)
  -- what came out
  snippet           text,                                   -- the extracted load-bearing passage
  artifact_type     text,                                   -- which artifact it fed (null when not_valuable)
  artifact_id       uuid references public.canon_artifacts(id) on delete set null,
  fed_to_assembler  boolean not null default false,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.source_assessments is
  'Curation ledger: source -> assessed -> valuable? -> extracted snippet -> fed-which-artifact. Expert Liaison observability surface; written only via record_source_assessment RPC.';

create index source_assessments_engagement_idx
  on public.source_assessments (engagement_type, engagement_id);
create index source_assessments_source_idx
  on public.source_assessments (source_type, source_id);
create index source_assessments_artifact_idx
  on public.source_assessments (artifact_id);
create index source_assessments_outcome_idx
  on public.source_assessments (outcome);

-- updated_at trigger: reuse the existing canon_engine convention.
create trigger source_assessments_set_updated_at
  before update on public.source_assessments
  for each row execute function public.fn_set_updated_at();

-- =====================================================================
-- RLS (match existing canon_engine pattern: enabled, service_role permissive)
-- =====================================================================
alter table public.source_assessments enable row level security;

create policy source_assessments_service_all
  on public.source_assessments
  for all to service_role using (true) with check (true);

-- =====================================================================
-- record_source_assessment: the sanctioned write path
-- =====================================================================
create or replace function public.record_source_assessment(
  p_source_type      text,
  p_source_id        text,
  p_engagement_type  text,
  p_engagement_id    text,
  p_assessed_by      text,
  p_outcome          text,
  p_source_locator   text default null,
  p_reasoning        text default null,
  p_snippet          text default null,
  p_artifact_type    text default null,
  p_artifact_id      uuid default null,
  p_fed_to_assembler boolean default false,
  p_metadata         jsonb default '{}'::jsonb
)
returns public.source_assessments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.source_assessments;
begin
  insert into public.source_assessments (
    source_type, source_id, source_locator,
    engagement_type, engagement_id,
    assessed_by, outcome, reasoning,
    snippet, artifact_type, artifact_id, fed_to_assembler, metadata
  ) values (
    p_source_type, p_source_id, p_source_locator,
    p_engagement_type, p_engagement_id,
    p_assessed_by, p_outcome, p_reasoning,
    p_snippet, p_artifact_type, p_artifact_id, p_fed_to_assembler, coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.record_source_assessment is
  'Sanctioned write path for the curation ledger. SECURITY DEFINER (source_assessments is service-role-only). Returns the inserted row.';

-- Lock the RPC to service_role only (tighter than the sibling propose_artifact/confirm_artifact
-- which remain anon-executable). Only the EL driver / backfill, both service-role, call this.
revoke execute on function public.record_source_assessment(text,text,text,text,text,text,text,text,text,text,uuid,boolean,jsonb) from public, anon, authenticated;
grant  execute on function public.record_source_assessment(text,text,text,text,text,text,text,text,text,text,uuid,boolean,jsonb) to service_role;
