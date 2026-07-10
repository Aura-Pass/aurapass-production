alter table public.events
  add column if not exists slug text unique;

create index if not exists events_slug_idx on public.events (slug);

create or replace function public.generate_event_slug(title text, event_id uuid)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 60);

  final_slug := base_slug;

  loop
    exit when not exists (
      select 1 from public.events
      where slug = final_slug
      and id != event_id
    );
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$$ language plpgsql;

create or replace function public.auto_set_event_slug()
returns trigger as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_event_slug(new.title, new.id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_event_slug_on_insert on public.events;
create trigger set_event_slug_on_insert
  before insert on public.events
  for each row execute procedure public.auto_set_event_slug();

update public.events
  set slug = public.generate_event_slug(title, id)
  where slug is null;
