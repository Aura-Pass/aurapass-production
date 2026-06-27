-- =========================================================
-- BUILD 5F — Scanner / Check-In (RLS update)
-- Run this SQL in your Supabase SQL editor.
-- Safe to re-run: uses DROP POLICY IF EXISTS first.
-- =========================================================

-- ---- UPDATE policies (admit / mark used) ----
-- Data API table privileges are required in addition to RLS policies.
grant select, update on public.tickets to authenticated;
grant select on public.orders to authenticated;
grant all on public.tickets to service_role;
grant all on public.orders to service_role;

drop policy if exists "Organisers can update tickets for their events" on public.tickets;
create policy "Organisers can update tickets for their events"
  on public.tickets for update to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = tickets.event_id
        and events.organiser_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = tickets.event_id
        and events.organiser_id = auth.uid()
    )
  );

drop policy if exists "Admins can update all tickets" on public.tickets;
create policy "Admins can update all tickets"
  on public.tickets for update to authenticated
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- ---- SELECT policies (so the scanner can LOOK UP a qr_code) ----
-- Without these, .eq("qr_code", code).maybeSingle() silently returns null
-- for organisers/admins, so every scan looks like "Invalid ticket".
drop policy if exists "Organisers can read tickets for their events" on public.tickets;
create policy "Organisers can read tickets for their events"
  on public.tickets for select to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = tickets.event_id
        and events.organiser_id = auth.uid()
    )
  );

drop policy if exists "Admins can read all tickets" on public.tickets;
create policy "Admins can read all tickets"
  on public.tickets for select to authenticated
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- ---- Orders SELECT for manual search fallback ----
drop policy if exists "Organisers can read orders for their events" on public.orders;
create policy "Organisers can read orders for their events"
  on public.orders for select to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = orders.event_id
        and events.organiser_id = auth.uid()
    )
  );

-- ---- Verification: should show UPDATE + SELECT policies as active ----
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('tickets', 'orders')
  and policyname in (
    'Organisers can update tickets for their events',
    'Admins can update all tickets',
    'Organisers can read tickets for their events',
    'Admins can read all tickets',
    'Organisers can read orders for their events'
  )
order by tablename, cmd, policyname;
