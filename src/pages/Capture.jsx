import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';
import {
  CAPTURE_CATEGORY_OPTIONS,
  CAPTURE_NOTES_UPDATED_EVENT,
  createCaptureNote,
  deleteCaptureNote,
  listCaptureNotes,
  updateCaptureNote,
} from '../lib/captureRepository';
import { createReminder } from '../lib/remindersRepository';
import { buildAutosaveHelperText } from '../lib/uiCopy';
import { useToast } from '../hooks/useToast';
import '../styles/capture.css';

function formatCategoryLabel(category) {
  if (typeof category !== 'string') {
    return 'Idea';
  }

  const normalized = category.trim().toLowerCase();
  return `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}`;
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function Capture() {
  const [notes, setNotes] = useState(() => listCaptureNotes());
  const [draftText, setDraftText] = useState('');
  const [draftCategory, setDraftCategory] = useState(CAPTURE_CATEGORY_OPTIONS[0]);
  const [errorMessage, setErrorMessage] = useState('');
  const composerTextareaRef = useRef(null);
  const promotingNoteIdsRef = useRef(new Set());
  const { toastMessage, isToastVisible, showToast } = useToast();

  useEffect(() => {
    const handleCaptureUpdate = () => {
      setNotes(listCaptureNotes());
    };

    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, handleCaptureUpdate);
    return () => {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, handleCaptureUpdate);
    };
  }, []);

  const sortedNotes = useMemo(() => (
    [...notes].sort((left, right) => (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    ))
  ), [notes]);
  const captureSaveHelper = buildAutosaveHelperText({
    hasError: Boolean(errorMessage),
    healthyText: 'Auto-saved locally and ready whenever your brain moves fast.',
    pausedText: 'Autosave is paused until sticky notes save successfully again.',
  });
  const captureComposerDescriptionId = [
    'capture-composer-helper',
    errorMessage ? 'capture-composer-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const clearComposerError = () => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleDraftTextChange = (event) => {
    clearComposerError();
    setDraftText(event.target.value);
  };

  const handleDraftCategoryChange = (event) => {
    clearComposerError();
    setDraftCategory(event.target.value);
  };

  const createNote = (event) => {
    event.preventDefault();
    const text = draftText.trim();
    if (!text) {
      setErrorMessage('Add a quick note before saving.');
      composerTextareaRef.current?.focus?.();
      return;
    }

    try {
      createCaptureNote({
        text,
        category: draftCategory,
      });
      setDraftText('');
      setDraftCategory(CAPTURE_CATEGORY_OPTIONS[0]);
      setErrorMessage('');
    } catch {
      setErrorMessage('Unable to save this note right now.');
      composerTextareaRef.current?.focus?.();
    }
  };

  const updateNote = (id, payload) => {
    try {
      updateCaptureNote(id, payload);
      setErrorMessage('');
    } catch {
      setErrorMessage('Unable to update this note right now.');
    }
  };

  const removeNote = (id) => {
    try {
      deleteCaptureNote(id);
      setErrorMessage('');
    } catch {
      setErrorMessage('Unable to delete this note right now.');
    }
  };

  const promoteNoteToReminder = (note) => {
    if (!note?.id || !notes.some((entry) => entry.id === note.id)) {
      return;
    }
    if (promotingNoteIdsRef.current.has(note.id)) {
      return;
    }
    const text = (note.text || '').trim();
    if (!text) {
      showToast('Add some text to this note before promoting it.');
      return;
    }

    promotingNoteIdsRef.current.add(note.id);
    try {
      createReminder({ text });
      showToast('Added a reminder from this note. The sticky stays here in case you still need it.');
    } catch {
      showToast('Unable to create a reminder right now.');
    } finally {
      promotingNoteIdsRef.current.delete(note.id);
    }
  };

  return (
    <section className="capture-page">
      <PageHeader
        title="Capture"
        description="Fast sticky-note style capture for ideas, tasks, opportunities, content drafts, and private thoughts."
      />

      <section className="capture-composer focus-panel" aria-label="Create a capture note">
        <h2>Brain Dump</h2>
        <p className="supportive-copy">
          Drop the thought here. Keep it messy now, organize later.
        </p>
        <form onSubmit={createNote} className="capture-composer__form">
          <label htmlFor="capture-note-text" className="helper-text">Note</label>
          <p id="capture-composer-helper" className="sr-only">
            Capture one thought, task, or idea at a time.
          </p>
          <textarea
            ref={composerTextareaRef}
            id="capture-note-text"
            value={draftText}
            onChange={handleDraftTextChange}
            rows={3}
            placeholder="What do you want to remember?"
            aria-describedby={captureComposerDescriptionId}
            aria-invalid={errorMessage ? 'true' : undefined}
          />

          <label htmlFor="capture-note-category" className="helper-text">Category</label>
          <select
            id="capture-note-category"
            value={draftCategory}
            onChange={handleDraftCategoryChange}
          >
            {CAPTURE_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatCategoryLabel(option)}
              </option>
            ))}
          </select>

          <div className="capture-composer__actions">
            <Button type="submit" icon={{ name: 'add' }}>
              Save sticky note
            </Button>
          </div>
        </form>
        {errorMessage ? (
          <p id="capture-composer-error" role="alert" className="form-error">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className="capture-wall" aria-label="Sticky note wall">
        <header className="capture-wall__header">
          <h2>Sticky Notes</h2>
          <p className="helper-text" role="status" aria-live="polite">{captureSaveHelper}</p>
        </header>
        {sortedNotes.length ? (
          <div className="sticky-wall">
            {sortedNotes.map((note) => (
              <article key={note.id} className="sticky-note">
                <header className="sticky-note__meta">
                  <span className="sticky-note__tag">
                    {formatCategoryLabel(note.category)}
                  </span>
                  <span className="helper-text">{formatRelativeDate(note.updatedAt)}</span>
                </header>
                <label htmlFor={`capture-note-${note.id}`} className="sr-only">
                  Edit note
                </label>
                <textarea
                  id={`capture-note-${note.id}`}
                  value={note.text}
                  rows={4}
                  onChange={(event) => updateNote(note.id, {
                    text: event.target.value,
                    category: note.category,
                  })}
                />
                <div className="sticky-note__controls">
                  <label htmlFor={`capture-category-${note.id}`} className="sr-only">
                    Edit note category
                  </label>
                  <select
                    id={`capture-category-${note.id}`}
                    value={note.category}
                    onChange={(event) => updateNote(note.id, {
                      text: note.text,
                      category: event.target.value,
                    })}
                  >
                    {CAPTURE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatCategoryLabel(option)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    icon={{ name: 'check', size: 14 }}
                    onClick={() => promoteNoteToReminder(note)}
                    ariaLabel={`Make a reminder from ${formatCategoryLabel(note.category)} note`}
                  >
                    Make reminder
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    icon={{ name: 'delete' }}
                    onClick={() => removeNote(note.id)}
                    ariaLabel={`Delete ${formatCategoryLabel(note.category)} note`}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sticky notes yet"
            description="Start with one idea or one tiny task to clear mental load."
          />
        )}
      </section>
      <Toast className="toast--capture" isVisible={isToastVisible} message={toastMessage} />
    </section>
  );
}

export default Capture;
