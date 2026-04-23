import { getSupabaseAdapter, isSupabaseAdapterEnabled } from './supabaseAdapter';

export const isSupabaseRuntimeEnabled = isSupabaseAdapterEnabled;

export async function getSupabaseRuntime() {
  if (!isSupabaseRuntimeEnabled) {
    return null;
  }

  return getSupabaseAdapter();
}
