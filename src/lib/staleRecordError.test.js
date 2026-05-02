import { describe, expect, it } from 'vitest';
import {
  STALE_RECORD_ERROR_CODE,
  StaleRecordError,
  isStaleRecordError,
} from './staleRecordError';

describe('StaleRecordError', () => {
  it('carries the STALE_RECORD code and a default message', () => {
    const error = new StaleRecordError();
    expect(error.code).toBe(STALE_RECORD_ERROR_CODE);
    expect(error.name).toBe('StaleRecordError');
    expect(error.message).toContain('changed in another window');
    expect(error).toBeInstanceOf(Error);
  });

  it('accepts a custom message', () => {
    const error = new StaleRecordError('Custom note.');
    expect(error.message).toBe('Custom note.');
  });

  it('isStaleRecordError detects by code or name and ignores unrelated errors', () => {
    expect(isStaleRecordError(new StaleRecordError())).toBe(true);
    expect(isStaleRecordError({ code: STALE_RECORD_ERROR_CODE })).toBe(true);
    expect(isStaleRecordError({ name: 'StaleRecordError' })).toBe(true);
    expect(isStaleRecordError(new Error('something else'))).toBe(false);
    expect(isStaleRecordError(undefined)).toBe(false);
    expect(isStaleRecordError(null)).toBe(false);
  });
});
