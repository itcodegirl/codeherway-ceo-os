import { useCallback, useEffect, useRef } from 'react';
import { drainOfflineQueue, getOfflineQueue } from '../lib/offlineWriteQueue';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Automatically drains the offline write queue when the app comes back online.
 *
 * Pass `handlerByKind` — a map of `{ [kind]: async (payload) => any }` — to
 * handle each known write kind. Unknown kinds stay queued so a future code
 * version can drain them later.
 *
 * `onDrainFailure` is called with the drain summary `{ drained, failed,
 * remaining }` when at least one entry could not be replayed. Use it to
 * surface a toast so the user knows pending writes need attention. Not called
 * when the queue is empty or all entries drain successfully.
 */
export function useOfflineQueueDrain({ handlerByKind = {}, onDrainFailure } = {}) {
  const isOnline = useOnlineStatus();
  const isDrainingRef = useRef(false);
  const handlerByKindRef = useRef(handlerByKind);
  const onDrainFailureRef = useRef(onDrainFailure);

  useEffect(() => {
    handlerByKindRef.current = handlerByKind;
  });

  useEffect(() => {
    onDrainFailureRef.current = onDrainFailure;
  });

  const runDrain = useCallback(async () => {
    if (isDrainingRef.current) {
      return;
    }

    if (getOfflineQueue().length === 0) {
      return;
    }

    isDrainingRef.current = true;
    try {
      const result = await drainOfflineQueue(handlerByKindRef.current);
      if (result.failed > 0 && typeof onDrainFailureRef.current === 'function') {
        onDrainFailureRef.current(result);
      }
    } catch (error) {
      // drainOfflineQueue catches per-entry handler failures internally, so a
      // hard rejection here means storage itself failed (quota, serialization).
      // Surface it like a per-entry failure and keep this hook from emitting
      // an unhandled rejection on every reconnect.
      if (typeof onDrainFailureRef.current === 'function') {
        onDrainFailureRef.current({ drained: 0, failed: 1, remaining: 0 });
      }
      if (import.meta.env.DEV) {
        console.error('Offline queue drain failed unexpectedly', error);
      }
    } finally {
      isDrainingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return undefined;
    }

    // runDrain has its own try/catch so this can be a fire-and-forget call,
    // but we still attach a defensive .catch so a future unhandled path
    // cannot escape.
    runDrain().catch(() => {});
    return undefined;
  }, [isOnline, runDrain]);
}
