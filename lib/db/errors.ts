export function databaseRequestError(error: unknown, resource: string) {
  const details = error instanceof Error ? error.message : '';
  const cannotReachDatabase = /P1001|can't reach database server|could not connect to server/i.test(details);

  return {
    error: cannotReachDatabase
      ? 'Cannot reach the Supabase database. Check that the project is active and that DATABASE_URL contains the current Session Pooler URI, then restart the app.'
      : `Failed to fetch ${resource}`,
    status: cannotReachDatabase ? 503 : 500,
  };
}
