-- Migration: outreach_sequences (System M copy store) + record/confirm RPCs
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Phase 3 of the offer-first outreach build: the Outreach Producer's COPY output. Copy is
--   structured per-step (and maps to a channel's send model: LinkedIn's connect/DM/visit/follow-up,
--   email's subject/body touches), so it lives in its OWN table, NOT canon_artifacts (which holds
--   prose context artifacts). One row per produced channel sequence, versioned like canon_artifacts.
--
--   The copy producer (scripts/produce-sequence.mjs) is a fork of the govern-artifacts shape:
--   CODE owns the loop, AI is a called function at produce + judge, deterministic rules-gate first.
--   Writes go through the SECURITY DEFINER RPCs only (mirrors record_source_assessment).
--
--   PROVENANCE: every row carries `inputs` = the exact input lineage used to produce it
--   (each HINGE/SUBSTANCE/VOICE/FORM input with its artifact_type+version+id, or file path). This is
--   the trail the artifact-lineage viewer reads ("what context made this"). `rules_passed` records
--   the doctrine-compliance checklist; `flags` records unsourced/blocked lines (no fabrication).

create extension if not exists pgcrypto;

create table public.outreach_sequences (
  id                 uuid primary key default gen_random_uuid(),
  engagement_type    text not null,
  engagement_id      text not null,
  play               text,                                  -- play slug; null for the v0 template
  channel            text not null check (channel in ('linkedin','email')),
  sender_expert_slug text,                                  -- whose identity the copy goes out under
  front_end_offer    text,                                  -- which front-end offer (from the ladder) this leads with
  steps              jsonb not null default '[]'::jsonb,    -- [{order, action_type, delay_hours, subject, copy, char_count, source_map:[{line,source}]}]
  note_variants      jsonb not null default '{}'::jsonb,    -- {noted, noteless} for LinkedIn A/B; {} for email
  flags              jsonb not null default '[]'::jsonb,    -- unsourced / blocked lines (INSUFFICIENT_SOURCE)
  rules_passed       jsonb not null default '[]'::jsonb,    -- the doctrine-compliance checklist (which gates passed)
  inputs             jsonb not null default '[]'::jsonb,    -- INPUT LINEAGE / provenance: what context produced this
  status             text not null default 'draft' check (status in ('draft','approved','superseded')),
  version            integer not null default 1,
  approver           text,                                  -- who/what proposed the draft
  confirmed_by       text,                                  -- who approved it
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.outreach_sequences is
  'System M (Outreach Producer) copy output: per-channel outreach sequences. Versioned, governed via record_outreach_sequence / confirm_outreach_sequence RPCs. `inputs` is the provenance trail (what context produced this).';

create index outreach_sequences_engagement_idx on public.outreach_sequences (engagement_type, engagement_id);
create index outreach_sequences_channel_idx    on public.outreach_sequences (engagement_type, engagement_id, channel);
create index outreach_sequences_status_idx     on public.outreach_sequences (status);

create trigger outreach_sequences_set_updated_at
  before update on public.outreach_sequences
  for each row execute function public.fn_set_updated_at();

-- RLS: enabled, service_role permissive (match the canon_engine convention)
alter table public.outreach_sequences enable row level security;
create policy outreach_sequences_service_all
  on public.outreach_sequences for all to service_role using (true) with check (true);

-- =====================================================================
-- record_outreach_sequence: sanctioned write path. Supersedes the prior live draft for the same
-- (engagement, channel), versions up, inserts the new draft. Returns the inserted row.
-- =====================================================================
create or replace function public.record_outreach_sequence(
  p_engagement_type    text,
  p_engagement_id      text,
  p_channel            text,
  p_steps              jsonb,
  p_sender_expert_slug text default null,
  p_front_end_offer    text default null,
  p_note_variants      jsonb default '{}'::jsonb,
  p_flags              jsonb default '[]'::jsonb,
  p_rules_passed       jsonb default '[]'::jsonb,
  p_inputs             jsonb default '[]'::jsonb,
  p_play               text default null,
  p_approver           text default null,
  p_metadata           jsonb default '{}'::jsonb
)
returns public.outreach_sequences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     public.outreach_sequences;
  v_version integer;
begin
  -- supersede the prior live draft for this engagement+channel, version up
  update public.outreach_sequences
     set status = 'superseded'
   where engagement_type = p_engagement_type
     and engagement_id   = p_engagement_id
     and channel         = p_channel
     and status          = 'draft';

  select coalesce(max(version), 0) + 1 into v_version
    from public.outreach_sequences
   where engagement_type = p_engagement_type
     and engagement_id   = p_engagement_id
     and channel         = p_channel;

  insert into public.outreach_sequences (
    engagement_type, engagement_id, channel, steps, sender_expert_slug, front_end_offer,
    note_variants, flags, rules_passed, inputs, play, approver, metadata, version, status
  ) values (
    p_engagement_type, p_engagement_id, p_channel, coalesce(p_steps,'[]'::jsonb), p_sender_expert_slug, p_front_end_offer,
    coalesce(p_note_variants,'{}'::jsonb), coalesce(p_flags,'[]'::jsonb), coalesce(p_rules_passed,'[]'::jsonb),
    coalesce(p_inputs,'[]'::jsonb), p_play, p_approver, coalesce(p_metadata,'{}'::jsonb), v_version, 'draft'
  )
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.record_outreach_sequence is
  'Sanctioned write path for System M copy. Supersedes prior draft, versions up, inserts a draft. SECURITY DEFINER, service-role only.';

-- =====================================================================
-- confirm_outreach_sequence: human approval (draft -> approved)
-- =====================================================================
create or replace function public.confirm_outreach_sequence(
  p_sequence_id  uuid,
  p_confirmed_by text
)
returns public.outreach_sequences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.outreach_sequences;
begin
  update public.outreach_sequences
     set status = 'approved', confirmed_by = p_confirmed_by
   where id = p_sequence_id
  returning * into v_row;
  if v_row.id is null then raise exception 'outreach_sequence % not found', p_sequence_id; end if;
  return v_row;
end;
$$;

comment on function public.confirm_outreach_sequence is
  'Human approval for a System M copy sequence (draft -> approved). SECURITY DEFINER, service-role only.';

revoke execute on function public.record_outreach_sequence(text,text,text,jsonb,text,text,jsonb,jsonb,jsonb,jsonb,text,text,jsonb) from public, anon, authenticated;
grant  execute on function public.record_outreach_sequence(text,text,text,jsonb,text,text,jsonb,jsonb,jsonb,jsonb,text,text,jsonb) to service_role;
revoke execute on function public.confirm_outreach_sequence(uuid,text) from public, anon, authenticated;
grant  execute on function public.confirm_outreach_sequence(uuid,text) to service_role;
