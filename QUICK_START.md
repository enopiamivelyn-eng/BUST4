# Quick Start

## Setup

1. Install Node.js 20.9 or newer and run `npm install`.
2. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DATABASE_URL` in `.env.local` and `.env` as described in [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).
3. Run `npm run db:setup` to create the PostgreSQL schema and seed buses, routes, and trips.
4. Run `supabase-auth-migration.sql` in Supabase SQL Editor.
5. Run `supabase-business-security.sql` in Supabase SQL Editor.
6. Enable Supabase email confirmation, configure the `{{ .Token }}` email templates, and configure SMTP.
7. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

To access the admin panel, register a user through the app, verify their email, then promote that account with the SQL in [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).

## Main flows

- **Passenger:** register → verify email OTP → log in with password and email OTP → search trips → book seats → view booking history.
- **Admin:** log in with password and email OTP → manage buses, routes, and trips → view bookings, messages, and reports.
- **Forgot password:** request recovery code → verify code → set a new password.

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for database connection details, SMTP configuration, role setup, and existing-data notes.
