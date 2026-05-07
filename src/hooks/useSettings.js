import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../lib/settings';
import { getSettingsSource, loadSettings, saveSettings as persistSettings } from '../lib/settingsRepository';
import { resolveNextValue } from '../lib/stateUtils';
import { useIsMountedRef } from './useIsMountedRef';

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
  const requestIdRef = useRef(0);
  const isSavingRef = useRef(false);
  const queuedSettingsRef = useRef(null);
  const editVersionRef = useRef(0);
  const timezoneIsValid = Boolean(resolveTimeZone(settings.timezone || ''));
  const resetSavingRef = useCallback(() => {
    isSavingRef.current = false;
    queuedSettingsRef.current = null;
  }, []);
  const isMountedRef = useIsMountedRef(resetSavingRef);

  const loadCurrentSettings = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setLoadError('');
    const loadEditVersion = editVersionRef.current;

    try {
      const result = await loadSettings();
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      if (loadEditVersion === editVersionRef.current) {
        setSettingsState(result.settings || DEFAULT_SETTINGS);
      }
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
  }, [isMountedRef]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadCurrentSettings();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadCurrentSettings]);

  const updateSetting = useCallback((key, value) => {
    editVersionRef.current += 1;
    setSettingsState((current) => ({
      ...current,
      [key]: resolveSettingValue(key, value),
    }));
  }, []);

  const setSettings = useCallback((nextValue) => {
    editVersionRef.current += 1;
    setSettingsState((current) => resolveNextValue(nextValue, current));
  }, []);

  const saveSettings = useCallback(async (nextSettings) => {
    const initialSettings = nextSettings || settings;

    if (isSavingRef.current) {
      queuedSettingsRef.current = initialSettings;
      return undefined;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setLoadError('');
    let settingsToSave = initialSettings;
    let lastResult;

    try {
      while (settingsToSave) {
        queuedSettingsRef.current = null;
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        const saveEditVersion = editVersionRef.current;
        const normalizedTimezone = resolveTimeZone(settingsToSave?.timezone);
        const normalizedSettings = {
          ...settingsToSave,
          timezone: normalizedTimezone || DEFAULT_SETTINGS.timezone,
          teamName: resolveTeamName(settingsToSave?.teamName),
          emailDigest: Boolean(settingsToSave?.emailDigest),
          keyboardShortcuts: Boolean(settingsToSave?.keyboardShortcuts),
          autoSave: Boolean(settingsToSave?.autoSave),
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
          settingsToSave = queuedSettingsRef.current;
          lastResult = undefined;
          continue;
        }

        const result = await persistSettings(normalizedSettings);
        lastResult = result;
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          settingsToSave = queuedSettingsRef.current;
          continue;
        }

        if (saveEditVersion === editVersionRef.current) {
          setSettingsState(result.settings || DEFAULT_SETTINGS);
        }
        setSavedAt(result.savedAt || Date.now());
        setSource(result.source || getSettingsSource());
        settingsToSave = queuedSettingsRef.current;
      }

      return lastResult;
    } catch (error) {
      if (!isMountedRef.current) {
        return undefined;
      }

      setLoadError('Unable to save settings right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to save settings', error);
      }
    } finally {
      if (isMountedRef.current) {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }
  }, [isMountedRef, settings]);

  const normalizeTimezone = useCallback(() => {
    setSettingsState((current) => {
      const resolvedTimezone = resolveTimeZone(current.timezone);
      if (!resolvedTimezone || resolvedTimezone === current.timezone) {
        return current;
      }

      editVersionRef.current += 1;
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
