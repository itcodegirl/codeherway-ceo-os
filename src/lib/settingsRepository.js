import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from './settings';
import { requireLocalStorageSetItem } from './utils';
import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';

const LOCAL_SETTINGS_KEY = 'ceo-os-settings';
const LOCAL_SETTINGS_SAVED_AT_KEY = 'ceo-os-settings-saved-at';
export const SETTINGS_UPDATED_EVENT = 'ceo-os:settings-updated';

function normalizeSettings(input) {
  const next = input && typeof input === 'object' ? input : {};
  const resolvedTimezone = resolveTimeZone(next.timezone);

  return {
    teamName: resolveTeamName(next.teamName),
    timezone: resolvedTimezone || DEFAULT_SETTINGS.timezone,
    emailDigest: typeof next.emailDigest === 'boolean' ? next.emailDigest : DEFAULT_SETTINGS.emailDigest,
    keyboardShortcuts:
      typeof next.keyboardShortcuts === 'boolean'
        ? next.keyboardShortcuts
        : DEFAULT_SETTINGS.keyboardShortcuts,
    autoSave: typeof next.autoSave === 'boolean' ? next.autoSave : DEFAULT_SETTINGS.autoSave,
  };
}

function notifySettingsUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail }));
}

function readLocalSettings() {
  if (typeof window === 'undefined') {
    return normalizeSettings(DEFAULT_SETTINGS);
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) {
      return normalizeSettings(DEFAULT_SETTINGS);
    }

    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

function readLocalSavedAt() {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_SAVED_AT_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeLocalSettings(settings, savedAt = Date.now()) {
  requireLocalStorageSetItem(
    LOCAL_SETTINGS_KEY,
    JSON.stringify(settings),
    'Failed to persist settings to localStorage',
  );
  requireLocalStorageSetItem(
    LOCAL_SETTINGS_SAVED_AT_KEY,
    String(savedAt),
    'Failed to persist settings to localStorage',
  );
}

function mapSettingsToProfileFields(settings) {
  return {
    team_name: settings.teamName,
    timezone: settings.timezone,
    email_digest: settings.emailDigest,
    keyboard_shortcuts: settings.keyboardShortcuts,
    auto_save: settings.autoSave,
  };
}

function mapProfileToSettings(profile) {
  return normalizeSettings({
    teamName: profile?.team_name,
    timezone: profile?.timezone,
    emailDigest: profile?.email_digest,
    keyboardShortcuts: profile?.keyboard_shortcuts,
    autoSave: profile?.auto_save,
  });
}

function isSupabaseAuthError(error) {
  const authErrorCode = error?.code || '';
  const statusCode = Number(error?.status) || 0;
  return (
    authErrorCode === 'SUPABASE_AUTH_REQUIRED'
    || authErrorCode === 'PGRST301'
    || authErrorCode === 'PGRST116'
    || statusCode === 401
    || statusCode === 403
  );
}

export function getSettingsSource() {
  return isSupabaseRuntimeEnabled ? 'supabase' : 'local';
}

export async function loadSettings() {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    try {
      const userId = await supabase.requireSupabaseUserId();
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('team_name, timezone, email_digest, keyboard_shortcuts, auto_save, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          settings: normalizeSettings(DEFAULT_SETTINGS),
          savedAt: 0,
          source: 'supabase',
        };
      }

      const updatedAtMs = Date.parse(data.updated_at || '') || 0;
      return {
        settings: mapProfileToSettings(data),
        savedAt: updatedAtMs,
        source: 'supabase',
      };
    } catch (error) {
      if (!isSupabaseAuthError(error)) {
        throw error;
      }
    }
  }

  return {
    settings: readLocalSettings(),
    savedAt: readLocalSavedAt(),
    source: 'local',
  };
}

export async function saveSettings(nextSettings) {
  const normalizedSettings = normalizeSettings(nextSettings);

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    try {
      const userId = await supabase.requireSupabaseUserId();
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert(
          {
            id: userId,
            ...mapSettingsToProfileFields(normalizedSettings),
          },
          { onConflict: 'id' },
        )
        .select('team_name, timezone, email_digest, keyboard_shortcuts, auto_save, updated_at')
        .single();

      if (error) {
        throw error;
      }

      notifySettingsUpdated({
        source: 'supabase',
      });

      return {
        settings: mapProfileToSettings(data),
        savedAt: Date.parse(data.updated_at || '') || Date.now(),
        source: 'supabase',
      };
    } catch (error) {
      if (!isSupabaseAuthError(error)) {
        throw error;
      }
    }
  }

  const savedAt = Date.now();
  writeLocalSettings(normalizedSettings, savedAt);
  notifySettingsUpdated({
    source: 'local',
  });

  return {
    settings: normalizedSettings,
    savedAt,
    source: 'local',
  };
}
