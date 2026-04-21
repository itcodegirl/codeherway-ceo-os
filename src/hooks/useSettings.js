import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../lib/settings';
import { getSettingsSource, loadSettings, saveSettings as persistSettings } from '../lib/settingsRepository';

function resolveNextValue(nextValue, currentValue) {
  return typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
}

function resolveSettingValue(key, nextValue) {
  if (key === 'teamName') {
    return resolveTeamName(nextValue);
  }

  if (key === 'timezone') {
    return typeof nextValue === 'string' ? nextValue : DEFAULT_SETTINGS.timezone;
  }

  if (key === 'emailDigest' || key === 'keyboardShortcuts' || key === 'autoSave') {
    return Boolean(nextValue);
  }

  return nextValue;
}

export function useSettings() {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState(0);
  const [source, setSource] = useState(getSettingsSource());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const timezoneIsValid = Boolean(resolveTimeZone(settings.timezone || ''));

  const loadCurrentSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const result = await loadSettings();
      setSettingsState(result.settings || DEFAULT_SETTINGS);
      setSavedAt(result.savedAt || 0);
      setSource(result.source || getSettingsSource());
    } catch (error) {
      setLoadError('Unable to load settings right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load settings', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadCurrentSettings();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadCurrentSettings]);

  const updateSetting = useCallback((key, value) => {
    setSettingsState((current) => ({
      ...current,
      [key]: resolveSettingValue(key, value),
    }));
  }, []);

  const setSettings = useCallback((nextValue) => {
    setSettingsState((current) => resolveNextValue(nextValue, current));
  }, []);

  const saveSettings = useCallback(async (nextSettings) => {
    setIsSaving(true);
    setLoadError('');
    const resolvedNextSettings = nextSettings || settings;
    const normalizedTimezone = resolveTimeZone(resolvedNextSettings?.timezone);
    const normalizedSettings = {
      ...resolvedNextSettings,
      timezone: normalizedTimezone || DEFAULT_SETTINGS.timezone,
      teamName: resolveTeamName(resolvedNextSettings?.teamName),
      emailDigest: Boolean(resolvedNextSettings?.emailDigest),
      keyboardShortcuts: Boolean(resolvedNextSettings?.keyboardShortcuts),
      autoSave: Boolean(resolvedNextSettings?.autoSave),
    };

    if (!normalizedTimezone) {
      setLoadError('Timezone is invalid.');
      setSettingsState((current) => ({
        ...current,
        timezone: normalizedSettings.timezone,
        teamName: normalizedSettings.teamName,
        emailDigest: normalizedSettings.emailDigest,
        keyboardShortcuts: normalizedSettings.keyboardShortcuts,
        autoSave: normalizedSettings.autoSave,
      }));
      return;
    }

    try {
      const result = await persistSettings(normalizedSettings);
      setSettingsState(result.settings || DEFAULT_SETTINGS);
      setSavedAt(result.savedAt || Date.now());
      setSource(result.source || getSettingsSource());
      return result;
    } catch (error) {
      setLoadError('Unable to save settings right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to save settings', error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const normalizeTimezone = useCallback(() => {
    setSettingsState((current) => {
      const resolvedTimezone = resolveTimeZone(current.timezone);
      if (!resolvedTimezone || resolvedTimezone === current.timezone) {
        return current;
      }

      return {
        ...current,
        timezone: resolvedTimezone,
      };
    });
  }, []);

  return useMemo(
    () => ({
      settings,
      savedAt,
      source,
      isLoading,
      isSaving,
      loadError,
      timezoneIsValid,
      updateSetting,
      setSettings,
      saveSettings,
      normalizeTimezone,
      refreshSettings: loadCurrentSettings,
    }),
    [
      settings,
      savedAt,
      source,
      isLoading,
      isSaving,
      loadError,
      timezoneIsValid,
      updateSetting,
      setSettings,
      saveSettings,
      normalizeTimezone,
      loadCurrentSettings,
    ],
  );
}
