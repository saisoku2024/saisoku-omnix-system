-- SAISOKU OMNIX reporting database schema
-- Run this in the Supabase SQL editor for a new project.
-- Backend writes use SUPABASE_SERVICE_ROLE_KEY, so keep direct client access locked down.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text not null check (file_type in ('omnix', 'voice', 'csat')),
  storage_path text,
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'success', 'failed')),
  total_rows integer not null default 0 check (total_rows >= 0),
  inserted_rows integer not null default 0 check (inserted_rows >= 0),
  duplicate_rows integer not null default 0 check (duplicate_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.omnix_cases (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  ticket_id text not null unique,
  interaction_at timestamptz,
  created_at timestamptz,
  customer_name text,
  customer_hp text,
  channel text,
  source_name text,
  date_first_response_interaction timestamptz,
  date_end_interaction timestamptz,
  is_escalated text,
  ticket_status_name text,
  main_category text,
  category text,
  subcategory text,
  detail_subcategory text,
  detail_subcategory2 text,
  agent_name text,
  handling_time_sec integer check (handling_time_sec is null or handling_time_sec >= 0),
  response_time_sec integer check (response_time_sec is null or response_time_sec >= 0),
  waiting_time_sec integer check (waiting_time_sec is null or waiting_time_sec >= 0),
  feedback text,
  -- Optional reporting dimensions used by dashboard/report RPCs when available.
  brand text,
  product text,
  principal_group text,
  principal_category text,
  csat_dispatch_status text,
  csat_response_status text,
  rating_csat text,
  ingested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_interactions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  unique_id text not null unique,
  interaction_at timestamptz,
  created_at timestamptz,
  connected_at timestamptz,
  ended_at timestamptz,
  queue_name text,
  agent_name text,
  call_event text,
  clid_raw text,
  clid_normalized text,
  wait_time_sec integer check (wait_time_sec is null or wait_time_sec >= 0),
  talk_time_sec integer check (talk_time_sec is null or talk_time_sec >= 0),
  ring_time_sec integer check (ring_time_sec is null or ring_time_sec >= 0),
  hold_time_sec integer check (hold_time_sec is null or hold_time_sec >= 0),
  dst text,
  recording_file text,
  rec_ai text,
  channel text not null default 'voice',
  call_status text,
  ingested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.csat_responses (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  source_id text not null unique,
  sid text,
  unique_id text,
  channel text,
  account text,
  response_type text,
  score numeric,
  message text,
  additional_message text,
  feedback text,
  flow_token text,
  rating_csat text,
  created_at_source timestamptz,
  created_at timestamptz,
  updated_at_source timestamptz,
  ingested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uploads_file_type on public.uploads(file_type);
create index if not exists idx_uploads_processing_status on public.uploads(processing_status);
create index if not exists idx_uploads_created_at on public.uploads(created_at);

create index if not exists idx_omnix_cases_upload_id on public.omnix_cases(upload_id);
create index if not exists idx_omnix_cases_interaction_at on public.omnix_cases(interaction_at);
create index if not exists idx_omnix_cases_created_at on public.omnix_cases(created_at);
create index if not exists idx_omnix_cases_channel on public.omnix_cases(channel);
create index if not exists idx_omnix_cases_main_category on public.omnix_cases(main_category);
create index if not exists idx_omnix_cases_brand on public.omnix_cases(brand);
create index if not exists idx_omnix_cases_product on public.omnix_cases(product);

create index if not exists idx_voice_interactions_upload_id on public.voice_interactions(upload_id);
create index if not exists idx_voice_interactions_interaction_at on public.voice_interactions(interaction_at);
create index if not exists idx_voice_interactions_created_at on public.voice_interactions(created_at);
create index if not exists idx_voice_interactions_agent_name on public.voice_interactions(agent_name);
create index if not exists idx_voice_interactions_call_status on public.voice_interactions(call_status);

create index if not exists idx_csat_responses_upload_id on public.csat_responses(upload_id);
create index if not exists idx_csat_responses_created_at on public.csat_responses(created_at);
create index if not exists idx_csat_responses_created_at_source on public.csat_responses(created_at_source);
create index if not exists idx_csat_responses_unique_id on public.csat_responses(unique_id);
create index if not exists idx_csat_responses_channel on public.csat_responses(channel);

drop trigger if exists set_uploads_updated_at on public.uploads;
create trigger set_uploads_updated_at
before update on public.uploads
for each row execute function public.set_updated_at();

drop trigger if exists set_omnix_cases_updated_at on public.omnix_cases;
create trigger set_omnix_cases_updated_at
before update on public.omnix_cases
for each row execute function public.set_updated_at();

drop trigger if exists set_voice_interactions_updated_at on public.voice_interactions;
create trigger set_voice_interactions_updated_at
before update on public.voice_interactions
for each row execute function public.set_updated_at();

drop trigger if exists set_csat_responses_updated_at on public.csat_responses;
create trigger set_csat_responses_updated_at
before update on public.csat_responses
for each row execute function public.set_updated_at();

alter table public.uploads enable row level security;
alter table public.omnix_cases enable row level security;
alter table public.voice_interactions enable row level security;
alter table public.csat_responses enable row level security;
