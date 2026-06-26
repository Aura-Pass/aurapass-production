-- =========================================================
-- BUILD 5F — Scanner / Check-In (RLS update)
-- Run this SQL in your Supabase SQL editor.
-- =========================================================

create policy "Organisers can update tickets for their events"
  on public.tickets for update
  using (
    exists (
      select 1 from public.events
      where events.id = tickets.event_id
      and events.organiser_id = auth.uid()
    )
  );

create policy "Admins can update all tickets"
  on public.tickets for update
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
