const supabaseEnv = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

const shouldLogSupabaseDebug = import.meta.env.DEV && import.meta.env.VITE_SUPABASE_DEBUG === 'true';

if ((!supabaseEnv.url || !supabaseEnv.anonKey) && shouldLogSupabaseDebug) {
  console.info(
    'Supabase is not configured; running in local-first mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live persistence.',
  );
}

export const isSupabaseConfigured = Boolean(supabaseEnv.url && supabaseEnv.anonKey);

export const getSupabaseConfig = () => ({
  url: supabaseEnv.url || '',
  anonKey: supabaseEnv.anonKey || '',
});

let cachedSupabaseClient = null;
let cachedSupabaseClientPromise = null;

async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  if (!cachedSupabaseClientPromise) {
    cachedSupabaseClientPromise = createSupabaseClient()
      .then((client) => {
        cachedSupabaseClient = client;
        return client;
      })
      .catch((error) => {
        cachedSupabaseClientPromise = null;
        throw error;
      });
  }

  return cachedSupabaseClientPromise;
}

export async function requireSupabaseUserId() {
  const supabaseClient = await getSupabaseClient();
  if (!supabaseClient) {
    return '';
  }

  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    throw error;
  }

  const userId = data?.user?.id;
  if (!userId) {
    const authError = new Error('Supabase authentication is required for this action.');
    authError.code = 'SUPABASE_AUTH_REQUIRED';
    throw authError;
  }

  return userId;
}
