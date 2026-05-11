import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../lib/settings';
import { getSettingsSource, loadSettings, SETTINGS_UPDATED_EVENT } from '../lib/settingsRepository';
import { shallowEqualRecords } from '../lib/stateUtils';
import { useSilentRefresh } from './useSilentRefresh';

// Audit follow-up: cross-tab refresh wiring is now shared with
// useDashboardData via useSilentRefresh.
const SETTINGS_EVENTS = [SETTINGS_UPDATED_EVENT];
const SETTINGS_STORAGE_KEYS = [
  'ceo-os-settings',
  'ceo-os-settings-saved-at',
];
const LOAD_ERROR_MESSAGE = 'Unable to load workspace settings right now.';

export function useWorkspaceSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [source, setSource] = useState(getSettingsSource());
  const [loadError, setLoadError] = useState('');
  const requestIdRef = useRef(0);

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

  const silentRefresh = useCallback(() => {
    void refreshWorkspaceSettings();
  }, [refreshWorkspaceSettings]);

  useSilentRefresh({
    events: SETTINGS_EVENTS,
    // Settings updates are intentional in-app saves — never coalesce them so
    // two quick saves both produce a fresh refresh.
    forceEvents: SETTINGS_EVENTS,
    storageKeys: SETTINGS_STORAGE_KEYS,
    onRefresh: silentRefresh,
  });

  return useMemo(() => ({
    settings,
    source,
    loadError,
    teamName: resolveTeamName(settings?.teamName),
    timezone: resolveTimeZone(settings?.timezone),
    refreshWorkspaceSettings,
  }), [refreshWorkspaceSettings, settings, source, loadError]);
}
