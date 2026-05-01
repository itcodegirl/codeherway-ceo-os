import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusHomeSignals } from './useFocusHomeSignals';

const repositoryState = vi.hoisted(() => ({
  listCaptureNotes: vi.fn(() => []),
  getJournalEntryByDate: vi.fn(() => null),
  getTodayJournalDateKey: vi.fn(() => '2026-05-01'),
  listReminders: vi.fn(() => []),
}));

vi.mock('../lib/captureRepository', () => ({
  CAPTURE_NOTES_UPDATED_EVENT: 'ceo-os:capture-notes-updated',
  listCaptureNotes: (...args) => repositoryState.listCaptureNotes(...args),
}));

vi.mock('../lib/journalRepository', () => ({
  JOURNAL_ENTRIES_UPDATED_EVENT: 'ceo-os:journal-entries-updated',
  getJournalEntryByDate: (...args) => repositoryState.getJournalEntryByDate(...args),
  getTodayJournalDateKey: (...args) => repositoryState.getTodayJournalDateKey(...args),
}));

vi.mock('../lib/remindersRepository', () => ({
  REMINDERS_UPDATED_EVENT: 'ceo-os:reminders-updated',
  listReminders: (...args) => repositoryState.listReminders(...args),
}));

describe('useFocusHomeSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryState.listCaptureNotes.mockReturnValue([]);
    repositoryState.getTodayJournalDateKey.mockReturnValue('2026-05-01');
    repositoryState.getJournalEntryByDate.mockReturnValue(null);
    repositoryState.listReminders.mockReturnValue([]);
  });

  it('loads the current local-first signals on mount', () => {
    repositoryState.listCaptureNotes.mockReturnValue([{ id: 'note-1', text: 'Idea' }]);
    repositoryState.getJournalEntryByDate.mockReturnValue({ oneNextThing: 'Send update' });
    repositoryState.listReminders.mockReturnValue([{ id: 'reminder-1', text: 'Follow up' }]);

    const { result } = renderHook(() => useFocusHomeSignals());

    expect(result.current.captureNotes).toEqual([{ id: 'note-1', text: 'Idea' }]);
    expect(result.current.journalEntry).toEqual({ oneNextThing: 'Send update' });
    expect(result.current.reminders).toEqual([{ id: 'reminder-1', text: 'Follow up' }]);
    expect(repositoryState.getJournalEntryByDate).toHaveBeenCalledWith('2026-05-01');
  });

  it('refreshes the matching signal when repository update events fire', () => {
    repositoryState.listCaptureNotes.mockReturnValue([]);
    repositoryState.getJournalEntryByDate.mockReturnValue(null);
    repositoryState.listReminders.mockReturnValue([]);

    const { result } = renderHook(() => useFocusHomeSignals());

    repositoryState.listCaptureNotes.mockReturnValue([{ id: 'note-2', text: 'New idea' }]);
    act(() => {
      window.dispatchEvent(new CustomEvent('ceo-os:capture-notes-updated'));
    });
    expect(result.current.captureNotes).toEqual([{ id: 'note-2', text: 'New idea' }]);

    repositoryState.getJournalEntryByDate.mockReturnValue({ feelsHeavy: 'Too many asks' });
    act(() => {
      window.dispatchEvent(new CustomEvent('ceo-os:journal-entries-updated'));
    });
    expect(result.current.journalEntry).toEqual({ feelsHeavy: 'Too many asks' });

    repositoryState.listReminders.mockReturnValue([{ id: 'reminder-2', text: 'Send recap' }]);
    act(() => {
      window.dispatchEvent(new CustomEvent('ceo-os:reminders-updated'));
    });
    expect(result.current.reminders).toEqual([{ id: 'reminder-2', text: 'Send recap' }]);
  });
});
