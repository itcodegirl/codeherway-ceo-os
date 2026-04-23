import { beforeEach, describe, expect, it } from 'vitest';
import {
  getJournalEntryByDate,
  saveJournalEntry,
  listJournalEntries,
} from './journalRepository';

describe('src/lib/journalRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns an empty normalized entry when no data exists', () => {
    const entry = getJournalEntryByDate('2026-04-23');

    expect(entry).toMatchObject({
      onMyMind: '',
      feelsHeavy: '',
      oneNextThing: '',
      todaySuccess: '',
    });
  });

  it('saves and returns entry values by date', () => {
    saveJournalEntry({
      dateKey: '2026-04-23',
      entry: {
        onMyMind: 'Prepare launch notes',
        feelsHeavy: 'Decision fatigue',
      },
    });

    const entry = getJournalEntryByDate('2026-04-23');
    expect(entry).toMatchObject({
      onMyMind: 'Prepare launch notes',
      feelsHeavy: 'Decision fatigue',
    });
  });

  it('lists entries in descending date order', () => {
    saveJournalEntry({
      dateKey: '2026-04-22',
      entry: { onMyMind: 'Yesterday' },
    });
    saveJournalEntry({
      dateKey: '2026-04-23',
      entry: { onMyMind: 'Today' },
    });

    const entries = listJournalEntries();
    expect(entries[0].dateKey).toBe('2026-04-23');
    expect(entries[1].dateKey).toBe('2026-04-22');
  });
});
