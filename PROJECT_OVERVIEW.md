# Project Overview

## Bus Ticketing System

This is a full-stack bus reservation and administration app built with Next.js, TypeScript, Supabase Auth, Supabase PostgreSQL, and Prisma.

## Application areas

- Public home, About Us, routes, schedules, and online booking.
- Passenger registration, login, logout, email OTP verification, and password recovery.
- Passenger dashboard, trip search, seat selection, booking history, profile, and messages.
- Admin dashboard for buses, routes, trips, bookings, users, messages, and reports.

## Data and authentication

- Supabase Auth manages passwords, email verification, OTP, sessions, and account roles.
- Supabase PostgreSQL stores routes, buses, trips, and bookings through Prisma.
- Supabase tables store auth profiles, login history, and message threads.
- New accounts are passengers. An authorized Supabase administrator can promote a verified account to admin; see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).

## Local setup

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for environment variables, PostgreSQL setup, OTP email configuration, and initial administrator setup. Use [QUICK_START.md](./QUICK_START.md) for the shortest run-through.
