const missingEnv = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

if (!missingEnv.url || !missingEnv.anonKey) {
  if (import.meta.env.DEV) {
    console.warn(
      'Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
}

export const isSupabaseConfigured = Boolean(missingEnv.url && missingEnv.anonKey);

export const getSupabaseConfig = () => ({
  url: missingEnv.url || '',
  anonKey: missingEnv.anonKey || '',
});
