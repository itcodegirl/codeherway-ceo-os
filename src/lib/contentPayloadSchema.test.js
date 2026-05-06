import { describe, expect, it } from 'vitest';
import {
  parseContentPayload,
  validateContentPayload,
} from './contentPayloadSchema';

const VALID = {
  title: 'Founder Weekly',
  platform: 'LinkedIn',
  status: 'Drafting',
};

describe('validateContentPayload', () => {
  it('returns empty string for a valid payload', () => {
    expect(validateContentPayload(VALID)).toBe('');
  });

  it('returns an error when title is empty', () => {
    const error = validateContentPayload({ ...VALID, title: '' });
    expect(error).toBeTruthy();
    expect(error).toContain('Title');
  });

  it('returns an error when platform is empty', () => {
    const error = validateContentPayload({ ...VALID, platform: '' });
    expect(error).toBeTruthy();
    expect(error).toContain('Platform');
  });

  it('returns an error for an invalid status value', () => {
    const error = validateContentPayload({ ...VALID, status: 'Published' });
    expect(error).toBeTruthy();
  });

  it('accepts all valid status values', () => {
    for (const status of ['Drafting', 'Editing', 'Scheduled']) {
      expect(validateContentPayload({ ...VALID, status })).toBe('');
    }
  });
});

describe('parseContentPayload', () => {
  it('returns the trimmed payload and no error for valid input', () => {
    const { payload, error } = parseContentPayload({
      title: '  Founder Weekly  ',
      platform: ' LinkedIn ',
      status: 'Drafting',
    });

    expect(error).toBe('');
    expect(payload).toEqual({
      title: 'Founder Weekly',
      platform: 'LinkedIn',
      status: 'Drafting',
    });
  });

  it('returns an error and null payload when a required field is whitespace-only', () => {
    const { payload, error } = parseContentPayload({
      ...VALID,
      title: '   ',
    });

    expect(payload).toBeNull();
    expect(error).toContain('Title');
  });
});
