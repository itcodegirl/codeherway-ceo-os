import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  it('initializes from provided default value', () => {
    const { result } = renderHook(() => usePersistentState('ceo-os-test-key-init', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('persists updates to localStorage', () => {
    const key = `ceo-os-test-key-update-${Date.now()}`;
    const { result } = renderHook(() => usePersistentState(key, 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.localStorage.getItem(key)).toBe(JSON.stringify('updated'));
  });

  it('syncs values across hooks for the same key', async () => {
    const key = `ceo-os-shared-key-${Date.now()}`;
    const first = renderHook(() => usePersistentState(key, 'initial'));
    const second = renderHook(() => usePersistentState(key, 'initial'));

    act(() => {
      first.result.current[1]('shared-update');
    });

    await waitFor(() => {
      expect(second.result.current[0]).toBe('shared-update');
    });
  });
});
