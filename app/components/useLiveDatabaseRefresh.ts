'use client';

import { useEffect, useRef } from 'react';

const DATABASE_CHANGE_EVENT = 'app:database-change';

/** Rerun an authorized API read when Supabase reports a database change. */
export function useLiveDatabaseRefresh(refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const handleChange = () => refreshRef.current();
    window.addEventListener(DATABASE_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(DATABASE_CHANGE_EVENT, handleChange);
  }, []);
}
