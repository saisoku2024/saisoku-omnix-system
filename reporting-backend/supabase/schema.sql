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

-- ============================================================
-- Master dashboard RPCs
-- ============================================================
-- These functions collapse the previous multi-RPC dashboard reads into a
-- single database round trip per page. They return JSON objects shaped like
-- the current backend service responses.

alter table public.omnix_cases add column if not exists brand text;
alter table public.omnix_cases add column if not exists product text;
alter table public.omnix_cases add column if not exists principal_group text;
alter table public.omnix_cases add column if not exists principal_category text;
alter table public.omnix_cases add column if not exists deleted_at timestamptz;
alter table public.omnix_cases add column if not exists deleted_reason text;
alter table public.omnix_cases add column if not exists deleted_by text;
alter table public.omnix_cases add column if not exists cleanup_batch_id uuid;
alter table public.voice_interactions add column if not exists deleted_at timestamptz;
alter table public.voice_interactions add column if not exists deleted_reason text;
alter table public.voice_interactions add column if not exists deleted_by text;
alter table public.voice_interactions add column if not exists cleanup_batch_id uuid;

create table if not exists public.cleanup_deleted_omnix_cases (
  id uuid primary key default gen_random_uuid(),
  omnix_case_id uuid not null,
  ticket_id text,
  cleanup_batch_id uuid not null,
  reason text not null,
  deleted_by text,
  deleted_at timestamptz not null default now(),
  snapshot jsonb not null
);

create table if not exists public.cleanup_deleted_voice_interactions (
  id uuid primary key default gen_random_uuid(),
  voice_interaction_id uuid not null,
  unique_id text,
  cleanup_batch_id uuid not null,
  reason text not null,
  deleted_by text,
  deleted_at timestamptz not null default now(),
  snapshot jsonb not null
);

create index if not exists idx_omnix_cases_deleted_at on public.omnix_cases(deleted_at);
create index if not exists idx_voice_interactions_deleted_at on public.voice_interactions(deleted_at);
create index if not exists idx_cleanup_deleted_omnix_cases_batch on public.cleanup_deleted_omnix_cases(cleanup_batch_id);
create index if not exists idx_cleanup_deleted_voice_interactions_batch on public.cleanup_deleted_voice_interactions(cleanup_batch_id);

create or replace function public.get_voice_dashboard(
  p_start timestamptz,
  p_end timestamptz,
  p_mode text default 'monthly'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with filtered as (
  select *
  from public.voice_interactions
  where interaction_at >= p_start
    and interaction_at < p_end
),
summary_data as (
  select
    count(*)::int as total_calls,
    count(*) filter (
      where lower(coalesce(call_status, '')) in ('answered', 'completeagent', 'completecaller')
         or lower(coalesce(call_event, '')) in ('answered', 'completeagent', 'completecaller')
    )::int as answered,
    count(*) filter (
      where lower(coalesce(call_status, '')) like '%abandon%'
         or lower(coalesce(call_event, '')) like '%abandon%'
    )::int as abandon,
    coalesce(avg(talk_time_sec), 0)::numeric as avg_aht,
    coalesce(avg(wait_time_sec), 0)::numeric as avg_awt
  from filtered
),
daily_data as (
  select
    case
      when p_mode = 'monthly' then to_char(interaction_at, 'DD')
      else to_char(interaction_at, 'Mon')
    end as label,
    count(*)::int as count
  from filtered
  group by 1
),
hourly_data as (
  select
    h.hour,
    coalesce(count(f.id), 0)::int as total
  from generate_series(0, 23) as h(hour)
  left join filtered f on extract(hour from f.interaction_at)::int = h.hour
  group by h.hour
  order by h.hour
),
day_data as (
  select
    d.day_name as day,
    coalesce(count(f.id), 0)::int as total
  from (
    values
      (1, 'Monday'),
      (2, 'Tuesday'),
      (3, 'Wednesday'),
      (4, 'Thursday'),
      (5, 'Friday'),
      (6, 'Saturday'),
      (7, 'Sunday')
  ) as d(day_num, day_name)
  left join filtered f on extract(isodow from f.interaction_at)::int = d.day_num
  group by d.day_num, d.day_name
  order by d.day_num
),
agent_handling as (
  select
    coalesce(nullif(agent_name, ''), 'Unknown') as agent,
    count(*)::int as total
  from filtered
  group by 1
  order by total desc
  limit 10
),
agent_aht as (
  select
    coalesce(nullif(agent_name, ''), 'Unknown') as agent,
    coalesce(avg(talk_time_sec), 0)::numeric as avg_talk_sec
  from filtered
  group by 1
  order by avg_talk_sec desc
  limit 10
),
agent_awt as (
  select
    coalesce(nullif(agent_name, ''), 'Unknown') as agent,
    coalesce(avg(wait_time_sec), 0)::numeric as avg_wait_sec
  from filtered
  group by 1
  order by avg_wait_sec desc
  limit 10
)
select jsonb_build_object(
  'summary', (
    select jsonb_build_object(
      'total_calls', total_calls,
      'answered', answered,
      'abandon', abandon,
      'avg_aht', round(avg_aht, 2),
      'avg_awt', round(avg_awt, 2),
      'scr', case when total_calls > 0 then round((answered::numeric / total_calls::numeric) * 100, 1) else 0 end
    )
    from summary_data
  ),
  'daily', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by label) from daily_data), '[]'::jsonb),
  'hourly', coalesce((select jsonb_agg(jsonb_build_object('hour', hour, 'total', total) order by hour) from hourly_data), '[]'::jsonb),
  'byDay', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'total', total)) from day_data), '[]'::jsonb),
  'agentHandling', coalesce((select jsonb_agg(jsonb_build_object('agent', agent, 'total', total)) from agent_handling), '[]'::jsonb),
  'agentAht', coalesce((select jsonb_agg(jsonb_build_object('agent', agent, 'avg_talk_sec', round(avg_talk_sec, 2))) from agent_aht), '[]'::jsonb),
  'agentAwt', coalesce((select jsonb_agg(jsonb_build_object('agent', agent, 'avg_wait_sec', round(avg_wait_sec, 2))) from agent_awt), '[]'::jsonb)
);
$$;

