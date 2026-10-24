-- Read-only diagnostic for the signup error:
-- null value in column "username" of relation "profiles" violates not-null constraint
-- Returns the Auth trigger and its exact function body in one result set.
select
  trigger_row.tgname as trigger_name,
  function_namespace.nspname as function_schema,
  trigger_function.proname as function_name,
  pg_get_functiondef(trigger_function.oid) as function_definition
from pg_trigger as trigger_row
join pg_proc as trigger_function on trigger_function.oid = trigger_row.tgfoid
join pg_namespace as function_namespace on function_namespace.oid = trigger_function.pronamespace
where trigger_row.tgrelid = 'auth.users'::regclass
  and not trigger_row.tgisinternal
order by trigger_row.tgname;
