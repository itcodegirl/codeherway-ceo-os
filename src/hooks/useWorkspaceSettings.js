import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../lib/settings';
import { getSettingsSource, loadSettings, SETTINGS_UPDATED_EVENT } from '../lib/settingsRepository';
import { shallowEqualRecords } from '../lib/stateUtils';

const SETTINGS_STORAGE_KEYS = new Set([
  'ceo-os-settings',
  'ceo-os-settings-saved-at',
]);
const SILENT_REFRESH_COALESCE_MS = 400;
const LOAD_ERROR_MESSAGE = 'Unable to load workspace settings right now.';

export function useWorkspaceSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [source, setSource] = useState(getSettingsSource());
  const [loadError, setLoadError] = useState('');
  const requestIdRef = useRef(0);
  const lastRefreshAtRef = useRef(0);

  const refreshWorkspaceSettings = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const result = await loadSettings();
      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextSettings = result?.settings || DEFAULT_SETTINGS;
      const nextSource = result?.source || getSettingsSource();

      setSettings((current) => (
        shallowEqualRecords(current, nextSettings) ? current : nextSettings
      ));
      setSource((current) => (current === nextSource ? current : nextSource));
      setLoadError((current) => (current === '' ? current : ''));
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setLoadError(LOAD_ERROR_MESSAGE);
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
    const requestRefresh = ({ force = false } = {}) => {
      const now = Date.now();
      if (!force && now - lastRefreshAtRef.current < SILENT_REFRESH_COALESCE_MS) {
        return;
      }

      lastRefreshAtRef.current = now;
      void refreshWorkspaceSettings();
    };

    const handleSettingsUpdated = () => {
      requestRefresh({ force: true });
    };

    const handleStorageChange = (event) => {
      if (event?.key === null || SETTINGS_STORAGE_KEYS.has(event?.key)) {
        requestRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestRefresh();
      }
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', requestRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', requestRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshWorkspaceSettings]);

  return useMemo(() => ({
    settings,
    source,
    loadError,
    teamName: resolveTeamName(settings?.teamName),
    timezone: resolveTimeZone(settings?.timezone),
    refreshWorkspaceSettings,
  }), [refreshWorkspaceSettings, settings, source, loadError]);
}
