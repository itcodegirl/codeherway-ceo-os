import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import {
  CAPTURE_CATEGORY_OPTIONS,
  CAPTURE_NOTES_UPDATED_EVENT,
  createCaptureNote,
  deleteCaptureNote,
  listCaptureNotes,
  updateCaptureNote,
} from '../lib/captureRepository';
import { buildAutosaveHelperText } from '../lib/uiCopy';
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

  const createNote = (event) => {
    event.preventDefault();
    const text = draftText.trim();
    if (!text) {
      setErrorMessage('Add a quick note before saving.');
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
          <textarea
            id="capture-note-text"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={3}
            placeholder="What do you want to remember?"
          />

          <label htmlFor="capture-note-category" className="helper-text">Category</label>
          <select
            id="capture-note-category"
            value={draftCategory}
            onChange={(event) => setDraftCategory(event.target.value)}
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
        {errorMessage ? <p role="alert" className="form-error">{errorMessage}</p> : null}
      </section>

      <section className="capture-wall" aria-label="Sticky note wall">
        <header className="capture-wall__header">
          <h2>Sticky Notes</h2>
          <p className="helper-text" aria-live="polite">{captureSaveHelper}</p>
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
          <div className="empty-state">
            <p className="empty-state__title">No sticky notes yet</p>
            <p className="empty-state__description">
              Start with one idea or one tiny task to clear mental load.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

export default Capture;
