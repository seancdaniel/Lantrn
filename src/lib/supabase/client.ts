import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional.
 *
 * With credentials present the app runs on Postgres with real accounts. Without
 * them it falls back to local storage and still works as a single-user app, so a
 * deploy never breaks just because the backend has not been wired up yet.
 *
 * Vite only exposes variables prefixed `VITE_`. The Vercel-Supabase integration
 * injects `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_*`, none of which reach a client
 * bundle - the two below have to be set explicitly.
 *
 * This uses the publishable key (`sb_publishable_...`), not the legacy `anon`
 * JWT that Supabase is phasing out. Both are safe in a browser and both carry no
 * authority of their own: row level security is what protects the data. The
 * secret key must never appear in this project.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
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
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return supabase;
}

export const ENCOUNTER_PHOTO_BUCKET = 'encounter-photos';
