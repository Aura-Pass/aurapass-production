-- Organiser public profile fields
alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  add column if not exists website_url text;

alter table public.profiles
  add column if not exists instagram_url text;

alter table public.profiles
  add column if not exists twitter_url text;

alter table public.profiles
  add column if not exists avatar_url text;

-- Allow public read of organiser/admin profiles; users can still read their own
drop policy if exists "Anyone can view organiser profiles" on public.profiles;
create policy "Anyone can view organiser profiles"
  on public.profiles for select
  to anon, authenticated
  using (role = 'organiser' or role = 'admin' or auth.uid() = id);
