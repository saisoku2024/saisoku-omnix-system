create or replace view public.csat_clean as
select
  id,
  created_at,
  unique_id as customer_phone,
  (rating_csat::double precision)::integer as rating,
  channel
from public.csat_responses
where unique_id is not null
  and deleted_at is null;

create or replace view public.omnix_clean as
select
  id,
  interaction_at as created_at,
  nullif(customer_hp, '') as customer_phone,
  agent_name,
  lower(channel) as channel,
  main_category,
  category,
  handling_time_sec,
  response_time_sec,
  waiting_time_sec
from public.omnix_cases
where deleted_at is null;
