-- One-time migration for existing Supabase projects.
-- Replaces public.messages with the more recognizable public.bus_ticket_messages.
-- Existing message rows are intentionally removed by this requested reset.

begin;

drop table if exists public.messages;

create table if not exists public.bus_ticket_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists bus_ticket_messages_user_created_idx
  on public.bus_ticket_messages (user_id, created_at);

alter table public.bus_ticket_messages enable row level security;

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

revoke all on public.bus_ticket_messages from anon;
grant select, insert on public.bus_ticket_messages to authenticated;

notify pgrst, 'reload schema';

commit;
