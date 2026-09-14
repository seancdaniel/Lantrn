-- ===========================================================================
-- Milepost — schema, row level security, storage
--
-- Two kinds of data live here and they are governed differently:
--
--   Content  (destinations, characters, milestones, announcements)
--            shared by everyone, readable by all, writable only by admins.
--
--   Records  (profiles, activities, encounters)
--            belong to one person and are never visible to another, with the
--            single deliberate exception of the opt-in leaderboard aggregate.
--
-- Distance is not stored anywhere. Miles are steps ÷ steps_per_mile, computed
-- at read time, which is why changing a stride recalculates history for free
-- and why no two figures in the product can disagree.
-- ===========================================================================

-- Content ------------------------------------------------------------------

create table if not exists public.destinations (
  id          text primary key,
  name        text not null,
  subtitle    text not null default '',
  description text not null default '',
  order_index integer not null,
  palette     jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.characters (
  id             text primary key,
  name           text not null,
  epithet        text not null default '',
  description    text not null default '',
  -- The length of this leg, never a lifetime threshold.
  required_miles numeric(8,2) not null check (required_miles > 0),
  destination_id text not null references public.destinations (id) on delete restrict,
  order_index    integer not null,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists characters_order_idx on public.characters (order_index);
create index if not exists characters_destination_idx on public.characters (destination_id);

create table if not exists public.milestones (
  id             text primary key,
  name           text not null,
  required_miles numeric(8,2) not null check (required_miles > 0),
  description    text not null default ''
);

create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null default '',
  published_at date not null default current_date,
  active       boolean not null default true
);

-- Records ------------------------------------------------------------------

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  name                text not null default '',
  handle              text not null,
  avatar_url          text,
  steps_per_mile      numeric(7,2) not null default 2000.5
                        check (steps_per_mile between 800 and 4000),
  role                text not null default 'member' check (role in ('member', 'admin')),
  leaderboard_visible boolean not null default true,
  created_at          date not null default current_date
);

-- Handles are claimed case-insensitively: @QuietMile and @quietmile are one name.
create unique index if not exists profiles_handle_key on public.profiles (lower(handle));
alter table public.profiles drop constraint if exists profiles_handle_format;
alter table public.profiles add constraint profiles_handle_format
  check (handle ~ '^[a-zA-Z0-9_]{3,24}$');

create table if not exists public.activities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  date           date not null,
  steps          integer not null default 0 check (steps >= 0),
  active_minutes integer not null default 0 check (active_minutes >= 0),
  -- Null unless the source genuinely measured it. Manual entry never does.
  calories       integer check (calories >= 0),
  source         text not null default 'manual',
  updated_at     timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists activities_user_date_idx on public.activities (user_id, date desc);

create table if not exists public.encounters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  date         date not null default current_date,
  location     text not null default '',
  -- A storage object key. Never a base64 payload in a column.
  photo_path   text,
  notes        text not null default '',
  rating       smallint check (rating between 1 and 5),
  created_at   timestamptz not null default now(),
  unique (user_id, character_id)
);

create index if not exists encounters_user_idx on public.encounters (user_id);

-- A new sign-up gets a profile automatically, with a handle derived from the
-- email local part and de-duplicated. Without this the first write after
-- sign-up fails its foreign key.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate   text;
  suffix      integer := 0;
begin
  base_handle := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g');
  if length(base_handle) < 3 then
    base_handle := 'walker';
  end if;
  base_handle := left(base_handle, 20);
  candidate := base_handle;

  while exists (select 1 from public.profiles where lower(handle) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := left(base_handle, 20) || suffix::text;
  end loop;

  insert into public.profiles (id, name, handle)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), candidate);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security -------------------------------------------------------

-- Checked inside policies, so it must bypass RLS on profiles or it recurses.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.destinations  enable row level security;
alter table public.characters    enable row level security;
alter table public.milestones    enable row level security;
alter table public.announcements enable row level security;
alter table public.profiles      enable row level security;
alter table public.activities    enable row level security;
alter table public.encounters    enable row level security;

-- Content: everyone reads the route, only admins change it.
do $$
declare t text;
begin
  foreach t in array array['destinations', 'characters', 'milestones'] loop
    execute format('drop policy if exists content_read on public.%I', t);
    execute format('drop policy if exists content_write on public.%I', t);
    execute format('create policy content_read on public.%I for select using (true)', t);
    execute format(
      'create policy content_write on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t);
  end loop;
end $$;

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
  for select using (active or public.is_admin());

drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- Profiles: your own row always; other people's only if they opted in, and
-- admins see everything.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (id = auth.uid() or leaderboard_visible or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Records: strictly your own. No visibility exception, at all.
drop policy if exists activities_own on public.activities;
create policy activities_own on public.activities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists encounters_own on public.encounters;
create policy encounters_own on public.encounters
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Leaderboard --------------------------------------------------------------
-- Individual activity rows stay private. This view exposes only per-person
-- totals, and only for people who switched leaderboard visibility on. It runs
-- as its owner precisely so it can aggregate rows the caller cannot read.

create or replace view public.leaderboard
with (security_invoker = off) as
select
  p.id,
  p.handle,
  p.steps_per_mile,
  coalesce(sum(a.steps), 0)::bigint as lifetime_steps,
  coalesce(sum(a.steps) filter (where a.date > current_date - 7), 0)::bigint  as weekly_steps,
  coalesce(sum(a.steps) filter (where a.date > current_date - 30), 0)::bigint as monthly_steps,
  count(distinct a.date) filter (where a.steps > 0)::integer as walking_days,
  (select count(*) from public.encounters e where e.user_id = p.id)::integer as encounters_logged
from public.profiles p
left join public.activities a on a.user_id = p.id
where p.leaderboard_visible
group by p.id, p.handle, p.steps_per_mile;

grant select on public.leaderboard to anon, authenticated;

-- Storage ------------------------------------------------------------------
-- Encounter photos. Private bucket; each person may only touch their own
-- folder, which is keyed by their user id.

insert into storage.buckets (id, name, public)
values ('encounter-photos', 'encounter-photos', false)
on conflict (id) do nothing;

drop policy if exists encounter_photos_own on storage.objects;
create policy encounter_photos_own on storage.objects
  for all
  using (
    bucket_id = 'encounter-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'encounter-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
