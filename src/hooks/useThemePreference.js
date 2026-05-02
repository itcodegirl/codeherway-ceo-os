import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isValidTheme,
  normalizeThemePreference,
  resolveAppliedTheme,
} from '../lib/themePreference';
import { usePersistentState } from './usePersistentState';

function readSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function applyThemeAttribute(applied) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (!root) return;
  if (applied === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function useThemePreference() {
  const [storedPreference, setStoredPreference] = usePersistentState(
    THEME_STORAGE_KEY,
    DEFAULT_THEME,
  );
  const preference = normalizeThemePreference(storedPreference);
  const [prefersDark, setPrefersDark] = useState(readSystemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    let mediaQuery;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return undefined;
    }

    const handleChange = (event) => {
      setPrefersDark(Boolean(event.matches));
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
    return undefined;
  }, []);

  const appliedTheme = resolveAppliedTheme(preference, prefersDark);

  useEffect(() => {
    applyThemeAttribute(appliedTheme);
  }, [appliedTheme]);

  const setThemePreference = useCallback((next) => {
    if (!isValidTheme(next)) {
      return;
    }
    setStoredPreference(next);
  }, [setStoredPreference]);

  return useMemo(
    () => ({
      preference,
      appliedTheme,
      setThemePreference,
    }),
    [appliedTheme, preference, setThemePreference],
  );
}
