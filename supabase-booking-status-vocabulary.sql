-- Run in Supabase SQL Editor to align stored booking statuses with the labels
-- used by the application. Legacy values are migrated safely and idempotently.
-- The app continues to read legacy values while this migration is pending.
update public."Booking"
set status = case status
  when 'confirmed' then 'approved'
  when 'completed' then 'complete'
  else status
end
where status in ('confirmed', 'completed');

-- Broadcast only a payload-free invalidation; clients refetch the authorized
-- booking endpoint. This also covers edits made directly in Supabase Studio.
create or replace function public.broadcast_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  begin
    perform realtime.send(
      jsonb_build_object('table', TG_TABLE_NAME),
      'db-change',
      'app-data',
      false
    );
  exception when others then
    -- Realtime outages must not prevent booking writes.
    null;
  end;
  return null;
end;
$function$;

drop trigger if exists "Booking_realtime_change" on public."Booking";
create trigger "Booking_realtime_change"
after insert or update or delete on public."Booking"
for each row execute function public.broadcast_booking_status_change();
