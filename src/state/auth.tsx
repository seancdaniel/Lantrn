import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'local';

interface AuthValue {
  status: AuthStatus;
  session: Session | null;
  userId: string | null;
  /** True when there is no backend and the app is running on this browser alone. */
  isLocal: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Supabase error text is written for developers; these are written for people. */
function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password do not match.';
  if (m.includes('email not confirmed')) return 'Check your inbox and confirm your email first.';
  if (m.includes('already registered')) return 'That email already has an account. Sign in instead.';
  if (m.includes('password')) return 'Passwords need at least six characters.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a minute and try again.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'local');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setStatus(data.session ? 'signed-in' : 'signed-out');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setStatus(next ? 'signed-in' : 'signed-out');
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      userId: session?.user.id ?? null,
      isLocal: !isSupabaseConfigured,

      signIn: async (email, password) => {
        if (!supabase) throw new Error('No backend is configured.');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(readable(error.message));
      },

      signUp: async (email, password, name) => {
        if (!supabase) throw new Error('No backend is configured.');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw new Error(readable(error.message));
      },

      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [status, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
