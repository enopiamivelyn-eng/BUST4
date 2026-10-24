-- Run after Prisma creates the bus-ticket tables in Supabase PostgreSQL.
-- The app server uses the private DATABASE_URL. Browser roles should use the
-- authenticated API routes instead of reading or writing these tables directly.
alter table public."Bus" enable row level security;
alter table public."Route" enable row level security;
alter table public."Trip" enable row level security;
alter table public."Booking" enable row level security;

revoke all on public."Bus", public."Route", public."Trip", public."Booking"
  from anon, authenticated;

notify pgrst, 'reload schema';
