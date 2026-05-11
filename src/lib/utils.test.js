import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCreateId,
  formatIsoDate,
  normalizePath,
  requireLocalStorageSetItem,
  safeLocalStorageSetItem,
} from './utils';
import { SAVE_STATUS_EVENT } from './saveStatusBus';

describe('src/lib/utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('generates a non-empty string id', () => {
    const value = buildCreateId();

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('keeps fallback ids unique within the same millisecond', () => {
    const originalCrypto = globalThis.crypto;

    vi.stubGlobal('crypto', {});
    vi.spyOn(Date, 'now').mockReturnValue(1770000000000);

    try {
      const first = buildCreateId();
      const second = buildCreateId();

      expect(first).not.toBe(second);
      expect(new Set([first, second]).size).toBe(2);
    } finally {
      vi.stubGlobal('crypto', originalCrypto);
    }
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

  it('writes values to localStorage when available', () => {
    const result = safeLocalStorageSetItem('ceo-os-test-key', 'value');

    expect(result).toBe(true);
    expect(window.localStorage.getItem('ceo-os-test-key')).toBe('value');
  });

  it('throws when a required localStorage write fails', () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('storage full');
    });

    try {
      expect(() => requireLocalStorageSetItem(
        'ceo-os-test-key',
        'value',
        'Required write failed',
      )).toThrow('Required write failed');
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });

  it('emits a saved save-status event on successful write', () => {
    const listener = vi.fn();
    window.addEventListener(SAVE_STATUS_EVENT, listener);

    try {
      safeLocalStorageSetItem('ceo-os-test-key', 'value');

      expect(listener).toHaveBeenCalledTimes(1);
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.phase).toBe('saved');
      expect(detail.key).toBe('ceo-os-test-key');
    } finally {
      window.removeEventListener(SAVE_STATUS_EVENT, listener);
    }
  });

  it('emits a failed save-status event when a write throws', () => {
    const listener = vi.fn();
    window.addEventListener(SAVE_STATUS_EVENT, listener);

    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('storage full');
    });

    try {
      const result = safeLocalStorageSetItem('ceo-os-test-key', 'value');
      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.phase).toBe('failed');
      expect(detail.key).toBe('ceo-os-test-key');
      expect(detail.message).toContain('storage full');
    } finally {
      window.localStorage.setItem = originalSetItem;
      window.removeEventListener(SAVE_STATUS_EVENT, listener);
    }
  });

  it('suppresses save-status events when silent is true', () => {
    const listener = vi.fn();
    window.addEventListener(SAVE_STATUS_EVENT, listener);

    try {
      safeLocalStorageSetItem('ceo-os-test-key', 'value', 'msg', { silent: true });

      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(SAVE_STATUS_EVENT, listener);
    }
  });
});
