-- Organiser following system
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  organiser_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (follower_id, organiser_id)
);

grant select, insert, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant all on public.follows to service_role;

alter table public.follows enable row level security;

drop policy if exists "Users can view their own follows" on public.follows;
create policy "Users can view their own follows"
  on public.follows for select
  to authenticated
  using (auth.uid() = follower_id);

drop policy if exists "Anyone can view follow counts" on public.follows;
create policy "Anyone can view follow counts"
  on public.follows for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can follow organisers" on public.follows;
create policy "Users can follow organisers"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);
