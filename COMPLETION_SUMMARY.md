# Bus Ticketing System — Requirements Summary

## Implemented

- **Registration and authentication:** passenger registration, login/logout, password recovery, and protected sessions via Supabase Auth.
- **OTP:** email OTP for new-account activation and login; recovery OTP for password reset; verification, resend, and Supabase-enforced expiration.
- **Roles:** admin and passenger roles, enforced in protected page/API routes.
- **Dashboards:** passenger and admin dashboards.
- **Message board:** private passenger-to-admin threads with replies.
- **CRUD:** admin bus, route, and trip management; booking read/update/cancel/delete actions.
- **Database:** bus, route, trip, and booking data in Supabase PostgreSQL via Prisma; profiles, login events, and messages in Supabase tables.
- **Search and filtering:** route/trip search and booking status filters.
- **Validation/security:** input validation, server-side role checks, HTTP-only session cookies, and passwords managed by Supabase Auth.
- **History and reports:** login activity history, booking/transaction records, and admin reports.
- **Responsive interface:** responsive public, booking, account, passenger, and admin pages.

## Required project configuration

The code is ready for Supabase PostgreSQL and email OTP, but deployment requires project-specific values and settings. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DATABASE_URL`; run `supabase-auth-migration.sql` and `supabase-business-security.sql`; configure SMTP and `{{ .Token }}` email templates; and promote a verified account to admin. See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).

The seed creates bus, route, and upcoming trip data. It does not create working Supabase Auth users or fake booking history. Register passenger accounts through the app, then promote the chosen administrator account in Supabase.

## Known scope limits

- Payment method capture is part of booking; a live payment processor is not configured.
- SMS OTP is not enabled; the implemented OTP channel is email.
- Existing data in the former local SQLite database is not automatically migrated to PostgreSQL.
