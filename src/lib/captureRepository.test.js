import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CAPTURE_NOTES_UPDATED_EVENT,
  createCaptureNote,
  deleteCaptureNote,
  listCaptureNotes,
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
});
