import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemePreference } from './useThemePreference';
import { THEME_STORAGE_KEY } from '../lib/themePreference';

function fakeMatchMedia(initialDark) {
  const listeners = new Set();
  const mediaQuery = {
    matches: initialDark,
    addEventListener: (_event, listener) => listeners.add(listener),
    removeEventListener: (_event, listener) => listeners.delete(listener),
    dispatchChange(nextMatches) {
      mediaQuery.matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches }));
    },
  };
  return mediaQuery;
}

describe('useThemePreference', () => {
  let mediaQuery;
  let originalMatchMedia;

  beforeEach(() => {
    window.localStorage.clear?.();
    document.documentElement.removeAttribute('data-theme');
    originalMatchMedia = window.matchMedia;
    mediaQuery = fakeMatchMedia(true);
    window.matchMedia = vi.fn(() => mediaQuery);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    window.matchMedia = originalMatchMedia;
  });

  it('defaults to system preference and applies the OS theme to <html>', () => {
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.preference).toBe('system');
    expect(result.current.appliedTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('applies a light data-theme attribute when system reports light', () => {
    mediaQuery = fakeMatchMedia(false);
    window.matchMedia = vi.fn(() => mediaQuery);

    const { result } = renderHook(() => useThemePreference());
    expect(result.current.appliedTheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists explicit dark/light preferences and updates the attribute', () => {
    const { result } = renderHook(() => useThemePreference());

    act(() => {
      result.current.setThemePreference('light');
    });
    expect(result.current.preference).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(JSON.stringify('light'));

    act(() => {
      result.current.setThemePreference('dark');
    });
    expect(result.current.preference).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('rejects invalid preference values silently', () => {
    const { result } = renderHook(() => useThemePreference());
    act(() => {
      result.current.setThemePreference('mystery');
    });
    expect(result.current.preference).toBe('system');
  });

  it('reacts to OS preference changes when in system mode', () => {
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.appliedTheme).toBe('dark');

    act(() => {
      mediaQuery.dispatchChange(false);
    });

    expect(result.current.appliedTheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
