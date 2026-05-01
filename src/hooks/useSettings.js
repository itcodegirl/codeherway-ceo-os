import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../lib/settings';
import { getSettingsSource, loadSettings, saveSettings as persistSettings } from '../lib/settingsRepository';
import { resolveNextValue } from '../lib/stateUtils';

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
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const timezoneIsValid = Boolean(resolveTimeZone(settings.timezone || ''));

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCurrentSettings = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setLoadError('');

    try {
      const result = await loadSettings();
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setSettingsState(result.settings || DEFAULT_SETTINGS);
      setSavedAt(result.savedAt || 0);
      setSource(result.source || getSettingsSource());
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setLoadError('Unable to load settings right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load settings', error);
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
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
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

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
      setIsSaving(false);
      return;
    }

    try {
      const result = await persistSettings(normalizedSettings);
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return undefined;
      }

      setSettingsState(result.settings || DEFAULT_SETTINGS);
      setSavedAt(result.savedAt || Date.now());
      setSource(result.source || getSettingsSource());
      return result;
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return undefined;
      }

      setLoadError('Unable to save settings right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to save settings', error);
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsSaving(false);
      }
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
