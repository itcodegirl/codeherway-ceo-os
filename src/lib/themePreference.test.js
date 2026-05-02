import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_VALUES,
  isValidTheme,
  normalizeThemePreference,
  resolveAppliedTheme,
} from './themePreference';

describe('themePreference', () => {
  it('exposes the three supported values', () => {
    expect(THEME_VALUES).toEqual(['system', 'dark', 'light']);
    expect(DEFAULT_THEME).toBe('system');
  });

  it('treats unknown strings and non-strings as invalid', () => {
    expect(isValidTheme('high-contrast')).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme(null)).toBe(false);
    expect(isValidTheme(42)).toBe(false);
  });

  it('normalizes invalid input back to the default', () => {
    expect(normalizeThemePreference('mystery')).toBe(DEFAULT_THEME);
    expect(normalizeThemePreference(undefined)).toBe(DEFAULT_THEME);
  });

  it('resolveAppliedTheme honors explicit preferences', () => {
    expect(resolveAppliedTheme('dark', true)).toBe('dark');
    expect(resolveAppliedTheme('light', true)).toBe('light');
    expect(resolveAppliedTheme('dark', false)).toBe('dark');
    expect(resolveAppliedTheme('light', false)).toBe('light');
  });

  it('resolveAppliedTheme follows OS when preference is "system"', () => {
    expect(resolveAppliedTheme('system', true)).toBe('dark');
    expect(resolveAppliedTheme('system', false)).toBe('light');
  });

  it('resolveAppliedTheme falls back through normalization for unknown values', () => {
    expect(resolveAppliedTheme('mystery', true)).toBe('dark');
    expect(resolveAppliedTheme('mystery', false)).toBe('light');
  });
});
