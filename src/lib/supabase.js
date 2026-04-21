import { createClient } from '@supabase/supabase-js';

const supabaseEnv = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

if (!supabaseEnv.url || !supabaseEnv.anonKey) {
  if (import.meta.env.DEV) {
    console.warn(
      'Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
}

export const isSupabaseConfigured = Boolean(supabaseEnv.url && supabaseEnv.anonKey);

export const getSupabaseConfig = () => ({
  url: supabaseEnv.url || '',
  anonKey: supabaseEnv.anonKey || '',
});

export const supabaseClient = isSupabaseConfigured
  ? createClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;
