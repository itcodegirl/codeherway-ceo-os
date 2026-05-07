import { describe, expect, it } from 'vitest';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  DOMAIN_MODELS,
  STORAGE_DOMAINS,
  STORAGE_SCHEMAS,
  createVersionedStorageEnvelope,
  readVersionedStoragePayload,
} from './dataSchema';

describe('dataSchema', () => {
  it('centralizes storage keys and model names for the primary domains', () => {
    expect(STORAGE_SCHEMAS[STORAGE_DOMAINS.weeklyBriefs]).toMatchObject({
      key: 'ceo-os-weekly-briefs',
      model: 'WeeklyBriefStore',
      version: CURRENT_DATA_SCHEMA_VERSION,
    });
    expect(DOMAIN_MODELS.Opportunity).toMatchObject({
      id: 'string',
      updatedAt: 'number',
    });
    expect(DOMAIN_MODELS.WeeklyBrief).toMatchObject({
      priorities: 'WeeklyPriority[]',
      wins: 'WeeklyWin[]',
      blockers: 'WeeklyBlocker[]',
    });
  });

  it('wraps storage payloads in a versioned envelope', () => {
    const data = { '2026-05-04': { reviewNotes: 'Ship proof' } };

    expect(createVersionedStorageEnvelope(STORAGE_DOMAINS.weeklyBriefs, data)).toEqual({
      schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
      domain: STORAGE_DOMAINS.weeklyBriefs,
      model: 'WeeklyBriefStore',
      data,
    });
  });

  it('reads legacy payloads without requiring an envelope', () => {
    const legacy = { '2026-05-04': { reviewNotes: 'Legacy notes' } };

    expect(readVersionedStoragePayload(STORAGE_DOMAINS.weeklyBriefs, legacy)).toEqual({
      data: legacy,
      schemaVersion: 0,
      isLegacy: true,
    });
  });

  it('rejects envelopes for a different storage domain', () => {
    const envelope = createVersionedStorageEnvelope(STORAGE_DOMAINS.opportunities, []);

    expect(readVersionedStoragePayload(STORAGE_DOMAINS.weeklyBriefs, envelope)).toEqual({
      data: null,
      schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
      isLegacy: false,
      isDomainMismatch: true,
    });
  });
});
