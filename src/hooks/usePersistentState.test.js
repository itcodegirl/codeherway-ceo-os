import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  const storageKey = 'ceo-os-test-persistent-state';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes from localStorage or fallback value', () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ user: 'Alice' }));

    const { result } = renderHook(() => usePersistentState(storageKey, { user: 'Default' }));

    expect(result.current[0]).toEqual({ user: 'Alice' });
  });

  it('persists updates and supports function updaters', async () => {
    const { result } = renderHook(() => usePersistentState(storageKey, 0));

    act(() => {
      result.current[1](3);
    });

    expect(result.current[0]).toBe(3);
    expect(window.localStorage.getItem(storageKey)).toBe(JSON.stringify(3));

    act(() => {
      result.current[1]((value) => value + 2);
    });

    expect(result.current[0]).toBe(5);
    await waitFor(() => {
      expect(window.localStorage.getItem(storageKey)).toBe(JSON.stringify(5));
    });
  });

  it('syncs updates from storage events', async () => {
    const { result } = renderHook(() => usePersistentState(storageKey, ''));

    act(() => {
      const storageEvent = new Event('storage');

      Object.defineProperty(storageEvent, 'storageArea', { value: window.localStorage });
      Object.defineProperty(storageEvent, 'key', { value: storageKey });
      Object.defineProperty(storageEvent, 'newValue', { value: JSON.stringify('Remote update') });

      window.dispatchEvent(
        storageEvent,
      );
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('Remote update');
    });
  });

  it('syncs updates from in-page persistent-state events', async () => {
    const { result } = renderHook(() => usePersistentState(storageKey, ''));

    act(() => {
      window.dispatchEvent(
        new CustomEvent('ceo-os:persistent-state', {
          detail: {
            key: storageKey,
            value: { team: 'Founder' },
          },
        }),
      );
    });

    await waitFor(() => {
      expect(result.current[0]).toStrictEqual({ team: 'Founder' });
    });
  });
});
