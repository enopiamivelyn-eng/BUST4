-- In-app notifications for passenger/admin message conversations.
-- Run this after supabase-auth-migration.sql, which creates auth_profiles and the message table.

begin;

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

notify pgrst, 'reload schema';

commit;
