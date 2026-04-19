-- =====================================================================
-- RideSync — Supabase SQL schema (Phase 1)
-- =====================================================================
-- Run the ENTIRE script in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: all statements are idempotent.
-- =====================================================================

-- 1) Extensions ---------------------------------------------------------
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- 2) Enums --------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_type') then
    create type trip_type as enum ('exam', 'trip', 'airport', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'ride_status') then
    create type ride_status as enum ('open', 'full', 'cancelled', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'passenger_status') then
    create type passenger_status as enum ('pending', 'confirmed', 'declined');
  end if;
end$$;

-- 3) users table --------------------------------------------------------
-- `uid` matches auth.users.id so we can use auth.uid() in RLS policies.
create table if not exists public.users (
  uid          uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  email        text not null unique
               check (email ~* '@sst\.scaler\.com$'),
  photo_url    text,
  rides_posted integer not null default 0,
  rides_joined integer not null default 0,
  created_at   timestamptz not null default now()
);

-- 4) rides table --------------------------------------------------------
create table if not exists public.rides (
  ride_id         uuid primary key default gen_random_uuid(),
  host_id         uuid not null references public.users(uid) on delete cascade,
  host_name       text not null,
  destination     text not null,
  trip_type       trip_type not null,
  departure_time  timestamptz not null,
  total_seats     integer not null check (total_seats > 0),
  cost_per_person numeric(10,2),
  whatsapp_number text check (
    whatsapp_number is null
    or whatsapp_number ~ '^\+?[0-9]{10,15}$'
  ),
  status          ride_status not null default 'open',
  created_at      timestamptz not null default now()
);

create index if not exists rides_host_id_idx        on public.rides(host_id);
create index if not exists rides_departure_time_idx on public.rides(departure_time);
create index if not exists rides_status_idx         on public.rides(status);

-- 5) ride_passengers (join table) --------------------------------------
create table if not exists public.ride_passengers (
  ride_id    uuid not null references public.rides(ride_id) on delete cascade,
  user_id    uuid not null references public.users(uid)     on delete cascade,
  status     passenger_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

create index if not exists ride_passengers_user_id_idx on public.ride_passengers(user_id);

-- 6) messages table -----------------------------------------------------
create table if not exists public.messages (
  message_id  uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references public.rides(ride_id) on delete cascade,
  sender_id   uuid not null references public.users(uid)     on delete cascade,
  sender_name text not null,
  text        text not null check (length(text) > 0),
  sent_at     timestamptz not null default now()
);

create index if not exists messages_ride_id_idx on public.messages(ride_id);
create index if not exists messages_sent_at_idx on public.messages(sent_at);

-- 7) Row Level Security -------------------------------------------------
alter table public.users            enable row level security;
alter table public.rides            enable row level security;
alter table public.ride_passengers  enable row level security;
alter table public.messages         enable row level security;

-- Helper: re-create policies cleanly (drop if exists first)

-- ---- users policies -------------------------------------------------
drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
  on public.users for insert
  to authenticated
  with check (uid = auth.uid());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users for update
  to authenticated
  using (uid = auth.uid())
  with check (uid = auth.uid());

drop policy if exists "users_delete_self" on public.users;
create policy "users_delete_self"
  on public.users for delete
  to authenticated
  using (uid = auth.uid());

-- ---- rides policies -------------------------------------------------
drop policy if exists "rides_select_authenticated" on public.rides;
create policy "rides_select_authenticated"
  on public.rides for select
  to authenticated
  using (true);

drop policy if exists "rides_insert_host_self" on public.rides;
create policy "rides_insert_host_self"
  on public.rides for insert
  to authenticated
  with check (host_id = auth.uid());

drop policy if exists "rides_update_host_only" on public.rides;
create policy "rides_update_host_only"
  on public.rides for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "rides_delete_host_only" on public.rides;
create policy "rides_delete_host_only"
  on public.rides for delete
  to authenticated
  using (host_id = auth.uid());

-- ---- ride_passengers policies --------------------------------------
-- Readable by the passenger themself OR by the host of the ride.
drop policy if exists "ride_passengers_select_self_or_host" on public.ride_passengers;
create policy "ride_passengers_select_self_or_host"
  on public.ride_passengers for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.ride_id = ride_passengers.ride_id
        and r.host_id = auth.uid()
    )
  );

-- A user can only insert a join-request row for themselves.
drop policy if exists "ride_passengers_insert_self" on public.ride_passengers;
create policy "ride_passengers_insert_self"
  on public.ride_passengers for insert
  to authenticated
  with check (user_id = auth.uid());

