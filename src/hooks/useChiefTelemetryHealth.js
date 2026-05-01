import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CHIEF_TELEMETRY_UPDATED_EVENT,
  getChiefTelemetrySource,
  listChiefTelemetryEvents,
} from '../lib/chiefTelemetryRepository';

const DEFAULT_LIMIT = 50;
const DEFAULT_COUNTERS = {
  saved: 0,
  skipped: 0,
  failed: 0,
};

function toCountValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function deriveOutcomeCounters(events) {
  if (!Array.isArray(events) || !events.length) {
    return DEFAULT_COUNTERS;
  }

  return events.reduce(
    (totals, event) => {
      if (!event || typeof event !== 'object') {
        return totals;
      }

      const eventName = typeof event.event === 'string' ? event.event.trim() : '';
      if (eventName === 'accept_item_saved') {
        totals.saved += 1;
      } else if (eventName === 'accept_item_skipped') {
        totals.skipped += 1;
      } else if (eventName === 'accept_item_failed') {
        totals.failed += 1;
      } else if (eventName === 'accept_all_completed') {
        totals.saved += toCountValue(event.saved);
        totals.skipped += toCountValue(event.skipped);
        totals.failed += toCountValue(event.failed);
      }

      return totals;
    },
    {
      saved: 0,
      skipped: 0,
      failed: 0,
    },
  );
}

export function useChiefTelemetryHealth({ limit = DEFAULT_LIMIT } = {}) {
  const [source, setSource] = useState(getChiefTelemetrySource());
  const [recentCount, setRecentCount] = useState(0);
  const [lastEventTimestamp, setLastEventTimestamp] = useState('');
  const [recentEvents, setRecentEvents] = useState([]);
  const [outcomeCounters, setOutcomeCounters] = useState(DEFAULT_COUNTERS);
  const [lastRequestId, setLastRequestId] = useState('');
  const [lastCorrelationId, setLastCorrelationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError('');

    try {
      const { source: nextSource, events } = await listChiefTelemetryEvents({ limit });
      const normalizedEvents = Array.isArray(events) ? events : [];
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setSource(nextSource || getChiefTelemetrySource());
      setRecentCount(normalizedEvents.length);
      setLastEventTimestamp(normalizedEvents[0]?.timestamp || '');
      setRecentEvents(normalizedEvents.slice(0, 6));
      setOutcomeCounters(deriveOutcomeCounters(normalizedEvents));
      setLastRequestId(
        normalizedEvents.find((event) => typeof event?.requestId === 'string' && event.requestId.trim())?.requestId || '',
      );
      setLastCorrelationId(
        normalizedEvents.find((event) => typeof event?.correlationId === 'string' && event.correlationId.trim())?.correlationId || '',
      );
    } catch {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError('Unable to load telemetry health right now.');
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    isMountedRef.current = true;

    const frameId = window.requestAnimationFrame(() => {
      void refresh();
    });

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const listener = () => {
        if (isMountedRef.current) {
          void refresh();
        }
      };

      window.addEventListener(CHIEF_TELEMETRY_UPDATED_EVENT, listener);

      return () => {
        isMountedRef.current = false;
        requestIdRef.current += 1;
        window.cancelAnimationFrame(frameId);
        window.removeEventListener(CHIEF_TELEMETRY_UPDATED_EVENT, listener);
      };
    }

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      window.cancelAnimationFrame(frameId);
    };
  }, [refresh]);

  return useMemo(
    () => ({
      source,
      recentCount,
      lastEventTimestamp,
      recentEvents,
      outcomeCounters,
      lastRequestId,
      lastCorrelationId,
      isLoading,
      error,
      refresh,
    }),
    [
      source,
      recentCount,
      lastEventTimestamp,
      recentEvents,
      outcomeCounters,
      lastRequestId,
      lastCorrelationId,
      isLoading,
      error,
      refresh,
    ],
  );
}
