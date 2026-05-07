import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  STORAGE_DOMAINS,
  createVersionedStorageEnvelope,
} from './dataSchema';
import {
  CAPTURE_NOTES_UPDATED_EVENT,
  createCaptureNote,
  deleteCaptureNote,
  listCaptureNotes,
  markCaptureNotePromoted,
  updateCaptureNote,
} from './captureRepository';

describe('src/lib/captureRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates and lists capture notes in reverse chronological order', () => {
    const first = createCaptureNote({
      text: 'Draft founder reel',
      category: 'content',
    });
    const second = createCaptureNote({
      text: 'Reach out to partner',
      category: 'opportunity',
    });

    const notes = listCaptureNotes();
    expect(notes).toHaveLength(2);
    expect(notes[0].id).toBe(second.id);
    expect(notes[1].id).toBe(first.id);
  });

  it('persists capture notes in a versioned schema envelope', () => {
    const created = createCaptureNote({
      text: 'Protect quick capture',
      category: 'task',
    });

    const raw = JSON.parse(window.localStorage.getItem('ceo-os-capture-notes'));
    expect(raw).toMatchObject({
      schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
      domain: STORAGE_DOMAINS.captureNotes,
      model: 'CaptureNote[]',
    });
    expect(raw.data).toEqual([
      expect.objectContaining({ id: created.id, text: 'Protect quick capture' }),
    ]);
  });

  it('continues reading legacy raw capture note arrays', () => {
    window.localStorage.setItem('ceo-os-capture-notes', JSON.stringify([
      {
        id: 'legacy-note',
        text: 'Legacy quick thought',
        category: 'idea',
        createdAt: '2026-05-01T12:00:00.000Z',
        updatedAt: '2026-05-01T12:00:00.000Z',
      },
    ]));

    expect(listCaptureNotes()).toEqual([
      expect.objectContaining({ id: 'legacy-note', text: 'Legacy quick thought' }),
    ]);
  });

  it('reads capture notes from the current schema envelope', () => {
    window.localStorage.setItem(
      'ceo-os-capture-notes',
      JSON.stringify(createVersionedStorageEnvelope(STORAGE_DOMAINS.captureNotes, [
        {
          id: 'versioned-note',
          text: 'Versioned quick thought',
          category: 'task',
          createdAt: '2026-05-01T12:00:00.000Z',
          updatedAt: '2026-05-01T12:00:00.000Z',
        },
      ])),
    );

    expect(listCaptureNotes()).toEqual([
      expect.objectContaining({ id: 'versioned-note', text: 'Versioned quick thought' }),
    ]);
  });

  it('updates note text and category', () => {
    const created = createCaptureNote({
      text: 'Initial note',
      category: 'idea',
    });

    const updated = updateCaptureNote(created.id, {
      text: 'Updated note',
      category: 'task',
    });

    expect(updated).toMatchObject({
      id: created.id,
      text: 'Updated note',
      category: 'task',
    });
  });

  it('deletes notes by id', () => {
    const created = createCaptureNote({
      text: 'Delete me',
      category: 'journal',
    });

    deleteCaptureNote(created.id);

    const notes = listCaptureNotes();
    expect(notes).toHaveLength(0);
  });

  it('rejects stale deletes without emitting a fake update event', () => {
    const created = createCaptureNote({
      text: 'Keep me',
      category: 'idea',
    });
    const updateListener = vi.fn();
    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, updateListener);

    try {
      expect(() => deleteCaptureNote('missing-note')).toThrow('Capture note not found');
    } finally {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, updateListener);
    }

    expect(updateListener).not.toHaveBeenCalled();
    expect(listCaptureNotes()).toEqual([created]);
  });

  it('rejects stale updates without emitting a fake update event', () => {
    const created = createCaptureNote({
      text: 'Keep this idea',
      category: 'idea',
    });
    const updateListener = vi.fn();
    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, updateListener);

    try {
      expect(() => updateCaptureNote('missing-note', {
        text: 'Unexpected overwrite',
        category: 'task',
      })).toThrow('Capture note not found');
    } finally {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, updateListener);
    }

    expect(updateListener).not.toHaveBeenCalled();
    expect(listCaptureNotes()).toEqual([created]);
  });

  it('marks notes promoted with target + timestamp and emits an update event', () => {
    const note = createCaptureNote({ text: 'Talk to Sarah', category: 'task' });
    const promoteListener = vi.fn();
    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, promoteListener);

    try {
      const updated = markCaptureNotePromoted(note.id, 'reminder');
      expect(updated.promotedTo).toBe('reminder');
      expect(updated.promotedAt).toBeTruthy();
      expect(promoteListener).toHaveBeenCalled();
      const persisted = listCaptureNotes()[0];
      expect(persisted.promotedTo).toBe('reminder');
    } finally {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, promoteListener);
    }
  });

  it('rejects unknown promotion targets', () => {
    const note = createCaptureNote({ text: 'Talk to Sarah', category: 'task' });
    expect(() => markCaptureNotePromoted(note.id, 'something-else')).toThrow();
  });
});
