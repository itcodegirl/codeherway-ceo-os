import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { useMetaMode } from './useMetaMode';
import { META_MODE_STORAGE_KEY } from '../lib/metaMode';

function makeWrapper(initialEntries) {
  return function RouterWrapper({ children }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('useMetaMode', () => {
  beforeEach(() => {
    window.sessionStorage.clear?.();
  });

  afterEach(() => {
    window.sessionStorage.clear?.();
  });

  it('returns false by default', () => {
    const { result } = renderHook(() => useMetaMode(), {
      wrapper: makeWrapper(['/']),
    });
    expect(result.current).toBe(false);
  });

  it('returns true when ?meta=1 is present in the URL', () => {
    const { result } = renderHook(() => useMetaMode(), {
      wrapper: makeWrapper(['/?meta=1']),
    });
    expect(result.current).toBe(true);
  });

  it('persists meta mode in sessionStorage once enabled', () => {
    renderHook(() => useMetaMode(), {
      wrapper: makeWrapper(['/?meta=1']),
    });

    expect(window.sessionStorage.getItem(META_MODE_STORAGE_KEY)).toBe('1');
  });

  it('reads meta mode from sessionStorage on first render', () => {
    window.sessionStorage.setItem(META_MODE_STORAGE_KEY, '1');

    const { result } = renderHook(() => useMetaMode(), {
      wrapper: makeWrapper(['/']),
    });

    expect(result.current).toBe(true);
  });

  it('keeps meta mode true after navigating away from the meta URL', () => {
    function useProbe() {
      const location = useLocation();
      const navigate = useNavigate();
      const meta = useMetaMode();
      return { location, navigate, meta };
    }

    const { result } = renderHook(useProbe, {
      wrapper: makeWrapper(['/?meta=1']),
    });

    expect(result.current.meta).toBe(true);

    act(() => {
      result.current.navigate('/ops-reliability');
    });

    expect(result.current.meta).toBe(true);
  });
});
