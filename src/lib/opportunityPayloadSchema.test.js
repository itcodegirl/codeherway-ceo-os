import { describe, expect, it } from 'vitest';
import { validateOpportunityPayload } from './opportunityPayloadSchema';

const VALID = {
  name: 'Acme Expansion',
  company: 'Acme Corp',
  priority: 'High',
  stage: 'New',
  nextStep: 'Send intro email',
};

describe('validateOpportunityPayload', () => {
  it('returns empty string for a valid payload', () => {
    expect(validateOpportunityPayload(VALID)).toBe('');
  });

  it('returns an error when name is empty', () => {
    const error = validateOpportunityPayload({ ...VALID, name: '' });
    expect(error).toBeTruthy();
    expect(error).toContain('Name');
  });

  it('returns an error when company is empty', () => {
    const error = validateOpportunityPayload({ ...VALID, company: '' });
    expect(error).toBeTruthy();
    expect(error).toContain('Company');
  });

  it('returns an error when nextStep is empty', () => {
    const error = validateOpportunityPayload({ ...VALID, nextStep: '' });
    expect(error).toBeTruthy();
    expect(error).toContain('Next step');
  });

  it('returns an error for an invalid priority value', () => {
    const error = validateOpportunityPayload({ ...VALID, priority: 'Critical' });
    expect(error).toBeTruthy();
  });

  it('returns an error for an invalid stage value', () => {
    const error = validateOpportunityPayload({ ...VALID, stage: 'Closed' });
    expect(error).toBeTruthy();
  });

  it('accepts all valid priority values', () => {
    for (const priority of ['High', 'Medium', 'Low']) {
      expect(validateOpportunityPayload({ ...VALID, priority })).toBe('');
    }
  });

  it('accepts all valid stage values', () => {
    for (const stage of ['New', 'In Progress', 'Awaiting Reply']) {
      expect(validateOpportunityPayload({ ...VALID, stage })).toBe('');
    }
  });
});
