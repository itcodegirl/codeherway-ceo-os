/**
 * Theme preference is stored in its own localStorage key (so it does not need
 * a Supabase profile-schema migration) and applied to <html data-theme="...">.
 *
 * Three values:
 *   - 'system' (default): follow prefers-color-scheme.
 *   - 'dark':   force dark.
 *   - 'light':  force light.
 */

export const THEME_STORAGE_KEY = 'ceo-os-theme';
export const THEME_VALUES = ['system', 'dark', 'light'];
export const DEFAULT_THEME = 'system';

export function isValidTheme(value) {
  return typeof value === 'string' && THEME_VALUES.includes(value);
}

export function normalizeThemePreference(value) {
  return isValidTheme(value) ? value : DEFAULT_THEME;
}

export function resolveAppliedTheme(preference, prefersDark) {
  const normalized = normalizeThemePreference(preference);
  if (normalized === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return normalized;
}
