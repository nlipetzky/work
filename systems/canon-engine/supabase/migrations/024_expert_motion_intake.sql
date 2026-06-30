-- Migration: expert_motion_intake (expert_requests + expert_motions tables)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: expert-liaison-engine (Hermes)
-- Purpose:
--   The INTAKE + persistence front-half of the expert-liaison loop. expert_requests is the
--   raw inbound ask any agent/system hands off; expert_motions is the durable, goal-owning
--   thread that drives follow-up until satisfied or abandoned. Together they feed the existing
--   expert_exchanges (006) -> expert_review_packets (007) outbound machinery, and bind the
--   resolved verdict back to the asking system.
--
--   Membrane seam: target_type/target_ref abstract the recipient so a motion routes to a human
--   expert today and a maturing AI expert-folder later with no schema change.
--
--   Write path = record_expert_request / triage_expert_request / advance_motion (migration 025,
--   SECURITY DEFINER, service-role-locked). No direct table writes.

create extension if not exists pgcrypto;

-- =====================================================================
-- expert_motions: the durable, goal-owning thread (sole state-writer = advance_motion)
-- =====================================================================
create table public.expert_motions (
  id                uuid primary key default gen_random_uuid(),
  -- membrane recipient abstraction
  target_type       text not null default 'human_expert' check (target_type in ('human_expert','ai_expert_folder')),
  target_ref        text,                                   -- human_expert => experts.slug; ai_expert_folder => folder id
  expert_slug       text,                                   -- operative human handle (= target_ref when human); kept for zero-join surface + convention match
  engagement_type   text not null check (engagement_type in ('venture','client','practice')),
  engagement_id     text not null,
  concerning_system text,                                   -- system whose output the expert stewards = bind-back target; null for direction/onboarding
  goal              text not null,                          -- expert-facing destination outcome
  goal_key          text not null,                          -- deterministic dedup key (producer/triage supplied)
  goal_predicate    jsonb not null default '{"rule":"all","line_items":[]}'::jsonb,
  satisfaction      text not null default 'none' check (satisfaction in ('none','partial','full')),
  status            text not null default 'open' check (status in ('open','active','parked','achieved','abandoned')),
  ball_in_court     text not null default 'operator' check (ball_in_court in ('expert','operator')),
  next_action_due   timestamptz,
  next_action_kind  text check (next_action_kind in ('nudge','clarify','re_ask_revised','escalate','review_for_abandon')),
  opened_from_request_ids uuid[] not null default '{}',
  resolution        text check (resolution in ('goal_satisfied','expert_declined','resolved_to_default','abandoned')),
  resolution_reason text,
  bind_target       jsonb,                                  -- {system, artifact_type, artifact_id?, kind} read on achieved
  bound_at          timestamptz,
  meta              jsonb not null default '{}'::jsonb,
  created_by        text,
  session_id        text,
  owner_actor_id    text not null default 'expert-liaison',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.expert_motions is
  'Expert-liaison MOTION: durable goal-owning thread that drives follow-up until satisfied/abandoned. goal_predicate.line_items point at the expert_exchanges that resolve them; verdicts live on the exchange, never copied here. Sole state-writer: advance_motion. target_type/target_ref abstract the recipient (human today, AI expert-folder later).';

create index expert_motions_engagement_idx on public.expert_motions (engagement_type, engagement_id);
create index expert_motions_expert_idx on public.expert_motions (expert_slug);
create index expert_motions_concerning_system_idx on public.expert_motions (concerning_system);
-- attach-dedup: at most one live motion per goal in an engagement
create unique index expert_motions_goal_key_live_uidx on public.expert_motions (engagement_type, engagement_id, goal_key)
  where status in ('open','active','parked');
-- sweep: due follow-ups on active motions only
create index expert_motions_due_idx on public.expert_motions (next_action_due)
  where status = 'active';

create trigger expert_motions_set_updated_at
  before update on public.expert_motions
  for each row execute function public.fn_set_updated_at();

alter table public.expert_motions enable row level security;
create policy expert_motions_service_all
  on public.expert_motions
  for all to service_role using (true) with check (true);

-- =====================================================================
-- expert_requests: raw inbound ask (the intake atom)
-- =====================================================================
create table public.expert_requests (
  id                uuid primary key default gen_random_uuid(),
  motion_id         uuid references public.expert_motions(id) on delete set null,
  request_type      text not null check (request_type in ('verdict','approval','direction','learning','onboarding')),
  target_type       text not null default 'human_expert' check (target_type in ('human_expert','ai_expert_folder')),
  target_ref        text,
  expert_slug       text,
  engagement_type   text not null check (engagement_type in ('venture','client','practice')),
  engagement_id     text not null,
  concerning_system text,
  source_system     text,                                   -- which agent/system emitted this
  source_ref        text,                                   -- idempotency key for producer re-runs
  goal_key          text,                                   -- producer-supplied dedup hint (else derived at triage)
  subject           text,
  body              text,
  payload           jsonb not null default '{}'::jsonb,     -- structured handoff (batch ids, contact ids, etc.)
  status            text not null default 'open' check (status in ('open','triaged','attached','dismissed')),
  created_by        text,
  session_id        text,
  created_at        timestamptz not null default now()
);

comment on table public.expert_requests is
  'Expert-liaison INTAKE atom: a raw inbound ask handed off by a producing agent/system. Triaged into an expert_motion (verdict/approval/learning) or dismissed (direction/onboarding). Write path: record_expert_request. Idempotent on (source_system, source_ref).';

create index expert_requests_status_idx on public.expert_requests (status);
create index expert_requests_expert_idx on public.expert_requests (expert_slug);
create index expert_requests_motion_idx on public.expert_requests (motion_id);
create unique index expert_requests_source_uidx on public.expert_requests (source_system, source_ref)
  where source_system is not null and source_ref is not null;

alter table public.expert_requests enable row level security;
create policy expert_requests_service_all
  on public.expert_requests
  for all to service_role using (true) with check (true);