-- Host of the ride can accept/decline (update status);
-- the passenger can also update their own row (e.g., withdraw).
drop policy if exists "ride_passengers_update_host_or_self" on public.ride_passengers;
create policy "ride_passengers_update_host_or_self"
  on public.ride_passengers for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.ride_id = ride_passengers.ride_id
        and r.host_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.ride_id = ride_passengers.ride_id
        and r.host_id = auth.uid()
    )
  );

drop policy if exists "ride_passengers_delete_host_or_self" on public.ride_passengers;
create policy "ride_passengers_delete_host_or_self"
  on public.ride_passengers for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.ride_id = ride_passengers.ride_id
        and r.host_id = auth.uid()
    )
  );

-- ---- messages policies ---------------------------------------------
-- Only the host or a confirmed passenger of the ride may read/send messages.
drop policy if exists "messages_select_ride_members" on public.messages;
create policy "messages_select_ride_members"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.rides r
      where r.ride_id = messages.ride_id
        and r.host_id = auth.uid()
    )
    or exists (
      select 1 from public.ride_passengers rp
      where rp.ride_id = messages.ride_id
        and rp.user_id = auth.uid()
        and rp.status  = 'confirmed'
    )
  );

drop policy if exists "messages_insert_ride_members" on public.messages;
create policy "messages_insert_ride_members"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1 from public.rides r
        where r.ride_id = messages.ride_id
          and r.host_id = auth.uid()
      )
      or exists (
        select 1 from public.ride_passengers rp
        where rp.ride_id = messages.ride_id
          and rp.user_id = auth.uid()
          and rp.status  = 'confirmed'
      )
    )
  );

-- Sender can edit/delete their own messages.
drop policy if exists "messages_update_sender_self" on public.messages;
create policy "messages_update_sender_self"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "messages_delete_sender_self" on public.messages;
create policy "messages_delete_sender_self"
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- =====================================================================
-- 8) Auth trigger (Phase 2) --------------------------------------------
-- Mirror new auth.users rows into public.users so app queries against
-- public.users work from the very first login.
--
-- NOTE: We originally had a second trigger (enforce_sst_email_domain)
-- that rejected non-@sst.scaler.com signups BEFORE INSERT on auth.users.
-- Supabase hosted projects don't permit user triggers on auth.users in
-- some configurations, so that trigger has been removed. Domain
-- enforcement now lives client-side in src/services/authService.js
-- (validateEmailDomain) AND in the CHECK constraint on public.users.email.
-- =====================================================================

-- Mirror auth.users -> public.users ------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
begin
  -- Prefer user_metadata.name, fall back to local-part of email.
  derived_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.users (uid, name, email)
  values (new.id, derived_name, new.email)
  on conflict (uid) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =====================================================================
-- 9) seats_available auto-maintained column (Phase 3) ------------------
-- Avoids leaking ride_passengers rows to non-host/non-passenger users
-- while still letting the Ride Feed filter by "seats still available".
-- Formula: seats_available = total_seats - 1 (host) - COUNT(confirmed passengers)
-- =====================================================================
alter table public.rides
  add column if not exists seats_available integer;

-- Backfill for any existing rows (idempotent)
update public.rides r
set seats_available = greatest(
  r.total_seats - 1 - coalesce((
    select count(*) from public.ride_passengers rp
    where rp.ride_id = r.ride_id and rp.status = 'confirmed'
  ), 0),
  0
)
where r.seats_available is null;

alter table public.rides alter column seats_available set default 0;
alter table public.rides alter column seats_available set not null;

create index if not exists rides_seats_available_idx
  on public.rides(seats_available);

-- Trigger (a): on rides BEFORE INSERT, set initial seats_available.
create or replace function public.rides_set_initial_seats()
returns trigger
language plpgsql
as $$
begin
  -- new ride → host occupies 1 seat, 0 confirmed passengers yet.
  new.seats_available := greatest(new.total_seats - 1, 0);
  return new;
end;
$$;

drop trigger if exists rides_set_initial_seats on public.rides;
create trigger rides_set_initial_seats
  before insert on public.rides
  for each row execute function public.rides_set_initial_seats();

-- Trigger (b): on rides BEFORE UPDATE of total_seats, recompute.
-- (Implemented with an inline scalar subquery rather than a PL/pgSQL
--  local variable — some Postgres configurations misparse a declared
--  variable here as a table reference, raising 42P01.)
create or replace function public.rides_recompute_on_total_change()
returns trigger
language plpgsql
as $$
begin
  if new.total_seats is distinct from old.total_seats then
    new.seats_available := greatest(
      new.total_seats - 1 - coalesce((
        select count(*)
        from public.ride_passengers rp
        where rp.ride_id = new.ride_id
          and rp.status = 'confirmed'
      ), 0),
      0
    );
  end if;
  return new;
