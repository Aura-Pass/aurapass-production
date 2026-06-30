-- =========================================================
-- SECURITY FIXES — Run in Supabase SQL editor for project qryqcsnbcftcasjovtdj
-- =========================================================

-- FIX 1: handle_new_user trigger — never allow client to set admin
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';

  insert into public.profiles (id, full_name, email, phone, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when requested_role = 'organiser' then 'organiser'
      else 'attendee'
    end,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- FIX 2: Lock down profile role updates
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile (not role)"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and is_approved = (select is_approved from public.profiles where id = auth.uid())
  );

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- FIX 3: Lock down order creation
drop policy if exists "Anyone can create an order" on public.orders;

create policy "Anyone can create a pending or free order"
  on public.orders for insert to authenticated, anon
  with check (
    paystack_reference is null
    and (
      (status = 'pending')
      or (status = 'confirmed' and total_amount = 0 and platform_fee = 0)
    )
  );

-- FIX 4: Restrict Paystack raw response to buyer/admin only
drop policy if exists "Anyone can view payments linked to viewable orders" on public.payments;

create policy "Buyers and admins can view payments"
  on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
        and (
          orders.user_id = auth.uid()
          or orders.buyer_email = (select email from public.profiles where id = auth.uid())
        )
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- FIX 6: Storage bucket MIME + size restrictions
update storage.buckets
set
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  file_size_limit = 5242880
where id = 'event-banners';

-- FIX 7: Revoke unused orders UPDATE grant (only server role updates orders)
revoke update on public.orders from authenticated, anon;
