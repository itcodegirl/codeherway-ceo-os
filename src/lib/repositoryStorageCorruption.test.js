import { beforeEach, describe, expect, it } from 'vitest';
import { listCaptureNotes } from './captureRepository';
import { loadChiefWorkspace } from './chiefRepository';
import { listChiefTelemetryEvents } from './chiefTelemetryRepository';
import { listContentItems } from './contentRepository';
import { listJournalEntries } from './journalRepository';
import { getOfflineQueue } from './offlineWriteQueue';
import { listOpportunities } from './opportunitiesRepository';
import { listReminders } from './remindersRepository';
import { loadSettings } from './settingsRepository';
import { listCorruptBackups } from './storageCorruption';
import { getWeeklyBriefByWeek } from './weeklyRepository';
import { getWorkspaceSetupMode } from './workspaceSetup';

describe('repository localStorage corruption preservation', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each([
    ['ceo-os-opportunities', () => listOpportunities()],
    ['ceo-os-content-items', () => listContentItems()],
    ['ceo-os-capture-notes', () => listCaptureNotes()],
    ['ceo-os-reminders', () => listReminders()],
    ['ceo-os-journal-entries', () => listJournalEntries()],
    ['ceo-os-weekly-briefs', () => getWeeklyBriefByWeek('2026-04-20')],
    ['ceo-os-settings', () => loadSettings()],
    ['ceo-os-chief-responses', () => loadChiefWorkspace()],
    ['ceo-os-chief-telemetry-events', () => listChiefTelemetryEvents()],
    ['ceo-os-offline-write-queue', () => getOfflineQueue()],
    ['ceo-os-workspace-setup', () => getWorkspaceSetupMode()],
  ])('preserves malformed JSON for %s before falling back', async (key, exerciseRepository) => {
    window.localStorage.setItem(key, '{not valid json');

    await exerciseRepository();

    expect(listCorruptBackups(key)[0]).toMatchObject({
      value: '{not valid json',
    });
  });
});
