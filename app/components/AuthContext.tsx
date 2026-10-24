'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createClient } from '@supabase/supabase-js';

const DATABASE_CHANGE_EVENT = 'app:database-change';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  photoUrl?: string;
}

interface AuthContextValue {
  /** null while checking session, then the user object or null if logged out. */
  user: SessionUser | null;
  /** True until the initial session check completes — avoids flicker/redirect races. */
  loading: boolean;
  /** Sign in with email and password - calls real API */
  signIn: (email: string, password: string) => Promise<{ success: boolean; otpRequired?: boolean; error?: string }>;
  /** Sign out - calls real API logout endpoint */
  signOut: () => Promise<void>;
  /** Refresh user data from server */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  realtimeConfig,
}: {
  children: React.ReactNode;
  realtimeConfig: { url: string; anonKey: string };
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionVersion = useRef(0);

  // Subscribe to a payload-free Supabase Broadcast. Database triggers publish
  // only an invalidation event; pages refetch their authorized API data.
  useEffect(() => {
    if (!realtimeConfig.url || !realtimeConfig.anonKey) return;
    const supabase = createClient(realtimeConfig.url, realtimeConfig.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    let dispatchTimer: number | undefined;
    const channel = supabase
      .channel('app-data', { config: { private: false } })
      .on('broadcast', { event: 'db-change' }, () => {
        window.clearTimeout(dispatchTimer);
        dispatchTimer = window.setTimeout(() => {
          window.dispatchEvent(new Event(DATABASE_CHANGE_EVENT));
        }, 150);
      })
      .subscribe();

    return () => {
      window.clearTimeout(dispatchTimer);
      void supabase.removeChannel(channel);
    };
  }, [realtimeConfig.url, realtimeConfig.anonKey]);

  // Check if user is already authenticated by calling GET /api/auth/me
  const checkSession = useCallback(async () => {
    const version = sessionVersion.current;
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
        cache: 'no-store',
      });

      // A 401 is the normal answer for a signed-out visitor — every public page
      // loads this on mount, so let it resolve to "no session" quietly instead
      // of letting the browser log a failed request on each visit.
      if (response.ok) {
        const data = await response.json();
        if (version === sessionVersion.current) setUser(data.user);
      } else {
        if (version === sessionVersion.current) setUser(null);
      }
    } catch {
      // Network-level failure (offline, server restarting) — treat as signed out.
      if (version === sessionVersion.current) setUser(null);
    } finally {
      if (version === sessionVersion.current) setLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, otpRequired: Boolean(data.otpRequired) };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // Sign out - call logout API
  const signOut = useCallback(async () => {
    sessionVersion.current += 1;
    setUser(null);
    setLoading(false);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear any identity immediately; the server also expires the cookie.
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser }),
    [user, loading, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}
