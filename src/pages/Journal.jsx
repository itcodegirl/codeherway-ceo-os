import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import {
  getJournalEntryByDate,
  getTodayJournalDateKey,
  JOURNAL_ENTRIES_UPDATED_EVENT,
  JOURNAL_PROMPTS,
  saveJournalEntry,
} from '../lib/journalRepository';
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

  const handleDateChange = (nextDateKey) => {
    setDateKey(nextDateKey);
    const nextEntry = getJournalEntryByDate(nextDateKey);
    setEntry(nextEntry);
    setLastSavedAt(nextEntry.updatedAt);
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

        <p className="helper-text" role="status">{savedAtLabel}</p>
        {errorMessage ? <p role="alert" className="form-error">{errorMessage}</p> : null}

        <div className="journal-prompts">
          {JOURNAL_PROMPTS.map((prompt) => (
            <label key={prompt.id} className="journal-prompts__item" htmlFor={`journal-${prompt.id}`}>
              <span>{prompt.label}</span>
              <textarea
                id={`journal-${prompt.id}`}
                rows={4}
                value={entry[prompt.id] || ''}
                onChange={(event) => updateField(prompt.id, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Journal;
