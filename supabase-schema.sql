-- ============================================================
-- Bus Ticketing Management System — Supabase PostgreSQL schema + seed
-- Auth users live in Supabase Auth; this file creates the bus-ticket data tables.
-- DESTRUCTIVE reset: drops and recreates the bus-ticket tables below.
-- ============================================================

-- ---------- 1. Clean slate ----------
drop table if exists public."Booking" cascade;
drop table if exists public."Trip"    cascade;
drop table if exists public."Route"   cascade;
drop table if exists public."Bus"     cascade;

-- ---------- 2. Tables ----------
-- Supabase Auth profiles, login history, and messages are set up separately by
-- supabase-auth-migration.sql. This file resets and reseeds the bus tables;
-- do not run it against an existing database unless that reset is intended.

-- Buses: the fleet
create table public."Bus" (
  id          text        primary key default gen_random_uuid()::text,
  "busNumber" text        not null unique,
  model       text        not null,
  capacity    integer     not null,
  status      text        not null default 'active',     -- 'active' | 'maintenance' | 'inactive'
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Routes: origin -> destination with a base fare
create table public."Route" (
  id          text        primary key default gen_random_uuid()::text,
  name        text        not null unique,
  "fromCity"  text        not null,
  "toCity"    text        not null,
  distance    double precision not null,
  "basePrice" double precision not null,
  duration    text        not null,
  status      text        not null default 'active',     -- 'active' | 'inactive'
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Trips: a dated departure of a bus on a route
create table public."Trip" (
  id               text        primary key default gen_random_uuid()::text,
  "routeId"        text        not null references public."Route"(id) on delete restrict,
  "busId"          text        not null references public."Bus"(id)   on delete restrict,
  "departureDate"  text        not null,                 -- 'YYYY-MM-DD' (string, as in Prisma)
  "departureTime"  text        not null,                 -- '06:00 AM'
  "arrivalTime"    text        not null,
  price            double precision not null,
  "availableSeats" integer     not null,
  status           text        not null default 'scheduled', -- 'scheduled' | 'boarding' | 'completed' | 'cancelled'
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now()
);

-- Bookings: a passenger's seat on a trip
create table public."Booking" (
  id               text        primary key default gen_random_uuid()::text,
  "userId"         text        not null,
  "tripId"         text        not null references public."Trip"(id) on delete cascade,
  "seatNumber"     text        not null,
  "passengerName"  text        not null,
  "passengerEmail" text        not null,
  "passengerPhone" text        not null,
  status           text        not null default 'pending',  -- 'pending' | 'approved' | 'complete' | 'rejected' | 'cancelled'
  "paymentStatus"  text        not null default 'unpaid',   -- 'unpaid' | 'paid' | 'refunded'
  "paymentMethod"  text,                                    -- 'GCash' | 'Maya' | 'Cash'
  "totalAmount"    double precision not null,
  "bookingDate"    timestamptz not null default now(),
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now()
);

-- ---------- 3. Indexes ----------
create unique index "Trip_routeId_departureDate_departureTime_key"
  on public."Trip"("routeId", "departureDate", "departureTime");
create index "Trip_routeId_idx"        on public."Trip"("routeId");
create index "Trip_busId_idx"          on public."Trip"("busId");
create index "Trip_departureDate_idx"  on public."Trip"("departureDate");
create index "Booking_userId_idx"      on public."Booking"("userId");
create index "Booking_tripId_idx"      on public."Booking"("tripId");
create index "Booking_status_idx"      on public."Booking"("status");

-- A seat can only be sold once per trip, unless the booking was cancelled.
create unique index "Booking_seat_unique"
  on public."Booking"("tripId", "seatNumber")
  where status <> 'cancelled';

-- ---------- 4. updatedAt triggers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end $$;

create trigger trg_bus_updated     before update on public."Bus"     for each row execute function public.set_updated_at();
create trigger trg_route_updated   before update on public."Route"   for each row execute function public.set_updated_at();
create trigger trg_trip_updated    before update on public."Trip"    for each row execute function public.set_updated_at();
create trigger trg_booking_updated before update on public."Booking" for each row execute function public.set_updated_at();

-- ---------- 5. Seed bus and route data ----------

-- Buses
insert into public."Bus" ("busNumber", model, capacity, status) values
  ('BUS-001', 'Hino Grand Cruiser', 45, 'active'),
  ('BUS-002', 'Hyundai Universe',   50, 'active'),
  ('BUS-003', 'Daewoo GDW6117',     40, 'active'),
  ('BUS-004', 'Yutong ZK6127',      48, 'maintenance')
on conflict ("busNumber") do nothing;

-- Routes
insert into public."Route" (name, "fromCity", "toCity", distance, "basePrice", duration) values
  ('Cebu-Bato',      'Cebu City', 'Bato',      120.5, 300, '5 hours'),
  ('Cebu-Oslob',     'Cebu City', 'Oslob',     115.0, 200, '5 hours'),
  ('Cebu-Boljoon',   'Cebu City', 'Boljoon',   105.0, 300, '5 hours'),
  ('Cebu-Dalaguete', 'Cebu City', 'Dalaguete',  85.0, 300, '5 hours'),
  ('Cebu-Moalboal',  'Cebu City', 'Moalboal',   89.0, 250, '4 hours'),
  ('Cebu-Argao',     'Cebu City', 'Argao',      67.0, 280, '4.5 hours')
on conflict (name) do nothing;

-- Trips: next 7 days x first 4 routes x 3 departures
insert into public."Trip"
  ("routeId", "busId", "departureDate", "departureTime", "arrivalTime", price, "availableSeats", status)
select
  r.id,
  b.id,
  to_char(current_date + offs, 'YYYY-MM-DD'),
  t.dep_time,
  '10:00 PM',
  r."basePrice",
  b.capacity,
  'scheduled'
from generate_series(0, 6) as offs
cross join (select id, "basePrice" from public."Route" order by name limit 4) r
cross join (values ('06:00 AM'), ('08:00 AM'), ('10:00 AM')) as t(dep_time)
cross join lateral (
  select id, capacity from public."Bus"
  where status = 'active'
  order by md5(random()::text) limit 1
) b
on conflict ("routeId", "departureDate", "departureTime") do nothing;

-- These tables are accessed by the server through Prisma's private DB URL.
-- Do not expose bus, trip, or booking rows through the public API role.
alter table public."Bus" enable row level security;
alter table public."Route" enable row level security;
alter table public."Trip" enable row level security;
alter table public."Booking" enable row level security;
revoke all on public."Bus", public."Route", public."Trip", public."Booking" from anon, authenticated;

-- ---------- 6. Verify ----------
select 'Bus'     as table_name, count(*) from public."Bus"
union all select 'Route',   count(*) from public."Route"
union all select 'Trip',    count(*) from public."Trip"
union all select 'Booking', count(*) from public."Booking";
