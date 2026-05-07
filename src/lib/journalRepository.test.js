import { beforeEach, describe, expect, it } from 'vitest';
import {
  getJournalEntryByDate,
  saveJournalEntry,
  listJournalEntries,
} from './journalRepository';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  STORAGE_DOMAINS,
  createVersionedStorageEnvelope,
} from './dataSchema';

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

  it('persists journal entries in a versioned schema envelope', () => {
    saveJournalEntry({
      dateKey: '2026-04-23',
      entry: {
        oneNextThing: 'Create schema coverage',
      },
    });

    const raw = JSON.parse(window.localStorage.getItem('ceo-os-journal-entries'));
    expect(raw).toMatchObject({
      schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
      domain: STORAGE_DOMAINS.journalEntries,
      model: 'Record<string,JournalEntry>',
    });
    expect(raw.data['2026-04-23']).toMatchObject({
      oneNextThing: 'Create schema coverage',
    });
  });

  it('continues reading legacy raw journal stores', () => {
    window.localStorage.setItem('ceo-os-journal-entries', JSON.stringify({
      '2026-04-23': {
        oneNextThing: 'Legacy next move',
        updatedAt: '2026-04-23T12:00:00.000Z',
      },
    }));

    expect(getJournalEntryByDate('2026-04-23')).toMatchObject({
      oneNextThing: 'Legacy next move',
    });
  });

  it('reads journal entries from the current schema envelope', () => {
    window.localStorage.setItem(
      'ceo-os-journal-entries',
      JSON.stringify(createVersionedStorageEnvelope(STORAGE_DOMAINS.journalEntries, {
        '2026-04-23': {
          todaySuccess: 'Versioned reflection',
          updatedAt: '2026-04-23T12:00:00.000Z',
        },
      })),
    );

    expect(getJournalEntryByDate('2026-04-23')).toMatchObject({
      todaySuccess: 'Versioned reflection',
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
