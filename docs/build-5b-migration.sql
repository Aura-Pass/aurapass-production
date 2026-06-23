-- =========================================================
-- BUILD 5B — Tickets (QR codes)
-- Run this SQL in your Supabase SQL editor.
-- =========================================================

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  ticket_type_id uuid references public.ticket_types(id) on delete cascade not null,
  qr_code text not null unique,
  status text not null default 'valid' check (status in ('valid', 'used', 'voided')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

grant select on public.tickets to authenticated, anon;
grant all on public.tickets to service_role;

alter table public.tickets enable row level security;

create policy "Users can view tickets linked to their orders"
  on public.tickets for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = tickets.order_id
      and (orders.user_id = auth.uid() or orders.buyer_email = (select email from public.profiles where id = auth.uid()))
    )
  );

create policy "Organisers can view tickets for their events"
  on public.tickets for select
  using (
    exists (
      select 1 from public.events
      where events.id = tickets.event_id
      and events.organiser_id = auth.uid()
    )
  );

create policy "Admins can view all tickets"
  on public.tickets for select
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
