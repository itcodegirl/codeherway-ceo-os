import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from './settings';

describe('settings helpers', () => {
  describe('resolveTeamName', () => {
    it('returns trimmed team name when value is present', () => {
      expect(resolveTeamName('  Launch Ops  ')).toBe('Launch Ops');
    });

    it('falls back to default team name for empty and non-string values', () => {
      expect(resolveTeamName('   ')).toBe(DEFAULT_SETTINGS.teamName);
      expect(resolveTeamName(null)).toBe(DEFAULT_SETTINGS.teamName);
    });
  });

  describe('resolveTimeZone', () => {
    it('keeps valid IANA timezone values', () => {
      expect(resolveTimeZone('America/Chicago')).toBe('America/Chicago');
    });

    it('returns empty string for invalid or empty values', () => {
      expect(resolveTimeZone('')).toBe('');
      expect(resolveTimeZone('Mars/Olympus')).toBe('');
      expect(resolveTimeZone(undefined)).toBe('');
    });
  });
});
