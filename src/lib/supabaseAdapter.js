const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL
  && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

let supabaseAdapterPromise = null;

export const isSupabaseAdapterEnabled = hasSupabaseConfig;

export async function getSupabaseAdapter() {
  if (!hasSupabaseConfig) {
    return null;
  }

  if (!supabaseAdapterPromise) {
    supabaseAdapterPromise = import('./supabase').catch((error) => {
      if (import.meta.env.DEV) {
        console.error('Unable to load Supabase adapter, falling back to local-first mode.', error);
      }
      return null;
    });
  }

  return supabaseAdapterPromise;
}
