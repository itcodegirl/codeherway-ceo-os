import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_CORRUPTION_EVENT,
  preserveCorruptStorageValue,
} from './storageCorruption';

describe('preserveCorruptStorageValue', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('writes a timestamped backup key for the corrupted blob', () => {
    const key = 'ceo-os-test-corrupt';
    const raw = '{this is not json';

    const backupKey = preserveCorruptStorageValue(key, raw, new Error('SyntaxError'));

    expect(backupKey).toMatch(/^ceo-os-test-corrupt__corrupt_\d+-\d{3}$/);
    expect(window.localStorage.getItem(backupKey)).toBe(raw);
  });

  it('dispatches a window event so a UI banner can react', () => {
    const detailEvents = [];
    const listener = (event) => {
      detailEvents.push(event.detail);
    };
    window.addEventListener(STORAGE_CORRUPTION_EVENT, listener);

    try {
      preserveCorruptStorageValue('ceo-os-test-event', '{', new Error('boom'));
    } finally {
      window.removeEventListener(STORAGE_CORRUPTION_EVENT, listener);
    }

    expect(detailEvents).toHaveLength(1);
    expect(detailEvents[0]).toMatchObject({
      key: 'ceo-os-test-event',
      message: 'boom',
    });
    expect(typeof detailEvents[0].backupKey).toBe('string');
  });

  it('keeps at most three backups per key', () => {
    const key = 'ceo-os-test-cap';
    const writtenKeys = [];
    for (let index = 0; index < 5; index += 1) {
      const backupKey = preserveCorruptStorageValue(key, `payload-${index}`, new Error('parse'));
      if (backupKey) {
        writtenKeys.push(backupKey);
      }
    }

    expect(writtenKeys).toHaveLength(5);

    const survivors = writtenKeys.filter((backupKey) => window.localStorage.getItem(backupKey) !== null);
    expect(survivors).toHaveLength(3);
  });

  it('returns null and does nothing when the raw value is null', () => {
    const result = preserveCorruptStorageValue('ceo-os-test-null', null, new Error('parse'));
    expect(result).toBeNull();
  });
});
