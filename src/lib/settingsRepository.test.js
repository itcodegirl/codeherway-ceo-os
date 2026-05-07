import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  STORAGE_DOMAINS,
  createVersionedStorageEnvelope,
} from './dataSchema';

async function loadSettingsRepositoryWithSupabaseMock(mockDefinition) {
  vi.resetModules();
  if (mockDefinition?.isSupabaseConfigured) {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
  } else {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
  }
  vi.doMock('./supabaseAdapter', () => ({
    isSupabaseAdapterEnabled: Boolean(mockDefinition?.isSupabaseConfigured),
    getSupabaseAdapter: vi.fn(async () => (
      mockDefinition?.isSupabaseConfigured
        ? {
            getSupabaseClient: mockDefinition.getSupabaseClient || vi.fn(async () => mockDefinition.supabaseClient || null),
            requireSupabaseUserId: mockDefinition.requireSupabaseUserId || vi.fn(async () => ''),
          }
        : null
    )),
  }));
  return import('./settingsRepository');
}

describe('settingsRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('falls back to local storage when Supabase auth is required during load', async () => {
    const authRequiredError = new Error('Auth required');
    authRequiredError.code = 'SUPABASE_AUTH_REQUIRED';

    window.localStorage.setItem('ceo-os-settings', JSON.stringify({
      teamName: 'Local Team',
      timezone: 'America/New_York',
      emailDigest: false,
      keyboardShortcuts: true,
      autoSave: false,
    }));
    window.localStorage.setItem('ceo-os-settings-saved-at', '1745190000000');

    const { loadSettings } = await loadSettingsRepositoryWithSupabaseMock({
      isSupabaseConfigured: true,
      supabaseClient: {},
      requireSupabaseUserId: vi.fn(async () => {
        throw authRequiredError;
      }),
    });

    const result = await loadSettings();

    expect(result.source).toBe('local');
    expect(result.settings).toEqual({
      teamName: 'Local Team',
      timezone: 'America/New_York',
      emailDigest: false,
      keyboardShortcuts: true,
      autoSave: false,
    });
    expect(result.savedAt).toBe(1745190000000);
  });

  it('falls back to local persistence and emits update event when Supabase auth is required during save', async () => {
    const authRequiredError = new Error('Auth required');
    authRequiredError.code = 'SUPABASE_AUTH_REQUIRED';

    const updateListener = vi.fn();
    window.addEventListener('ceo-os:settings-updated', updateListener);

    try {
      const { saveSettings } = await loadSettingsRepositoryWithSupabaseMock({
        isSupabaseConfigured: true,
        supabaseClient: {},
        requireSupabaseUserId: vi.fn(async () => {
          throw authRequiredError;
        }),
      });

      const result = await saveSettings({
        teamName: 'Fallback Team',
        timezone: 'America/Chicago',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      });

      const storedSettings = JSON.parse(window.localStorage.getItem('ceo-os-settings'));

      expect(result.source).toBe('local');
      expect(storedSettings).toMatchObject({
        schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
        domain: STORAGE_DOMAINS.settings,
        model: 'Settings',
      });
      expect(storedSettings.data).toEqual({
        teamName: 'Fallback Team',
        timezone: 'America/Chicago',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      });
      expect(updateListener).toHaveBeenCalledTimes(1);
      expect(updateListener.mock.calls[0][0]?.detail?.source).toBe('local');
    } finally {
      window.removeEventListener('ceo-os:settings-updated', updateListener);
    }
  });

  it('reads settings from the current schema envelope', async () => {
    window.localStorage.setItem('ceo-os-settings', JSON.stringify(
      createVersionedStorageEnvelope(STORAGE_DOMAINS.settings, {
        teamName: 'Versioned Team',
        timezone: 'UTC',
        emailDigest: false,
        keyboardShortcuts: true,
        autoSave: false,
      }),
    ));

    const { loadSettings } = await loadSettingsRepositoryWithSupabaseMock({
      isSupabaseConfigured: false,
    });

    await expect(loadSettings()).resolves.toMatchObject({
      source: 'local',
      settings: {
        teamName: 'Versioned Team',
        timezone: 'UTC',
        emailDigest: false,
        keyboardShortcuts: true,
        autoSave: false,
      },
    });
  });

  it('throws and skips update events when local settings persistence fails', async () => {
    const updateListener = vi.fn();
    const originalSetItem = window.localStorage.setItem;
    window.addEventListener('ceo-os:settings-updated', updateListener);

    window.localStorage.setItem = vi.fn((key, value) => {
      if (key === 'ceo-os-settings') {
        throw new Error('storage full');
      }

      return originalSetItem.call(window.localStorage, key, value);
    });

    try {
      const { saveSettings } = await loadSettingsRepositoryWithSupabaseMock({
        isSupabaseConfigured: false,
      });

      await expect(saveSettings({
        teamName: 'Local Team',
        timezone: 'America/Chicago',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      })).rejects.toThrow('Failed to persist settings to localStorage');

      expect(updateListener).not.toHaveBeenCalled();
    } finally {
      window.localStorage.setItem = originalSetItem;
      window.removeEventListener('ceo-os:settings-updated', updateListener);
    }
  });

  it('uses Supabase profile data when Supabase is configured and available', async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        team_name: 'Supabase Team',
        timezone: 'America/Los_Angeles',
        email_digest: true,
        keyboard_shortcuts: true,
        auto_save: false,
        updated_at: '2026-04-21T14:00:00.000Z',
      },
      error: null,
    }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const { loadSettings } = await loadSettingsRepositoryWithSupabaseMock({
      isSupabaseConfigured: true,
      supabaseClient: { from },
      requireSupabaseUserId: vi.fn(async () => 'user-123'),
    });

    const result = await loadSettings();

    expect(result.source).toBe('supabase');
    expect(result.settings).toEqual({
      teamName: 'Supabase Team',
      timezone: 'America/Los_Angeles',
      emailDigest: true,
      keyboardShortcuts: true,
      autoSave: false,
    });
    expect(result.savedAt).toBe(Date.parse('2026-04-21T14:00:00.000Z'));
    expect(from).toHaveBeenCalledWith('profiles');
  });

});
