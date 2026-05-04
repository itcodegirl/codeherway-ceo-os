import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  notifySaveFailed,
  notifySaveSucceeded,
  SAVE_STATUS_EVENT,
  SAVE_STATUS_PHASES,
  subscribeSaveStatus,
} from './saveStatusBus';

describe('saveStatusBus', () => {
  let received;
  let unsubscribe;

  beforeEach(() => {
    received = [];
    unsubscribe = subscribeSaveStatus((detail) => {
      received.push(detail);
    });
  });

  afterEach(() => {
    unsubscribe?.();
  });

  it('emits a saved phase with the key and an ISO timestamp', () => {
    notifySaveSucceeded('ceo-os-test');
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      phase: SAVE_STATUS_PHASES.SAVED,
      key: 'ceo-os-test',
    });
    expect(typeof received[0].at).toBe('string');
    expect(Number.isNaN(Date.parse(received[0].at))).toBe(false);
  });

  it('emits a failed phase carrying the error message', () => {
    notifySaveFailed('ceo-os-test', new Error('quota exceeded'));
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      phase: SAVE_STATUS_PHASES.FAILED,
      key: 'ceo-os-test',
      message: 'quota exceeded',
    });
  });

  it('coerces non-Error failure values to string messages', () => {
    notifySaveFailed('ceo-os-test', 'bad json');
    expect(received[0].message).toBe('bad json');
  });

  it('ignores empty or non-string keys to avoid spurious events', () => {
    notifySaveSucceeded('');
    notifySaveSucceeded(null);
    notifySaveFailed(undefined, new Error('x'));
    expect(received).toHaveLength(0);
  });

  it('detaches the handler when the unsubscribe is called', () => {
    unsubscribe();
    notifySaveSucceeded('ceo-os-test');
    expect(received).toHaveLength(0);
  });

  it('uses the SAVE_STATUS_EVENT name for cross-module dispatch', () => {
    const handler = vi.fn();
    window.addEventListener(SAVE_STATUS_EVENT, handler);
    notifySaveSucceeded('ceo-os-test');
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(SAVE_STATUS_EVENT, handler);
  });
});
