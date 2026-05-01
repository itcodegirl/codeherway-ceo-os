import { describe, expect, it } from 'vitest';
import {
  deleteRecordById,
  replaceRecordById,
  resolveNextValue,
  shallowEqualRecordArrays,
  shallowEqualRecords,
} from './stateUtils';

describe('src/lib/stateUtils', () => {
  it('resolves direct and functional next values', () => {
    expect(resolveNextValue('next', 'current')).toBe('next');
    expect(resolveNextValue((current) => `${current}-next`, 'current')).toBe('current-next');
  });

  it('compares shallow records and record arrays', () => {
    expect(shallowEqualRecords({ id: '1', label: 'A' }, { id: '1', label: 'A' })).toBe(true);
    expect(shallowEqualRecords({ id: '1' }, { id: '2' })).toBe(false);
    expect(shallowEqualRecordArrays([{ id: '1' }], [{ id: '1' }])).toBe(true);
    expect(shallowEqualRecordArrays([{ id: '1' }], [{ id: '2' }])).toBe(false);
  });

  it('replaces records by id and rejects missing records', () => {
    expect(replaceRecordById(
      [{ id: '1', title: 'Old' }, { id: '2', title: 'Keep' }],
      '1',
      { id: '1', title: 'New' },
    )).toEqual([{ id: '1', title: 'New' }, { id: '2', title: 'Keep' }]);

    expect(() => replaceRecordById(
      [{ id: '1', title: 'Old' }],
      'missing',
      { id: 'missing', title: 'New' },
      { notFoundMessage: 'Missing record' },
    )).toThrow('Missing record');
  });

  it('deletes records by id and rejects missing records', () => {
    expect(deleteRecordById(
      [{ id: '1', title: 'Delete' }, { id: '2', title: 'Keep' }],
      '1',
    )).toEqual([{ id: '2', title: 'Keep' }]);

    expect(() => deleteRecordById(
      [{ id: '1', title: 'Keep' }],
      'missing',
      { notFoundMessage: 'Missing record' },
    )).toThrow('Missing record');
  });
});
