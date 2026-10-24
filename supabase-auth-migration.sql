-- Safe, additive Supabase Auth setup. Run this file in the Supabase SQL Editor.
-- Do not run supabase-schema.sql against an existing database: it drops and
-- recreates the bus-ticketing tables before seeding demo data.

-- Use a dedicated table because this project already has an unrelated
-- public.profiles table with a different column layout.
create table if not exists public.auth_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  name text not null default '',
  phone text,
  role text not null default 'passenger',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.auth_profiles add column if not exists role text not null default 'passenger';

-- Backfill Auth accounts created before this trigger was installed.
insert into public.auth_profiles (id, email, name, phone, role)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'name', ''),
  nullif(raw_user_meta_data ->> 'phone', ''),
  case when raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'passenger' end
from auth.users
on conflict (id) do update set
  role = excluded.role,
  updated_at = now();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.auth_profiles (id, email, name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'passenger' end
  )
  on conflict (id) do update set
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data, raw_app_meta_data on auth.users
  for each row execute function public.handle_new_auth_user();

create table if not exists public.user_login_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  login_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- User to administrator support/message board.
create table if not exists public.bus_ticket_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists bus_ticket_messages_user_created_idx on public.bus_ticket_messages (user_id, created_at);

-- Add these fields when upgrading a login-log table created by an earlier version.
alter table public.user_login_logs add column if not exists email text;
alter table public.user_login_logs add column if not exists name text;
alter table public.user_login_logs add column if not exists phone text;

-- Fill identity details for old events without overwriting existing snapshots.
update public.user_login_logs as logs
set email = coalesce(logs.email, auth_user.email),
    name = coalesce(logs.name, profile.name, auth_user.raw_user_meta_data ->> 'name'),
    phone = coalesce(logs.phone, profile.phone)
from auth.users as auth_user
left join public.auth_profiles as profile on profile.id = auth_user.id
where logs.user_id = auth_user.id
  and (logs.email is null or logs.name is null or logs.phone is null);

create index if not exists user_login_logs_user_login_at_idx
  on public.user_login_logs (user_id, login_at desc);

alter table public.auth_profiles enable row level security;
alter table public.user_login_logs enable row level security;
alter table public.bus_ticket_messages enable row level security;

drop policy if exists "Users can read own auth profile" on public.auth_profiles;
create policy "Users can read own auth profile" on public.auth_profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can update own auth profile" on public.auth_profiles;
create policy "Users can update own auth profile" on public.auth_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Admins can read all auth profiles" on public.auth_profiles;
create policy "Admins can read all auth profiles" on public.auth_profiles
  for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Users can read own login events" on public.user_login_logs;
create policy "Users can read own login events" on public.user_login_logs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can record own login events" on public.user_login_logs;
create policy "Users can record own login events" on public.user_login_logs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users and admins can read message threads" on public.bus_ticket_messages;
create policy "Users and admins can read message threads" on public.bus_ticket_messages
  for select to authenticated using (
    auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
drop policy if exists "Users and admins can send messages" on public.bus_ticket_messages;
create policy "Users and admins can send messages" on public.bus_ticket_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and (
      (sender_role = 'user' and user_id = auth.uid()) or
      (sender_role = 'admin' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

revoke all on public.user_login_logs from anon;
grant select, insert on public.user_login_logs to authenticated;
revoke all on public.auth_profiles from anon;
revoke update on public.auth_profiles from authenticated;
grant select, update (name, phone) on public.auth_profiles to authenticated;
revoke all on public.bus_ticket_messages from anon;
grant select, insert on public.bus_ticket_messages to authenticated;

-- In-app alerts for new messages between passengers and administrators.
create table if not exists public.bus_ticket_notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  message_id bigint not null references public.bus_ticket_messages(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, message_id)
);
create index if not exists bus_ticket_notifications_recipient_created_idx
  on public.bus_ticket_notifications (recipient_id, created_at desc);
alter table public.bus_ticket_notifications enable row level security;

drop policy if exists "Users can read their notifications" on public.bus_ticket_notifications;
create policy "Users can read their notifications" on public.bus_ticket_notifications
  for select to authenticated using (recipient_id = auth.uid());
drop policy if exists "Users can mark their notifications read" on public.bus_ticket_notifications;
create policy "Users can mark their notifications read" on public.bus_ticket_notifications
  for update to authenticated using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
revoke all on public.bus_ticket_notifications from anon;
grant select on public.bus_ticket_notifications to authenticated;
grant update (read_at) on public.bus_ticket_notifications to authenticated;

create or replace function public.notify_message_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.sender_role = 'admin' then
    insert into public.bus_ticket_notifications (recipient_id, actor_id, message_id, title, body)
    values (new.user_id, new.sender_id, new.id, 'New message from admin', left(new.body, 180))
    on conflict (recipient_id, message_id) do nothing;
  else
    insert into public.bus_ticket_notifications (recipient_id, actor_id, message_id, title, body)
    select profile.id, new.sender_id, new.id, 'New passenger message', left(new.body, 180)
    from public.auth_profiles as profile
    where profile.role = 'admin' and profile.id <> new.sender_id
    on conflict (recipient_id, message_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists bus_ticket_message_notification on public.bus_ticket_messages;
create trigger bus_ticket_message_notification
  after insert on public.bus_ticket_messages
  for each row execute function public.notify_message_recipient();

-- Refresh PostgREST's schema cache so the new table is immediately visible.
notify pgrst, 'reload schema';
