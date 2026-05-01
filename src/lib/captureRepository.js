import { buildCreateId, requireLocalStorageSetItem, safeLocalStorageSetItem } from './utils';

const STORAGE_KEY = 'ceo-os-capture-notes';
export const CAPTURE_NOTES_UPDATED_EVENT = 'ceo-os:capture-notes-updated';
export const CAPTURE_CATEGORY_OPTIONS = ['idea', 'task', 'content', 'opportunity', 'journal'];

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeCategory(value) {
  if (typeof value !== 'string') {
    return CAPTURE_CATEGORY_OPTIONS[0];
  }

  const lowercased = value.trim().toLowerCase();
  return CAPTURE_CATEGORY_OPTIONS.includes(lowercased)
    ? lowercased
    : CAPTURE_CATEGORY_OPTIONS[0];
}

function normalizeDate(value) {
  if (typeof value !== 'string') {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeCaptureNote(note) {
  return {
    id: String(note?.id || buildCreateId()),
    text: normalizeText(note?.text),
    category: normalizeCategory(note?.category),
    createdAt: normalizeDate(note?.createdAt),
    updatedAt: normalizeDate(note?.updatedAt || note?.createdAt),
  };
}

function getFallbackCaptureNotes() {
  return [];
}

function readStorage() {
  if (typeof window === 'undefined') {
    return getFallbackCaptureNotes();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fallback = getFallbackCaptureNotes();
      safeLocalStorageSetItem(
        STORAGE_KEY,
        JSON.stringify(fallback),
        'Failed to seed capture notes in localStorage',
      );
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getFallbackCaptureNotes();
    }

    return parsed.map((note) => normalizeCaptureNote(note));
  } catch {
    return getFallbackCaptureNotes();
  }
}

function writeStorage(notes) {
  requireLocalStorageSetItem(
    STORAGE_KEY,
    JSON.stringify(notes),
    'Failed to persist capture notes to localStorage',
  );
}

function emitCaptureNotesUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CAPTURE_NOTES_UPDATED_EVENT, { detail }),
  );
}

export function listCaptureNotes() {
  return readStorage();
}

export function createCaptureNote(payload) {
  const text = normalizeText(payload?.text);
  if (!text) {
    throw new Error('Capture note text is required');
  }

  const timestamp = new Date().toISOString();
  const newNote = normalizeCaptureNote({
    id: buildCreateId(),
    text,
    category: payload?.category,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const current = readStorage();
  const next = [newNote, ...current];
  writeStorage(next);
  emitCaptureNotesUpdated({ type: 'create', id: newNote.id });
  return newNote;
}

export function updateCaptureNote(id, payload) {
  const normalizedId = String(id || '');
  const nextText = normalizeText(payload?.text);
  const nextCategory = normalizeCategory(payload?.category);
  const now = new Date().toISOString();

  const current = readStorage();
  let didUpdate = false;
  const next = current.map((note) => {
    if (note.id !== normalizedId) {
      return note;
    }

    didUpdate = true;
    return normalizeCaptureNote({
      ...note,
      text: nextText || note.text,
      category: nextCategory,
      updatedAt: now,
    });
  });

  if (!didUpdate) {
    return null;
  }

  writeStorage(next);
  emitCaptureNotesUpdated({ type: 'update', id: normalizedId });
  return next.find((note) => note.id === normalizedId) || null;
}

export function deleteCaptureNote(id) {
  const normalizedId = String(id || '');
  const current = readStorage();
  const didDelete = current.some((note) => note.id === normalizedId);
  if (!didDelete) {
    throw new Error('Capture note not found');
  }

  const next = current.filter((note) => note.id !== normalizedId);
  writeStorage(next);
  emitCaptureNotesUpdated({ type: 'delete', id: normalizedId });
}
