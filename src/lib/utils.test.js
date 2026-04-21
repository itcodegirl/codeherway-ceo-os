import { describe, expect, it } from 'vitest';
import { buildCreateId, formatIsoDate, normalizePath } from './utils';

describe('src/lib/utils', () => {
  it('generates a non-empty string id', () => {
    const value = buildCreateId();

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('formats dates as ISO local date strings', () => {
    const date = new Date('2026-04-20T15:30:00.000Z');

    expect(formatIsoDate(date, 'UTC')).toBe('2026-04-20');
  });

  it('normalizes paths by trimming trailing slashes', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('/weekly-brief')).toBe('/weekly-brief');
    expect(normalizePath('/weekly-brief/')).toBe('/weekly-brief');
    expect(normalizePath('/weekly-brief///')).toBe('/weekly-brief');
  });
});
