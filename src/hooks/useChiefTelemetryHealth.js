import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CHIEF_TELEMETRY_UPDATED_EVENT,
  getChiefTelemetrySource,
  listChiefTelemetryEvents,
} from '../lib/chiefTelemetryRepository';

const DEFAULT_LIMIT = 50;

export function useChiefTelemetryHealth({ limit = DEFAULT_LIMIT } = {}) {
  const [source, setSource] = useState(getChiefTelemetrySource());
  const [recentCount, setRecentCount] = useState(0);
  const [lastEventTimestamp, setLastEventTimestamp] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const { source: nextSource, events } = await listChiefTelemetryEvents({ limit });
      const normalizedEvents = Array.isArray(events) ? events : [];
      setSource(nextSource || getChiefTelemetrySource());
      setRecentCount(normalizedEvents.length);
      setLastEventTimestamp(normalizedEvents[0]?.timestamp || '');
    } catch {
      setError('Unable to load telemetry health right now.');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let isMounted = true;

    const runRefresh = async () => {
      if (!isMounted) {
        return;
      }

      await refresh();
    };

    runRefresh();

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const listener = () => {
        if (isMounted) {
          void refresh();
        }
      };

      window.addEventListener(CHIEF_TELEMETRY_UPDATED_EVENT, listener);

      return () => {
        isMounted = false;
        window.removeEventListener(CHIEF_TELEMETRY_UPDATED_EVENT, listener);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  return useMemo(
    () => ({
      source,
      recentCount,
      lastEventTimestamp,
      isLoading,
      error,
      refresh,
    }),
    [source, recentCount, lastEventTimestamp, isLoading, error, refresh],
  );
}
