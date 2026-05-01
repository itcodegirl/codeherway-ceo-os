import { useCallback, useEffect, useState } from 'react';
import { CAPTURE_NOTES_UPDATED_EVENT, listCaptureNotes } from '../lib/captureRepository';
import {
  JOURNAL_ENTRIES_UPDATED_EVENT,
  getJournalEntryByDate,
  getTodayJournalDateKey,
} from '../lib/journalRepository';
import { REMINDERS_UPDATED_EVENT, listReminders } from '../lib/remindersRepository';

const FOCUS_HOME_SIGNAL_STORAGE_KEYS = new Set([
  'ceo-os-capture-notes',
  'ceo-os-journal-entries',
  'ceo-os-reminders',
]);

export function useFocusHomeSignals() {
  const [captureNotes, setCaptureNotes] = useState(() => listCaptureNotes());
  const [journalEntry, setJournalEntry] = useState(() => getJournalEntryByDate(getTodayJournalDateKey()));
  const [reminders, setReminders] = useState(() => listReminders());

  const syncCaptureNotes = useCallback(() => {
    setCaptureNotes(listCaptureNotes());
  }, []);

  const syncJournalEntry = useCallback(() => {
    setJournalEntry(getJournalEntryByDate(getTodayJournalDateKey()));
  }, []);

  const syncReminders = useCallback(() => {
    setReminders(listReminders());
  }, []);

  const syncAllSignals = useCallback(() => {
    syncCaptureNotes();
    syncJournalEntry();
    syncReminders();
  }, [syncCaptureNotes, syncJournalEntry, syncReminders]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event?.key === null
        || FOCUS_HOME_SIGNAL_STORAGE_KEYS.has(event?.key)
      ) {
        syncAllSignals();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAllSignals();
      }
    };

    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, syncCaptureNotes);
    window.addEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, syncJournalEntry);
    window.addEventListener(REMINDERS_UPDATED_EVENT, syncReminders);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', syncAllSignals);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, syncCaptureNotes);
      window.removeEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, syncJournalEntry);
      window.removeEventListener(REMINDERS_UPDATED_EVENT, syncReminders);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', syncAllSignals);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncAllSignals, syncCaptureNotes, syncJournalEntry, syncReminders]);

  return {
    captureNotes,
    journalEntry,
    reminders,
  };
}

export default useFocusHomeSignals;