create or replace function public.get_omnix_dashboard(
  p_start timestamptz,
  p_end timestamptz,
  p_mode text default 'monthly',
  p_year int default extract(year from now())::int
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with filtered as (
  select *
  from public.omnix_cases
  where interaction_at >= p_start
    and interaction_at < p_end
),
trend_filtered as (
  select *
  from public.omnix_cases
  where interaction_at >= case when p_mode = 'monthly' then p_start else make_timestamptz(p_year, 1, 1, 0, 0, 0) end
    and interaction_at < case when p_mode = 'monthly' then p_end else make_timestamptz(p_year + 1, 1, 1, 0, 0, 0) end
),
summary_data as (
  select
    count(*)::int as total_ticket,
    coalesce(avg(handling_time_sec), 0)::numeric as avg_aht,
    coalesce(avg(response_time_sec), 0)::numeric as avg_art,
    coalesce(avg(waiting_time_sec), 0)::numeric as avg_awt
  from filtered
),
daily_data as (
  select
    case
      when p_mode = 'monthly' then to_char(interaction_at, 'DD')
      else to_char(interaction_at, 'Mon')
    end as label,
    count(*)::int as total
  from trend_filtered
  group by 1
),
hourly_data as (
  select
    extract(hour from interaction_at)::int as hour,
    count(*)::int as total
  from filtered
  group by 1
  order by 1
),
day_data as (
  select
    to_char(interaction_at, 'FMDay') as day,
    count(*)::int as total
  from filtered
  group by 1
),
channel_data as (
  select coalesce(nullif(channel, ''), 'Unknown') as name, count(*)::int as total
  from filtered
  group by 1
  order by total desc
  limit 10
),
category_data as (
  select coalesce(nullif(main_category, ''), 'Unknown') as name, count(*)::int as total
  from filtered
  group by 1
  order by total desc
  limit 10
),
product_data as (
  select coalesce(nullif(category, ''), 'Unknown') as name, count(*)::int as total
  from filtered
  group by 1
  order by total desc
  limit 10
),
customer_data as (
  select
    to_char(m.month_start, 'Mon') as label,
    count(distinct o.customer_hp)::int as total,
    count(distinct o.customer_hp) filter (
      where first_seen.first_month = m.month_start
    )::int as new
  from generate_series(
    make_timestamptz(p_year, 1, 1, 0, 0, 0),
    make_timestamptz(p_year, 12, 1, 0, 0, 0),
    interval '1 month'
  ) as m(month_start)
  left join public.omnix_cases o
    on o.interaction_at >= m.month_start
   and o.interaction_at < m.month_start + interval '1 month'
   and o.customer_hp is not null
   and nullif(o.customer_hp, '') is not null
  left join lateral (
    select date_trunc('month', min(oc.interaction_at)) as first_month
    from public.omnix_cases oc
    where oc.customer_hp = o.customer_hp
  ) first_seen on true
  group by m.month_start
  order by m.month_start
)
select jsonb_build_object(
  'summary', (
    select jsonb_build_object(
      'total_ticket', total_ticket,
      'avg_aht', round(avg_aht, 2),
      'avg_art', round(avg_art, 2),
      'avg_awt', round(avg_awt, 2)
    )
    from summary_data
  ),
  'daily', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'total', total) order by label) from daily_data), '[]'::jsonb),
  'hourly', coalesce((select jsonb_agg(jsonb_build_object('hour', hour, 'total', total) order by hour) from hourly_data), '[]'::jsonb),
  'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'total', total)) from day_data), '[]'::jsonb),
  'channel', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'total', total)) from channel_data), '[]'::jsonb),
  'category', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'total', total)) from category_data), '[]'::jsonb),
  'product', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'total', total)) from product_data), '[]'::jsonb),
  'customer', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'total', total, 'new', new)) from customer_data), '[]'::jsonb)
);
$$;

