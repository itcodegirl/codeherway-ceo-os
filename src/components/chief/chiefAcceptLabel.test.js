import { describe, expect, it } from 'vitest';
import { getChiefAcceptLabel } from './chiefAcceptLabel';

describe('getChiefAcceptLabel', () => {
  it('reports a saving state regardless of accepted flag', () => {
    expect(
      getChiefAcceptLabel({
        isAccepting: true,
        isAccepted: false,
        readyLabel: 'Add to Weekly',
      }),
    ).toBe('Saving...');

    expect(
      getChiefAcceptLabel({
        isAccepting: true,
        isAccepted: true,
        readyLabel: 'Add to Content',
      }),
    ).toBe('Saving...');
  });

  it('reports an accepted state when accepted but not actively saving', () => {
    expect(
      getChiefAcceptLabel({
        isAccepting: false,
        isAccepted: true,
        readyLabel: 'Add to Opportunities',
      }),
    ).toBe('Added');
  });

  it('returns the per-list ready label when no save is in flight and nothing is accepted', () => {
    expect(
      getChiefAcceptLabel({
        isAccepting: false,
        isAccepted: false,
        readyLabel: 'Add to Weekly',
      }),
    ).toBe('Add to Weekly');

    expect(
      getChiefAcceptLabel({
        isAccepting: false,
        isAccepted: false,
        readyLabel: 'Add to Opportunities',
      }),
    ).toBe('Add to Opportunities');
  });
});
