-- Keep Omnix monitoring aligned with soft cleanup semantics.

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
    and deleted_at is null
),
trend_filtered as (
  select *
  from public.omnix_cases
  where interaction_at >= case when p_mode = 'monthly' then p_start else make_timestamptz(p_year, 1, 1, 0, 0, 0) end
    and interaction_at < case when p_mode = 'monthly' then p_end else make_timestamptz(p_year + 1, 1, 1, 0, 0, 0) end
    and deleted_at is null
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
   and o.deleted_at is null
  left join lateral (
    select date_trunc('month', min(oc.interaction_at)) as first_month
    from public.omnix_cases oc
    where oc.customer_hp = o.customer_hp
      and oc.deleted_at is null
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

