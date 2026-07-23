-- Party Monster: users who bought tickets for the most DISTINCT events this calendar month
create or replace view public.party_monster_leaderboard as
select
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  count(distinct o.event_id) as events_this_month,
  sum(o.quantity) as total_tickets_this_month
from public.orders o
join public.profiles p on p.id = o.user_id
where
  o.status = 'confirmed'
  and o.user_id is not null
  and date_trunc('month', o.created_at) = date_trunc('month', now())
group by p.id, p.full_name, p.username, p.avatar_url
order by events_this_month desc, total_tickets_this_month desc
limit 20;

-- Crowd Control: users who most consistently buy group tickets (quantity > 1) across events
create or replace view public.crowd_control_leaderboard as
select
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  count(*) as group_orders_count,
  sum(o.quantity) as total_group_tickets,
  count(distinct o.event_id) as events_with_group_tickets
from public.orders o
join public.profiles p on p.id = o.user_id
where
  o.status = 'confirmed'
  and o.user_id is not null
  and o.quantity > 1
  and date_trunc('month', o.created_at) = date_trunc('month', now())
group by p.id, p.full_name, p.username, p.avatar_url
order by group_orders_count desc, total_group_tickets desc
limit 20;

-- Grant read access
grant select on public.party_monster_leaderboard to anon, authenticated;
grant select on public.crowd_control_leaderboard to anon, authenticated;
