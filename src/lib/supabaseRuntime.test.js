import { describe, expect, it, vi } from 'vitest';

async function loadSupabaseRuntimeWithMock({
  isEnabled,
  adapterValue,
} = {}) {
  vi.resetModules();
  const getSupabaseAdapter = vi.fn(async () => adapterValue ?? null);

  vi.doMock('./supabaseAdapter', () => ({
    getSupabaseAdapter,
    isSupabaseAdapterEnabled: Boolean(isEnabled),
  }));

  const runtimeModule = await import('./supabaseRuntime');
  return {
    ...runtimeModule,
    getSupabaseAdapter,
  };
}

describe('supabaseRuntime', () => {
  it('returns null when Supabase adapter is not enabled', async () => {
    const { getSupabaseRuntime, isSupabaseRuntimeEnabled, getSupabaseAdapter } = await loadSupabaseRuntimeWithMock({
      isEnabled: false,
      adapterValue: { getSupabaseClient: vi.fn() },
    });

    const result = await getSupabaseRuntime();

    expect(isSupabaseRuntimeEnabled).toBe(false);
    expect(result).toBeNull();
    expect(getSupabaseAdapter).not.toHaveBeenCalled();
  });

  it('returns the shared adapter when Supabase adapter is enabled', async () => {
    const adapter = { getSupabaseClient: vi.fn() };
    const { getSupabaseRuntime, isSupabaseRuntimeEnabled, getSupabaseAdapter } = await loadSupabaseRuntimeWithMock({
      isEnabled: true,
      adapterValue: adapter,
    });

    const result = await getSupabaseRuntime();

    expect(isSupabaseRuntimeEnabled).toBe(true);
    expect(result).toBe(adapter);
    expect(getSupabaseAdapter).toHaveBeenCalledTimes(1);
  });
});
