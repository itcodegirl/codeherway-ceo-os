import { describe, expect, it } from 'vitest';
import { hasText, normalizeCollection, normalizeText } from './focusSignalUtils';

describe('src/lib/focusSignalUtils', () => {
  it('normalizes array-like focus inputs defensively', () => {
    const values = [{ id: 'one' }];

    expect(normalizeCollection(values)).toBe(values);
    expect(normalizeCollection(null)).toEqual([]);
    expect(normalizeCollection({ id: 'not-array' })).toEqual([]);
  });

  it('normalizes text and identifies meaningful content', () => {
    expect(normalizeText('  follow up  ')).toBe('follow up');
    expect(normalizeText(null)).toBe('');
    expect(hasText('  follow up  ')).toBe(true);
    expect(hasText('   ')).toBe(false);
  });
});
