-- =========================================================
-- BUILD 5A — Security hardening: prevent fake confirmed orders
-- Run this SQL manually in the Supabase SQL editor for project
-- qryqcsnbcftcasjovtdj.
-- =========================================================

create or replace function public.validate_order_insert()
returns trigger as $$
declare
  real_price numeric;
begin
  select price into real_price
  from public.ticket_types
  where id = new.ticket_type_id;

  if real_price is null then
    raise exception 'Ticket type not found';
  end if;

  if real_price > 0 and new.status = 'confirmed' then
    raise exception 'Paid ticket orders must start as pending';
  end if;

  if real_price > 0 and new.total_amount = 0 then
    raise exception 'Total amount cannot be zero for a paid ticket';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists validate_order_before_insert on public.orders;

create trigger validate_order_before_insert
  before insert on public.orders
  for each row execute procedure public.validate_order_insert();

-- Verify the trigger is active:
-- select trigger_name, event_object_table, action_timing, event_manipulation
-- from information_schema.triggers
-- where trigger_schema = 'public'
--   and trigger_name = 'validate_order_before_insert';
