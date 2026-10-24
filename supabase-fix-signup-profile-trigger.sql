-- Fix signup conflicts from the old patient profile trigger.
-- This bus ticket app uses public.auth_profiles (created by
-- supabase-auth-migration.sql), not the unrelated public.profiles table.
-- This only disables automatic patient-profile creation for future signups;
-- it does not delete the existing public.profiles table or its rows.

begin;

drop trigger if exists auth_user_creates_patient_profile on auth.users;

commit;
