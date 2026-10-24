# Presentation Guide

## System overview

The Bus Ticketing System uses Next.js and TypeScript for the responsive web application, Supabase Auth for password and email OTP authentication, Supabase PostgreSQL for bus data, and Prisma for server-side database access.

## Demonstration order

1. **Registration and OTP:** register a new passenger, show the email code, verify it, and point out the resend option.
2. **Login and security:** log in with email and password, verify the second email OTP, then log out. Demonstrate expired or invalid codes only with a test account.
3. **Passenger booking:** search by origin, destination, date, and passenger count; choose a trip and seats; review the booking record.
4. **Message board:** send a message as a passenger, sign in as an administrator, and reply in that conversation.
5. **Admin tools:** demonstrate bus, route, and trip create/read/update/delete operations, booking management, and reports.
6. **Password recovery:** request a recovery OTP, verify it, and set a new password.
7. **Responsive UI:** show the public pages and booking flow at desktop and mobile widths.

## Before presenting

- Follow [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) and configure the Supabase PostgreSQL connection.
- Confirm Supabase SMTP and the signup, email OTP, and recovery templates are configured for `{{ .Token }}`.
- Create and verify a passenger account; promote a separate account to admin using the setup guide.
- Seed buses, routes, and trips with `npm run db:setup`.
- Do not present the old `admin@busticket.com` or `user@test.com` sample credentials as working Supabase Auth accounts. Auth accounts are created through Supabase Auth and the app registration flow.

## Requirement mapping

| Requirement | Bus ticketing implementation |
| --- | --- |
| Registration, login, logout | Supabase Auth flows and app session cookie |
| Email OTP, expiry, resend | Supabase Auth signup, email OTP, and recovery endpoints |
| Roles | Admin and passenger roles from Supabase app metadata |
| Dashboard | Passenger and admin dashboard pages |
| Message board | Passenger/admin conversation threads |
| CRUD and search | Admin bus/route/trip management; route and trip search |
| Database | Supabase PostgreSQL accessed with Prisma |
| Validation and security | Form/API validation, Supabase password handling, protected APIs |
| Activity/transactions | Login history and booking records |
| Reports and responsive UI | Admin reports plus responsive public and account pages |
