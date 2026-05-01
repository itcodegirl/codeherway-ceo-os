import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../lib/settings';
import { getSettingsSource, loadSettings, SETTINGS_UPDATED_EVENT } from '../lib/settingsRepository';

export function useWorkspaceSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [source, setSource] = useState(getSettingsSource());
  const requestIdRef = useRef(0);

  const refreshWorkspaceSettings = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const result = await loadSettings();
      if (requestId !== requestIdRef.current) {
        return;
      }

      setSettings(result?.settings || DEFAULT_SETTINGS);
      setSource(result?.source || getSettingsSource());
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load workspace settings', error);
      }
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) {
        void refreshWorkspaceSettings();
      }
    });

    return () => {
      isActive = false;
    };
  }, [refreshWorkspaceSettings]);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      void refreshWorkspaceSettings();
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, [refreshWorkspaceSettings]);

  return useMemo(() => ({
    settings,
    source,
    teamName: resolveTeamName(settings?.teamName),
    timezone: resolveTimeZone(settings?.timezone),
    refreshWorkspaceSettings,
  }), [refreshWorkspaceSettings, settings, source]);
}
