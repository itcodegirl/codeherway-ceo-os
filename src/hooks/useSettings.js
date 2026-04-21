import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS } from '../lib/settings';
import { getSettingsSource, loadSettings, saveSettings as persistSettings } from '../lib/settingsRepository';

function resolveNextValue(nextValue, currentValue) {
  return typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
}

export function useSettings() {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState(0);
  const [source, setSource] = useState(getSettingsSource());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

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
      [key]: value,
    }));
  }, []);

  const setSettings = useCallback((nextValue) => {
    setSettingsState((current) => resolveNextValue(nextValue, current));
  }, []);

  const saveSettings = useCallback(async (nextSettings) => {
    setIsSaving(true);
    setLoadError('');

    try {
      const result = await persistSettings(nextSettings || settings);
      setSettingsState(result.settings || DEFAULT_SETTINGS);
      setSavedAt(result.savedAt || Date.now());
      setSource(result.source || getSettingsSource());
      return result;
    } catch (error) {
      setLoadError('Unable to save settings right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to save settings', error);
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  return useMemo(
    () => ({
      settings,
      savedAt,
      source,
      isLoading,
      isSaving,
      loadError,
      updateSetting,
      setSettings,
      saveSettings,
      refreshSettings: loadCurrentSettings,
    }),
    [
      settings,
      savedAt,
      source,
      isLoading,
      isSaving,
      loadError,
      updateSetting,
      setSettings,
      saveSettings,
      loadCurrentSettings,
    ],
  );
}
