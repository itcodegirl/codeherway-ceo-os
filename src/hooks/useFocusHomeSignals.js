import { useEffect, useState } from 'react';
import { CAPTURE_NOTES_UPDATED_EVENT, listCaptureNotes } from '../lib/captureRepository';
import {
  JOURNAL_ENTRIES_UPDATED_EVENT,
  getJournalEntryByDate,
  getTodayJournalDateKey,
} from '../lib/journalRepository';
import { REMINDERS_UPDATED_EVENT, listReminders } from '../lib/remindersRepository';

export function useFocusHomeSignals() {
  const [captureNotes, setCaptureNotes] = useState(() => listCaptureNotes());
  const [journalEntry, setJournalEntry] = useState(() => getJournalEntryByDate(getTodayJournalDateKey()));
  const [reminders, setReminders] = useState(() => listReminders());

  useEffect(() => {
    const syncCaptureNotes = () => {
      setCaptureNotes(listCaptureNotes());
    };
    const syncJournalEntry = () => {
      setJournalEntry(getJournalEntryByDate(getTodayJournalDateKey()));
    };
    const syncReminders = () => {
      setReminders(listReminders());
    };

    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, syncCaptureNotes);
    window.addEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, syncJournalEntry);
    window.addEventListener(REMINDERS_UPDATED_EVENT, syncReminders);

    return () => {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, syncCaptureNotes);
      window.removeEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, syncJournalEntry);
      window.removeEventListener(REMINDERS_UPDATED_EVENT, syncReminders);
    };
  }, []);

  return {
    captureNotes,
    journalEntry,
    reminders,
  };
}

export default useFocusHomeSignals;
