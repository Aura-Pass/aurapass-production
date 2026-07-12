-- Add username column to profiles
alter table public.profiles
  add column if not exists username text unique;

create index if not exists profiles_username_idx on public.profiles (username);

-- Update trigger to save username from metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';

  insert into public.profiles (id, full_name, email, phone, role, is_approved, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when requested_role = 'organiser' then 'organiser'
      else 'attendee'
    end,
    true,
    nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '')
  );
  return new;
end;
$$ language plpgsql security definer;
