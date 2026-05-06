import { describe, expect, it } from 'vitest';
import {
  META_MODE_QUERY_PARAM,
  META_MODE_QUERY_VALUE,
  META_MODE_STORAGE_KEY,
  readMetaModeFromSearch,
  readMetaModeFromStorage,
  writeMetaModeToStorage,
} from './metaMode';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    snapshot: () => Object.fromEntries(map),
  };
}

describe('src/lib/metaMode', () => {
  it('exposes stable constants', () => {
    expect(META_MODE_QUERY_PARAM).toBe('meta');
    expect(META_MODE_QUERY_VALUE).toBe('1');
    expect(META_MODE_STORAGE_KEY).toBe('codeherway:meta-mode');
  });

  describe('readMetaModeFromSearch', () => {
    it('returns true when ?meta=1 is present', () => {
      expect(readMetaModeFromSearch('?meta=1')).toBe(true);
      expect(readMetaModeFromSearch('meta=1')).toBe(true);
      expect(readMetaModeFromSearch('?foo=bar&meta=1')).toBe(true);
    });

    it('returns false for any other meta value or absence', () => {
      expect(readMetaModeFromSearch('')).toBe(false);
      expect(readMetaModeFromSearch('?meta=0')).toBe(false);
      expect(readMetaModeFromSearch('?meta=true')).toBe(false);
      expect(readMetaModeFromSearch('?other=1')).toBe(false);
    });

    it('survives malformed input', () => {
      expect(readMetaModeFromSearch(undefined)).toBe(false);
      expect(readMetaModeFromSearch(null)).toBe(false);
      expect(readMetaModeFromSearch(42)).toBe(false);
    });
  });

  describe('readMetaModeFromStorage', () => {
    it('returns true when the storage entry equals "1"', () => {
      const storage = createMemoryStorage({ [META_MODE_STORAGE_KEY]: '1' });
      expect(readMetaModeFromStorage(storage)).toBe(true);
    });

    it('returns false when the entry is missing or different', () => {
      expect(readMetaModeFromStorage(createMemoryStorage())).toBe(false);
      expect(
        readMetaModeFromStorage(createMemoryStorage({ [META_MODE_STORAGE_KEY]: '0' })),
      ).toBe(false);
    });

    it('returns false when storage is unusable', () => {
      expect(readMetaModeFromStorage(null)).toBe(false);
      expect(readMetaModeFromStorage({})).toBe(false);
      expect(
        readMetaModeFromStorage({
          getItem: () => {
            throw new Error('blocked');
          },
        }),
      ).toBe(false);
    });
  });

  describe('writeMetaModeToStorage', () => {
    it('writes "1" or "0" depending on the boolean', () => {
      const storage = createMemoryStorage();
      writeMetaModeToStorage(storage, true);
      expect(storage.snapshot()[META_MODE_STORAGE_KEY]).toBe('1');
      writeMetaModeToStorage(storage, false);
      expect(storage.snapshot()[META_MODE_STORAGE_KEY]).toBe('0');
    });

    it('is a no-op when storage is unusable', () => {
      expect(() => writeMetaModeToStorage(null, true)).not.toThrow();
      expect(() => writeMetaModeToStorage({}, true)).not.toThrow();
      expect(() =>
        writeMetaModeToStorage(
          {
            setItem: () => {
              throw new Error('blocked');
            },
          },
          true,
        ),
      ).not.toThrow();
    });
  });
});
