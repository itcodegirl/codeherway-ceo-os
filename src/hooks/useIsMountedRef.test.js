import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIsMountedRef } from './useIsMountedRef';

describe('useIsMountedRef', () => {
  it('tracks mounted state and calls optional unmount cleanup', () => {
    const onUnmount = vi.fn();
    const { result, unmount } = renderHook(() => useIsMountedRef(onUnmount));

    expect(result.current.current).toBe(true);

    unmount();

    expect(result.current.current).toBe(false);
    expect(onUnmount).toHaveBeenCalledTimes(1);
  });
});
