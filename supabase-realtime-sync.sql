-- Run this in Supabase SQL Editor after the booking, auth profile, message,
-- and notification tables have been created, to enable live UI refreshes.
-- Broadcast only the table name, never passenger or payment fields. Clients
-- refetch the authorized API after receiving this invalidation event.

create or replace function public.broadcast_app_data_change()
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
    -- Never make a booking or schedule write fail just because Realtime is
    -- unavailable. Existing API polling remains the fallback.
    null;
  end;
  return null;
end;
$function$;

drop trigger if exists "Booking_realtime_change" on public."Booking";
create trigger "Booking_realtime_change"
after insert or update or delete on public."Booking"
for each row execute function public.broadcast_app_data_change();

drop trigger if exists "Trip_realtime_change" on public."Trip";
create trigger "Trip_realtime_change"
after insert or update or delete on public."Trip"
for each row execute function public.broadcast_app_data_change();

drop trigger if exists "Route_realtime_change" on public."Route";
create trigger "Route_realtime_change"
after insert or update or delete on public."Route"
for each row execute function public.broadcast_app_data_change();

drop trigger if exists "Bus_realtime_change" on public."Bus";
create trigger "Bus_realtime_change"
after insert or update or delete on public."Bus"
for each row execute function public.broadcast_app_data_change();

drop trigger if exists "bus_ticket_messages_realtime_change" on public.bus_ticket_messages;
create trigger "bus_ticket_messages_realtime_change"
after insert or update or delete on public.bus_ticket_messages
for each row execute function public.broadcast_app_data_change();

drop trigger if exists "bus_ticket_notifications_realtime_change" on public.bus_ticket_notifications;
create trigger "bus_ticket_notifications_realtime_change"
after insert or update or delete on public.bus_ticket_notifications
for each row execute function public.broadcast_app_data_change();

drop trigger if exists "auth_profiles_realtime_change" on public.auth_profiles;
create trigger "auth_profiles_realtime_change"
after insert or update or delete on public.auth_profiles
for each row execute function public.broadcast_app_data_change();
