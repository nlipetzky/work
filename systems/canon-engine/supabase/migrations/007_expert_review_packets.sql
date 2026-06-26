-- Migration: expert_review_packets (the packaging layer) + RPCs
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: expert-liaison (Hermes)
-- Purpose:
--   A review packet is ONE composed communication to a domain expert that bundles the pending
--   (drafted) expert_exchanges asks for that expert into a single, explained, prioritized touch
--   -- so the expert is never hit with N standalone "read this and reply" emails. The individual
--   asks (migration 006) are the members; this layer is the packaging + its send/answer lifecycle.
--
--   Composition runs a deterministic produce -> judge loop in projection-ui (lib/packets/*,
--   AI as a called function, gated by the Hermes packaging doctrine). The COMPOSED draft + the
--   provenance of that run (doctrine_version, rules_passed, judge_notes) persist here.
--
--   Write path = record_review_packet / send_review_packet / record_packet_answer
--   (SECURITY DEFINER, service-role-locked), same discipline as record_expert_exchange.
--   send + answer also advance the MEMBER expert_exchanges rows in lockstep (batch advance),
--   which is what flips the linked outreach items' "expert sign-off" lanes on /outreach.

create extension if not exists pgcrypto;

-- =====================================================================
-- expert_review_packets
-- =====================================================================
create table public.expert_review_packets (
  id                  uuid primary key default gen_random_uuid(),
  expert_slug         text not null,                          -- references experts.slug (loose)
  engagement_type     text not null check (engagement_type in ('venture','client','practice')),
  engagement_id       text not null,
  member_exchange_ids uuid[] not null default '{}',           -- the drafted asks bundled into this packet
  item_order          uuid[] not null default '{}',           -- producer's chosen sequencing of members
  composed_subject    text,                                   -- the ONE communication's subject
  composed_body       text,                                   -- the ONE communication's body
  status              text not null default 'drafted' check (status in ('drafted','sent','answered','closed')),
  doctrine_version    text,                                   -- which packaging-doctrine version produced this
  rules_passed        jsonb not null default '{}'::jsonb,     -- deterministic-gate checklist result
  judge_notes         jsonb not null default '{}'::jsonb,     -- produce->judge loop result (scores, feedback, iterations)
  response            text,                                   -- the expert's full reply (captured on answer)
  sent_at             timestamptz,
  answered_at         timestamptz,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.expert_review_packets is
  'Expert review packets: ONE composed communication bundling the drafted expert_exchanges asks for an expert. The packaging layer above migration 006. Written via record/send/record_packet_answer RPCs; send + answer advance member exchanges in lockstep.';

create index expert_review_packets_engagement_idx on public.expert_review_packets (engagement_type, engagement_id);
create index expert_review_packets_expert_idx on public.expert_review_packets (expert_slug);
create index expert_review_packets_status_idx on public.expert_review_packets (status);

create trigger expert_review_packets_set_updated_at
  before update on public.expert_review_packets
  for each row execute function public.fn_set_updated_at();

alter table public.expert_review_packets enable row level security;
create policy expert_review_packets_service_all
  on public.expert_review_packets
  for all to service_role using (true) with check (true);

-- =====================================================================
-- record_review_packet: persist a freshly composed packet draft.
--   Idempotent re-Package: closes any prior 'drafted' packet for the same
--   expert+engagement so there is only ever one live draft to act on.
-- =====================================================================
create or replace function public.record_review_packet(
  p_expert_slug         text,
  p_engagement_type     text,
  p_engagement_id       text,
  p_member_exchange_ids uuid[],
  p_composed_subject    text default null,
  p_composed_body       text default null,
  p_item_order          uuid[] default '{}',
  p_doctrine_version    text default null,
  p_rules_passed        jsonb default '{}'::jsonb,
  p_judge_notes         jsonb default '{}'::jsonb,
  p_metadata            jsonb default '{}'::jsonb
)
returns public.expert_review_packets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expert_review_packets;
begin
  update public.expert_review_packets
    set status = 'closed', updated_at = now()
    where expert_slug = p_expert_slug
      and engagement_type = p_engagement_type
      and engagement_id = p_engagement_id
      and status = 'drafted';

  insert into public.expert_review_packets (
    expert_slug, engagement_type, engagement_id, member_exchange_ids, item_order,
    composed_subject, composed_body, doctrine_version, rules_passed, judge_notes, metadata
  ) values (
    p_expert_slug, p_engagement_type, p_engagement_id, coalesce(p_member_exchange_ids,'{}'),
    coalesce(p_item_order,'{}'), p_composed_subject, p_composed_body, p_doctrine_version,
    coalesce(p_rules_passed,'{}'::jsonb), coalesce(p_judge_notes,'{}'::jsonb), coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v_row;
  return v_row;
end;
$$;

-- =====================================================================
-- send_review_packet: advance the packet AND its member exchanges to 'sent'
--   in one transaction. Only members still 'drafted' are advanced (a member
--   already sent/answered on its own is left alone).
-- =====================================================================
create or replace function public.send_review_packet(p_id uuid)
returns public.expert_review_packets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expert_review_packets;
begin
  update public.expert_review_packets
    set status = 'sent', sent_at = now(), updated_at = now()
    where id = p_id
    returning * into v_row;

  if v_row.id is null then
    raise exception 'review packet % not found', p_id;
  end if;

  update public.expert_exchanges
    set status = 'sent', sent_at = now(), updated_at = now()
    where id = any (v_row.member_exchange_ids)
      and status = 'drafted';

  return v_row;
end;
$$;

-- =====================================================================
-- record_packet_answer: capture the expert's reply, advance packet to
--   'answered', and distribute per-member outcomes back to expert_exchanges.
--   p_member_verdicts is a jsonb object: { "<exchange_id>": "approved"|"flagged", ... }.
--   Each member gets status='answered', the shared response, and metadata.verdict
--   (read by /outreach to flip the sign-off lane to certified / needs-revision).
-- =====================================================================
create or replace function public.record_packet_answer(
  p_id              uuid,
  p_response        text default null,
  p_member_verdicts jsonb default '{}'::jsonb
)
returns public.expert_review_packets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     public.expert_review_packets;
  v_member  uuid;
  v_verdict text;
begin
  update public.expert_review_packets
    set status = 'answered', answered_at = now(), response = coalesce(p_response, response), updated_at = now()
    where id = p_id
    returning * into v_row;

  if v_row.id is null then
    raise exception 'review packet % not found', p_id;
  end if;

  foreach v_member in array v_row.member_exchange_ids loop
    v_verdict := coalesce(p_member_verdicts->>(v_member::text), null);
    update public.expert_exchanges
      set status      = 'answered',
          answered_at = now(),
          response    = coalesce(p_response, response),
          metadata    = case when v_verdict is null then metadata
                             else metadata || jsonb_build_object('verdict', v_verdict) end,
          updated_at  = now()
      where id = v_member
        and status in ('sent','drafted');
  end loop;

  return v_row;
end;
$$;

comment on function public.record_review_packet is 'Sanctioned write path: persist a composed review packet (closes prior drafts). SECURITY DEFINER, service-role only.';
comment on function public.send_review_packet  is 'Sanctioned write path: send a packet -- advances packet + drafted member exchanges to sent. SECURITY DEFINER, service-role only.';
comment on function public.record_packet_answer is 'Sanctioned write path: capture a packet reply -- answers packet + distributes per-member verdicts to exchanges. SECURITY DEFINER, service-role only.';

revoke execute on function public.record_review_packet(text,text,text,uuid[],text,text,uuid[],text,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant  execute on function public.record_review_packet(text,text,text,uuid[],text,text,uuid[],text,jsonb,jsonb,jsonb) to service_role;
revoke execute on function public.send_review_packet(uuid) from public, anon, authenticated;
grant  execute on function public.send_review_packet(uuid) to service_role;
revoke execute on function public.record_packet_answer(uuid,text,jsonb) from public, anon, authenticated;
grant  execute on function public.record_packet_answer(uuid,text,jsonb) to service_role;
