import { describe, expect, it } from 'vitest';
import { validateContentPayload } from './contentPayloadSchema';

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
