-- Keep dashboard home aligned with soft cleanup semantics.

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
    and deleted_at is null
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
      and previous.deleted_at is null
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

