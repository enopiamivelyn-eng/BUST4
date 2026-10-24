-- Repair the Trip updatedAt trigger used by Prisma schedule edits.
-- Run this in Supabase Dashboard > SQL Editor.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new."updatedAt" := now();
  return new;
end;
$function$;

drop trigger if exists trg_trip_updated on public."Trip";
create trigger trg_trip_updated
  before update on public."Trip"
  for each row
  execute function public.set_updated_at();
