import { useEffect, useState } from 'react';
import {
  OFFLINE_QUEUE_UPDATED_EVENT,
  getOfflineQueue,
} from '../lib/offlineWriteQueue';

/**
 * Subscribes a component to the offline-write queue size. Returns the
 * count of pending writes so the SyncStatusPill (or any other UI) can
 * surface it without callers having to wire the event listener themselves.
 *
 * Reads the current size on mount, updates on every queue change event,
 * and cleans up on unmount.
 */
export function useOfflineWriteQueueSize() {
  const [size, setSize] = useState(() => getOfflineQueue().length);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleQueueChange = (event) => {
      const detailSize = Number(event?.detail?.size);
      if (Number.isFinite(detailSize) && detailSize >= 0) {
        setSize(detailSize);
        return;
      }
      setSize(getOfflineQueue().length);
    };

    // Refetch on storage events so other tabs' queue mutations propagate.
    const handleStorageChange = (event) => {
      if (event?.key === null || event?.key === 'ceo-os-offline-write-queue') {
        setSize(getOfflineQueue().length);
      }
    };

    window.addEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handleQueueChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handleQueueChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return size;
}
