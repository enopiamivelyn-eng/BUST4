-- Run in Supabase SQL Editor before deploying the QR ticket feature.
-- Booking.userId stores the Supabase Auth UUID as text; it is not a Prisma User
-- row. Remove the stale FK left by an older schema so Supabase Auth accounts
-- can create bookings.
alter table public."Booking"
  drop constraint if exists "Booking_userId_fkey";

-- Approved legacy bookings receive a token for their reservation QR. The
-- terminal scanner still requires paid status before check-in.
alter table public."Booking"
  add column if not exists "ticketToken" text,
  add column if not exists "checkedInAt" timestamptz;

update public."Booking"
set "ticketToken" = gen_random_uuid()::text
where "paymentStatus" = 'paid'
  and "status" in ('approved', 'confirmed', 'complete', 'completed')
  and "ticketToken" is null;

update public."Booking"
set "ticketToken" = gen_random_uuid()::text
where "status" in ('approved', 'confirmed', 'complete', 'completed')
  and "paymentStatus" in ('unpaid', 'pending', 'failed')
  and "ticketToken" is null;

create unique index if not exists "Booking_ticketToken_key"
  on public."Booking" ("ticketToken");