end;
$$;

drop trigger if exists rides_recompute_on_total_change on public.rides;
create trigger rides_recompute_on_total_change
  before update on public.rides
  for each row execute function public.rides_recompute_on_total_change();

-- Trigger (c): on ride_passengers changes, recompute seats_available
-- for the affected ride(s).
create or replace function public.ride_passengers_refresh_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_ride_id uuid;
begin
  target_ride_id := coalesce(new.ride_id, old.ride_id);

  update public.rides r
  set seats_available = greatest(
    r.total_seats - 1 - coalesce((
      select count(*) from public.ride_passengers rp
      where rp.ride_id = r.ride_id and rp.status = 'confirmed'
    ), 0),
    0
  )
  where r.ride_id = target_ride_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists ride_passengers_refresh_seats_ins on public.ride_passengers;
create trigger ride_passengers_refresh_seats_ins
  after insert on public.ride_passengers
  for each row execute function public.ride_passengers_refresh_seats();

drop trigger if exists ride_passengers_refresh_seats_upd on public.ride_passengers;
create trigger ride_passengers_refresh_seats_upd
  after update on public.ride_passengers
  for each row execute function public.ride_passengers_refresh_seats();

drop trigger if exists ride_passengers_refresh_seats_del on public.ride_passengers;
create trigger ride_passengers_refresh_seats_del
  after delete on public.ride_passengers
  for each row execute function public.ride_passengers_refresh_seats();

-- =====================================================================
-- 10) Public-profile counters on users (Phase 6) ----------------------
-- Triggers keep public.users.rides_posted / rides_joined in sync so the
-- /profile/:uid page can display them without needing RLS exceptions
-- on ride_passengers for outsiders.
-- =====================================================================

create or replace function public.users_rides_posted_bump()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.users
      set rides_posted = rides_posted + 1
      where uid = new.host_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.users
      set rides_posted = greatest(rides_posted - 1, 0)
      where uid = old.host_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists rides_posted_counter_ins on public.rides;
create trigger rides_posted_counter_ins
  after insert on public.rides
  for each row execute function public.users_rides_posted_bump();

drop trigger if exists rides_posted_counter_del on public.rides;
create trigger rides_posted_counter_del
  after delete on public.rides
  for each row execute function public.users_rides_posted_bump();

create or replace function public.users_rides_joined_bump()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'confirmed' then
      update public.users
        set rides_joined = rides_joined + 1
        where uid = new.user_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from 'confirmed' and new.status = 'confirmed' then
      update public.users
        set rides_joined = rides_joined + 1
        where uid = new.user_id;
    elsif old.status = 'confirmed' and new.status is distinct from 'confirmed' then
      update public.users
        set rides_joined = greatest(rides_joined - 1, 0)
        where uid = new.user_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.status = 'confirmed' then
      update public.users
        set rides_joined = greatest(rides_joined - 1, 0)
        where uid = old.user_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists rides_joined_counter_ins on public.ride_passengers;
create trigger rides_joined_counter_ins
  after insert on public.ride_passengers
  for each row execute function public.users_rides_joined_bump();

drop trigger if exists rides_joined_counter_upd on public.ride_passengers;
create trigger rides_joined_counter_upd
  after update on public.ride_passengers
  for each row execute function public.users_rides_joined_bump();

drop trigger if exists rides_joined_counter_del on public.ride_passengers;
create trigger rides_joined_counter_del
  after delete on public.ride_passengers
  for each row execute function public.users_rides_joined_bump();

-- One-shot backfill (safe to re-run)
update public.users u set rides_posted = coalesce((
  select count(*) from public.rides r where r.host_id = u.uid
), 0);

update public.users u set rides_joined = coalesce((
  select count(*) from public.ride_passengers rp
  where rp.user_id = u.uid and rp.status = 'confirmed'
), 0);

-- =====================================================================
-- Done. Remember to:
--  1. Enable Realtime on `rides`, `ride_passengers`, `messages` if desired
--     (Dashboard → Database → Replication).
--  2. Supabase Auth → Providers → Email:
--       • Enable the Email provider
--       • Turn OFF "Confirm email" (magic link confirms automatically)
--  3. Supabase Auth → URL Configuration:
--       • Site URL       = your deployed origin (e.g. https://<preview>.emergentagent.com)
--       • Additional Redirect URLs:
--           http://localhost:3000/feed
--           https://<your-preview>.emergentagent.com/feed
--           https://<your-prod-domain>/feed
-- =====================================================================
