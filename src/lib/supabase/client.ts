import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional.
 *
 * With credentials present the app runs on Postgres with real accounts. Without
 * them it falls back to local storage and still works as a single-user app, so a
 * deploy never breaks just because the backend has not been wired up yet.
 *
 * Vite only exposes variables prefixed `VITE_`. The Vercel–Supabase integration
 * injects `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_*`, none of which reach a client
 * bundle — the two below have to be set explicitly.
 *
 * The anon key belongs in the browser: it is public by design and carries no
 * authority of its own. Row level security is what protects the data. The
 * service role key must never appear in this project.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Narrows the nullable client at the call site rather than at every usage. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}

export const ENCOUNTER_PHOTO_BUCKET = 'encounter-photos';
