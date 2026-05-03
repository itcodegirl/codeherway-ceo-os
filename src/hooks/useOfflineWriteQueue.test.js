import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useOfflineWriteQueueSize } from './useOfflineWriteQueue';
import {
  OFFLINE_QUEUE_STORAGE_KEY,
  OFFLINE_QUEUE_UPDATED_EVENT,
  enqueueOfflineWrite,
  clearOfflineQueue,
} from '../lib/offlineWriteQueue';

describe('useOfflineWriteQueueSize', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearOfflineQueue();
  });

  afterEach(() => {
    clearOfflineQueue();
  });

  it('reads the persisted queue length on mount', () => {
    enqueueOfflineWrite({ kind: 'k', payload: 1 });
    enqueueOfflineWrite({ kind: 'k', payload: 2 });

    const { result } = renderHook(() => useOfflineWriteQueueSize());
    expect(result.current).toBe(2);
  });

  it('updates when OFFLINE_QUEUE_UPDATED_EVENT fires', () => {
    const { result } = renderHook(() => useOfflineWriteQueueSize());
    expect(result.current).toBe(0);

    act(() => {
      enqueueOfflineWrite({ kind: 'k', payload: 1 });
    });

    expect(result.current).toBe(1);

    act(() => {
      enqueueOfflineWrite({ kind: 'k', payload: 2 });
    });

    expect(result.current).toBe(2);
  });

  it('falls back to a fresh queue read when an event has no detail.size', () => {
    const { result } = renderHook(() => useOfflineWriteQueueSize());
    enqueueOfflineWrite({ kind: 'k', payload: 1 });
    enqueueOfflineWrite({ kind: 'k', payload: 2 });

    act(() => {
      window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_UPDATED_EVENT));
    });

    expect(result.current).toBe(2);
  });

  it('refreshes when another tab emits a storage event for the queue key', () => {
    const { result } = renderHook(() => useOfflineWriteQueueSize());

    enqueueOfflineWrite({ kind: 'k', payload: 1 });
    act(() => {
      const event = new Event('storage');
      Object.defineProperty(event, 'key', { value: OFFLINE_QUEUE_STORAGE_KEY });
      window.dispatchEvent(event);
    });

    expect(result.current).toBe(1);
  });
});
