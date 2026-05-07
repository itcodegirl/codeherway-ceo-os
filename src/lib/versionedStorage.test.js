import { beforeEach, describe, expect, it } from 'vitest';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  STORAGE_DOMAINS,
  createVersionedStorageEnvelope,
} from './dataSchema';
import {
  getVersionedStorageKey,
  readVersionedLocalStorage,
  safeWriteVersionedLocalStorage,
  writeVersionedLocalStorage,
} from './versionedStorage';

describe('versionedStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes and reads versioned localStorage envelopes', () => {
    const items = [{ id: 'opp-1', name: 'Partner lead' }];

    writeVersionedLocalStorage(
      STORAGE_DOMAINS.opportunities,
      items,
      'Failed to persist opportunities',
    );

    const raw = JSON.parse(window.localStorage.getItem('ceo-os-opportunities'));
    expect(raw).toMatchObject({
      schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
      domain: STORAGE_DOMAINS.opportunities,
      model: 'Opportunity[]',
    });
    expect(readVersionedLocalStorage(STORAGE_DOMAINS.opportunities, [])).toEqual(items);
  });

  it('still reads legacy raw payloads for the same storage key', () => {
    const legacyItems = [{ id: 'content-1', title: 'Launch post' }];
    window.localStorage.setItem('ceo-os-content-items', JSON.stringify(legacyItems));

    expect(readVersionedLocalStorage(STORAGE_DOMAINS.contentItems, [])).toEqual(legacyItems);
  });

  it('returns the fallback for domain-mismatched envelopes', () => {
    window.localStorage.setItem(
      'ceo-os-settings',
      JSON.stringify(createVersionedStorageEnvelope(STORAGE_DOMAINS.reminders, [])),
    );

    expect(readVersionedLocalStorage(STORAGE_DOMAINS.settings, { teamName: 'Fallback' })).toEqual({
      teamName: 'Fallback',
    });
  });

  it('safe-writes envelopes through the schema key', () => {
    expect(safeWriteVersionedLocalStorage(
      STORAGE_DOMAINS.captureNotes,
      [],
      'Failed to seed capture notes',
    )).toBe(true);
    expect(getVersionedStorageKey(STORAGE_DOMAINS.captureNotes)).toBe('ceo-os-capture-notes');
    expect(JSON.parse(window.localStorage.getItem('ceo-os-capture-notes')).data).toEqual([]);
  });
});