create or replace function public.get_dashboard_home(
  p_start timestamptz,
  p_end timestamptz,
  p_mode text default 'monthly',
  p_year int default extract(year from now())::int
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with omnix_filtered as (
  select *
  from public.omnix_cases
  where interaction_at >= p_start
    and interaction_at < p_end
),
csat_filtered as (
  select *
  from public.csat_responses
  where coalesce(created_at_source, created_at) >= p_start
    and coalesce(created_at_source, created_at) < p_end
),
summary_data as (
  select
    count(o.id)::int as total_ticket,
    coalesce(avg(o.handling_time_sec), 0)::numeric as avg_aht,
    coalesce(avg(o.response_time_sec), 0)::numeric as avg_art,
    coalesce(avg(o.waiting_time_sec), 0)::numeric as avg_awt,
    coalesce(avg(c.score), 0)::numeric as csat
  from omnix_filtered o
  full join csat_filtered c on false
),
trend_data as (
  select
    case
      when p_mode = 'monthly' then to_char(interaction_at, 'DD')
      else to_char(interaction_at, 'Mon')
    end as label,
    count(*)::int as total
  from omnix_filtered
  group by 1
),
channel_data as (
  select coalesce(nullif(channel, ''), 'Unknown') as name, count(*)::int as total
  from omnix_filtered
  group by 1
  order by total desc
  limit 10
),
category_data as (
  select coalesce(nullif(main_category, ''), 'Unknown') as name, count(*)::int as total
  from omnix_filtered
  group by 1
  order by total desc
  limit 10
),
brand_data as (
  select
    coalesce(nullif(brand, ''), 'Unknown') as name,
    count(*)::int as total,
    round((count(*)::numeric / nullif((select count(*) from omnix_filtered), 0)) * 100, 2) as pct
  from omnix_filtered
  group by 1
  order by total desc
  limit 10
),
customer_totals as (
  select
    count(distinct customer_hp)::int as total_customer
  from omnix_filtered
  where customer_hp is not null
    and nullif(customer_hp, '') is not null
),
new_customer_totals as (
  select count(distinct current_customers.customer_hp)::int as total_new_customer
  from (
    select distinct customer_hp
    from omnix_filtered
    where customer_hp is not null
      and nullif(customer_hp, '') is not null
  ) current_customers
  where not exists (
    select 1
    from public.omnix_cases previous
    where previous.customer_hp = current_customers.customer_hp
      and previous.interaction_at < p_start
  )
)
select jsonb_build_object(
  'summary', (
    select jsonb_build_object(
      'total_ticket', total_ticket,
      'avg_aht', round(avg_aht, 2),
      'avg_art', round(avg_art, 2),
      'avg_awt', round(avg_awt, 2),
      'csat', round(csat, 2)
    )
    from summary_data
  ),
  'trend', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'total', total) order by label) from trend_data), '[]'::jsonb),
  'channel', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'total', total)) from channel_data), '[]'::jsonb),
  'category', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'total', total)) from category_data), '[]'::jsonb),
  'brand', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'total', total, 'pct', pct)) from brand_data), '[]'::jsonb),
  'customer', jsonb_build_object('total', coalesce((select total_customer from customer_totals), 0)),
  'new_customer', jsonb_build_object('total', coalesce((select total_new_customer from new_customer_totals), 0))
);
$$;
