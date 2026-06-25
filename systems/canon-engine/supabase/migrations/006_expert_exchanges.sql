-- Migration: expert_exchanges (the ask/exchange log) + RPCs
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Durable record of every ask sent to a domain expert (and its eventual answer). The
--   Supabase equivalent of the retired Airtable "Exchanges" table. This is what makes the
--   Will-email problem go away: a composed ask lives here, visible + editable in the Expert
--   Liaison console, never lost in a chat session. Inbound replies arrive via canon email
--   ingestion and get linked here later (EL writer / Slice 2).
--
--   Write path = record_expert_exchange / update_expert_exchange (SECURITY DEFINER,
--   service-role-locked), same discipline as record_source_assessment / upsert_expert.

create extension if not exists pgcrypto;

-- =====================================================================
-- expert_exchanges
-- =====================================================================
create table public.expert_exchanges (
  id               uuid primary key default gen_random_uuid(),
  expert_slug      text not null,                          -- references experts.slug (loose; expert may be added later)
  engagement_type  text not null check (engagement_type in ('venture','client','practice')),
  engagement_id    text not null,
  channel          text not null default 'email',
  subject          text,
  body             text,                                   -- the composed ask
  artifact_types   text[] not null default '{}',           -- which gap artifacts this ask covers
  status           text not null default 'drafted' check (status in ('drafted','sent','answered','closed')),
  response         text,                                   -- the expert's answer (filled when linked/answered)
  sent_at          timestamptz,
  answered_at      timestamptz,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.expert_exchanges is
  'Expert ask/exchange log: composed asks to experts + their answers. Expert Liaison console surface; the durable home that keeps asks out of chat. Written via record/update_expert_exchange RPCs.';

create index expert_exchanges_engagement_idx on public.expert_exchanges (engagement_type, engagement_id);
create index expert_exchanges_expert_idx on public.expert_exchanges (expert_slug);
create index expert_exchanges_status_idx on public.expert_exchanges (status);

create trigger expert_exchanges_set_updated_at
  before update on public.expert_exchanges
  for each row execute function public.fn_set_updated_at();

alter table public.expert_exchanges enable row level security;
create policy expert_exchanges_service_all
  on public.expert_exchanges
  for all to service_role using (true) with check (true);

-- =====================================================================
-- record_expert_exchange: create a new ask
-- =====================================================================
create or replace function public.record_expert_exchange(
  p_expert_slug     text,
  p_engagement_type text,
  p_engagement_id   text,
  p_subject         text default null,
  p_body            text default null,
  p_artifact_types  text[] default '{}',
  p_channel         text default 'email',
  p_status          text default 'drafted',
  p_metadata        jsonb default '{}'::jsonb
)
returns public.expert_exchanges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expert_exchanges;
begin
  insert into public.expert_exchanges (
    expert_slug, engagement_type, engagement_id, subject, body,
    artifact_types, channel, status, metadata
  ) values (
    p_expert_slug, p_engagement_type, p_engagement_id, p_subject, p_body,
    coalesce(p_artifact_types,'{}'), p_channel, p_status, coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v_row;
  return v_row;
end;
$$;

-- =====================================================================
-- update_expert_exchange: edit body/status/response (only provided fields)
-- =====================================================================
create or replace function public.update_expert_exchange(
  p_id          uuid,
  p_subject     text default null,
  p_body        text default null,
  p_status      text default null,
  p_response    text default null,
  p_sent_at     timestamptz default null,
  p_answered_at timestamptz default null
)
returns public.expert_exchanges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expert_exchanges;
begin
  update public.expert_exchanges set
    subject     = coalesce(p_subject, subject),
    body        = coalesce(p_body, body),
    status      = coalesce(p_status, status),
    response    = coalesce(p_response, response),
    sent_at     = coalesce(p_sent_at, sent_at),
    answered_at = coalesce(p_answered_at, answered_at),
    updated_at  = now()
  where id = p_id
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.record_expert_exchange is 'Sanctioned write path: create an expert ask. SECURITY DEFINER, service-role only.';
comment on function public.update_expert_exchange is 'Sanctioned write path: edit an expert ask (status/body/response). SECURITY DEFINER, service-role only.';

revoke execute on function public.record_expert_exchange(text,text,text,text,text,text[],text,text,jsonb) from public, anon, authenticated;
grant  execute on function public.record_expert_exchange(text,text,text,text,text,text[],text,text,jsonb) to service_role;
revoke execute on function public.update_expert_exchange(uuid,text,text,text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant  execute on function public.update_expert_exchange(uuid,text,text,text,text,timestamptz,timestamptz) to service_role;
