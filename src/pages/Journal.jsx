import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';
import {
  getJournalEntryByDate,
  getTodayJournalDateKey,
  JOURNAL_ENTRIES_UPDATED_EVENT,
  JOURNAL_PROMPTS,
  saveJournalEntry,
} from '../lib/journalRepository';
import { createReminder } from '../lib/remindersRepository';
import { useToast } from '../hooks/useToast';
import { buildAutosaveHelperText } from '../lib/uiCopy';
import '../styles/journal.css';

function formatSavedAt(value) {
  if (!value) {
    return 'Not saved yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Saved';
  }

  return `Auto-saved ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`;
}

function Journal() {
  const [dateKey, setDateKey] = useState(() => getTodayJournalDateKey());
  const [entry, setEntry] = useState(() => getJournalEntryByDate(getTodayJournalDateKey()));
  const [lastSavedAt, setLastSavedAt] = useState(entry.updatedAt);
  const [errorMessage, setErrorMessage] = useState('');
  const { isToastVisible, toastMessage, showToast } = useToast();

  useEffect(() => {
    const handleJournalUpdate = (event) => {
      const updatedDateKey = event?.detail?.dateKey;
      if (updatedDateKey && updatedDateKey !== dateKey) {
        return;
      }

      const nextEntry = getJournalEntryByDate(dateKey);
      setEntry(nextEntry);
      setLastSavedAt(nextEntry.updatedAt);
    };

    window.addEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, handleJournalUpdate);
    return () => {
      window.removeEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, handleJournalUpdate);
    };
  }, [dateKey]);

  const savedAtLabel = useMemo(() => formatSavedAt(lastSavedAt), [lastSavedAt]);
  const journalSaveStatus = buildAutosaveHelperText({
    hasError: Boolean(errorMessage),
    healthyText: savedAtLabel,
    pausedText: 'Autosave is paused. Your latest journal changes are not saved yet.',
  });
  const isEntryEmpty = useMemo(
    () => JOURNAL_PROMPTS.every((prompt) => !(entry[prompt.id] || '').trim()),
    [entry],
  );

  const handleDateChange = (nextDateKey) => {
    setDateKey(nextDateKey);
    const nextEntry = getJournalEntryByDate(nextDateKey);
    setEntry(nextEntry);
    setLastSavedAt(nextEntry.updatedAt);
  };

  // Closes the journal-to-action loop the audit flagged: writing a "one next
  // thing" no longer requires the user to context-switch to Dashboard and
  // retype the same sentence as a reminder.
  const handleMakeReminderFromNextThing = () => {
    const text = (entry.oneNextThing || '').trim();
    if (!text) {
      showToast('Write your one next thing first.');
      return;
    }
    try {
      createReminder({ text });
      showToast('Reminder created from your journal next-thing.');
    } catch {
      showToast('Unable to create a reminder right now.');
    }
  };

  const updateField = (fieldId, value) => {
    setEntry((current) => {
      const next = {
        ...current,
        [fieldId]: value,
      };

      try {
        const persisted = saveJournalEntry({
          dateKey,
          entry: next,
        });
        setLastSavedAt(persisted.updatedAt);
        setErrorMessage('');
      } catch {
        setErrorMessage('Unable to auto-save journal entry right now.');
      }

      return next;
    });
  };

  return (
    <section className="journal-page">
      <PageHeader
        title="Journal"
        description="A calm, private space for low-pressure reflection and one clear next step."
      />

      <section className="journal-panel focus-panel" aria-label="Daily journal prompts">
        <header className="journal-panel__header">
          <div>
            <h2>Daily Reflection</h2>
            <p className="supportive-copy">
              No perfect writing needed. A few honest lines are enough.
            </p>
          </div>
          <label className="journal-panel__date">
            <span className="helper-text">Journal date</span>
            <input
              type="date"
              value={dateKey}
              onChange={(event) => handleDateChange(event.target.value)}
              aria-label="Journal date"
            />
          </label>
        </header>

        <p className="helper-text" role="status" aria-live="polite">{journalSaveStatus}</p>
        {errorMessage ? <p role="alert" className="form-error">{errorMessage}</p> : null}
        {isEntryEmpty ? (
          <p className="helper-text">Start with one sentence. Small reflections count.</p>
        ) : null}

        <div className="journal-prompts">
          {JOURNAL_PROMPTS.map((prompt) => {
            const isNextThingPrompt = prompt.id === 'oneNextThing';
            const hasNextThingText = isNextThingPrompt && (entry.oneNextThing || '').trim().length > 0;
            return (
              <label key={prompt.id} className="journal-prompts__item" htmlFor={`journal-${prompt.id}`}>
                <span>{prompt.label}</span>
                <textarea
                  id={`journal-${prompt.id}`}
                  rows={4}
                  value={entry[prompt.id] || ''}
                  onChange={(event) => updateField(prompt.id, event.target.value)}
                />
                {isNextThingPrompt ? (
                  <button
                    type="button"
                    className="journal-prompts__action"
                    onClick={handleMakeReminderFromNextThing}
                    disabled={!hasNextThingText}
                  >
                    Make a reminder from this
                  </button>
                ) : null}
              </label>
            );
          })}
        </div>
      </section>
      <Toast className="toast--journal" isVisible={isToastVisible} message={toastMessage} />
    </section>
  );
}

export default Journal;
